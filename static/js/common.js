/**
 * Created by yuqy on 2017/10/2.
 */
var CONST = {};
CONST.A = 1;
Object.freeze(CONST);

var isPC, isWeixin, isAndroid, isIos, dw, dh;

$(function () {
    isPC = !navigator.userAgent.match(/mobile/i);
    var ua = navigator.userAgent.toLowerCase();
    isWeixin = ua.indexOf('micromessenger') != -1;
    isAndroid = ua.indexOf('android') != -1;
    isIos = (ua.indexOf('iphone') != -1) || (ua.indexOf('ipad') != -1);

    dw = window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth;

    dh = window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight;
});

/**
 * 获取随机数，下标从0开始
 * @param seed
 * @returns {number}
 */
function getRandom(seed) {
    return Math.floor(Math.random() * seed);
}
