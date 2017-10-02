/**
 * Created by yuqy on 2017/9/29.
 */
var mineGame = {
    layers: [],
    dataMap: [],
    currentLevel: 0
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
            return 0;
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
            mineGame.dataMap[pos.x][pos.y] = -1;
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
                if (c > -1 && c < columns && !(r == pos.x && c == pos.y) && mineGame.dataMap[r][c] > -1) {
                    mineGame.dataMap[r][c]++;
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

    drawDataMap();
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
            if (mineGame.dataMap[ri][ci] < 0) {
                ctx.fillStyle = "lightgray";
                msg = "M";
            } else if (mineGame.dataMap[ri][ci] > 0) {
                ctx.fillStyle = "blue";
                msg = mineGame.dataMap[ri][ci];
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

function gameLoop() {
}

$(function () {
    var canvas_bg = document.getElementById("bg");
    mineGame.layers[0] = canvas_bg.getContext("2d");
    var canvas_game = document.getElementById("game");
    mineGame.layers[1] = canvas_game.getContext("2d");

    createGameData();

    initLayers();

    var layers = $("#layers");
    //layers.mousedown(function (e) {
    //    var canvasPosition = $(this).offset();
    //    var mouseX = (e.pageX - canvasPosition.left) || 0;
    //    var mouseY = (e.pageY - canvasPosition.top) || 0;
    //    for (var i = 0; i < mineGame.circles.length; i++) {
    //        var circleX = mineGame.circles[i].x;
    //        var circleY = mineGame.circles[i].y;
    //        var radius = mineGame.circles[i].radius;
    //        if (Math.pow(mouseX - circleX, 2) + Math.pow(mouseY - circleY, 2) < Math.pow(radius, 2)) {
    //            mineGame.targetCircle = i;
    //            break;
    //        }
    //    }
    //});
    //
    //layers.mousemove(function (e) {
    //    if (mineGame.targetCircle != undefined) {
    //        var canvasPosition = $(this).offset();
    //        var mouseX = (e.pageX - canvasPosition.left) || 0;
    //        var mouseY = (e.pageY - canvasPosition.top) || 0;
    //        var radius = mineGame.circles[mineGame.targetCircle].radius;
    //        mineGame.circles[mineGame.targetCircle] = new Circle(mouseX, mouseY, radius);
    //    }
    //    connectCircles();
    //    updateLineIntersection();
    //    updateLevelProgress();
    //});
    //
    //layers.mouseup(function (e) {
    //    mineGame.targetCircle = undefined;
    //
    //    checkLevelCompleteness();
    //});

    //setupCurrentLevel();

    //mineGame.background = new Image();
    //mineGame.background.onload = function () {
    drawGridCells();
    setInterval(gameLoop, 30);
    //};
    //mineGame.background.onerror = function () {
    //    console.log("Error loading the image.");
    //};
    //mineGame.background.src = "images/board.png";
});
