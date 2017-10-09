var app = require('express')()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server);

// 当前在线人数
var onlineCount = 0;

////连接事件
//io.sockets.on('connection', function (socket) {
//    console.log('有新用户进入...');
//    //叠加当前在线人数
//    onlineCount++;
//
//    var tweets = setInterval(function () {
//        socket.volatile.emit('onlinenums', {nums: onlineCount});
//    }, 1000);
//
//    console.log('当前用户数量:' + onlineCount);
//    //客户端断开连接
//    socket.on('disconnect', function () {
//        if (onlineCount > 0) {
//            //当前在线用户减一
//            onlineCount--;
//            console.log('当前用户数量:' + onlineCount);
//        }
//    });
//});

var port = process.env.PORT || 1337;

// fs s
var module = require("./five");
var fiveServer = new module.FiveChess();
fiveServer.SetConfig({
    "ListenPort": port,
    "RoomTotal": 100,
    "MaxClientNum": 300
});
fiveServer.Startup(io);
// fs e

server.listen(port);

app.get('/', function (req, res) {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Hello World! Node.js.");
});

console.log("Server running at http://localhost:%d", port);
