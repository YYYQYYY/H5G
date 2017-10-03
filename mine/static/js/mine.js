/**
 * Created by yuqy on 2017/9/29.
 */
var CONFIG = {
    width: 0,
    height: 0,
    cellWidth: 0
};
var MG = {
    layers: [], /* 画布层 */
    dataMap: [], /* 雷区地图 */
    currentLevel: 0, /* 当前游戏级别 */
    cg: null, /* 当前游戏 */
    residualMines: 0, /* 剩余雷数 */
    elapsedTime: 0, /* 经过时间 */
    timer: 0, /* 计时器 */
    timeout: 0, /* 计时器句柄 */
    score: 0, /* 得分 */
    cellWidth: 0
};

MG.levels = [
    {
        level: 0,
        mineCount: 49,
        range: {
            rows: 9,
            columns: 9
        }
    }
];

/**
 * 格子
 * @constructor
 */
function Cell() {
    this.data = 0;
    this.isOpened = false;
    this.isFlag = false;
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

//////////////////////////////////////////////////
//// 画布相关
//////////////////////////////////////////////////
/**
 * 初始化游戏画布
 */
function initLayers() {
    MG.layers.forEach(function (i) {
            //MG.layers[i].canvas.oncontextmenu = function (e) {
            //    if (document.all) {
            //        window.event.returnValue = false;
            //    } else {
            //        event.preventDefault();
            //    }
            //}
        }
    );

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
 * 判断输赢
 */
function checkWin() {
}

/**
 * 判断是否是雷区
 * @param ri
 * @param ci
 * @param isFlag
 */
function checkMine(ri, ci, isFlag) {
    if (MG.dataMap[ri][ci].isFlag || MG.dataMap[ri][ci].isOpened) {
        return;
    }

    // 判断是否是标旗动作
    if (isFlag) {
        // 正确标旗
        if (MG.dataMap[ri][ci].data < 0) {
            drawFlag(ri, ci);
            addScore(true);
        } else {
            openCell(ri, ci);
            drawBoomCell(ri, ci);
            //stopGame(true);
            subtractScore(true);
        }
    } else {
        openCell(ri, ci);
        // 正确打开格子
        if (MG.dataMap[ri][ci].data > -1) {
            addScore(false);
        } else {
            drawBoomCell(ri, ci);
            //stopGame(false);
            subtractScore(false);
        }
    }

    // 雷区全部清除后，停止计时
    if (MG.residualMines == 0) {
        setTimeout(function () {
            stopInterval();
            if (confirm("你的得分：" + MG.score + "\n还要继续吗？")) {
                resetGame();
            }
        }, 500);
    }
}

/**
 * 加分数
 * @param isFlag
 */
function addScore(isFlag) {
    if (isFlag) {
        MG.residualMines--;
        $("#residual_mines").text(MG.residualMines);
    }
    MG.score++;
    $("#score").text(MG.score);
}

/**
 * 减分数
 * @param isFlag
 */
function subtractScore(isFlag) {
    if (!isFlag) {
        MG.residualMines--;
        $("#residual_mines").text(MG.residualMines);
    }
    MG.score--;
    MG.score = MG.score < 0 ? 0 : MG.score;
    $("#score").text(MG.score);
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

            if ((!(ri % 2 && ci % 2))) {
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

/**
 * 初始化游戏
 */
function initGame() {
    MG.timeout = 0;
    MG.dataMap = [];
    MG.currentLevel = 0;
    MG.residualMines = 0;
    MG.score = 0;

    $("#residual_mines").text(0);
    $("#score").text(MG.score);
    stopInterval();

    setCurrentGame();
    drawGridCells();
    drawMask();
}

function setCurrentGame() {
    MG.cg = MG.levels[MG.currentLevel];
    MG.residualMines = MG.cg.mineCount;
    MG.cellWidth = CONFIG.cellWidth;
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

/**
 * 结束游戏
 * @param isWon
 */
function stopGame(isWon) {
    var msg = "";
    if (isWon) {
        msg = "你赢了";
    } else {
        msg = "你输了";
    }
    if (confirm(msg)) {
        stopInterval();
        openAllCell();
    }
}

function setConfig() {
    var msg = "";
    if (isPC) {
        msg = ("正在通过PC端访问");
    } else {
        msg = ("正在通过移动端访问");
    }
    if (isWeixin) {
        msg = ("正在通过微信移动端访问");
    }
    if (isIos) {
        msg = ("正在通过苹果移动端访问");
    }
    if (isAndroid) {
        msg = ("正在通过安卓移动端访问");
    }

    var dh = WH - parseInt($("header").css("height")) - parseInt($("footer").css("height")) - 100;
    var gw = (Math.floor((WW < dh ? WW : dh) / 100) * 100);
    var cw = Math.floor(gw / MG.levels[MG.currentLevel].range.rows / 10) * 10;
    var ch = Math.floor(gw / MG.levels[MG.currentLevel].range.columns / 10) * 10;
    CONFIG.cellWidth = cw < ch ? cw : ch;
    CONFIG.width = CONFIG.cellWidth * MG.levels[MG.currentLevel].range.rows;
    CONFIG.height = CONFIG.cellWidth * MG.levels[MG.currentLevel].range.columns;

    console.log(
        msg + "\n\n浏览器屏幕宽度：" + WW + "\t浏览器屏幕高度：" + WH
        + "\n\ndh:" + dh
        + "\n\n游戏区域宽度：" + gw + "\t\t游戏格子宽度：" + CONFIG.cellWidth
        + "\n\n游戏屏幕宽度：" + CONFIG.width + "\t\t游戏屏幕高度：" + CONFIG.height
    );

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
 * 游戏入口
 */
$(function () {
    // TODO:浏览器缩放是坐标不对
    setConfig();

    initGame();
});
