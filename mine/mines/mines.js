exports.MineServer = function () {
    var MSG_ALL = 0;//发送到所有用户
    var MSG_TO = 1;//发送指定用户
    var MSG_ROOM = 2;//向指定桌发送消息

    var STAT_NORMAL = 0;//无状态
    var STAT_READY = 1;//准备
    var STAT_START = 2;//游戏中

    var COLOR_BLACK = 1;//黑色
    var COLOR_WHITE = 2;//白色

    var m_Config = {
        "ListenPort": 8080,
        "RoomTotal": 100,
        "MaxClientNum": 300
    };
    var m_Connections = [];//用户管理
    var m_Rooms = [];//房间管理
    var m_RoomData = [];//房间内游戏数据信息
    var n_Clients = 0;
    var self = this;
    var io;//socket.io

    var MG = function () {
        ///* 画布层 */
        //this.layers = [];
        /* 雷区地图 */
        this.dataMap = [];
        ///* 蒙板地图 */
        //this.masks = [];
        /* 当前游戏级别 */
        this.currentLevel = 0;
        /* 当前游戏 */
        this.cg = null;
        /* 剩余雷数 */
        this.residualMines = 0;
        /* 经过时间 */
        this.elapsedTime = 0;
        ///* 计时器 */
        //this.timer = 0;
        ///* 计时器句柄 */
        //this.timeout = 0;
        /* 得分 */
        this.score = 0;
        /* 游戏级别 */
        this.levels = [
            {
                level: 0,
                mineCount: 20,
                range: {
                    rows: 10,
                    columns: 10
                }
            }
        ];
    };

    var Cell = function () {
        this.data = 0;
        this.isOpened = false;
        this.isFlag = false;
    };

    //设置配置文件
    this.setConfig = function (cfg) {
        for (var x in cfg) {
            m_Config[x] = cfg[x];
        }
    };

    //初始化游戏数据
    var initGameData = function (roomIdx) {
        m_RoomData[roomIdx] = new MG();
        resetGameData(roomIdx);
    };

    //重置游戏数据
    var resetGameData = function (roomIdx) {
        var MG = m_RoomData[roomIdx];
        MG.timeout = 0;
        MG.dataMap = [];
        MG.currentLevel = 0;
        MG.residualMines = 0;
        MG.score = 0;

        MG.timer = 0;
        MG.elapsedTime = 0;

        MG.cg = MG.levels[MG.currentLevel];
        MG.cg.mineCount = Math.ceil(Math.random() * 15 + MG.cg.mineCount);
        MG.residualMines = MG.cg.mineCount;

        for (var r = 0; r < MG.cg.range.rows; r++) {
            MG.dataMap[r] = Array.apply(null, Array(MG.cg.range.columns)).map(function (i) {
                return new Cell();
            });
        }
    };

    //启动服务
    this.startup = function (_io) {
        //初始化房间
        for (var i = 0; i < m_Config.RoomTotal; i++) {
            m_Rooms[i] = [0, 0];
            initGameData(i);
        }

        //网络服务
        io = _io;//require('socket.io').listen(m_Config.ListenPort);
        io.sockets.on('connection', function (socket) {
            //断开
            socket.on("disconnect", onClose);

            //登陆
            socket.on("login", onLogin);

            //加入房间
            socket.on("joinRoom", onJoinRoom);

            //离开房间
            socket.on("leaveRoom", onLeaveRoom);

            //准备
            socket.on("ready", onReady);

            //消息
            socket.on('message', onMessage);

            //点击格子
            socket.on("drawCell", onDrawCell);
        });
        console.log('server is started, port: ' + m_Config.ListenPort);
    };

    //获取房间列表
    var getRoomList = function () {
        var data = [];
        for (var idx in m_Rooms) {
            var room = [0, 0];
            for (var j = 0; j < 2; j++) {
                if (m_Rooms[idx][j]) {
                    var c = m_Connections[m_Rooms[idx][j]];
                    if (c) {
                        room[j] = {
                            "id": c.socket.id,
                            "nickname": c.nickname,
                            "status": c.status
                        };
                    }
                }
            }
            data.push(room);
        }
        return data;
    };

    //获取用户列表
    var getUserList = function () {
        var list = [];
        for (var sid in m_Connections) {
            list.push(getUserInfo(sid));
        }
        return list;
    };

    //获取用户信息
    var getUserInfo = function (sid) {
        return {
            "id": m_Connections[sid].socket.id,
            "nickname": m_Connections[sid].nickname,
            "status": m_Connections[sid].status
        }
    };

    //关闭链接
    var onClose = function () {
        var sid = this.id;

        if (!m_Connections[sid]) return;
        n_Clients--;


        //发送退出消息
        io.sockets.emit("close", {
            "id": sid,
            "roomIdx": m_Connections[sid].roomIdx,
            "posIdx": m_Connections[sid].posIdx
        });

        //如果该房间内用户正在游戏，那么重设另一个用户的状态
        var roomIdx = m_Connections[sid].roomIdx;
        var posIdx = m_Connections[sid].posIdx;
        if (roomIdx != -1) {
            m_Rooms[roomIdx][posIdx] = 0;//退出房间
            if (m_Connections[sid].status == STAT_START) {
                if (posIdx == 0) {
                    if (m_Rooms[roomIdx][1] && m_Connections[m_Rooms[roomIdx][1]]) {
                        m_Connections[m_Rooms[roomIdx][1]].status = STAT_NORMAL;
                    }
                } else {
                    if (m_Rooms[roomIdx][0] && m_Connections[m_Rooms[roomIdx][0]]) {
                        m_Connections[m_Rooms[roomIdx][0]].status = STAT_NORMAL;
                    }
                }
            }
        }

        console.log("用户：" + m_Connections[sid].nickname + "：SID：" + sid + "退出了游戏。");

        //删除元素
        delete m_Connections[sid];
    };

    //用户登陆
    var onLogin = function (data) {
        var ret = 0;
        var sid = this.id;
        var client = {};
        if (n_Clients < m_Config.MaxClientNum) {
            ret = 1;
            client = {
                socket: this,
                nickname: data.nickname,
                status: STAT_NORMAL,//0-无状态, 1-准备, 2-游戏中
                roomIdx: -1, //所处房间号
                posIdx: -1 //所处房间的位置
            };

            //更新客户端链接
            m_Connections[sid] = client;
            n_Clients++;

            //登陆成功
            this.emit("login", {
                "ret": ret,
                "info": getUserInfo(sid),
                "list": getUserList(),
                "room": getRoomList()
            });

            console.log("用户：" + m_Connections[sid].nickname + "：SID：" + sid + "进入了游戏大厅。");

            //发送用户加入大厅
            io.sockets.emit("join", getUserInfo(sid));
        } else {
            //登陆失败
            this.emit("login", {"ret": ret});
        }
    };

    //加入房间
    var onJoinRoom = function (data) {
        var sid = this.id;
        if (data.roomIdx > -1 && data.roomIdx < m_Config.RoomTotal &&
            (data.posIdx == 0 || data.posIdx == 1) &&
            m_Rooms[data.roomIdx][data.posIdx] == 0 &&
            m_Connections[sid] && m_Connections[sid].status != STAT_START) {
            var oldRoomIdx = m_Connections[sid].roomIdx;
            var oldPosIdx = m_Connections[sid].posIdx;

            //离开原座位
            if (oldRoomIdx != -1) {
                m_Rooms[oldRoomIdx][oldPosIdx] = 0;
                io.sockets.emit("leaveRoom", {
                    "id": sid,
                    "roomIdx": oldRoomIdx,
                    "posIdx": oldPosIdx
                });
                console.log("用户：" + m_Connections[sid].nickname + "：SID：" + sid + "退出了" + oldRoomIdx + "号房间。");
            }

            //加入新房间
            m_Connections[sid].roomIdx = data.roomIdx;
            m_Connections[sid].posIdx = data.posIdx;
            m_Connections[sid].status = STAT_NORMAL;
            m_Rooms[data.roomIdx][data.posIdx] = sid;
            io.sockets.emit("joinRoom", {
                "roomIdx": data.roomIdx,
                "posIdx": data.posIdx,
                "nickname": m_Connections[sid].nickname,
                "id": sid,
                "mg": m_RoomData[data.roomIdx]
            });

            console.log("用户：" + m_Connections[sid].nickname + "：SID：" + sid + "进入了" + data.roomIdx + "号房间。");

            //发送房间内信息
            var info = [0, 0];
            if (m_Rooms[data.roomIdx][0]) info[0] = getUserInfo(m_Rooms[data.roomIdx][0]);
            if (m_Rooms[data.roomIdx][1]) info[1] = getUserInfo(m_Rooms[data.roomIdx][1]);
            this.emit("roomInfo", info);
        } else {
            this.emit("joinRoomError", '');
        }
    };

    //离开房间
    var onLeaveRoom = function (data) {
        var sid = this.id;
        if (m_Connections[sid] && m_Connections[sid].roomIdx != -1 &&
            m_Connections[sid].roomIdx == data.roomIdx) {
            var roomIdx = m_Connections[sid].roomIdx;
            var posIdx = m_Connections[sid].posIdx;
            m_Rooms[roomIdx][posIdx] = 0;
            m_Connections[sid].roomIdx = -1;
            m_Connections[sid].posIdx = -1;
            m_Connections[sid].status = STAT_NORMAL;

            //通知大厅人有人离开
            io.sockets.emit("leaveRoom", {
                "id": sid,
                "roomIdx": roomIdx,
                "posIdx": posIdx
            });
            console.log("用户：" + m_Connections[sid].nickname + "：SID：" + sid + "退出了" + roomIdx + "号房间。");
        }
    };

    //准备
    var onReady = function () {
        var sid = this.id;
        if (m_Connections[sid] && m_Connections[sid].roomIdx != -1 &&
            m_Connections[sid].status != STAT_START) {
            var status = 1 - m_Connections[sid].status;
            var roomIdx = m_Connections[sid].roomIdx;
            m_Connections[sid].status = status;

            //发送准备信息到大厅
            io.sockets.emit("ready", {
                "id": sid,
                "roomIdx": roomIdx,
                "posIdx": m_Connections[sid].posIdx,
                "nickname": m_Connections[sid].nickname,
                "status": status
            });
            console.log("用户：" + m_Connections[sid].nickname + "：SID：" + sid + "在" + roomIdx + "号房间做好准备了。");

            //发送开始消息
            if (m_Rooms[roomIdx][0] && m_Rooms[roomIdx][1] &&
                m_Connections[m_Rooms[roomIdx][0]] &&
                m_Connections[m_Rooms[roomIdx][1]] &&
                m_Connections[m_Rooms[roomIdx][0]].status == STAT_READY &&
                m_Connections[m_Rooms[roomIdx][1]].status == STAT_READY) {
                //告诉两名玩家游戏正式开始
                m_Connections[m_Rooms[roomIdx][0]].status = STAT_START;
                m_Connections[m_Rooms[roomIdx][1]].status = STAT_START;
                m_Connections[m_Rooms[roomIdx][0]].socket.emit("start", {
                    "color": COLOR_BLACK,
                    "allowDraw": true
                });
                m_Connections[m_Rooms[roomIdx][1]].socket.emit("start", {
                    "color": COLOR_WHITE,
                    "allowDraw": false
                });

                //通知大厅的成员有游戏开始了
                io.sockets.emit("startInfo", {
                    "roomIdx": roomIdx,
                    "player1": m_Rooms[roomIdx][0],
                    "player2": m_Rooms[roomIdx][1]
                });
                console.log(roomIdx + "号房间开始游戏了。");
            }
        }
    };

    //点击格子
    var onDrawCell = function (data) {
        var sid = this.id;
        var roomIdx = m_Connections[sid].roomIdx;
        if (m_Rooms[roomIdx][0] && m_Rooms[roomIdx][1] &&
            m_Connections[m_Rooms[roomIdx][0]] &&
            m_Connections[m_Rooms[roomIdx][1]] &&
            m_Connections[m_Rooms[roomIdx][0]].status == STAT_START &&
            m_Connections[m_Rooms[roomIdx][1]].status == STAT_START &&
            checkValidCell(roomIdx, data.x, data.y) == true) {
            data.id = sid;
            m_RoomData[roomIdx][data.x][data.y] = data.color;

            for (var i = 0; i < 2; i++) {//向房间内所有成员发送游戏信息
                m_Connections[m_Rooms[roomIdx][i]].socket.emit("drawCell", data);
            }

            //结束游戏判断
            if (checkGameOver(roomIdx, data.x, data.y) == true) {
                var winer = (sid == m_Rooms[roomIdx][0] ? m_Rooms[roomIdx][0] : m_Rooms[roomIdx][1]);
                var loser = (sid == m_Rooms[roomIdx][1] ? m_Rooms[roomIdx][0] : m_Rooms[roomIdx][1]);
                m_Connections[m_Rooms[roomIdx][0]].status = STAT_NORMAL;
                m_Connections[m_Rooms[roomIdx][1]].status = STAT_NORMAL;
                resetGameData(roomIdx);
                m_Connections[winer].socket.emit("winer", "");
                m_Connections[loser].socket.emit("loser", "");

                //通知大厅的成员有游戏结束了
                io.sockets.emit("overInfo", {
                    "roomIdx": roomIdx,
                    "player1": m_Rooms[roomIdx][0],
                    "player2": m_Rooms[roomIdx][1]
                });
            }
        }
    };

    //检查合法性
    var checkValidCell = function (roomIdx, x, y) {
        return m_RoomData[roomIdx][x][y] != 1;
    };

    //检查游戏是否结束
    var checkGameOver = function (roomIdx, x, y) {
        var n;
        var cur = m_RoomData[roomIdx][x][y];

        //横
        n = 0;
        var startX = (x - 4) < 0 ? 0 : x - 4;
        var endX = (x + 4) > 14 ? 14 : x + 4;
        for (var xi = startX; xi <= endX; xi++) {
            if (m_RoomData[roomIdx][xi][y] == cur) {
                n++;
            } else {
                n = 0;
            }
            if (n >= 5) return true;
        }

        //竖
        n = 0;
        var startY = (y - 4) < 0 ? 0 : x - 4;
        var endY = (y + 4) > 14 ? 14 : y + 4;
        for (var yi = startY; yi <= endY; yi++) {
            if (m_RoomData[roomIdx][x][yi] == cur) {
                n++;
            } else {
                n = 0;
            }
            if (n >= 5) return true;
        }

        //正斜
        n = 0;
        var min = x < y ? (x - 4 < 0 ? x : 4) : (y - 4 < 0 ? y : 4);
        var max = x > y ? (x + 4 > 14 ? 14 - x : 4) : (y + 4 > 14 ? 14 - y : 4);
        var p1x = x - min;
        var p1y = y - min;
        var p2x = x + max;
        var p2y = y + max;
        for (var p1xi = p1x, p1yi = p1y; p1xi <= p2x, p1yi <= p2y; p1xi++, p1yi++) {
            if (m_RoomData[roomIdx][p1xi][p1yi] == cur) {
                n++;
            } else {
                n = 0;
            }
            if (n >= 5) return true;
        }

        //反斜
        n = 0;
        var min = (x + 4 > 14 ? 14 - x : 4) < (y - 4 < 0 ? y : 4) ?
            (x + 4 > 14 ? 14 - x : 4) : (y - 4 < 0 ? y : 4);
        var max = (x - 4 < 0 ? x : 4) < (y + 4 > 14 ? 14 - y : 4) ?
            (x - 4 < 0 ? x : 4) : (y + 4 > 14 ? 14 - y : 4);
        var p1x = x + min;
        var p1y = y - min;
        var p2x = x - max;
        var p2y = y + max;
        for (var i = p1x, j = p1y; i >= p2x; i--, j++) {
            if (m_RoomData[roomIdx][i][j] == cur) {
                n++;
            } else {
                n = 0;
            }
            if (n >= 5) return true;
        }

        return false;
    };

    //发送消息
    var onMessage = function (data) {
        var sid = this.id;
        if (!m_Connections[sid]) return;

        var cli = m_Connections[sid];
        var msg = {
            type: data.type,
            id: cli.socket.id,
            nickname: cli.nickname,
            body: data.body
        };
        switch (data.type) {
            case MSG_ALL://所有人消息
                if (data.body) {
                    io.sockets.emit("message", msg);
                }
                break;
            case MSG_TO://发送消息到指定人
                if (data.to && data.body) {
                    m_Connections[data.to].socket.emit("message", msg);
                }
                break;
            case MSG_ROOM://房间
                if (cli.roomIdx > -1 && cli.roomIdx < m_Config.RoomTotal && data.body) {
                    for (var i = 0; i < 2; i++) {
                        if (m_Rooms[cli.roomIdx][i]) {
                            m_Connections[m_Rooms[cli.roomIdx][i]].socket.emit("message", msg);
                        }
                    }
                }
                break;
            default:
                break;
        }
    };

    /**
     * 获取随机数，下标从0开始
     * @param seed
     * @returns {number}
     */
    var getRandom = function (seed) {
        return Math.floor(Math.random() * seed);
    }
};
