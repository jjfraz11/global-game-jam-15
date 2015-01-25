"use strict";

var Splat = require("splatjs");
var canvas = document.getElementById("canvas");

var manifest = {
    "images": {
	"runman-idle": "img/runman.png",
	"plane-idle": "img/plane.png"
    },
    "sounds": {
    },
    "fonts": {
    },
    "animations": {
    }
};

var game = new Splat.Game(canvas, manifest);

function generatePositions(canvas, player){
    
    var laneWidth = 2*player.width;

    var centerLane = canvas.width/2 - player.width/2;
    var renderDistance = canvas.height*(7/8);

    player.x = centerLane;
    player.y = renderDistance;

    return {
        lanes: [
            centerLane + laneWidth,
            centerLane,
            centerLane - laneWidth
        ],

        leftBound: canvas.width/2 - canvas.width*0.2 + laneWidth,
        rightBound: canvas.width/2 + canvas.width*0.2 - laneWidth,
        renderDistance: renderDistance,
        renderStart: function() { return player.y - renderDistance; }

    };
}

function spawnObstacle(positions){
    var o =new Splat.Entity(positions.lanes[randomNumber(3)],
                            positions.renderStart(), 40, 40);
    o.color = "#00ff00";
    return o;
}

function randomNumber(max) {
    return Math.floor((Math.random() * max));
}

function centerText(context, text, offsetX, offsetY) {
    var w = context.measureText(text).width;
    var x = offsetX + (canvas.width / 2) - (w / 2) | 0;
    var y = offsetY | 0;
    context.fillText(text, x, y);
}

function drawEntity(context, drawable){ 
    context.fillStyle = drawable.color;
    context.fillRect(drawable.x, drawable.y, drawable.width, drawable.height);
}

/**
 *	Create a line between two points that the entity moves along 
 *@param {@link Entity} entity The entity that i being moved
 *@param {number} x The ending X-coordinate
 *@param {number} y The ending Y-coordinate
 *@param {number} velocity The speed at which the entity moves
 **/
function createMovementLine(entity, x, y, velocity){
    var finalX = x - (entity.width/2);
    var finalY = y - (entity.height/2);

    /**
     * adjust the velocity of the entity in the x direction
     **/
    if( finalX > (entity.x - entity.width/2 ) ) {
	entity.vx = velocity;
    } else if ( finalX < (entity.x - entity.width/2) ) {
	entity.vx = -velocity;
    } else {
	entity.vx = 0;
    }

    /**
     * adjust the velocity of the entity in the x direction
     **/
    if( finalY > (entity.y -entity.height/2) ) {
	entity.vy = velocity;
    } else if ( finalY < (entity.y -entity.height/2) ) {
	entity.vy = -velocity;
    } else {
	entity.vy = 0;
    }
}

function drawObstacle(context, drawable, color){
    context.fillStyle = color;
    context.fillRect(drawable.x, drawable.y, drawable.width, drawable.height);
}

function createSpawner(scene, entity){
    entity.spawn = function (){
        var enemy = new Splat.Entity(this.x, this.y, 20, 20);
        enemy.color = "orange";
        scene.obstacles.push(enemy);
    };
    entity.color = "orange";
    entity.vy = -1;
}

game.scenes.add("title", new Splat.Scene(canvas, function() {
    // initialization
}, function() {
    // simulation
    if(game.keyboard.consumePressed("space")){
	game.scenes.switchTo("main");
    }
}, function(context) {
    // draw
    context.fillStyle = "#092227";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#fff";
    context.font = "25px helvetica";
    centerText(context, "Press Space to Begin", 0, canvas.height / 2 - 13);
}));

game.scenes.add("main", new Splat.Scene(canvas, function() {
    // initialization
    this.createMovementLine = function (entity, x, velocity){
	var finalX = x - (entity.width/2);
	
	if( finalX > ( entity.x - entity.width/2 ) ) {
	    entity.vx = velocity;
	} else if ( finalX < (entity.x - entity.width/2) ) {
	    entity.vx = -velocity;
	} else {
	    entity.vx = 0;
	}
    };

    var scene = this;

    var playerImage = game.images.get("runman-idle");

    this.player = new Splat.AnimatedEntity(canvas.width/2 - 25,canvas.height*(7/8),playerImage.width,playerImage.height,playerImage,0,0); 

    this.camera = new Splat.EntityBoxCamera(this.player,
                                            canvas.width, canvas.height*(1/8),
                                            canvas.width/2, canvas.height*(15/16));

    this.positions = generatePositions(canvas, this.player);

    this.player.currentLane = 1;
    this.player.color = "red";
    this.player.vy = -1;
    this.player.vx = 0;

    this.spawners = [];
    this.obstacles = [];
    this.obstacles2 = [ spawnObstacle(this.positions) ];

    this.obstacleSpawnRight = new Splat.Entity(this.positions.lanes[0], 20, 20, 20);
    this.obstacleSpawnCenter = new Splat.Entity(this.positions.lanes[1], 20, 20, 20);
    this.obstacleSpawnLeft = new Splat.Entity(this.positions.lanes[2], 20, 20, 20);

    createSpawner(this, this.obstacleSpawnRight);
    createSpawner(this, this.obstacleSpawnCenter);
    createSpawner(this, this.obstacleSpawnLeft);


    this.timers.spawnObstacle = new Splat.Timer(undefined, 5000, function(){
        scene.obstacleSpawnRight.spawn();
        scene.obstacleSpawnCenter.spawn();
        scene.obstacleSpawnLeft.spawn();
        this.reset();
        this.start();
    });
    this.timers.spawnObstacle.start();

    this.moveX = this.player.x;
    this.moveTo = false;
    this.playerV = 0.5;
}, function(elapsedMs) {
    //simulation
    this.player.move(elapsedMs);
    this.obstacleSpawnRight.move(elapsedMs);
    this.obstacleSpawnCenter.move(elapsedMs);
    this.obstacleSpawnLeft.move(elapsedMs);

    //possibly change controls ( tb discussed)
    if((game.keyboard.consumePressed("left") || game.keyboard.consumePressed("a")) &&
       this.player.x > this.positions.leftBound){
	this.player.x -= 150;
    }

    if((game.keyboard.consumePressed("right") || game.keyboard.consumePressed("d")) &&
       this.player.x < this.positions.rightBound){
	this.player.x += 150;
    }


    //obstacle management
    for( var x = 0; x < this.obstacles.length; x++){
        //this.enemies[x].x -= enemySpeed;
        if(this.obstacles[x] && this.obstacles[x].y > this.player.y + canvas.height * (1/8)){
        this.obstacles.splice(x,1);
        console.log("got splice");
        }
    }

    if(game.keyboard.consumePressed("o")) {
        this.obstacles2.push(spawnObstacle(this.positions));
    }

}, function(context) {
    // draw
    var scene = this;
    context.fillStyle = "#ffffff";
    context.fillRect(canvas.width/2 - canvas.width*0.2, this.player.y - this.positions.renderDistance,
                     canvas.width*0.4, canvas.height);

    this.player.draw(context);
    context.fillstyle = "#00ff00";

    for(var i = 0; i< this.obstacles.length; i++){
        drawObstacle(context, this.obstacles[i], this.obstacles[i].color);
    }

    for(i = 0; i < this.obstacles2.length; i++) {
        drawEntity(context, this.obstacles2[i]);
    }

    drawEntity(context, scene.obstacleSpawnRight);
    drawEntity(context, scene.obstacleSpawnCenter);
    drawEntity(context, scene.obstacleSpawnLeft);

}));

game.scenes.add("plane", new Splat.Scene(canvas, function() {
    // initialization
    var playerImage = game.images.get("plane-idle");
    this.player = new Splat.AnimatedEntity(canvas.width/2 - playerImage.width/2,canvas.height/2 -playerImage.height/2,playerImage.width,playerImage.height,playerImage,0,0);
    this.player.color = "blue";
    this.player.vx = 0;
    this.player.vy = 0;

    this.moveX = this.player.x;
    this.moveY = this.player.y;
    this.moveTo = false;
    this.playerV = 2;
}, function(elapsedMillis) {
    // simulation
    //possibly change controls ( tb discussed)
    //move left
    if((game.keyboard.consumePressed("left") || game.keyboard.consumePressed("a")) && this.player.x >canvas.width/2 - canvas.width*0.4 + 150 && !this.moveTo){
	this.moveX = this.player.x -300;
	this.moveTo = true;
    }
    //move right
    if((game.keyboard.consumePressed("right") || game.keyboard.consumePressed("d")) && this.player.x < canvas.width/2 + canvas.width*0.4 - 150 && !this.moveTo){
	this.moveX = this.player.x + 300;
	this.moveTo = true;
    }
    //move up

    if((game.keyboard.consumePressed("up") || game.keyboard.consumePressed("w")) && this.player.y > canvas.height/2 - canvas.height*0.2 + 120 && !this.moveTo){
	this.moveY = this.player.y - 150;
	this.moveTo = true;
    }
    //move down
    if((game.keyboard.consumePressed("down") || game.keyboard.consumePressed("s")) && this.player.y < canvas.height/2 + canvas.height*0.2 - 120 && !this.moveTo){
	this.moveY = this.player.y + 150;
	this.moveTo = true;
    }
    if(this.player.x !== this.moveX || this.player.y !== this.moveY){
	createMovementLine(this.player,this.moveX,this.moveY,this.playerV);
	//console.log(this.player.x, this.moveX,this.player.y,this.moveY );
    }else{
	this.player.vx = 0;
	this.player.vy = 0;
	this.moveTo = false;
    }
    this.player.move(elapsedMillis);

}, function(context) {
    // draw
    context.fillStyle = "#ffffff";
    context.fillRect(0, canvas.height/2 - canvas.height*0.2, canvas.width, canvas.height*0.4);

    this.player.draw(context);
}));

game.scenes.switchTo("loading");
