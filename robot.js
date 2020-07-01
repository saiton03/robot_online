'use strict';

module.exports = class Robot{
    constructor(obj={}){
        this.x = obj['x'];
        this.y = obj['y'];
        this.color = obj['color'];

        //移動中の座標
        this.movex = obj['x']; 
        this.movey = obj['y']; 
        
    }

    
};
