$(function () {
    do {
        //用两个循环创建100个块，并且随机产生10个加一个雷的类名
        //给每个块添加位置数据 和 id属性 鼠标按下事件
        $(".box").empty();
        for (var i = 0; i < 10; i++) {
            for (var j = 0; j < 10; j++) {
                var islei = Math.random() > 0.9;
                $("<div></div>").addClass(function () {
                    return "block" + (islei ? " lei" : "");
                }).data("pos", {x: i, y: j}).attr("id", i + "-" + j).mousedown(mousedownhandler).appendTo(".box");
            }
        }
    } while ($(".lei").length != 10);
    $(document).on("contextmenu", false);  //右击浏览器弹出窗口事件 被 contextmenu事件冲掉
    function mousedownhandler(e) {
        e.preventDefault();
        if (e.which == 1) {                   //区分左击和右击事件
            leftclick.call(this);		  //将this指针保存到leftclick上
        } else if (e.which == 3) {
            rightclick.call(this);        // 将this指针保存到rightclick上
        }
    }

    function leftclick() {
        if ($(this).hasClass("flag")) {       //右击后不能左击
            return;
        }
        if ($(this).hasClass("lei")) {
            clearInterval(t);
            alert("Game Over!");             //左击点到雷  游戏结束
            // $(".block").filter(":not(lei)").addClass("num");
            $(".lei").addClass("show");      //所有的雷显示
        } else {
            var n = 0;						 //如果点到的不是雷，显示出他旁边雷的个数
            var pos = $(this).data("pos");
            // console.log(pos.x);
            $(this).addClass("num");
            for (var i = pos.x - 1; i <= pos.x + 1; i++) {
                for (var j = pos.y - 1; j <= pos.y + 1; j++) {
                    if ($("#" + i + "-" + j).hasClass("lei")) {
                        n++;
                    }
                }
            }
            $(this).text(n);
            if (n == 0) {
                for (var i = pos.x - 1; i <= pos.x + 1; i++) {
                    for (var j = pos.y - 1; j <= pos.y + 1; j++) {
                        if ($("#" + i + "-" + j).length != 0) {
                            if (!$("#" + i + "-" + j).data("check")) {
                                $("#" + i + "-" + j).data("check", true);
                                leftclick.call($("#" + i + "-" + j)[0]);
                            }
                        }
                    }
                }
            }
        }
    }

    function rightclick() {
        if ($(this).hasClass("num")) {     //有数字的不能够再次右击
            return;
        }
        if ($(this).hasClass("flag")) {
            $(".flagbox").text(function (index, num) {
                num = parseInt(num);
                return ++num;
            })
        } else {
            if ($(".flag").length == 10) {
                return;
            }
            $(".flagbox").text(function (index, num) {
                num = parseInt(num);
                return --num;
            })
        }
        $(this).toggleClass("flag");     //右击切换flag类名
        if ($(".flag").filter(".lei").length == 10) {
            clearInterval(t);
            alert("Success!");
        }
    }

    var t = setInterval(function () {        //计时器
        $(".time").text(function (index, n) {
            return --n;
        })
        if ($(".time").text() == 0) {
            clearInterval(t);
            alert("时间到，游戏结束！");
        }
    }, 1000)
})
