/**
 * Created by yuqy on 2017/10/2.
 */
var CONST = {};
CONST.A = 1;
Object.freeze(CONST);

var isPC = !navigator.userAgent.match(/mobile/i);
var ua = navigator.userAgent.toLowerCase();
var isWeixin = ua.indexOf('micromessenger') != -1;
var isAndroid = ua.indexOf('android') != -1;
var isIos = (ua.indexOf('iphone') != -1) || (ua.indexOf('ipad') != -1);

/**
 * 获取随机数，下标从0开始
 * @param seed
 * @returns {number}
 */
function getRandom(seed) {
    return Math.floor(Math.random() * seed);
}
