/**
 * Created by yuqy on 2017/9/29.
 */
var MG = {
    layers: [], /* 画布层 */
    dataMap: [], /* 雷区地图 */
    currentLevel: 0, /* 当前游戏级别 */
    cg: null, /* 当前游戏 */
    residualMines: 20, /* 剩余雷数 */
    elapsedTime: 0, /* 经过时间 */
    timer: 0, /* 计时器 */
    timeout: 0, /* 计时器句柄 */
    score: 0 /* 得分 */
};

MG.levels = [
    {
        level: 0,
        width: 400,
        height: 400,
        cellWidth: 50,
        mineCount: 20,
        range: {
            rows: 8,
            columns: 8
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

/**
 * 绑定事件
 */
function bindEvent() {
    var layers = $("#layers");
    layers.oncontextmenu = disableRightClick;
    layers.mousedown(function (e) {
        var canvasPosition = $(this).offset();
        var mouseX = (e.pageX - canvasPosition.left) || 0;
        var mouseY = (e.pageY - canvasPosition.top) || 0;
        var ri = Math.floor(mouseX / MG.cg.cellWidth);
        var ci = Math.floor(mouseY / MG.cg.cellWidth);
        //var isLeftButtonClicked = event.button == 0;

        MG.timeout = setTimeout(function (e) {
            drawFlag(ri, ci);
            //if (isLeftButtonClicked) {
            //    openCell(mouseX, mouseY);
            //} else {
            //    drawFlag(mouseX, mouseY);
            //}
            MG.timeout = 0;
        }, 1000);
    });
    layers.mousemove(function (e) {
        clearTimeout(MG.timeout);
        MG.timeout = 0;
    });
    layers.mouseup(function (e) {
        clearTimeout(MG.timeout);
        if (MG.timeout != 0) {
            var canvasPosition = $(this).offset();
            var mouseX = (e.pageX - canvasPosition.left) || 0;
            var mouseY = (e.pageY - canvasPosition.top) || 0;
            var ri = Math.floor(mouseX / MG.cg.cellWidth);
            var ci = Math.floor(mouseY / MG.cg.cellWidth);
            openCell(ri, ci);
        }
    });
}

/**
 * 判断是否是雷区
 * @param ri
 * @param ci
 * @param isFlag
 */
function checkMine(ri, ci, isFlag) {
    if (isFlag) {
        // 正确标旗
        if (MG.dataMap[ri][ci].isFlag) {
            addScore(true);
        }
    } else {
        // 正确打开格子
        if (MG.dataMap[ri][ci].data > -1) {
            addScore(false);
        } else {
            drawBoomCell(ri, ci);
            stopGame(false);
        }
    }
}

/**
 * 计算分数
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
    var cellWidth = MG.cg.cellWidth;
    var rows = MG.cg.range.rows + 1;
    var columns = MG.cg.range.columns + 1;
    var ctx = MG.layers[0];

    clear(ctx);

    for (var ri = 0; ri < rows; ri++) {
        ctx.moveTo(0, ri * cellWidth);
        ctx.lineTo(MG.cg.range.columns * cellWidth, ri * cellWidth);
        ctx.stroke();
    }
    for (var ci = 0; ci < columns; ci++) {
        ctx.moveTo(ci * cellWidth, 0);
        ctx.lineTo(ci * cellWidth, MG.cg.range.rows * cellWidth);
        ctx.stroke();
    }
}

/**
 * 绘制格子
 */
function drawDataMap() {
    var cellWidth = MG.cg.cellWidth;
    var rows = MG.cg.range.rows;
    var columns = MG.cg.range.columns;
    var ctx = MG.layers[0];
    ctx.textAlign = "center";
    ctx.font = "30px Arial";

    var msg = "";
    for (var ri = 0; ri < rows; ri++) {
        for (var ci = 0; ci < columns; ci++) {
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
    }
}

/**
 * 绘制遮罩
 */
function drawMask() {
    var cellWidth = MG.cg.cellWidth;
    var rows = MG.cg.range.rows;
    var columns = MG.cg.range.columns;
    var ctx = MG.layers[1];

    for (var ri = 0; ri < rows; ri++) {
        for (var ci = 0; ci < columns; ci++) {
            ctx.fillStyle = "lightblue";
            ctx.fillRect(ri * cellWidth + 1, ci * cellWidth + 1, cellWidth - 1, cellWidth - 1);
        }
    }
}

/**
 * 绘制爆炸格子
 * @param ri
 * @param ci
 */
function drawBoomCell(ri, ci) {
    var cellWidth = MG.cg.cellWidth;
    var ctx = MG.layers[0];
    ctx.fillStyle = "red";
    ctx.fillRect(ri * cellWidth + 1, ci * cellWidth + 1, cellWidth - 1, cellWidth - 1);
}

/**
 * 打开所有格子
 */
function openAllCell() {
    var cellWidth = MG.cg.cellWidth;
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
        var cellWidth = MG.cg.cellWidth;
        var ctx = MG.layers[1];
        ctx.clearRect(ri * cellWidth + 1, ci * cellWidth + 1, cellWidth - 1, cellWidth - 1);
        MG.dataMap[ri][ci].isOpened = true;
        checkMine(ri, ci, false);
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

    var cellWidth = MG.cg.cellWidth;

    MG.dataMap[ri][ci].isFlag = !MG.dataMap[ri][ci].isFlag;
    if (MG.dataMap[ri][ci].isFlag) {
        ctx.fillStyle = "#abc";
        ctx.fillRect(ri * cellWidth + cellWidth / 4, ci * cellWidth + cellWidth / 4, cellWidth / 2 - 1, cellWidth / 2 - 1);
        checkMine(ri, ci, true);
    } else {
        ctx.clearRect(ri * cellWidth + cellWidth / 4, ci * cellWidth + cellWidth / 4, cellWidth / 2 - 1, cellWidth / 2 - 1);
        ctx.fillStyle = "lightblue";
        ctx.fillRect(ri * cellWidth + cellWidth / 4 - 1, ci * cellWidth + cellWidth / 4 - 1, cellWidth / 2, cellWidth / 2 + 1);
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
 * 初始化游戏
 */
function initGame() {
    MG.timeout = 0;
    MG.layers = [];
    var canvas_bg = document.getElementById("bg");
    MG.layers[0] = canvas_bg.getContext("2d");
    canvas_bg.oncontextmenu = disableRightClick;
    var canvas_game = document.getElementById("game");
    MG.layers[1] = canvas_game.getContext("2d");
    canvas_game.oncontextmenu = disableRightClick;

    MG.dataMap = [];
    MG.currentLevel = 0;
    MG.residualMines = 20;
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

/**
 * 游戏入口
 */
$(function () {
    initGame();
});
