var app = require('express')()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server);

var port = process.env.PORT || 1337;

// ms s
var module = require("./mines");
var mineServer = new module.MineServer();
mineServer.setConfig({
    "ListenPort": port,
    "RoomTotal": 100,
    "MaxClientNum": 300
});
mineServer.startup(io);
// ms e

server.listen(port);

app.get('/', function (req, res) {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Hello. Almc.");
});

console.log("Server running at http://localhost:%d", port);
