/**
 * Created by yuqy on 2017/9/29.
 */
var mineGame = {
    layers: [],
    dataMap: [],
    currentLevel: 0,
    width: 400,
    height: 400,
    mines: [],
    blockWidth: 50
};
mineGame.levels = [
    {
        level: 0,
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

function createGameData() {
    initDataMap();
    createMines();
    scanAroundCells();
}

function initDataMap() {
    var currentGame = mineGame.levels[mineGame.currentLevel];
    for (var r = 0; r < currentGame.range.rows; r++) {
        mineGame.dataMap[r] = Array.apply(null, Array(currentGame.range.columns)).map(function (i) {
            return 0;
        });
    }
}

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
            mineCount--;
        }
    }
}

function scanAroundCells() {
    var currentGame = mineGame.levels[mineGame.currentLevel];
    var rows = currentGame.range.rows;
    var columns = currentGame.range.columns;
    for (var x = 0; x < rows; x++) {
        for (var y = 0; y < columns; y++) {
            if (mineGame.dataMap[x][y] < 0) {
                scanAroundCell(x, y);
            }
        }
    }
}

function scanAroundCell(x, y) {
    var currentGame = mineGame.levels[mineGame.currentLevel];
    var rows = currentGame.range.rows;
    var columns = currentGame.range.columns;
    for (var ri = -1; ri < 2; ri++) {
        var r = x + ri;
        if (r > -1 && r < rows) {
            for (var ci = -1; ci < 2; ci++) {
                var c = y + ci;
                if (c > -1 && c < columns && !(r == x && c == y) && mineGame.dataMap[r][c] > -1) {
                    mineGame.dataMap[r][c]++;
                }
            }
        }
    }
}
