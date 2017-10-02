/**
 * Created by yuqy on 2017/10/2.
 */
var CONST = {};
CONST.A = 1;
Object.freeze(CONST);

/**
 * 获取随机数，下标从0开始
 * @param seed
 * @returns {number}
 */
function getRandom(seed) {
    return Math.floor(Math.random() * seed);
}
