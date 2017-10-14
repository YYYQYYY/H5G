/**
 * Created by yuqy on 2017/10/2.
 */
var CONST = {};
CONST.A = 1;
Object.freeze(CONST);

var isPC, isWeixin, isAndroid, isIos, WW, WH;

//(function (doc, win) {
//    var docEl = doc.documentElement,
//        resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
//        recalc = function () {
//            var clientWidth = docEl.clientWidth;
//            if (!clientWidth) return;
//            if (clientWidth > 750) clientWidth = 750;//这里限制最大的宽度尺寸，从而实现PC端的两边留白等
//            docEl.style.fontSize = 10 * (clientWidth / 320) + 'px';
//        };
//
//    if (!doc.addEventListener) return;
//    win.addEventListener(resizeEvt, recalc, false);
//    doc.addEventListener('DOMContentLoaded', recalc, false);
//})(document, window);

!function () {
    isPC = !navigator.userAgent.match(/mobile/i);
    var ua = navigator.userAgent.toLowerCase();
    isWeixin = ua.indexOf('micromessenger') != -1;
    isAndroid = ua.indexOf('android') != -1;
    isIos = (ua.indexOf('iphone') != -1) || (ua.indexOf('ipad') != -1);

    WW = window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth;

    WH = window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight;
}();

/**
 * 获取随机数，下标从0开始
 * @param seed
 * @returns {number}
 */
function getRandom(seed) {
    return Math.floor(Math.random() * seed);
}

/**
 *样式相关函数
 */
function addClass(a, b) {
    if (a.classList) {
        a.classList.add(b);
    } else {
        var c = a.className.split(/\s+/);
        -1 == c.indexOf(b) && (c.push(b), a.className = c.join(b));
    }
}

function removeClass(a, b) {
    if (a.classList) {
        a.classList.remove(b);
    } else {
        var c = new RegExp("\\b" + b + "\\b", g);
        a.className = a.className.replace(c, "");
    }
}

function hasClass(a, b) {
    if (a.classList) {
        return a.classList.contains(b);
    }
    var c = a.className.split(/\s+/);
    return c.indexOf(b) > -1;
}

function toggleClass(a, b) {
    hasClass(a, b) ? removeClass(a, b) : addClass(a, b);
}

function $(id) {
    return document.getElementById(id);
}
