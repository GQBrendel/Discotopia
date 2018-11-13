
var express = require('express');
var app = express();
var serve = require('http').Server(app);



app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client' , express.static(__dirname + '/client'));

serve.listen(2000);
console.log("Listen on Port: 2000");

let SOCKET_LIST = {};
let PLAYER_LIST = {};
let id = 0;

let Player = function(id){
    let self = {
        x:250,
        y:250,
        id:id,
        number: "" + Math.floor(10 * Math.random()),
        pressingRight:false,
        pressingLeft:false,
        pressingUp:false,
        pressingDown:false,
        maxSpeed:10
    }
    self.updatePosition = function (){
        if(self.pressingRight)
            self.x += self.maxSpeed;
        if(self.pressingLeft)
            self.x -= self.maxSpeed;
        if(self.pressingUp)
            self.y -= self.maxSpeed;
        if(self.pressingDown)
            self.y += self.maxSpeed;
    }
    return self;
}

let io = require('socket.io') (serve,{});
io.sockets.on('connection', function(socket) {
    console.log('socket connection'); //whenerver a connection happens this will be called

    socket.id = id;
    id++;
    SOCKET_LIST[socket.id] = socket;

    let player = Player(socket.id);
    PLAYER_LIST[socket.id] = player;

   socket.on('disconnect', function(){
    delete SOCKET_LIST[socket.id];    
    delete PLAYER_LIST[socket.id];
   });

   socket.on('keyPress' , function (data)
   {
        if(data.inputId === 'left')
            player.pressingLeft = data.state;
        else if(data.inputId === 'right')
            player.pressingRight = data.state;
        else if(data.inputId === 'up')
            player.pressingUp = data.state;
        else if(data.inputId === 'down')
            player.pressingDown = data.state;
   });
    
});

setInterval (function () {
    let pack = [];
    for (let i in PLAYER_LIST) {
        
        let player = PLAYER_LIST[i];
        player.updatePosition();
        pack.push({
                x: player.x,
                y: player.y,
                number: player.number
            });
    }
    for (let i in SOCKET_LIST)
    {
        let socket = SOCKET_LIST[i];
        socket.emit("newPositions", pack);   
    }
}, 1000/25);