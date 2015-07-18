

// http://stackoverflow.com/a/21574562/4187005
function fillTextMultiLine(ctx, text, x, y) {
  var lineHeight = ctx.measureText("M").width * 2;
  var lines = text.split("\n");
  for (var i = 0; i < lines.length; ++i) {
    ctx.fillText(lines[i], x, y);
    ctx.strokeText(lines[i], x, y);
		y += lineHeight;
  }
}


function generateTerrain(width, height, startingChar){
	var out = "";
	for(var row=0;row<height;row++){
		var line = "";
		for(var col=0;col<width;col++){
			line += String.fromCharCode(startingChar + (row + col)%5);
		}
		line += "\n";
		out += line;
	}
	return out;
}

function generateBox(width, height, fillChar){
	if(fillChar === undefined)
		fillChar = " ";

	var out = "";
	for(var row=0;row<height;row++){
		var line = "";
		for(var col=0;col<width;col++){
			if( (row == 0 && col == 0) ||
					(row == height - 1 && col == width -1) ||
					(row == 0 && col == width - 1) ||
					(row == height - 1 && col == 0))
					line += "+";
			else if(row == 0 || row == height-1)
				line += "-";
			else if(col == 0 || col == width - 1)
				line += "|";
			else
				line += fillChar;
		}
		line += "\n";
		out += line;
	}
	return out;
}

function generateTile(character){
	var out = "";
	for(var row=0;row<5;row++){
		var line = "";
		for(var col=0;col<10;col++){
			line += character;
		}
		line += "\n";
		out += line;
	}
	return out;
}

function layerText(base, content, map, x, y){
	var img = content.split("\n");
	var mapImg = map.split("\n");
	var baseImg = base.split("\n");
	var out = "";
	for(var row=0;row<baseImg.length;row++){
		var line = "";
		for(var col=0;col<baseImg[row].length;col++){
			var img_row = row - y;
			var img_col = col - x;
			if(img_row >= 0 && img_row < mapImg.length &&
				img_col >= 0 && img_col < mapImg[0].length &&
				mapImg[img_row] != "" && 
				mapImg[img_row][img_col] != " ")
				line += img[img_row][img_col];
			else
				line += baseImg[row][col];
		}
		line += "\n";
		out += line;
	}
	return out;
};


var SCREEN_WIDTH = 100;
var SCREEN_HEIGHT = 45;

var SCREEN_PX_WIDTH = 1000;
var SCREEN_PX_HEIGHT = 900;

var TILE_HEIGHT = 5;
var TILE_WIDTH = 10;

var FPS = 30;

var DOWN = 0;
var LEFT = 1;
var RIGHT = 2;
var UP = 3;

var Compositor = function(canvasElement){
	this.el = canvasElement;
	this.clearFrame();
	this.textOverlays = [];
};

Compositor.prototype.render = function(){
		var ctx = this.el.getContext("2d");
		
		ctx.fillStyle = "white";
    ctx.fillRect(0,0,SCREEN_PX_WIDTH,SCREEN_PX_HEIGHT);
		
		ctx.font = "16.6px Courier New";
		ctx.fillStyle = "black";
		ctx.textAlign = "left";
		fillTextMultiLine(ctx, this.frame, 0, 13);
		
		ctx.font = "45px Courier New";
		ctx.textAlign = "left";
		for(var t=0;t<this.textOverlays.length;t++){
			var textObj = this.textOverlays[t];
			fillTextMultiLine(ctx, textObj.text, textObj.x*9.86, 13 + textObj.y*20.5 );
		}
};

Compositor.prototype.clearFrame = function(){
	this.frame = "";
	for(var i=0;i<SCREEN_HEIGHT;i++){
		for(var j=0;j<SCREEN_WIDTH;j++){
			this.frame += " ";
		}
		this.frame += "\n";
	}
	this.textOverlays = [];
};

Compositor.prototype.add = function(content, map, x, y){
	this.frame = layerText(this.frame, content, map, x, y);
};

Compositor.prototype.addText = function(text, x, y){
	this.textOverlays.push({
		'text': text,
		'x': x,
		'y': y,
	});
};

var Sprite = function(){
	this.image = "<   >";
	this.map = "## ##";
};

Sprite.prototype.getImage = function(){
	return this.image;
};

Sprite.prototype.getMap = function(){
	return this.map;
};

var AnimatedSprite = function(sprite_data, options){
	Sprite.call(this);
	
	this.image = sprite_data.states;
	this.map = sprite_data.states;
	
	this.frameDelay = 170;
	this.cycleInterval = null;
	this.frame = 0;
	this.setState(0);
	
	if(options !== undefined){
		if(options.autostart !== false){
			this.start();
		}
	}else{
		this.start();
	}
};

AnimatedSprite.prototype = new Sprite();

AnimatedSprite.prototype.fromString = function(imageString, mapString){

	var parse = function(spriteSheet){
		var states = [
			["","","",""],
			["","","",""],
			["","","",""],
			["","","",""]
		];
		// 4 directions: down, left, right, up
		var rows = imageString.split("\n");
		for(var row_i=0; row_i < rows.length; row_i++){
			var row = rows[row_i];
			for(var col_i=0; col_i < row.length; col_i++){
				states[Math.floor(row_i/TILE_HEIGHT)][Math.floor(col_i/TILE_WIDTH)] += row[col_i];
			}
			for(var i=0;i<3;i++){
				states[Math.floor(row_i/TILE_HEIGHT)][i] += "\n";
			}
		}
		for(var i=0;i<4;i++){
			states[i][3] = states[i][1];
		}
		return states;
	};
	
	this.image = parse(imageString);
	this.map = parse(mapString);
};

AnimatedSprite.prototype.getImage = function(){
	return this.image[this.state].frames[this.frame];
};

AnimatedSprite.prototype.getMap = function(){
	return this.image[this.state].frames[this.frame];
};

AnimatedSprite.prototype.setState = function(state){
	if(state >= 0 && state < this.image.length){
		this.state = state;
		this.frameDelay = 1000/this.image[this.state].frameRate;
	}
};

AnimatedSprite.prototype.cycle = function(){
	this.frame = (this.frame + 1)%this.image[this.state].frames.length;
};
AnimatedSprite.prototype.start = function(){
	var sprite = this;
	if(this.cycleInterval === null){
		this.cycleInterval = setInterval(function(){sprite.cycle();}, sprite.frameDelay);
	}
};
AnimatedSprite.prototype.stop = function(){
	clearInterval(this.cycleInterval);
	this.cycleInterval = null;
	this.frame = 1%this.image[this.state].frames.length; // standing position
};


var Room = function(room_data){
	this.gameObjects = [];

	this.tiles = [];
	for(var row_i=0;row_i < room_data.tiles.length; row_i++){
		var row = room_data.tiles[row_i];
		this.tiles.push([]);
		for(var col_i=0;col_i < row.length; col_i++){
			var go_data = row[col_i];
			var go = new GameObject(go_data);
			go.y = row_i*TILE_HEIGHT;
			go.x = col_i*TILE_WIDTH;
			this.add(go);
			this.tiles[row_i].push(go);
		}
	}
	this.player = new Actor(room_data.players[0]);
	this.add(this.player);
};

Room.prototype.add = function(gameObject){
	this.gameObjects.push(gameObject);
	gameObject.room = this;
};

Room.prototype.isAvailable = function(actor, x, y, fromDirection){
	for(var i=0;i<this.gameObjects.length;i++){
		if( !this.gameObjects[i].mayWalkOn(actor,x, y, fromDirection) ||
				!this.gameObjects[i].mayWalkOff(actor,x, y, fromDirection)){
			return false;
		}
	}
	return true;
}


var GameObject = function(game_object_data){
	this.x = 0;
	this.y = 0;
	this.width = 10; // in chars
	this.height = 5;
	
	this._moving = false;
	this.room = null;
	
	this.mayEnterDirections = [UP,DOWN,LEFT,RIGHT];
	this.mayExitDirections = [UP,DOWN,LEFT,RIGHT];
	
	if(game_object_data !== undefined){
		this.sprite = new AnimatedSprite(game_object_data.sprite);

		if(game_object_data.properties !== undefined){
			if(game_object_data.properties.solid === true)
				this.setSolid(true);
			$.extend(this, game_object_data.properties);
		}
	}else{
		this.sprite = new Sprite();
	}
};


GameObject.prototype.setSolid = function(value){
	if(value)
		this.mayEnterDirections = [];
	else
		this.mayEnterDirections = [UP,DOWN,LEFT,RIGHT];
};

GameObject.prototype.mayWalkOn = function(actor, x, y, fromDirection){
	// if we cover that square and players may not enter from that direction
	if(this.covers(x, y) && $.inArray(fromDirection, this.mayEnterDirections) === -1)
			return false;
	return true;
};

GameObject.prototype.mayWalkOff = function(actor, x, y, toDirection){
	// if we cover that square and players may not enter from that direction
	if(this.covers(actor.x, actor.y) && $.inArray(toDirection, this.mayExitDirections) === -1)
			return false;
	return true;
};

GameObject.prototype.covers = function(x, y){
	if( x >= this.x && x < this.x + this.width &&
			y >= this.y && y < this.y + this.height){
		return true;
	}
	return false;
};


var Actor = function(actor_data){
	GameObject.call(this, actor_data.player);
	
	this.sprite = new AnimatedSprite(actor_data.player.sprite);
	this.x = actor_data.location[0]*TILE_WIDTH;
	this.y = actor_data.location[1]*TILE_HEIGHT;
	
	this.direction = DOWN;
	
	this._moving = false;
	this.world = null;
};

Actor.prototype = new GameObject();

Actor.prototype.setDirection = function(direction){
	this.direction = direction;
	this.sprite.setState(direction);
};
Actor.prototype.setMoving = function(value){
	var actor = this;
	actor._moving = value;
	if(value){
		actor.sprite.start();
	}else{
		setTimeout(function(){
				if(!actor._moving){
					actor.sprite.stop();
				}
			}, 100);
	}
};

Actor.prototype.canMove = function(direction){
			switch(direction){
				case UP:
					return this.room.isAvailable(this, this.x, this.y - 5, direction);
					break;
				case DOWN:
					return this.room.isAvailable(this, this.x, this.y + 5, direction);
					break;
				case LEFT:
					return this.room.isAvailable(this, this.x - 10, this.y, direction);
					break;
				case RIGHT:
					return this.room.isAvailable(this, this.x + 10, this.y, direction);
					break;
			}
			return false;
};

Actor.prototype.move = function(direction, _countdown){
	// recursively move 1 tile for smooth transition

	var actor = this;
	if(!actor._moving || _countdown != undefined){
		
		
		//change direction if needed immediately
		if(this.direction !== direction){
			actor.setMoving(true);
			this.setDirection(direction);
			setTimeout(function(){actor.setMoving(false);}, 50);
			return;
		}
	
		if(_countdown === undefined){ //first call to move
			if(!this.canMove(direction))
				return;
			_countdown = 5;
		}
		
		//move if allowed
		actor.setMoving(true);
		if(_countdown > 0){ // general case
			switch(direction){
				case UP:
					game.player.y -= 1;
					break;
				case DOWN:
					game.player.y += 1;
					break;
				case LEFT:
					game.player.x -= 2;
					break;
				case RIGHT:
					game.player.x += 2;
					break;
			}
			setTimeout(function(){actor.move(direction, _countdown - 1)}, 50);
		}else{  // base case
			actor.setMoving(false);
		}
	}
};

Actor.prototype.handleInput = function(key){
	//basic WASD movement
	switch(key){
		case 87: //up
			this.move(UP);
			break;
		case 83: //down
			this.move(DOWN);
			break;
		case 65: //left
			this.move(LEFT);
			break;
		case 68: //right
			this.move(RIGHT);
			break;
		case KeyEvent.DOM_VK_E:
			this.world.hud.setMessage("LOOK");
	}
};


var World = function(canvasElement, world_data){

	if(world_data === undefined){
		world_data = {
			name:"New World",
			rooms: [
				{
					name:"Room1",
					tiles: [
					],
					players: [{
						player: {
							name:"player",
							sprite: {
								states: [{
									frames: [
										"   ___    \n  /mmm\\   \n  \\@,@/   \n q mmm p  \n   n n    \n",
									],
									frameRate: 1.5,
								}]
							}, 
						}, 
						location: [0,0]
					}]
				},
			]
		};
	}
	this.room = new Room(world_data.rooms[0]);
	this.player = this.room.player;
	this.player.world = this;
	
	this.compositor = new Compositor(canvasElement);
	this.hud = new HUD();
};

World.prototype.draw = function(){
	var viewport_x = this.player.x - SCREEN_WIDTH/2;
	var viewport_y = this.player.y - Math.floor(SCREEN_HEIGHT/2) - 3;

	this.compositor.clearFrame();
	for(var i=0; i < this.room.gameObjects.length;i++){
		this.compositor.add(
			this.room.gameObjects[i].sprite.getImage(),
			this.room.gameObjects[i].sprite.getMap(),
			this.room.gameObjects[i].x - viewport_x,
			this.room.gameObjects[i].y - viewport_y
		);
	}
	this.hud.draw(this.compositor);
	this.compositor.render();
};

World.prototype.run = function(){
	var g = this;
	g.draw();
	setTimeout(function(){g.run()}, 1000/FPS);
};

World.prototype.handleInput = function(key){
	//basic WASD movement
	if(this.hud.isUp)
		this.hud.handleInput(key);
	else
		this.player.handleInput(key);
};

var HUD = function(){
	this.message = "Ash: Whoa! Where am I?\n"+
		"Oak: You are in the wonderful world of Pokemon!!";
	this.isUp = false;
};

HUD.prototype.draw = function(compositor){
	//3 chars padding either side with twice char size
	function addNewlines(str){
		var charsPerLine = Math.floor((SCREEN_WIDTH - 3*2)/2.65);
		var lines = str.split('\n');
		var out = [];
		for(var i=0;i<lines.length;i++)
			out = out.concat(lines[i].match(new RegExp('.{1,' + charsPerLine + '}', 'g')))
		return out.join('\n');
	}
	if(this.message !== ""){
		this.isUp = true;
		var box = generateBox(SCREEN_WIDTH, TILE_HEIGHT*2);
		var boxMap = generateBox(SCREEN_WIDTH, TILE_HEIGHT*2, fillChar="#");
		
		compositor.addText(addNewlines(this.message), 2, SCREEN_HEIGHT - TILE_HEIGHT*2 + 1);

		compositor.add(box, boxMap, 0, SCREEN_HEIGHT - TILE_HEIGHT*2);
	}else{
		this.isUp = false;
	}
};

HUD.prototype.scrollMessage = function(){
	var lines = this.message.split('\n')
	lines.shift()
	this.message = lines.join('\n');
};

HUD.prototype.setMessage = function(message){
	this.message = message
};

HUD.prototype.handleInput = function(key){
	switch(key)
	{
		case KeyEvent.DOM_VK_E:
			this.scrollMessage();
			break;
		default:
			console.log(key);
			break;
	}
};


// if WASD is down, mash move every 100ms (so we have regular continued movement)
var keyPressers = {};

$(document).keydown(function(event){
	switch(event.keyCode){
		case 87: //up
		case 83: //down
		case 65: //left
		case 68: //right
		default:
			if(keyPressers[event.keyCode]){
				return;
			}
			game.handleInput(event.keyCode);
			keyPressers[event.keyCode] = setInterval(function(){game.handleInput(event.keyCode);}, 100);
			break;
	}
});

$(document).keyup(function(event){
	switch(event.keyCode){
		case 87: //up
		case 83: //down
		case 65: //left
		case 68: //right
		default:
			clearInterval(keyPressers[event.keyCode]);
			keyPressers[event.keyCode] = null;
			break;
	}
});


var parseSpriteSheet = function(imageString){
	var states = [];
	var grid = imageString.split("\n");
	
	//iterate over each frame 
	for(var state_i=0;state_i < grid.length-1; state_i += TILE_HEIGHT){
		var row = grid[state_i];
		states.push([]);
		for(var frame_i=0;frame_i < row.length-1; frame_i += TILE_WIDTH){
			states[state_i/TILE_HEIGHT].push([]);
			
			// now parse a single frame
			for(var y = state_i; y < state_i + TILE_HEIGHT; y++){
				var line = "";
				for(var x = frame_i; x < frame_i + TILE_WIDTH; x++){
					line += grid[y][x];
				}
				states[state_i/TILE_HEIGHT][frame_i/TILE_WIDTH] += line + "\n";
			}
		}
	}
	return states;
};

var asciiRPG = {
	load: function(canvasEl, world_data){
			return new World(canvasEl, world_data);
	}
}


// http://stackoverflow.com/a/1465409/4187005
if (typeof KeyEvent == "undefined") {
    var KeyEvent = {
        DOM_VK_CANCEL: 3,
        DOM_VK_HELP: 6,
        DOM_VK_BACK_SPACE: 8,
        DOM_VK_TAB: 9,
        DOM_VK_CLEAR: 12,
        DOM_VK_RETURN: 13,
        DOM_VK_ENTER: 14,
        DOM_VK_SHIFT: 16,
        DOM_VK_CONTROL: 17,
        DOM_VK_ALT: 18,
        DOM_VK_PAUSE: 19,
        DOM_VK_CAPS_LOCK: 20,
        DOM_VK_ESCAPE: 27,
        DOM_VK_SPACE: 32,
        DOM_VK_PAGE_UP: 33,
        DOM_VK_PAGE_DOWN: 34,
        DOM_VK_END: 35,
        DOM_VK_HOME: 36,
        DOM_VK_LEFT: 37,
        DOM_VK_UP: 38,
        DOM_VK_RIGHT: 39,
        DOM_VK_DOWN: 40,
        DOM_VK_PRINTSCREEN: 44,
        DOM_VK_INSERT: 45,
        DOM_VK_DELETE: 46,
        DOM_VK_0: 48,
        DOM_VK_1: 49,
        DOM_VK_2: 50,
        DOM_VK_3: 51,
        DOM_VK_4: 52,
        DOM_VK_5: 53,
        DOM_VK_6: 54,
        DOM_VK_7: 55,
        DOM_VK_8: 56,
        DOM_VK_9: 57,
        DOM_VK_SEMICOLON: 59,
        DOM_VK_EQUALS: 61,
        DOM_VK_A: 65,
        DOM_VK_B: 66,
        DOM_VK_C: 67,
        DOM_VK_D: 68,
        DOM_VK_E: 69,
        DOM_VK_F: 70,
        DOM_VK_G: 71,
        DOM_VK_H: 72,
        DOM_VK_I: 73,
        DOM_VK_J: 74,
        DOM_VK_K: 75,
        DOM_VK_L: 76,
        DOM_VK_M: 77,
        DOM_VK_N: 78,
        DOM_VK_O: 79,
        DOM_VK_P: 80,
        DOM_VK_Q: 81,
        DOM_VK_R: 82,
        DOM_VK_S: 83,
        DOM_VK_T: 84,
        DOM_VK_U: 85,
        DOM_VK_V: 86,
        DOM_VK_W: 87,
        DOM_VK_X: 88,
        DOM_VK_Y: 89,
        DOM_VK_Z: 90,
        DOM_VK_CONTEXT_MENU: 93,
        DOM_VK_NUMPAD0: 96,
        DOM_VK_NUMPAD1: 97,
        DOM_VK_NUMPAD2: 98,
        DOM_VK_NUMPAD3: 99,
        DOM_VK_NUMPAD4: 100,
        DOM_VK_NUMPAD5: 101,
        DOM_VK_NUMPAD6: 102,
        DOM_VK_NUMPAD7: 103,
        DOM_VK_NUMPAD8: 104,
        DOM_VK_NUMPAD9: 105,
        DOM_VK_MULTIPLY: 106,
        DOM_VK_ADD: 107,
        DOM_VK_SEPARATOR: 108,
        DOM_VK_SUBTRACT: 109,
        DOM_VK_DECIMAL: 110,
        DOM_VK_DIVIDE: 111,
        DOM_VK_F1: 112,
        DOM_VK_F2: 113,
        DOM_VK_F3: 114,
        DOM_VK_F4: 115,
        DOM_VK_F5: 116,
        DOM_VK_F6: 117,
        DOM_VK_F7: 118,
        DOM_VK_F8: 119,
        DOM_VK_F9: 120,
        DOM_VK_F10: 121,
        DOM_VK_F11: 122,
        DOM_VK_F12: 123,
        DOM_VK_F13: 124,
        DOM_VK_F14: 125,
        DOM_VK_F15: 126,
        DOM_VK_F16: 127,
        DOM_VK_F17: 128,
        DOM_VK_F18: 129,
        DOM_VK_F19: 130,
        DOM_VK_F20: 131,
        DOM_VK_F21: 132,
        DOM_VK_F22: 133,
        DOM_VK_F23: 134,
        DOM_VK_F24: 135,
        DOM_VK_NUM_LOCK: 144,
        DOM_VK_SCROLL_LOCK: 145,
        DOM_VK_COMMA: 188,
        DOM_VK_PERIOD: 190,
        DOM_VK_SLASH: 191,
        DOM_VK_BACK_QUOTE: 192,
        DOM_VK_OPEN_BRACKET: 219,
        DOM_VK_BACK_SLASH: 220,
        DOM_VK_CLOSE_BRACKET: 221,
        DOM_VK_QUOTE: 222,
        DOM_VK_META: 224
    };
}