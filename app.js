
var express = require('express');
var app = express();
var serve = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('client/' , express.static(__dirname + '/client'));

console.log("Listen on Port: 2000");
serve.listen(2000);