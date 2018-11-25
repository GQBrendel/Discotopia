
var express = require('express');
var app = express();
var serve = require('http').Server(app);

const WIDTH = 1400;
const HEIGHT = 700;


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client' , express.static(__dirname + '/client'));

var port = process.env.PORT || 2000;

serve.listen(port);
console.log("Listen on Port: " + port);

let SOCKET_LIST = {};
let id = 0;

const Entity = function() {
    const self = {
        x:WIDTH/2,
        y:HEIGHT/2,
        spdX: 0,
        spdY: 0,
        id:""
    }
    self.update = function(){
        self.updatePosition();
    }
    self.updatePosition = function(){
        self.x += self.spdX;
        self.y += self.spdY;
    }
    self.getDistance = function(pt){
        return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
    }
    return self;

}
var Player = function(id){
    var self = Entity();
    self.id = id;
    self.number = "" + Math.floor(10 * Math.random()),
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingAttack = false;
    self.mouseAngle = 0;
    self.maxSpeed = 10;
    self.hp = 10;
    self.hpMax = 10;
    self.score = 0;

    let superUpdate = self.update;

    self.update = function (){
        self.updateSpeed();
        superUpdate();
        if(self.pressingAttack){
          
          // self.shootBullet(self.mouseAngle);

           //upgraded shoot:
           for (let i = -2; i < 2; i++)
           {
               self.shootBullet(i *10 + self.mouseAngle);
           }
        }
    }
    self.shootBullet = function(angle){
        let bullet = Bullet(self.id, angle);
        bullet.x = self.x;
        bullet.y = self.y;
    }

    self.updateSpeed = function() {
        if(self.pressingRight)
            self.spdX = self.maxSpeed;
        else if(self.pressingLeft)
            self.spdX = -self.maxSpeed;
        else
            self.spdX = 0;

        if(self.pressingDown)
            self.spdY = self.maxSpeed;
        else if(self.pressingUp)
            self.spdY = -self.maxSpeed;
        else
            self.spdY = 0;
    }

    self.getInitPack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,  
            number:self.number,
            hp:self.hp,
            hpMax:self.hpMax,
            score:self.score,
        };     
    }
    self.getUpdatePack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,
            hp:self.hp,
            score:self.score,
        }  
    }


    Player.list[id] = self;
  
    
    initPack.player.push(self.getInitPack());

    return self;
}
Player.list = {};
Player.onConnect = function(socket) {

    const player = Player(socket.id);
    socket.on('keyPress' , function (data)
   {
        if(data.inputId === 'left')
        {
            player.pressingLeft = data.state;
        }
        else if(data.inputId === 'right')
            player.pressingRight = data.state;
        else if(data.inputId === 'up')
            player.pressingUp = data.state;
        else if(data.inputId === 'down')
            player.pressingDown = data.state;
        else if(data.inputId === 'attack')
        {
            if(data.canAttack && data.state)
            {
                player.pressingAttack = true;
            }
            else{
                player.pressingAttack = false;
            }
        }
        else if(data.inputId === 'mouseAngle')
            player.mouseAngle = data.state;
   });
   
	socket.emit('init',{
		selfId:socket.id,
		player:Player.getAllInitPack(),
		bullet:Bullet.getAllInitPack(),
	})

   socket.on('sendMsgToServer',function(data){
    //let playerName = ("" + socket.id).slice(2,7);
    let playerName = ("Player " + socket.id);
    for(let i in SOCKET_LIST){
            SOCKET_LIST[i].emit('addToChat',playerName + ': ' + data);
        }
    });

    socket.on('evalServer',function(data){
        if(!DEBUG)
            return;
        var res = eval(data);
        socket.emit('evalAnswer',res);     
    });
}
Player.getAllInitPack = function(){
    var players = [];
    for(var i in Player.list)
        players.push(Player.list[i].getInitPack());
    return players;
}
Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
}
Player.update = function(){
    var pack = [];
    for(var i in Player.list){
        var player = Player.list[i];
        player.update();
        
        pack.push(player.getUpdatePack());    
    }
    return pack;
}

const Bullet = function(parent, angle){
    const self = Entity();
    self.id = Math.random();
    self.spdX = Math.cos(angle/180*Math.PI) * 20;
    self.spdY = Math.sin(angle/180*Math.PI) * 20;
    self.y = Infinity;
    self.parent = parent;
    self.timer = 0;
    self.toRemove = false;
    const super_update = self.update;
    self.update = function(){
        if(self.timer++ > 100)
            self.toRemove = true;
        super_update();

        for (let i in Player.list){ //loop on players to check the collision
           let p = Player.list[i];
            
           if(self.getDistance(p) < 32 && self.parent !== p.id){
                p.hp -= 1;
                            
                if(p.hp <= 0){
                    var shooter = Player.list[self.parent];
                    if(shooter)
                        shooter.score += 1;
                    p.hp = p.hpMax;
                    p.x = Math.random() * WIDTH;
                    p.y = Math.random() * HEIGHT;                 
                }
                self.toRemove = true;
            }
        }
    }
    self.getInitPack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,      
        };
    }
    self.getUpdatePack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,      
        };
    }

    Bullet.list[self.id] = self;
   
    initPack.bullet.push(self.getInitPack());

    return self;
}
Bullet.list = {};

Bullet.update = function(){
    var pack = [];
    for(var i in Bullet.list){
        var bullet = Bullet.list[i];
        bullet.update();
        if(bullet.toRemove){
            delete Bullet.list[i];
            removePack.bullet.push(bullet.id);
        } else             
            pack.push(bullet.getUpdatePack());     
    }
    return pack;
}
Bullet.getAllInitPack = function(){
    var bullets = [];
    for(var i in Bullet.list)
        bullets.push(Bullet.list[i].getInitPack());
    return bullets;
}


const io = require('socket.io') (serve,{});
const DEBUG = true;

io.sockets.on('connection', function(socket) { //whenerver a connection happens this will be called

    socket.id = id;
    id++;
    SOCKET_LIST[socket.id] = socket;

    Player.onConnect(socket);

    socket.on('disconnect', function(){
    delete SOCKET_LIST[socket.id];    
    Player.onDisconnect(socket);
   });

   
    
});

var initPack = {player:[],bullet:[]};
var removePack = {player:[],bullet:[]}; 

setInterval(function(){
    var pack = {
        player:Player.update(),
        bullet:Bullet.update(),
    }
   
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('init',initPack);
        socket.emit('update',pack);
        socket.emit('remove',removePack);
    }
    initPack.player = [];
    initPack.bullet = [];
    removePack.player = [];
    removePack.bullet = [];
   
},1000/25);