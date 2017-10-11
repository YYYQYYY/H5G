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
            $("#list-box").append(makeHtmlUserList(data));
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
        $("#room-" + data.roomIdx).addClass("room_item_start");
        $("#user-" + data.player1 + " span").html("游戏中");
        $("#user-" + data.player2 + " span").html("游戏中");
    }).on("overInfo", function (data) {//游戏结束了
        $("#room-" + data.roomIdx).removeClass("room_item_start");
        $("#user-" + data.player1 + " span").html("无状态");
        $("#user-" + data.player2 + " span").html("无状态");
        if (data.roomIdx == g_Info.roomIdx) {
            //更新房间另一个成员的状态
            var p = (data.player1 == g_Info.id ? 2 : 1);
            $("#room-p" + p + "-status").html("未准备");
        }
    }).on("leaveRoom", function (data) {//离开房间
        onLeaveRoom(data);
    }).on("joinRoomError", function (data) {//加入房间失败
        alert("加入房间失败");
    }).on("message", function (data) {//接受消息
        if (data.type == MSG_ALL) {
            $("#msg-content").append("<p>" + data.nickname + ": " + data.body + "</p>");
        } else if (data.type == MSG_TO) {
            $("#msg-content").append("<p style=\"color:#339933\">" + data.nickname + ": " + data.body + "</p>");
        } else if (data.type == MSG_ROOM) {
            $("#room-msg-content").append("<p>" + data.nickname + ": " + data.body + "</p>");
        }
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
    $('#nickname').val("abc").focus();

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
    $(document).on("click", "#room-box .player", function () {
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
    $("#msg-button").click(function () {
        var msg = $("#msg-input").val();
        if (msg == "") {
            return;
        }
        app.sendAllMsg(msg);
        $("#msg-input").val('');
    });

    //发送消息到房间内
    $("#room-msg-button").click(function () {
        var msg = $("#room-msg-input").val();
        if (!msg) {
            return;
        }
        app.sendRoomMsg(msg);
        $("#room-msg-input").val("");
    });

    //切换窗口
    $("#tag a").click(function () {
        var id = $(this).attr('href').substr(1);
        if ($(this).hasClass('on')) {
            return false;
        }

        if (g_Info.roomIdx == -1) {
            alert("您还没有加入房间");
            return false;
        }

        changeTag(id);
        return false;
    });

    //点击格子
    $("div.room_cell").click(function (ev) {
        var pageX = ev.pageX;
        var pageY = ev.pageY;
        var x = parseInt((pageX - $(this).offset().left - 5) / 35);
        var y = parseInt((pageY - $(this).offset().top - 5) / 35);

        if (g_Info.roomIdx == -1 || g_Info.status != STAT_START ||
            $("#cell-" + x + '-' + y).length > 0 || g_Info.allowDraw == false) {
            return;
        }

        app.drawCell(g_Info.color, x, y);
    });

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

    //切换
    function changeTag(tag) {
        if (tag == "room_list") {
            $("#room_list").show();
            $("#tag_room_list").addClass("on");
            $("#room").hide();
            $("#tag_room").removeClass("on");
        } else {
            $("#room").show();
            $("#tag_room").addClass("on");
            $("#room_list").hide();
            $("#tag_room_list").removeClass("on");
        }
    }

    //生成用户html
    function makeHtmlUserList(data) {
        var stat = (data.status == STAT_READY ? "已准备" : (data.status == STAT_START ? "游戏中" : "无状态"));
        return ('<li id="user-' + data.id + '"><span>' + stat + "</span>" + data.nickname + "</li>");
    }

    //初始化用户列表
    function initUserList(data) {
        var html = '';
        for (var i = 0; i < data.length; i++) {
            html += makeHtmlUserList(data[i]);
        }
        $("#list-box").html(html);
    }

    //初始化房间列表
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
        $("#room-box").html(html);
    }

    //初始化房间
    function initRoom(player1, player2) {
        //清除消息和棋子
        $("div.room_cell div").remove();
        $("#room-msg-content p").remove();

        //tag样式切换
        changeTag("room");

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

    //更新房间人员
    function updateRoom(posIdx, player) {
        var p = (posIdx == 0 ? 1 : 2);
        var s = (player.status == STAT_NORMAL ? "未准备" : (player.status == STAT_READY ? "已准备" : "游戏中"));
        $("#room-p" + p + "-nickname").html(player.nickname);
        $("#room-p" + p + "-status").html(s);
        $("#room-p" + p + "-img").html('<img src="static/images/room/yes_player.gif">');
        if (g_Info.id == player.id) {
            var b = (player.status == STAT_NORMAL ? "准备" : (player.status == STAT_READY ? "取消" : "游戏中..."));
            $("#game_ready").val(b);
        }
    }

    //从本房间移除另一个成员
    function removeRoom(posIdx) {
        var p = (posIdx == 0 ? 1 : 2);
        $("#room-p" + p + "-nickname").html('&nbsp;');
        $("#room-p" + p + "-status").html("&nbsp;");
        $("#room-p" + p + "-img").html('<img src="static/images/room/no_player.gif">');
    }

    //登录请求回调
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

    //退出请求回调
    function onClose(data) {
        $("#user-" + data.id).remove();

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

    //加入房间请求回调
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
        initGame(data.mg);
    }

    //准备请求回调
    function onReady(data) {
        //本房间有人准备
        if (data.roomIdx == g_Info.roomIdx) {
            updateRoom(data.posIdx, data);
        }
        //大厅有人准备
        var stat = (data.status == STAT_NORMAL ?
            "无状态" : (data.status == STAT_READY ? "已准备" : "游戏中"));
        $("#user-" + data.id + " span").html(stat);
    }

    //开始游戏请求回调
    function onStart(data) {
        g_Info.status = STAT_START;
        g_Info.color = data.color;
        g_Info.allowDraw = data.allowDraw;
        if (g_Info.allowDraw) {
            $("div.room_cell").css("cursor", "pointer");
        } else {
            $("div.room_cell").css("cursor", "no-drop");
        }
        $("div.room_cell div").remove();//清除棋子
        $("#game_ready").val("游戏中...");
        alert("开始游戏啦...");
    }

    //离开房间请求回调
    function onLeaveRoom(data) {
        var name = $('#room-' + data.roomIdx + '-name-' + data.posIdx);
        var icon = $('#room-' + data.roomIdx + '-icon-' + data.posIdx);
        name.html('');
        icon.removeClass('yes').addClass('no');
        if (data.id == g_Info.id) {//更新自己的信息
            g_Info.roomIdx = -1;
            g_Info.posIdx = -1;
            changeTag("room_list");
        } else if (data.roomIdx == g_Info.roomIdx) {//本房间有人退出
            removeRoom(data.posIdx);
        }
    }

    //点击格子请求回调
    function onDrawCell(data) {
        var left = data.x * 35 + 5;
        var top = data.y * 35 + 5;
        var css = (data.color == COLOR_BLACK ? "black" : "white");
        var html = '<div id="cell-' + data.x + '-' + data.y + '" style="left:' + left + 'px;top:' + top + 'px" class="' + css + '"></div>';
        $("div.room_cell").append(html);
        if ($("div.room_cell .cur").length == 0) {
            $("div.room_cell").append('<div class="cur"></div>');
        }
        $("div.room_cell .cur").css({
            left: left,
            top: top
        });
        if (data.id == g_Info.id) {
            g_Info.allowDraw = false;
            $("div.room_cell").css("cursor", "no-drop");
        } else {
            g_Info.allowDraw = true;
            $("div.room_cell").css("cursor", "pointer");
        }
    }

    $("#loginBtn").click();
});

//////////////////////////////////////////////////
//// 画布相关
//////////////////////////////////////////////////
var MG = {};

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
 * 初始化游戏
 */
function initGame(mg) {
    setConfig();

    MG.masks = [];
    MG.timer = 0;
    MG.timeout = 0;
    MG.score = mg.score;

    MG.dataMap = mg.dataMap;
    MG.cg = mg.cg;
    MG.residualMines = mg.residualMines;
    MG.elapsedTime = mg.elapsedTime;


    $("#residual_mines").text(0);
    $("#score").text(MG.score);
    stopInterval();

    //setCurrentGame();
    drawGridCells();
    initMask();
    drawMask();

    initLayers();
    bindEvent();
    createGameData();
    drawDataMap();
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

    //ctx.beginPath();
    //ctx.moveTo(0, 0);
    //ctx.lineTo(0, CONFIG.width);
    //ctx.lineTo(CONFIG.width, CONFIG.height);
    //ctx.lineTo(0, CONFIG.height);
    //ctx.lineTo(0, 0);
    //ctx.closePath();

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
function initMask() {
    for (var r = 0; r < MG.cg.range.rows; r++) {
        MG.masks[r] = Array.apply(null, Array(MG.cg.range.columns)).map(function (i) {
            return new Cell();
        });
    }
    for (var ri = 0; ri < MG.cg.range.rows; ri++) {
        drawBlock(ri, ri, ri % 2);
    }
}

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
    //MG.layers.forEach(function (i) {
    //        //MG.layers[i].canvas.oncontextmenu = function (e) {
    //        //    if (document.all) {
    //        //        window.event.returnValue = false;
    //        //    } else {
    //        //        event.preventDefault();
    //        //    }
    //        //}
    //    }
    //);

    $("#elapsed_time").text(MG.elapsedTime);
    MG.timer = setInterval(function () {
        MG.elapsedTime++;
        $("#elapsed_time").text(MG.elapsedTime);
    }, 1000);
    $("#residual_mines").text(MG.residualMines);
}

var dX = 0, dY = 0;
/**
 * 绑定事件
 */
function bindEvent() {
    var layers = $("#layers");
    layers.oncontextmenu = disableRightClick;
    layers.mousedown(function (e) {
        var canvasPosition = $(this).offset();
        dX = (e.pageX - canvasPosition.left) || 0;
        dY = (e.pageY - canvasPosition.top) || 0;
        var ri = Math.floor(dX / MG.cellWidth);
        var ci = Math.floor(dY / MG.cellWidth);
        ri = ri >= MG.cg.range.rows ? MG.cg.range.rows - 1 : ri;
        ci = ci >= MG.cg.range.columns ? MG.cg.range.columns - 1 : ci;

        MG.timeout = setTimeout(function (e) {
            checkMine(ri, ci, true);
            MG.timeout = 0;
        }, 1000);
    });
    layers.mousemove(function (e) {
        var canvasPosition = $(this).offset();
        var mX = (e.pageX - canvasPosition.left) || 0;
        var mY = (e.pageY - canvasPosition.top) || 0;

        if ((Math.abs(dX - mX) > MG.cellWidth / 2) ||
            (Math.abs(dY - mY) > MG.cellWidth / 2)) {
            clearTimeout(MG.timeout);
            MG.timeout = 0;
        }
    });
    layers.mouseup(function (e) {
        clearTimeout(MG.timeout);
        if (MG.timeout != 0) {
            var canvasPosition = $(this).offset();
            var uX = (e.pageX - canvasPosition.left) || 0;
            var uY = (e.pageY - canvasPosition.top) || 0;
            var ri = Math.floor(uX / MG.cellWidth);
            var ci = Math.floor(uY / MG.cellWidth);
            ri = ri >= MG.cg.range.rows ? MG.cg.range.rows - 1 : ri;
            ci = ci >= MG.cg.range.columns ? MG.cg.range.columns - 1 : ci;

            checkMine(ri, ci, false);
        }
    });
}

/**
 * 生成雷区地图
 */
function createGameData() {
    initDataMap();
    createMines();
}

/**
 * 生成空白地图
 */
function initDataMap() {
    for (var r = 0; r < MG.cg.range.rows; r++) {
        MG.dataMap[r] = Array.apply(null, Array(MG.cg.range.columns)).map(function (i) {
            return new Cell();
        });
    }
}

/**
 * 生成地雷
 * 扫描地雷周围，生成格子周围地雷数
 */
function createMines() {
    var mineCount = MG.cg.mineCount;
    var tempArr = {};
    while (mineCount > 0) {
        var pos = getRandomPosition();
        var key = pos.x + "=" + pos.y;
        if (!tempArr[key]) {
            tempArr[key] = 1;
            MG.dataMap[pos.x][pos.y].data = -1;
            scanAroundCell(pos);
            mineCount--;
        }
    }
    tempArr = null;
}

/**
 * 扫描当前格子周围8格，更新地雷数
 * @param pos
 */
function scanAroundCell(pos) {
    var rows = MG.cg.range.rows;
    var columns = MG.cg.range.columns;
    for (var ri = -1; ri < 2; ri++) {
        var r = pos.x + ri;
        if (r > -1 && r < rows) {
            for (var ci = -1; ci < 2; ci++) {
                var c = pos.y + ci;
                if (c > -1 && c < columns && !(r == pos.x && c == pos.y) && MG.dataMap[r][c].data > -1) {
                    MG.dataMap[r][c].data++;
                }
            }
        }
    }
}

/**
 * 随机生成格子地址
 * @returns {*[]}
 */
function getRandomPosition() {
    return {
        x: getRandom(MG.cg.range.rows),
        y: getRandom(MG.cg.range.columns)
    };
}

/**
 * 绘制格子
 */
function drawDataMap() {
    var rows = MG.cg.range.rows;
    var columns = MG.cg.range.columns;

    for (var ri = 0; ri < rows; ri++) {
        for (var ci = 0; ci < columns; ci++) {
            drawCell(ri, ci);
        }
    }
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
 * @param ri
 * @param ci
 */
function drawCell(ri, ci) {
    var cellWidth = MG.cellWidth;
    var ctx = MG.layers[0];
    ctx.textAlign = "center";
    ctx.font = MG.cellWidth / 2 + "px Arial";
    var msg = "";

    if (MG.dataMap[ri][ci].data < 0) {
        ctx.fillStyle = "lightgray";
        msg = "M";
    } else if (MG.dataMap[ri][ci].data > 0) {
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
 * 打开格子
 * @param ri
 * @param ci
 */
function openCell(ri, ci) {
    if (!MG.dataMap[ri][ci].isOpened && !MG.dataMap[ri][ci].isFlag) {
        var cellWidth = MG.cellWidth;
        var ctx = MG.layers[1];
        ctx.clearRect(ri * cellWidth + 1, ci * cellWidth + 1, cellWidth - 1, cellWidth - 1);
        MG.dataMap[ri][ci].isOpened = true;
    }
}

/**
 * 标记旗子
 * @param ri
 * @param ci
 */
function drawFlag(ri, ci) {
    var ctx = MG.layers[1];

    if (MG.dataMap[ri][ci].isOpened) {
        return;
    }

    var cellWidth = MG.cellWidth;

    MG.dataMap[ri][ci].isFlag = true;//!MG.dataMap[ri][ci].isFlag;
    //if (MG.dataMap[ri][ci].isFlag) {
    //    ctx.fillStyle = "#abc";
    //    ctx.fillRect(ri * cellWidth + cellWidth / 4, ci * cellWidth + cellWidth / 4, cellWidth / 2 - 1, cellWidth / 2 - 1);
    //} else {
    //    ctx.clearRect(ri * cellWidth + cellWidth / 4, ci * cellWidth + cellWidth / 4, cellWidth / 2 - 1, cellWidth / 2 - 1);
    //    ctx.fillStyle = "lightblue";
    //    ctx.fillRect(ri * cellWidth + cellWidth / 4 - 1, ci * cellWidth + cellWidth / 4 - 1, cellWidth / 2, cellWidth / 2 + 1);
    //}
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

var CONFIG = {
    width: 0,
    height: 0,
    cellWidth: 0
};

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
 * 开始游戏
 */
function startGame() {
    initLayers();
    bindEvent();
    createGameData();
    drawDataMap();
}

/**
 * 重置游戏
 */
function resetGame() {
    initGame();
    startGame();
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
