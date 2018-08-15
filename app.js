
var express = require('express');
var app = express();
var serve = require('http').Server(app);



app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client' , express.static(__dirname + '/client'));

serve.listen(2000);
console.log("Listen on Port: 2000");

let io = require('socket.io') (serve,{});
io.sockets.on('connection', function(socket) {
    console.log('socket connection'); //whenerver a connection happens this will be called
});