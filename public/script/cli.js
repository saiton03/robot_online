'use strict';

const socket = io();
const ConBoard = $('#board')[0];

const ConPlayer = $('#player')[0];
const ConScore = $('#score')[0];
const ConWall = $('#wallTip')[0];
const ConRobot = $('#robot')[0];

//const board = document.getElementById("board");
const board = ConBoard.getContext('2d');
const player = ConPlayer.getContext('2d');
const score = ConScore.getContext('2d');
const wallTips = ConWall.getContext('2d');
const robot = ConRobot.getContext('2d');

const W = document.documentElement.clientWidth;
const H = document.documentElement.clientHeight;
const startx = (W-H*0.7)/2.0, starty = H*0.15;
const gridH = H*0.7/16, gridW = H*0.7/16;
$('#board').attr('width',W);
$('#board').attr('height',H);
$('#player').attr('width',W);
$('#player').attr('height',H);
$('#score').attr('width',W);
$('#score').attr('height',H);
$('#wallTip').attr('width',W);
$('#wallTip').attr('height',H);
$('#robot').attr('width',W);
$('#robot').attr('height',H);

var game_state = "standby";
var userName,userId,userIdx;
var board_img = new Image();
board_img.src = '/public/image/board.png';

const colors = ['red','green','blue','yellow']; //robot colors

var tip_images = [];
for(var i=0; i<17;++i){
    let tmp = new Image();
    let path = '/public/image/tips/'+String(i)+'.png';
    tmp.src = path;
    tip_images.push(tmp);
}

var robot_img = {};
for(let c in colors){
    console.log(c);
    let tmp = new Image();
    let path = 'public/image/'+colors[c]+'.png';
    tmp.src = path;
    robot_img[colors[c]]=tmp;
}

function update_player(status,players){
    player.clearRect(0.0,0.0,W,H); //initialize
    var participants=Object.keys(players).length;
    const playerW = W/10;
    const playerH = H*0.1;
    var itr = 0;
    for(const player1 in players){
        var p = players[player1];
        var playerX = Math.floor(itr%10)*playerW;
        var playerY = (itr<5)? 0:H*0.9;
        player.beginPath();
        player.rect(playerX,playerY,playerW,playerH);
        if(p.id==userId){ //myself
           if(p.is_host==true&&status=="standby") {
               player.fillStyle = "rgba(0,0,0,1.0)";
               player.textAlign = "center";
               player.font = "48px sans-serif";
               player.fillText("You are the host.",(3.0*W+H*0.7)/4.0,H*0.5);
               player.fillText("Press Enter to start.",(3.0*W+H*0.7)/4.0,H*0.5+48);
               //anata ireru?
           }
           player.fillStyle = "rgba(255,0,0,0.4)";
        }else{
           player.fillStyle = "rgba(0,0,255,0.4)";
        }
        player.fill();
        //text
        player.fillStyle = "rgba(0,0,0,1.0)";
        player.textAlign = "left";
        player.font = "28px sans-serif";
        player.fillText(p.name,playerX+playerW*0.1,playerY+28);
        player.font = "16px sans-serif";
        player.fillText("Tips",playerX+playerW*0.0,playerY+60);
        player.fillText("Position",playerX+playerW*0.5,playerY+60);
        player.textAlign = "center";
        player.font = "28px sans-serif";
        score.fillText(p.point,playerX+playerW*0.25,playerY+playerH*0.95);
        score.fillText(p.rank,playerX+playerW*0.75,playerY+playerH*0.95);
        itr+=1;
    }
}

function render_wall(game){
    //tips
    for(let i=0;i<17;++i){
        let tip=game.tips[i];
        let x=startx+gridW*(tip.x+0.2);
        let y=starty+gridH*(tip.y+0.2);
        wallTips.drawImage(tip_images[i],x,y,gridW*0.6, gridH*0.6);
    }
    wallTips.fillStyle = "rgba(80,80,80,1.0)"
    //wall
    for(let i=0;i<16;++i){
        for(let j=0;j<16;++j){
            if((i==7||i==8)&&(j==7||j==8)) continue;
            let val=game.board[i][j];
            let x=startx+gridW*j;
            let y=starty+gridH*i;
            if(val&8){ //up
                wallTips.beginPath();
                wallTips.rect(x,y-gridH*0.1,gridW,gridH*0.2);
                wallTips.fill();
            }
            if(val&4){ //down
                wallTips.beginPath();
                wallTips.rect(x,y+gridH*0.9,gridW,gridH*0.2);
                wallTips.fill();
            }
            if(val&2){ //left
                wallTips.beginPath();
                wallTips.rect(x-gridW*0.1,y,gridW*0.2,gridH);
                wallTips.fill();
            }
            if(val&1){ //right
                wallTips.beginPath();
                wallTips.rect(x+gridW*0.9,y,gridW*0.2,gridH);
                wallTips.fill();
            }
        }
    }
    
}

function render_robot(robots){
    
    for(const r in robots){
        console.log("called");
        let robo = robots[r];
        let x=startx+gridW*(robo.x+0.15);
        let y=starty+gridH*(robo.y+0.15);
        console.log(robot_img[r]);
        robot.drawImage(robot_img[r],x,y,gridW*0.7, gridH*0.7);
    }
}

window.onload = () =>{ 
    console.log(W);
    console.log(H);
    if(W>H) board.drawImage(board_img,(W-H*0.7)/2.0,H*0.15,H*0.7,H*0.7);
    else board.drawImage(board_img,W*0.15,(H-W*0.7)/2.0,W*0.7,W*0.7);
}

//key event
$(document).on('keydown',(event)=>{
    const key2command = {
        'Enter' : 'enter',
        'ArrowRight' : 'right',
        'ArrowLeft' : 'left',
        'ArrowUp' : 'up',
        'ArrowDown' : 'down',
        'r' : 'red',
        'g' : 'green',
        'b' : 'blue',
        'y' : 'yellow',
        's' : 'silver'
    };
    const command = key2command[event.key];
    if(command){
        console.log(command);        
        if(game_state=='standby'&&command=='enter'){
            socket.emit('start_request',userId);
        }
    }
});

socket.on('standby',(players)=>{
    update_player("standby",players);
});

socket.on('game_start',(game)=>{
    game_state="game_start";
    update_player("game_start",game.players);
    //add wall
    render_wall(game);
    console.log(game.robots);
    render_robot(game.robots);
});

socket.on('ready',(time)=>{
    game_state="ready";
    //ここから
});

function entry(){
    userName = document.getElementById('userName').innerHTML;
    userId = document.getElementById('userId').innerHTML;
    userIdx = Math.floor(userId/10000);
    var data = {name : userName, id : userId};
    socket.emit('entry',data);
}

socket.on('connect',entry);
