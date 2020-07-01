'use strict';

module.exports = class Tip{
    constructor(obj={}){
        this.id = obj['id'];
        this.x = obj['x'];
        this.y = obj['y'];
        this.used = false;
        this.goal = obj['goal'];
    }

};
