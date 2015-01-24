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

function generatePositions(canvas, playerSize){
    var centerLane = canvas.width/2 - playerSize/2;
    var laneWidth = 100;

    return {
        lanes: [
            centerLane + laneWidth,
            centerLane,
            centerLane - laneWidth
        ],

        leftBound: canvas.width/2 - canvas.width*0.2 + 100,
        rightBound: canvas.width/2 + canvas.width*0.2 - 100,
        playerStart: canvas.height*(7/8),
        obstacleStart: canvas.height*(1/8)
    };
}

// function spawnObstacle(){
// }

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
*@param {@link Entity} myEntity The entity that i being moved
*@param {number} x The ending X-coordinate
*@param {number} y The ending Y-coordinate
*@param {number} s The speed at which the entity moves
**/
function createMovementLine(myEntity, x, y, s){
	var startX = myEntity.x;
	var startY = myEntity.y;
	var endX = x - (myEntity.width/2);
	var endY = y - (myEntity.height/2);
	var mySpeed = s;
	//var errMargin =5;

	/**
	* adjust the velocity of the entity in the x direction
	**/
	if(endX > (startX -myEntity.width/2 ))
	{
		myEntity.vx = mySpeed;
		
	}
	else if (endX < (startX -myEntity.width/2))
	{
		myEntity.vx = -mySpeed;
		
	}
	else 
	{
		myEntity.vx = 0;
	}

	/**
	* adjust the velocity of the entity in the x direction
	**/
	if(endY > (startY -myEntity.height/2))
	{
		myEntity.vy = mySpeed;
	}
	else if (endY < (startY -myEntity.height/2))
	{
		myEntity.vy = -mySpeed;
	}
	else
	{
		myEntity.vy = 0;
	}

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
    var playerSize = 50;
    var Positions = generatePositions(canvas, playerSize);

    // initialization
    this.player = new Splat.Entity(Positions.lanes[1],Positions.playerStart,playerSize,playerSize);
    this.player.color = "red";
    this.player.vy = -1;

    this.obstacle = new Splat.Entity(Positions.lanes[randomNumber(3)],
                                     Positions.obstacleStart, 40, 40);

    this.camera = new Splat.EntityBoxCamera(this.player,
                                            canvas.width, canvas.height*(1/8),
                                            canvas.width/2, canvas.height*(15/16));

    this.positions = Positions;
}, function(elapsedMs) {
    this.player.move(elapsedMs);
    
    //possibly change controls ( tb discussed)
    if((game.keyboard.consumePressed("left") || game.keyboard.consumePressed("a")) &&
       this.player.x > this.positions.leftBound){
	this.player.x -= 150;
    }

    if((game.keyboard.consumePressed("right") || game.keyboard.consumePressed("d")) &&
       this.player.x < this.positions.rightBound){
	this.player.x += 150;
    }
}, function(context) {
    // draw
    context.fillStyle = "#ffffff";
    context.fillRect(canvas.width/2 - canvas.width*0.2, this.player.y - this.positions.playerStart,
                     canvas.width*0.4, canvas.height);

    drawEntity(context, this.player);

    drawEntity(context, this.obstacle);
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
    drawEntity(context,this.player);
    // this.player.draw(context);
}));

game.scenes.switchTo("loading");
