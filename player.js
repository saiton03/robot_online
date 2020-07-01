'use strict';

module.exports = class Player{
    constructor(obj={}){
        this.id = obj.id;
        this.name = obj.name;
        this.point = 0;
        this.ans = 0;
        this.rank = 1;
        this.is_host = false; //(Math.floor(obj.id/10000)==0)? true:false;
    }
}