$(function () {
    var MSG_ALL = 0;//发送到所有用户
    var MSG_TO = 1;//发送指定用户
    var MSG_ROOM = 2;//向指定桌发送消息

    var STAT_NORMAL = 0;//无状态
    var STAT_READY = 1;//准备
    var STAT_START = 2;//游戏中

    var COLOR_BLACK = 1;//黑色
    var COLOR_WHITE = 2;//白色

    var g_Connected = false;
    //var g_Host = "msss.chinacloudsites.cn";
    var g_Host = "localhost";
    var g_Port = 1337;
    var g_Info = {
        "id": 0,
        "nickname": "",
        "status": 0,
        "roomIdx": -1,
        "posIdx": -1
    };
    var app = new MineClient(g_Host, g_Port);
    //var defaultNickname = "请输入昵称";

    app.on("login", function (data) {//登录返回
        onLogin(data);
    }).on("close", function (data) {//退出程序
        onClose(data);
    }).on("join", function (data) {//新用户加入大厅
        if (g_Info.id != data.id) {
            $("#user_list_ul").append(makeHtmlUserList(data));
        }
    }).on("joinRoom", function (data) {//用户加入房间
        onJoinRoom(data);
    }).on("ready", function (data) {//准备
        onReady(data);
    }).on("roomInfo", function (data) {//获取房间信息
        initRoom(data[0], data[1]);
    }).on("start", function (data) {//开始游戏
        onStart(data);
    }).on("startInfo", function (data) {//有游戏开始了
        onStarted(data);
    }).on("overInfo", function (data) {//游戏结束了
        onOvered(data);
    }).on("leaveRoom", function (data) {//离开房间
        onLeaveRoom(data);
    }).on("joinRoomError", function (data) {//加入房间失败
        alert("加入房间失败");
    }).on("message", function (data) {//接受消息
        onMessage(data);
    }).on("drawCell", function (data) {//点击格子
        onDrawCell(data);
    }).on("winer", function (data) {//胜利
        g_Info.status = STAT_NORMAL;
        g_Info.allowDraw = false;
        updateRoom(g_Info.posIdx, g_Info);
        alert("你真厉害，居然赢了这个家伙，再接再历！");
    }).on("loser", function (data) {//失败
        g_Info.status = STAT_NORMAL;
        g_Info.allowDraw = false;
        updateRoom(g_Info.posIdx, g_Info);
        alert("你太菜了，连这家伙都搞不定，回去养猪吧！");
    });

    //初始化登录框
    $("#dlgBg").css({
        width: $(document).width(),
        height: $(document).height()
    });
    $("#login").css({
        left: ($(document).width() - $("#login").width()) / 2,
        top: 100
    });

    //昵称输入框事件
    $('#nickname').val("abc" + Math.ceil(Math.random() * 100 + 10)).focus();

//////////////////////////////////////////////////
//// 事件相关
//////////////////////////////////////////////////

    //登录
    $("#loginBtn").click(function () {
        //链接服务器
        if (app.connect() == false) {
            alert("error: " + app.getError());
            return false;
        }

        //登录
        var nickname = $("#nickname").val();
        if (!nickname) {
            alert("请输入昵称");
            $("#nickname").val('').focus();
            return;
        }
        app.login(nickname);
    });

    //加入房间
    $(document).on("click", "#room_list .player", function () {
        var roomIdx = $(this).closest('.room_item').attr('value');
        var posIdx = $(this).attr('value');
        if ($("#room-" + roomIdx + "-icon-" + posIdx).hasClass("yes")) {
            return;
        }

        if (g_Info.status == STAT_START) {
            alert("你正在游戏中，不能加入其它房间");
            return;
        }

        app.joinRoom(roomIdx, posIdx);
    });

    //发送消息
    $("#piazza_chat_button").click(function () {
        var msg = $("#piazza_chat_input").val();
        if (msg == "") {
            return;
        }
        app.sendAllMsg(msg);
        $("#piazza_chat_input").val('');
    });

    //发送消息到房间内
    $("#room_chat_button").click(function () {
        var msg = $("#room_chat_input").val();
        if (!msg) {
            return;
        }
        app.sendRoomMsg(msg);
        $("#room_chat_input").val("");
    });

    //切换窗口
    $("#tab_list a").click(function () {
        var id = $(this)[0].id;
        if ($(this).hasClass('on')) {
            return false;
        }

        if (g_Info.roomIdx == -1) {
            alert("您还没有加入房间");
            return false;
        }

        changeTab(id);
        return false;
    });

    //点击格子
    drawCellEvent();

    //准备
    $("#game_ready").click(function () {
        if (g_Info.status == STAT_START) {
            return;
        }
        app.ready();
    });

    //退出房间
    $("#game_leave").click(function () {
        if (g_Info.status == STAT_START) {
            alert("正在游戏中，你不能退出");
            return;
        }
        app.leaveRoom(g_Info.roomIdx);
    });

    /**
     * 切换大厅与房间
     * @param id
     */
    function changeTab(id) {
        if (id == "tab_game_piazza") {
            $("#game_piazza").show();
            $("#tab_game_piazza").addClass("on");
            $("#game_room").hide();
            $("#tab_game_room").removeClass("on");
        } else if (id == "tab_game_room") {
            $("#game_room").show();
            $("#tab_game_room").addClass("on");
            $("#game_piazza").hide();
            $("#tab_game_piazza").removeClass("on");
        }
    }

    /**
     * 生成用户html
     * @param data
     * @returns {string}
     */
    function makeHtmlUserList(data) {
        var stat = (data.status == STAT_READY ? "已准备" : (data.status == STAT_START ? "游戏中" : "无状态"));
        var html = '';
        html += '<li>';
        html += '<div id="room_user_' + data.id + '">';
        html += '<span>' + stat + '</span>';
        html += '<img style="min-height: 60%;max-height: 60%;" src="static/images/room/player_yes.gif">';
        html += '<p>' + data.nickname + '</p>';
        html += '</div>';
        html += '</li>';
        return html;
    }

    /**
     * 初始化用户列表
     * @param data
     */
    function initUserList(data) {
        var html = '';
        for (var i = 0; i < data.length; i++) {
            html += makeHtmlUserList(data[i]);
        }
        $("#user_list_ul").html(html);
    }

    /**
     * 初始化房间列表
     * @param data
     */
    function initRoomList(data) {
        var html = '';
        for (var idx in data) {
            html += '<div id="room-' + idx + '" value="' + idx + '" class="room_item">';
            html += '<div id="room-' + idx + '-name-1" class="player2">' + (data[idx][1] ? data[idx][1].nickname : "") + '</div>';
            html += '<div class="players">';
            html += '<div value="0" id="room-' + idx + '-icon-0" class="player icon1 ' + (data[idx][0] ? "yes" : "no") + '"></div>';
            html += '<div value="1" id="room-' + idx + '-icon-1" class="player icon2 ' + (data[idx][1] ? "yes" : "no") + '"></div>';
            html += '</div>';
            html += '<div id="room-' + idx + '-name-0" class="player1">' + (data[idx][0] ? data[idx][0].nickname : "") + '</div>';
            html += '<div class="roomnum">- ' + (parseInt(idx) + 1) + ' -</div>';
            html += '</div>';
        }
        $("#room_list").html(html);
    }

    /**
     * 初始化房间
     * @param player1
     * @param player2
     */
    function initRoom(player1, player2) {
        //清除消息和棋子
        $("div.room_cell div").remove();
        $("#room_message_list p").remove();

        //tag样式切换
        changeTab("tab_game_room");

        //玩家1
        if (player1) {
            updateRoom(0, player1);
        } else {
            removeRoom(0);
        }

        //玩家2
        if (player2) {
            updateRoom(1, player2);
        } else {
            removeRoom(1);
        }
    }

    /**
     * 更新房间人员
     * @param posIdx
     * @param player
     */
    function updateRoom(posIdx, player) {
        var p = (posIdx == 0 ? 1 : 2);
        var s = (player.status == STAT_NORMAL ? "未准备" : (player.status == STAT_READY ? "已准备" : "游戏中"));
        $("#room_p" + p + "_nickname").html(player.nickname);
        $("#room_p" + p + "_status").html(s);
        $("#room_p" + p + "_score").html('0');
        $("#room_p" + p + "_img").attr('src', 'static/images/room/player_yes.gif');
        if (g_Info.id == player.id) {
            var b = (player.status == STAT_NORMAL ? "准备" : (player.status == STAT_READY ? "取消" : "游戏中..."));
            $("#game_ready").val(b);
        }
    }

    /**
     * 从本房间移除另一个成员
     * @param posIdx
     */
    function removeRoom(posIdx) {
        var p = (posIdx == 0 ? 1 : 2);
        $("#room_p" + p + "_nickname").html('空缺中');
        $("#room_p" + p + "_status").html("无状态");
        $("#room_p" + p + "_img").attr('src', 'static/images/room/player_no.gif');
    }

    /**
     * 绑定点击格子事件
     */
    function drawCellEvent() {
        var layers = $("#layers");
        layers.oncontextmenu = disableRightClick;
        layers.on("mousedown", function (e) {
            var canvasPosition = $(this).offset();
            dX = (e.pageX - canvasPosition.left) || 0;
            dY = (e.pageY - canvasPosition.top) || 0;
            var ri = Math.floor(dX / MG.cellWidth);
            var ci = Math.floor(dY / MG.cellWidth);
            ri = ri >= MG.cg.range.rows ? MG.cg.range.rows - 1 : ri;
            ci = ci >= MG.cg.range.columns ? MG.cg.range.columns - 1 : ci;

            MG.timeout = setTimeout(function (e) {
                //checkMine(ri, ci, true);
                MG.timeout = 0;
                if (
                    g_Info.roomIdx == -1 || g_Info.status != STAT_START ||
                    MG.dataMap[ri][ci].data != 0 || MG.dataMap[ri][ci].isFlag || MG.dataMap[ri][ci].isOpened || !g_Info.allowDraw
                ) {
                    return;
                }
                app.drawCell(g_Info.color, ri, ci, true);
            }, 1000);
        });
        layers.on("mousemove", function (e) {
            var canvasPosition = $(this).offset();
            var mX = (e.pageX - canvasPosition.left) || 0;
            var mY = (e.pageY - canvasPosition.top) || 0;

            if ((Math.abs(dX - mX) > MG.cellWidth / 2) ||
                (Math.abs(dY - mY) > MG.cellWidth / 2)) {
                clearTimeout(MG.timeout);
                MG.timeout = 0;
            }
        });
        layers.on("mouseup", function (e) {
            clearTimeout(MG.timeout);
            if (MG.timeout != 0) {
                var canvasPosition = $(this).offset();
                var uX = (e.pageX - canvasPosition.left) || 0;
                var uY = (e.pageY - canvasPosition.top) || 0;
                var ri = Math.floor(uX / MG.cellWidth);
                var ci = Math.floor(uY / MG.cellWidth);
                ri = ri >= MG.cg.range.rows ? MG.cg.range.rows - 1 : ri;
                ci = ci >= MG.cg.range.columns ? MG.cg.range.columns - 1 : ci;

                //checkMine(ri, ci, false);
                if (
                    g_Info.roomIdx == -1 || g_Info.status != STAT_START ||
                    MG.dataMap[ri][ci].data != 0 || MG.dataMap[ri][ci].isFlag || MG.dataMap[ri][ci].isOpened || !g_Info.allowDraw
                ) {
                    return;
                }
                app.drawCell(g_Info.color, ri, ci, false);
            }
        });
    }

//////////////////////////////////////////////////
//// 回调相关
//////////////////////////////////////////////////

    /**
     * 登录请求回调
     * @param data
     */
    function onLogin(data) {
        if (data.ret == 1) {
            $("#dlgBg").remove();
            $("#login").remove();
            g_Info.id = data.info.id;
            g_Info.nickname = data.info.nickname;
            g_Info.status = data.info.status;
            initRoomList(data.room);
            initUserList(data.list);
        } else {
            alert("登录失败");
        }
    }

    /**
     * 退出请求回调
     * @param data
     */
    function onClose(data) {
        $("#room_user_" + data.id).parent().remove();

        //本房间有人退出
        if (data.roomIdx == g_Info.roomIdx) {
            removeRoom(data.posIdx);
            if (g_Info.status == STAT_START) {
                g_Info.status = STAT_NORMAL;
                updateRoom(g_Info.posIdx, g_Info);
            }
        }

        //大厅有人退出
        if (data.roomIdx != -1) {
            var name = $('#room-' + data.roomIdx + '-name-' + data.posIdx);
            var icon = $('#room-' + data.roomIdx + '-icon-' + data.posIdx);
            name.html('');
            icon.removeClass('yes').addClass('no');
        }
    }

    /**
     * 加入房间请求回调
     * @param data
     */
    function onJoinRoom(data) {
        var name = $('#room-' + data.roomIdx + '-name-' + data.posIdx);
        var icon = $('#room-' + data.roomIdx + '-icon-' + data.posIdx);
        name.html(data.nickname);
        icon.removeClass('no').addClass('yes');

        //自己
        if (data.id == g_Info.id) {
            g_Info.roomIdx = data.roomIdx;
            g_Info.posIdx = data.posIdx;
            g_Info.status = STAT_NORMAL;
        } else if (data.roomIdx == g_Info.roomIdx) {
            //有人加入本房间
            data.status = STAT_NORMAL;
            updateRoom(data.posIdx, data);
        }
        initGame();
    }

    /**
     * 准备请求回调
     * @param data
     */
    function onReady(data) {
        //本房间有人准备
        if (data.roomIdx == g_Info.roomIdx) {
            updateRoom(data.posIdx, data);
        }
        //大厅有人准备
        var stat = (data.status == STAT_NORMAL ? "无状态" : (data.status == STAT_READY ? "已准备" : "游戏中"));
        $("#room_user_" + data.id + " span").html(stat);
        resetGame(data.mg);
    }

    /**
     * 开始游戏请求回调
     * @param data
     */
    function onStart(data) {
        g_Info.status = STAT_START;
        g_Info.color = data.color;
        g_Info.allowDraw = data.allowDraw;
        MG.score = data.score;
        if (g_Info.allowDraw) {
            $("div.room_cell").css("cursor", "pointer");
        } else {
            $("div.room_cell").css("cursor", "no-drop");
        }
        $("div.room_cell div").remove();//清除桌面
        $("#game_ready").val("游戏中...");
        MG.timer = setInterval(function () {
            MG.elapsedTime++;
            $("#elapsed_time").text(MG.elapsedTime);
        }, 1000);
        //if (confirm("开始游戏啦...")) {
        //}
    }

    /**
     * 离开房间请求回调
     * @param data
     */
    function onLeaveRoom(data) {
        var name = $('#room-' + data.roomIdx + '-name-' + data.posIdx);
        var icon = $('#room-' + data.roomIdx + '-icon-' + data.posIdx);
        name.html('');
        icon.removeClass('yes').addClass('no');
        if (data.id == g_Info.id) {//更新自己的信息
            g_Info.roomIdx = -1;
            g_Info.posIdx = -1;
            changeTab("tab_game_piazza");
        } else if (data.roomIdx == g_Info.roomIdx) {//本房间有人退出
            removeRoom(data.posIdx);
        }
    }

    /**
     * 点击格子请求回调
     * @param data
     */
    function onDrawCell(data) {
        if (data.id == g_Info.id) {
            g_Info.allowDraw = false;
            $("div.room_cell").css("cursor", "no-drop");
        } else {
            g_Info.allowDraw = true;
            $("div.room_cell").css("cursor", "pointer");
        }
        MG.residualMines = data.residualMines;
        MG.score = data.score;
        drawCells(data);
    }

    /**
     * 接受消息回调
     * @param data
     */
    function onMessage(data) {
        if (data.type == MSG_ALL) {
            $("#piazza_message_list").append("<p>" + data.nickname + ": " + data.body + "</p>");
        } else if (data.type == MSG_TO) {
            $("#piazza_message_list").append("<p style=\"color:#339933\">" + data.nickname + ": " + data.body + "</p>");
        } else if (data.type == MSG_ROOM) {
            $("#room_message_list").append("<p>" + data.nickname + ": " + data.body + "</p>");
        }
    }

    /**
     * 游戏开始回调（更新大厅状态）
     * @param data
     */
    function onStarted(data) {
        $("#room-" + data.roomIdx).addClass("room_item_start");
        $("#room_user_" + data.player1 + " span").html("游戏中");
        $("#room_user_" + data.player2 + " span").html("游戏中");
    }

    /**
     * 游戏结束回调（更新大厅状态）
     * @param data
     */
    function onOvered(data) {
        $("#room-" + data.roomIdx).removeClass("room_item_start");
        $("#room_user_" + data.player1 + " span").html("无状态");
        $("#room_user_" + data.player2 + " span").html("无状态");
        if (data.roomIdx == g_Info.roomIdx) {
            //更新房间另一个成员的状态
            var p = (data.player1 == g_Info.id ? 2 : 1);
            $("#room-p" + p + "-status").html("未准备");
        }
    }

//////////////////////////////////////////////////
//// 画布相关
//////////////////////////////////////////////////
    var CONFIG = {
        width: 0,
        height: 0,
        cellWidth: 0
    };

    var MG = {};
    var dX = 0, dY = 0;

    /**
     * 格子
     * @constructor
     */
    var Cell = function () {
        this.data = 0;
        this.isOpened = false;
        this.isFlag = false;
    };

    /**
     * 进房间时，画游戏面板
     */
    function initGame() {
        var canvas_game = document.getElementById("game");
        canvas_game.width = canvas_game.height = 400;
        var ctx = canvas_game.getContext("2d");

        ctx.fillStyle = "lightblue";
        ctx.fillRect(2, 2, ctx.canvas.width - 2, ctx.canvas.height - 2);
    }

    /**
     * 初始化游戏
     */
    function resetGame(mg) {
        setConfig();

        MG.masks = [];
        MG.timer = 0;
        MG.timeout = 0;

        MG.cellWidth = CONFIG.cellWidth;
        MG.dataMap = mg.dataMap;
        MG.cg = mg.cg;
        MG.residualMines = mg.residualMines;
        MG.elapsedTime = mg.elapsedTime;
        MG.score = {};

        $("#residual_mines").text(0);
        $("#room_p1_score").html(0);
        $("#room_p2_score").html(0);

        stopInterval();

        initLayers();
        drawGridCells();
        createMask();
    }

    /**
     * 清除画布
     * @param ctx
     */
    function clear(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    /**
     * 绘制格子线
     */
    function drawGridCells() {
        var cellWidth = MG.cellWidth;
        var rows = MG.cg.range.rows + 1;
        var columns = MG.cg.range.columns + 1;
        var ctx = MG.layers[0];

        clear(ctx);

        for (var ri = 0; ri < columns; ri++) {
            ctx.beginPath();
            ctx.moveTo(0, ri * cellWidth);
            ctx.lineTo(CONFIG.width, ri * cellWidth);
            ctx.stroke();
            ctx.closePath();
        }
        for (var ci = 0; ci < rows; ci++) {
            ctx.beginPath();
            ctx.moveTo(ci * cellWidth, 0);
            ctx.lineTo(ci * cellWidth, CONFIG.height);
            ctx.stroke();
            ctx.closePath();
        }
    }

    /**
     * 生成遮罩地图
     */
    function createMask() {
        for (var r = 0; r < MG.cg.range.rows; r++) {
            MG.masks[r] = Array.apply(null, Array(MG.cg.range.columns)).map(function (i) {
                return new Cell();
            });
        }
        for (var ri = 0; ri < MG.cg.range.rows; ri++) {
            drawBlock(ri, ri, ri % 2);
        }
        drawMask();
    }

    /**
     * 生成环路地图
     * @param ridx
     * @param cidx
     * @param num
     */
    function drawBlock(ridx, cidx, num) {
        for (var ri = ridx; ri < MG.cg.range.rows - ridx; ri++) {
            for (var ci = cidx; ci < MG.cg.range.columns - cidx; ci++) {
                MG.masks[ri][ci] = num;
            }
        }
    }

    /**
     * 初始化游戏画布
     */
    function initLayers() {
        $("#elapsed_time").text(MG.elapsedTime);
        $("#residual_mines").text(MG.residualMines);
    }

    /**
     * 绘制遮罩
     */
    function drawMask() {
        var cellWidth = MG.cellWidth;
        var rows = MG.cg.range.rows;
        var columns = MG.cg.range.columns;
        var ctx = MG.layers[1];

        for (var ri = 0; ri < rows; ri++) {
            for (var ci = 0; ci < columns; ci++) {
                ctx.fillStyle = "lightblue";
                ctx.fillRect(ri * cellWidth + 1, ci * cellWidth + 1, cellWidth - 2, cellWidth - 2);
                ctx.fillStyle = "darkblue";
                ctx.fillRect(ri * cellWidth + 2, ci * cellWidth + 2, cellWidth - 1, cellWidth - 1);

                if (MG.masks[ri][ci]) {
                    ctx.fillStyle = "#ccf";
                } else {
                    ctx.fillStyle = "#cff";
                }
                ctx.fillRect(ri * cellWidth + 2, ci * cellWidth + 2, cellWidth - 2, cellWidth - 2);
            }
        }
    }

    /**
     * 绘制格子
     * @param data
     */
    function drawCells(data) {
        var ri = data.x;
        var ci = data.y;
        MG.dataMap[ri][ci] = data.cell;

        if (MG.dataMap[ri][ci].isOpened) {
            openCell(ri, ci);
            // 正确打开格子
            if (MG.dataMap[ri][ci].data > -1) {
                drawCell(ri, ci);
            } else {
                drawBoomCell(ri, ci);
            }
        }
        if (MG.dataMap[ri][ci].isFlag) {
            // 正确标旗
            if (MG.dataMap[ri][ci].data < 0) {
                drawFlag(ri, ci);
            } else {
                openCell(ri, ci);
                drawBoomCell(ri, ci);
            }
        }
        showScore(data.id);
    }

    /**
     * 打开格子
     * @param ri
     * @param ci
     */
    function openCell(ri, ci) {
        var cellWidth = MG.cellWidth;
        MG.layers[1].clearRect(ri * cellWidth + 1, ci * cellWidth + 1, cellWidth - 1, cellWidth - 1);
    }

    /**
     * 绘制格子
     * @param ri
     * @param ci
     */
    function drawCell(ri, ci) {
        var cellWidth = MG.cellWidth;
        var ctx = MG.layers[0];
        ctx.textAlign = "center";
        ctx.font = MG.cellWidth / 2 + "px Arial";
        var msg = "";

        if (MG.dataMap[ri][ci].data > 0) {
            ctx.fillStyle = "blue";
            msg = MG.dataMap[ri][ci].data;
        } else {
            ctx.fillStyle = "green";
            msg = "";
        }
        ctx.fillRect(ri * cellWidth + 1, ci * cellWidth + 1, cellWidth - 2, cellWidth - 2);
        ctx.fillStyle = "#f00";
        ctx.fillText(msg, ri * cellWidth + cellWidth / 2, ci * cellWidth + (cellWidth / 1.4));
    }

    /**
     * 绘制爆炸格子
     * @param ri
     * @param ci
     */
    function drawBoomCell(ri, ci) {
        var cellWidth = MG.cellWidth;
        var ctx = MG.layers[0];
        ctx.textAlign = "center";
        ctx.font = MG.cellWidth / 2 + "px Arial";
        var msg = "";

        if (MG.dataMap[ri][ci].data < 0) {
            msg = "M";
        } else if (MG.dataMap[ri][ci].data > 0) {
            msg = MG.dataMap[ri][ci].data;
        }
        ctx.fillStyle = "red";
        ctx.fillRect(ri * cellWidth + 1, ci * cellWidth + 1, cellWidth - 2, cellWidth - 2);
        ctx.fillStyle = "darkgray";
        ctx.fillText(msg, ri * cellWidth + cellWidth / 2, ci * cellWidth + (cellWidth / 1.4));
    }

    /**
     * 标记旗子
     * @param ri
     * @param ci
     */
    function drawFlag(ri, ci) {
        var ctx = MG.layers[1];
        var cellWidth = MG.cellWidth;
        var x = ri * cellWidth;
        var y = ci * cellWidth;

        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.fillStyle = "red";
        //ctx.lineJoin = 'round';
        //ctx.lineCap = 'round';
        ctx.lineTo(x + MG.cellWidth * 0.4, y + MG.cellWidth * 0.2);
        ctx.lineTo(x + MG.cellWidth * 0.8, y + MG.cellWidth * 0.4);
        ctx.lineTo(x + MG.cellWidth * 0.4, y + MG.cellWidth * 0.6);
        ctx.fill();
        ctx.moveTo(x + MG.cellWidth * 0.4 + 1, y + MG.cellWidth * 0.8);
        ctx.lineTo(x + MG.cellWidth * 0.4 + 1, y + MG.cellWidth * 0.6);
        ctx.stroke();
        ctx.closePath();
    }

    /**
     * 显示分数，剩余雷数
     */
    function showScore(id) {
        $("#residual_mines").text(MG.residualMines);

        var sp = (g_Info.posIdx == 0 ? 1 : 2);
        if (g_Info.id == id) {
            $("#room_p" + sp + "_score").html(MG.score[id]);
        } else {
            var op = (sp == 1 ? 2 : 1);
            $("#room_p" + op + "_score").html(MG.score[id]);
        }
    }

    /**
     * 打开所有格子
     */
    function openAllCell() {
        var cellWidth = MG.cellWidth;
        var rows = MG.cg.range.rows;
        var columns = MG.cg.range.columns;
        var ctx = MG.layers[1];

        for (var ri = 0; ri < rows; ri++) {
            for (var ci = 0; ci < columns; ci++) {
                ctx.clearRect(ri * cellWidth + 1, ci * cellWidth + 1, cellWidth - 1, cellWidth - 1);
            }
        }
    }

    /**
     * 屏蔽右键事件
     * @param e
     */
    function disableRightClick(e) {
        if (document.all) {
            window.event.returnValue = false;
        } else {
            event.preventDefault();
        }
    }

    /**
     * 初期设置
     */
    function setConfig() {
        CONFIG.cellWidth = 40;
        CONFIG.width = 400;
        CONFIG.height = 400;

        var layers = $("#layers");
        layers.css("width", CONFIG.width);
        layers.css("height", CONFIG.height);

        MG.layers = [];
        var canvas_bg = document.getElementById("bg");
        canvas_bg.style.border = "1px solid black";
        canvas_bg.width = CONFIG.width;
        canvas_bg.height = CONFIG.height;
        MG.layers[0] = canvas_bg.getContext("2d");
        canvas_bg.oncontextmenu = disableRightClick;
        var canvas_game = document.getElementById("game");
        canvas_game.width = CONFIG.width;
        canvas_game.height = CONFIG.height;
        MG.layers[1] = canvas_game.getContext("2d");
        canvas_game.oncontextmenu = disableRightClick;
    }

    /**
     * 停止计时器
     */
    function stopInterval() {
        clearInterval(MG.timer);
        MG.timer = 0;
        MG.elapsedTime = 0;
        $("#elapsed_time").text(MG.elapsedTime);
    }

    // TODO:::::
    $("#loginBtn").click();
});
