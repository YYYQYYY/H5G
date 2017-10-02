/**
 * Created by yuqy on 2017/9/29.
 */
var timeout = 0;
var mineGame = {
    layers: [],
    dataMap: [],
    currentLevel: 0,
    residualMines: 20,
    elapsedTime: 0,
    timer: 0,
    score: 0
};

mineGame.levels = [
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

function Cell() {
    this.data = 0;
    this.isOpened = false;
    this.isFlag = false;
}

/**
 * 随机生成地址
 * @returns {*[]}
 */
function getRandomPosition() {
    var currentGame = mineGame.levels[mineGame.currentLevel];
    return {
        x: getRandom(currentGame.range.rows),
        y: getRandom(currentGame.range.columns)
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
    var currentGame = mineGame.levels[mineGame.currentLevel];
    for (var r = 0; r < currentGame.range.rows; r++) {
        mineGame.dataMap[r] = Array.apply(null, Array(currentGame.range.columns)).map(function (i) {
            return new Cell();
        });
    }
}

/**
 * 生成地雷
 * 扫描地雷周围，生成格子周围地雷数
 */
function createMines() {
    var currentGame = mineGame.levels[mineGame.currentLevel];
    var mineCount = currentGame.mineCount;
    var tempArr = {};
    while (mineCount > 0) {
        var pos = getRandomPosition();
        var key = pos.x + "=" + pos.y;
        if (!tempArr[key]) {
            tempArr[key] = 1;
            mineGame.dataMap[pos.x][pos.y].data = -1;
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
    var currentGame = mineGame.levels[mineGame.currentLevel];
    var rows = currentGame.range.rows;
    var columns = currentGame.range.columns;
    for (var ri = -1; ri < 2; ri++) {
        var r = pos.x + ri;
        if (r > -1 && r < rows) {
            for (var ci = -1; ci < 2; ci++) {
                var c = pos.y + ci;
                if (c > -1 && c < columns && !(r == pos.x && c == pos.y) && mineGame.dataMap[r][c].data > -1) {
                    mineGame.dataMap[r][c].data++;
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
    mineGame.layers.forEach(function (i) {
            //mineGame.layers[i].canvas.oncontextmenu = function (e) {
            //    if (document.all) {
            //        window.event.returnValue = false;
            //    } else {
            //        event.preventDefault();
            //    }
            //}
        }
    );

    $("#elapsed_time").text(mineGame.elapsedTime);
    mineGame.timer = setInterval(function () {
        mineGame.elapsedTime++;
        $("#elapsed_time").text(mineGame.elapsedTime);
    }, 1000);
    $("#residual_mines").text(mineGame.residualMines);
}

function bindEvent() {
    var layers = $("#layers");
    layers.oncontextmenu = disableRightClick;
    layers.mousedown(function (e) {
        var canvasPosition = $(this).offset();
        var mouseX = (e.pageX - canvasPosition.left) || 0;
        var mouseY = (e.pageY - canvasPosition.top) || 0;
        var currentGame = mineGame.levels[mineGame.currentLevel];
        var ri = Math.floor(mouseX / currentGame.cellWidth);
        var ci = Math.floor(mouseY / currentGame.cellWidth);
        //var isLeftButtonClicked = event.button == 0;

        timeout = setTimeout(function (e) {
            drawFlag(ri, ci);
            //if (isLeftButtonClicked) {
            //    openCell(mouseX, mouseY);
            //} else {
            //    drawFlag(mouseX, mouseY);
            //}
            timeout = 0;
        }, 1000);
    });
    layers.mousemove(function (e) {
        clearTimeout(timeout);
        timeout = 0;
    });
    layers.mouseup(function (e) {
        clearTimeout(timeout);
        if (timeout != 0) {
            var canvasPosition = $(this).offset();
            var mouseX = (e.pageX - canvasPosition.left) || 0;
            var mouseY = (e.pageY - canvasPosition.top) || 0;
            var currentGame = mineGame.levels[mineGame.currentLevel];
            var ri = Math.floor(mouseX / currentGame.cellWidth);
            var ci = Math.floor(mouseY / currentGame.cellWidth);
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
        if (mineGame.dataMap[ri][ci].isFlag) {
            addScore();
        }
    } else {
        // 正确打开格子
        if (mineGame.dataMap[ri][ci].data > -1) {
            addScore();
        } else {
            drawBoomCell(ri, ci);
            stopGame(false);
        }
    }
}

function addScore() {
    mineGame.residualMines--;
    $("#residual_mines").text(mineGame.residualMines);
    mineGame.score++;
    $("#score").text(mineGame.score);
}

/**
 * 清除画布
 * @param ctx
 */
function clear(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * 绘制格子
 */
function drawGridCells() {
    var currentGame = mineGame.levels[mineGame.currentLevel];
    var cellWidth = currentGame.cellWidth;
    var rows = currentGame.range.rows + 1;
    var columns = currentGame.range.columns + 1;
    var ctx = mineGame.layers[0];

    clear(ctx);

    for (var ri = 0; ri < rows; ri++) {
        ctx.moveTo(0, ri * cellWidth);
        ctx.lineTo(currentGame.range.columns * cellWidth, ri * cellWidth);
        ctx.stroke();
    }
    for (var ci = 0; ci < columns; ci++) {
        ctx.moveTo(ci * cellWidth, 0);
        ctx.lineTo(ci * cellWidth, currentGame.range.rows * cellWidth);
        ctx.stroke();
    }
}

function drawDataMap() {
    var currentGame = mineGame.levels[mineGame.currentLevel];
    var cellWidth = currentGame.cellWidth;
    var rows = currentGame.range.rows;
    var columns = currentGame.range.columns;
    var ctx = mineGame.layers[0];
    ctx.textAlign = "center";
    ctx.font = "30px Arial";

    var msg = "";
    for (var ri = 0; ri < rows; ri++) {
        for (var ci = 0; ci < columns; ci++) {
            if (mineGame.dataMap[ri][ci].data < 0) {
                ctx.fillStyle = "lightgray";
                msg = "M";
            } else if (mineGame.dataMap[ri][ci].data > 0) {
                ctx.fillStyle = "blue";
                msg = mineGame.dataMap[ri][ci].data;
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

function drawMask() {
    var currentGame = mineGame.levels[mineGame.currentLevel];
    var cellWidth = currentGame.cellWidth;
    var rows = currentGame.range.rows;
    var columns = currentGame.range.columns;
    var ctx = mineGame.layers[1];

    for (var ri = 0; ri < rows; ri++) {
        for (var ci = 0; ci < columns; ci++) {
            ctx.fillStyle = "lightblue";
            ctx.fillRect(ri * cellWidth + 1, ci * cellWidth + 1, cellWidth - 1, cellWidth - 1);
        }
    }
}

function drawBoomCell(ri, ci) {
    var currentGame = mineGame.levels[mineGame.currentLevel];
    var cellWidth = currentGame.cellWidth;
    var ctx = mineGame.layers[0];
    ctx.fillStyle = "red";
    ctx.fillRect(ri * cellWidth + 1, ci * cellWidth + 1, cellWidth - 1, cellWidth - 1);
}

function openAllCell() {
    var currentGame = mineGame.levels[mineGame.currentLevel];
    var cellWidth = currentGame.cellWidth;
    var rows = currentGame.range.rows;
    var columns = currentGame.range.columns;
    var ctx = mineGame.layers[1];

    for (var ri = 0; ri < rows; ri++) {
        for (var ci = 0; ci < columns; ci++) {
            ctx.clearRect(ri * cellWidth + 1, ci * cellWidth + 1, cellWidth - 1, cellWidth - 1);
        }
    }
}

function openCell(ri, ci) {
    if (!mineGame.dataMap[ri][ci].isOpened && !mineGame.dataMap[ri][ci].isFlag) {
        var currentGame = mineGame.levels[mineGame.currentLevel];
        var cellWidth = currentGame.cellWidth;
        var ctx = mineGame.layers[1];
        ctx.clearRect(ri * cellWidth + 1, ci * cellWidth + 1, cellWidth - 1, cellWidth - 1);
        mineGame.dataMap[ri][ci].isOpened = true;
        checkMine(ri, ci, false);
    }
}

function drawFlag(ri, ci) {
    var ctx = mineGame.layers[1];

    if (mineGame.dataMap[ri][ci].isOpened) {
        return;
    }

    var currentGame = mineGame.levels[mineGame.currentLevel];
    var cellWidth = currentGame.cellWidth;

    if (!mineGame.dataMap[ri][ci].isFlag) {
        ctx.fillStyle = "#abc";
        ctx.fillRect(ri * cellWidth + cellWidth / 4, ci * cellWidth + cellWidth / 4, cellWidth / 2 - 1, cellWidth / 2 - 1);
    } else {
        ctx.clearRect(ri * cellWidth + cellWidth / 4, ci * cellWidth + cellWidth / 4, cellWidth / 2 - 1, cellWidth / 2 - 1);
        ctx.fillStyle = "lightblue";
        ctx.fillRect(ri * cellWidth + cellWidth / 4 - 1, ci * cellWidth + cellWidth / 4 - 1, cellWidth / 2, cellWidth / 2 + 1);
    }
    mineGame.dataMap[ri][ci].isFlag = !mineGame.dataMap[ri][ci].isFlag;
    checkMine(ri, ci, true);
}

function disableRightClick(e) {
    if (document.all) {
        window.event.returnValue = false;
    } else {
        event.preventDefault();
    }
}

function initGame() {
    timeout = 0;
    mineGame.layers = [];
    var canvas_bg = document.getElementById("bg");
    mineGame.layers[0] = canvas_bg.getContext("2d");
    canvas_bg.oncontextmenu = disableRightClick;
    var canvas_game = document.getElementById("game");
    mineGame.layers[1] = canvas_game.getContext("2d");
    canvas_game.oncontextmenu = disableRightClick;

    mineGame.dataMap = [];
    mineGame.currentLevel = 0;
    mineGame.residualMines = 20;
    mineGame.score = 0;

    $("#residual_mines").text(0);
    $("#score").text(mineGame.score);
    stopInterval();
    drawGridCells();
    drawMask();
}

function startGame() {
    initLayers();
    bindEvent();
    createGameData();
    drawDataMap();
}

function stopInterval() {
    clearInterval(mineGame.timer);
    mineGame.timer = 0;
    mineGame.elapsedTime = 0;
    $("#elapsed_time").text(mineGame.elapsedTime);
}

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

$(function () {
    initGame();

    //setupCurrentLevel();

    //mineGame.background = new Image();
    //mineGame.background.onload = function () {
    //setInterval(gameLoop, 30);
    //};
    //mineGame.background.onerror = function () {
    //    console.log("Error loading the image.");
    //};
    //mineGame.background.src = "images/board.png";
});
