/**
 * Created by yuqy on 2017/10/14.
 */
!function (a) {
    function b(a, b, c, d) {
        var f = a.getAttribute(e);
        if (f && k[f]) {
            if (void 0 === d)k[f][c][b] = []; else for (var g, h = 0; g = k[f][c][b][h++];) {
                if (g === d) {
                    k[f][c][b].splice(h - 1, 1);
                    break
                }
                h--
            }
            if (void 0 === c && void 0 === b)k[f][c] = {}; else if (void 0 === c && void 0 !== b)for (var i in k[f]) {
                var j = k[f][i];
                for (var l in j)l === b && void 0 === d && (j[l] = [])
            }
        }
    }

    function c(a, b, c, f, g) {
        var h = a.getAttribute(e);
        h || (h = "" + ((new Date).getTime() + l++), a.setAttribute(e, h)), k[h] || (k[h] = {}), k[h][c] || (k[h][c] = {}, a.addEventListener(c, function (b) {
            d(b, a, c)
        }, !!g)), k[h][c][b] || (k[h][c][b] = []), k[h][c][b].push(f)
    }

    function d(a, b, c) {
        var d = b.getAttribute(e);
        if (d) {
            var f, g, h = k[d][c], i = a.target, j = !1, l = a.stopImmediatePropagation;
            a.stopPropagation;
            a.stopPropagation = function () {
                f = !0
            }, a.stopImmediatePropagation = function () {
                j = !0, f = !0, g = !0
            };
            do {
                for (var m in h)if (i.webkitMatchesSelector(m)) {
                    var n = h[m].slice(0);
                    j = !1, n.every(function (b) {
                        return b.call(i, a), j ? (l.call(a), !1) : !0
                    })
                }
                if (f) {
                    l.call(a);
                    break
                }
                i = i.parentNode
            } while (b.contains(i))
        }
    }

    var e = "_mw_t", f = "complete" === document.readyState, h = !1, i = [], j = [], k = {}, l = 0;
    a.aa = {
        $: function (a, b) {
            return b = b || document, "string" == typeof b && (b = document.querySelector(b)), b.querySelector(a)
        }, $$: function (a, b) {
            return b = b || document, "string" == typeof b && (b = document.querySelector(b)), b.querySelectorAll(a)
        }, addClass: function (a, b) {
            if (a.classList)a.classList.add(b); else {
                var c = a.className.split(/\s+/);
                -1 == c.indexOf(b) && (c.push(b), a.className = c.join(b))
            }
        }, removeClass: function (a, b) {
            if (a.classList)a.classList.remove(b); else {
                var c = new RegExp("\\b" + b + "\\b", g);
                a.className = a.className.replace(c, "")
            }
        }, hasClass: function (a, b) {
            if (a.classList)return a.classList.contains(b);
            var c = a.className.split(/\s+/);
            return c.indexOf(b) > -1
        }, toggleClass: function (b, c) {
            a.aa.hasClass(b, c) ? a.aa.removeClass(b, c) : a.aa.addClass(b, c)
        }, template: function (b, c) {
            if (c) {
                var d = /\{([!@]?)([\w-.]+)\}/g;
                return b.replace(d, function (b, e, f) {
                    var g = c[f];
                    if (void 0 !== g) {
                        var h;
                        return h = g instanceof Function ? g.call(c) : g, null === h ? "" : "!" === e ? h : "@" === e ? a.aa.escapeHTML(h) : d.test(h) ? a.aa.template(h, c) : h
                    }
                    return b
                })
            }
            return b
        }, getRedirectUrl: function (b, c) {
            var d = b.getAttribute("href");
            if (!d)return d;
            d = new a.httpurl(d);
            var e = a.aa.$('meta[name="data-scm"]');
            if (e)var f = e.getAttribute("noscm"), g = e.getAttribute("content");
            if (!f && g) {
                for (var h, i = b.parentNode; "BODY" !== i.tagName && !(h = i.getAttribute("data-scm"));)i = i.parentNode;
                var j = b.getAttribute("data-scm") || d.params.id;
                h && j && (d.params.scm = g + "." + h + "." + j)
            }
            var k = b.getAttribute("data-params") || document.body.getAttribute("data-params");
            if (k) {
                var l = new a.httpurl(c || location.href);
                k.split(",").forEach(function (a) {
                    l.params[a] && (d.params[a] = l.params[a])
                })
            }
            return d.toString()
        }, beforeRedirect: function (a) {
            j.push(a)
        }, redirect: function (b) {
            var c, d, e;
            "object" != typeof b || b instanceof HTMLElement ? (c = b, d = "a, .link", e = "click") : (c = b.context || document.body, d = b.selector || "a, .link", e = b.eventName || "click"), a.aa.delegate(c, d, e, function (b) {
                b.preventDefault();
                var c = a.aa.getRedirectUrl(this), d = !1, e = {
                    stop: function () {
                        d = !0
                    }, targetEvent: b, href: c
                };
                j.forEach(function (a) {
                    a(e)
                }), d || "string" == typeof c && c.length > 0 && (location.href = c)
            })
        }, toast: function (b, c, d) {
            if ("function" == typeof c && (d = c, c = 1500), a.aa.isapp && a.windvane)a.windvane.call("WVUIToast", "toast", b, function () {
                d && d(!0)
            }, function () {
                d && d(!1)
            }); else {
                var e = window, f = e.document, g = f.body, h = f.createElement("div");
                h.style.cssText = "position:absolute;z-index:99;padding:.5em;color:#fff;background-color:rgba(0,0,0,.7);border-radius:.2em;", h.innerHTML = a.aa.escapeHTML(b), g.appendChild(h), h.style.left = (document.documentElement.clientWidth - h.offsetWidth) / 2 + "px", h.style.top = document.body.scrollTop + (document.documentElement.clientHeight - h.offsetHeight) / 2 + "px", setTimeout(function () {
                    g.removeChild(h), d && d(!0)
                }, c || 1500)
            }
        }, isapp: function () {
            return a.env && a.env.aliapp && "TB" === a.env.aliapp.appname
        }(), delegate: function (b, d, e, f, g) {
            if (b instanceof NodeList) {
                var h = a.aa.delegate;
                Array.prototype.forEach.call(b, function (a, b) {
                    h(a, d, e, f)
                })
            } else c(b, d, e, f, g)
        }, removeDelegate: function (c, d, e, f) {
            c instanceof NodeList ? Array.prototype.forEach.call(c, function (b, c) {
                a.aa.removeDelegate(b, d, e, f)
            }) : b(c, d, e, f)
        }, ready: function (a) {
            f ? a.call(document) : (i.push(a), h || (h = !0, document.addEventListener("DOMContentLoaded", function () {
                f = !0, i.forEach(function (a) {
                    a.call(document)
                })
            }, !1)))
        }, mixin: function (a, b, c) {
            var d = {};
            for (var e in a) {
                var f = b[e], g = a[e], h = c && e in b ? f : g;
                d[e] = h
            }
            for (var e in b)e in a || (d[e] = b[e]);
            return d
        }, escapeHTML: function (a) {
            var b = document, c = b.createTextNode(a), d = b.createElement("div");
            return d.appendChild(c), d.innerHTML
        }, padLeft: function (a, b) {
            return b || (b = 2), a = parseInt(a, 10), 0 == a ? (a = 1, ("" + Math.pow(10, b)).substr(1, b)) : ("" + a).length >= b ? "" + a : ("" + (Math.pow(10, b) + a)).substr(1, b + 1)
        }, goldlog: function (a, b, c, d) {
            var e = "";
            if ("string" == typeof c)e = c; else if ("[Object Object]" === Object.prototype.toString.call(c)) {
                e = [];
                for (var f in c)e.push(f + "=" + c[f]);
                e = e.join("&")
            } else console.error("参数gokey错误");
            try {
                window.goldlog.record(a, b, e, d)
            } catch (g) {
                console.log("goldlog打点失败: " + g)
            }
        }, _throttle: function (a, b, c, d) {
            var e, f, g = null, h = 0, i = c || this;
            d || (d = {});
            var j = function () {
                h = d.leading === !1 ? 0 : +new Date, g = null, f = a.apply(i, e), g || (i = e = null)
            };
            return function () {
                var c = +new Date;
                h || d.leading !== !1 || (h = c);
                var k = b - (c - h);
                return e = arguments, 0 >= k || k > b ? (g && (clearTimeout(g), g = null), h = c, f = a.apply(i, e), g || (i = e = null)) : g || d.trailing === !1 || (g = setTimeout(j, k)), f
            }
        }
    }, "remove" in HTMLElement.prototype || Object.defineProperty(HTMLElement.prototype, "remove", {
        value: function () {
            var a = this.parentNode;
            a.removeChild(this)
        }
    })
}(window.lib || (window.lib = {}));
(function () {
    function e(a, b, c) {
        if (3 === a.nodeType)a.nodeValue = lib.aa.template(a.nodeValue, b); else if (1 === a.nodeType) {
            var f = a.childNodes, d = a.getAttribute("data-repeat");
            a.removeAttribute("data-repeat");
            if (null != d && d in b) {
                var d = b[d], h = a.parentNode;
                document.createElement("div").innerHTML = a.outerHTML;
                d instanceof Array ? (d.forEach(function (b, c) {
                    var d = document.createElement("div");
                    d.innerHTML = a.outerHTML;
                    "[object Object]" == Object.prototype.toString.call(b) || b instanceof Array ? b.__index__ = c : b = {
                        __value__: b,
                        __index__: c
                    };
                    g(d, b);
                    [].forEach.call(d.childNodes, function (b) {
                        h.insertBefore(b, a)
                    })
                }), h.removeChild(a)) : g(a, d)
            }
            [].forEach.call(a.attributes, function (a) {
                a.value = lib.aa.template(a.value, b)
            });
            [].forEach.call(f, function (a) {
                e(a, b)
            });
            c && c(a)
        }
    }

    function i(a) {
        var b;
        if (a.template_content)b = a.template_content; else {
            b = a.getAttribute("data-template");
            if (null != b && 0 < b.length) {
                var c = lib.aa.$(b);
                if (c)b = c.innerHTML; else throw"[Dirty:setData]Cannot find html element : " + b;
            } else b = a.innerHTML;
            a.template_content = b
        }
        return b
    }

    function g(a, b) {
        var c = document.createElement("div");
        c.innerHTML = i(a);
        var f = c.querySelectorAll("[data-repeat]");
        if (b instanceof Array)if (f.length)b.forEach(function (a, b) {
            "[object Object]" == Object.prototype.toString.call(a) || a instanceof Array ? (a.__index__ = b, e(c, a)) : e(c, {
                __value__: a,
                __index__: b
            })
        }); else {
            var d = [];
            b.forEach(function (a, b) {
                "[object Object]" == Object.prototype.toString.call(a) || a instanceof Array ? (a.__index__ = b, d.push(lib.aa.template(c.innerHTML, a))) : d.push(lib.aa.template(c.innerHTML, {
                    __value__: a,
                    __index__: b
                }))
            });
            c.innerHTML = d.join("")
        } else f.length ? e(c, b) : c.innerHTML = lib.aa.template(c.innerHTML, b);
        a.innerHTML = c.innerHTML
    }

    Object.defineProperty(HTMLElement.prototype, "setData", {
        value: function (a) {
            g(this, a)
        }
    })
})();
