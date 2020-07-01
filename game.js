'use strict';

let Tip = require('./tip');
let Robot = require('./robot');

function generate_permutation (arr){
    ret = [];
    
    return ret;
};

module.exports = class Game{
    constructor(obj={}){
        this.players = {};
        this.robots = {};
        this.tips = [];
        this.tip_order = Array.from(Array(17).keys());
        this.status = "standby";
        this.board = [];

        this.attemptQ = [];
        this.timer=0;
        this.timer_enable = false;
        this.cnt = 0;
        this.progress = 0;

        this.setup();
    }

    setup(){
        this.set_tip_order();
        this.set_board();
        this.set_robot();
    }
    
    get participants(){
        return Object.keys(this.players).length;
    }

    set_host(){
        if(Object.keys(this.players).length==0){
            return;
        }
        var front = Object.keys(this.players)[0];
        this.players[front].is_host = true;
    }

    set_tip_order(){
        /*
        0: wild card
        RGBY order
        1~4: triangle
        5~8: square
        9~12: hexagon
        13~16: circle
        */
        for(var i = this.tip_order.length -1; i >= 0; --i){
            var j =Math.floor(Math.random() *(i+1));
            [this.tip_order[i], this.tip_order[j]] = [this.tip_order[j], this.tip_order[i]];
        }
    }

    set_board(){
        var bd = [ //UDLR if(wall exists) 1 else 0
            [10,8,12,8,9,10,8,8,8,9,10,8,12,8,8,9],
            [2,1,10,0,0,0,0,0,0,0,0,1,10,0,0,5],
            [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9],
            [2,0,0,0,0,1,6,0,1,6,0,0,0,0,0,1],
            [6,0,0,0,4,0,8,0,0,8,4,0,0,0,5,3],
            [10,0,0,0,9,2,0,0,0,0,9,2,0,0,8,1],
            [2,5,2,0,0,0,0,4,4,0,0,0,0,0,0,1],
            [2,8,0,0,0,0,1,15,15,2,0,0,0,0,0,1],
            [2,0,0,0,0,0,1,15,15,2,0,0,0,0,0,5],
            [2,0,0,9,2,0,0,8,12,0,0,0,0,4,0,9],
            [2,0,0,0,0,0,0,1,10,0,0,0,1,10,0,1],
            [3,6,0,0,0,0,0,0,0,0,5,2,0,0,0,1],
            [2,8,0,0,0,0,5,2,0,0,8,0,0,1,6,1],
            [6,0,4,0,0,0,8,0,0,4,0,0,0,0,8,1],
            [10,1,10,0,0,0,0,0,0,9,2,0,0,0,0,1],
            [6,4,4,4,4,5,6,4,4,4,4,5,6,4,4,5]
        ];
        this.board = bd;

        var tip_place = [[10,8],
                            [1,12], [14,2], [3,6], [12,14],
                            [5,4], [11,10], [12,6], [5,10],
                            [10,13], [6,1], [3,9], [9,3],
                            [11,1], [4,14], [14,9], [1,2]
        ];

        for(var i=0;i<17;++i){
            var obj ={};
            obj['id'] = i;
            obj['x'] = tip_place[i][1];
            obj['y'] = tip_place[i][0];
            if(i==0) obj['goal'] = 'all';
            else{
                switch(i%4){
                    case 0:
                        obj['goal']="green";
                        break;
                    case 1:
                        obj['goal'] = 'blue';
                        break;
                    case 2:
                        obj['goal'] = 'yellow';
                        break;
                    default:
                        obj['goal'] = 'red';
                        break;
                }
            }
            let tip = new Tip(obj);
            this.tips.push(tip);
        }
        {
        /*
        //とりあえず固定 sample.jpg
        bd=[
            [10,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9],
            [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [2,0,0,0,0,0,0,15,15,0,0,0,0,0,0,1],
            [2,0,0,0,0,0,0,15,15,0,0,0,0,0,0,1],
            [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [6,4,4,4,4,4,4,4,4,4,4,4,4,4,4,5]
            
        ];
        //determine edge wall
        for(var i = 0;i<8; ++i){
            edge = 0;
            rnd = Math.floor(Math.random()*5);
            if(i%2==1) rnd+=9;
            else rnd+=1;
            if(i%4==2||i%4==3) edge=15;

            if(i<4){
                bd[edge][rnd] += 1;
                bd[edge][rnd+1] += 2;
            }else{
                bd[rnd][edge] += 1;
                bd[rnd+1][edge] += 2;
            }
        }
        */        
        //determine middle wall
        }
    }
    
    set_robot(){
        const colors = ['red','green','blue','yellow']; //silver 面倒
        for(var i=0; i<4; ++i){
            let x,y;
            do{
            x = Math.floor(Math.random()*8);
            y = Math.floor(Math.random()*8);
            }while(x==7&&y==7);

            if(i&1==1) x=15-x;
            if(i>>1==1) y=15-y;

            let obj = {};
            obj['x'] = x;
            obj['y'] = y;
            obj['color'] = colors[i];

            let tmp = new Robot(obj);
            this.robots[colors[i]] = tmp;
        }
    }
}
