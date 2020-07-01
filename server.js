'use strict';

const express = require('express');
const path = require('path');
const socketIO = require('socket.io');
const app = express();
const http = require('http');
const server = http.Server(app);
const io = socketIO(server);
const ejs = require('ejs');
//const request = require("request");
app.engine('ejs', ejs.renderFile);
app.use('/public', express.static('public'));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use('/socket.io', express.static('node_modules/socket.io-client/dist'));

let Player = require("./player");
let Game = require("./game");

const MAX_player = 20;
const FPS = 30;
var visitor_cnt = 0;

var game = new Game();

io.on('connection', function(socket){
    let player = null;
    socket.on('entry',(config) =>{
        var data = config;
        player = new Player(data);
        game.players[player.id] = player;
        game.set_host();
        console.log(player);
        io.sockets.emit("standby",game.players);
    });
    socket.on('start_request',(userId)=>{
        console.log("request received")
        if(game.players[userId].is_host){
            console.log("game start");
            io.sockets.emit("game_start",game);
            game.status = "set_ready";
        }
    });
    socket.on('disconnect',()=>{
        if(!player){return;}
        delete game.players[player.id];
        player = null;
        game.set_host();
        io.sockets.emit("standby",game.players);
    });

});

function loop(){
    if(game.participants==0){
        //reset game
        game = new Game();
    }
    if(game.status=="set_ready"){
        if(!game.timer_enable){
            game.timer_enable = true;
            game.timer = 3*FPS;
        }else{
            game.timer--;
        }

        if(game.timer<=0){
            game.timer_enable=false;
            game.status = "thinking";
            const tip_no = game.tip_order[game.progress];
            io.sockets.emit("thinking",game.progress+1,game.tips[tip_no]); //次のラウンドNo.と目的のチップを送る
        }else if(game.timer%FPS==0) io.sockets.emit("ready",Math.floor(game.timer/FPS));
    }
    
}

setInterval(loop,1000/30);

var val_input = function(data){
    var errors = [];
    const name_regex = new RegExp(/^\w*$/);

    if(!data.name){
      errors[errors.length] = "おなまえを入力してください．";
    }
    if(!name_regex.test(data.name)){
      errors[errors.length] = "おなまえに使える文字は半角英数字とアンダーバーだけです．";
    }
    if(data.name.length > 10){
      errors[errors.length] = "おなまえの文字数は10文字までです．";
    }
    if(game.status != "standby"){
        errors[errors.length] = "現在実施中です．終了までしばらくお待ちください．";
    }
    if(Object.keys(game.players).length==MAX_player){
        errors[errors.length] = "参加人数が上限に達しています．しばらくお待ちください．";
    }
    return errors;
}


//routing
app.get('/', (req, res) => {
    visitor_cnt++;
    res.render('./index.ejs',{
        cnt : visitor_cnt,
        parts : Object.keys(game.players).length,
        stat : ((game.status != "standby") ? "ゲーム中": "待機中"),
        name : "",
        errors : []
    });
});

app.post('/', (req, res) => {
    var data = {name: req.body.name};
    var error = val_input(data);
    res.render('./index.ejs',{
        cnt : visitor_cnt,
        parts : Object.keys(game.players).length,
        stat : (game.status != "standby" ? "ゲーム中": "待機中"),
        name : req.body.name,
        errors : error
    });
});

app.get('/game', (req, res) => {
    res.redirect('/');
});

app.post('/game', (req, res) =>{
    var participants = Object.keys(game.players).length;
    var data = {name: req.body.name};
    var errors = val_input(data);
    data.errors = errors;
    if(errors.length>0){
        return res.redirect(307,'/');
    }
    var id = Math.floor(Math.random()*10000)+participants*10000;
    res.render('./game.ejs',{
        name : req.body.name,
        id : id
    })
});

server.listen(3000, () =>{
    console.log('Starting server on port 3000');
});

