(function() {
	"use strict"
	var stage;
	var REEL_WIDTH = 100;
	var SYMBOL_HEIGHT = 150;
	var running = false;
	
	var numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
	var digits = 8;
	var reels = []; // Reels
	var tweening = []; // Tween animation
	
	// List
	var list = [];
	var history = [];
	var result = null;
	
	// Shuffle list
	function shuffleList() {
		if(running) return;
		for(var i = 0; i < list.length; i++) {
			var rng = Math.floor(Math.random() * list.length);
			[list[i], list[rng]] = [list[rng], list[i]];
		}
	}
	
	// Generate Result
	function generateResult() {
		shuffleList();
		var index = Math.floor(Math.random() * list.length);
		result = list[index];
		
		// Remove from list and push to history
		history.push(list.splice(index, 1)[0]);
	}
	
	// Function to start playing
	function startPlay() {
		if(running || list.length < 1) return;
		running = true;
		
		generateResult();
		
		for(var i = 0; i < reels.length; i++) {
			var r = reels[i];
			var extra = Math.floor(Math.random() * 3);
			var target = r.position + 10 + i * 5 + extra;
			var time = 2500 + i * 600 + extra * 600;
		
			// Update reel target
			r.target = target;
			tweenTo(r, 'position',  time, backout(0.5), i === reels.length-1 ? reelsComplete : null)
		}
	}
	
	// Reels done handler
	function reelsComplete() {
		running = false;
	}
	
	// Tween
	function tweenTo(object, property,  time, easing, oncomplete) {
		var tween = {
			object,
			property,
			propertyBeginValue: object[property],
			easing,
			time,
			complete: oncomplete,
			start: Date.now(),
		}
	
		tweening.push(tween);
		return tween;
	}
	
	// Basic lerp formula
	function lerp(a1, a2, t) {
		return a1 * (1 - t) + a2 * t;
	}
	
	// Backout animation
	function backout(amount) {
		return t => (--t * t * ((amount + 1) * t + amount) + 1);
	}
	
	// INIT
	function init() {
		var data = {
			images: ["./public/images/numbers.png"],
			frames: {width:150, height:150, regX:75},
			animations: {
				"_0" : [0, 0],
				"_1" : [1, 1],
				"_2" : [2, 2],
				"_3" : [3, 3],
				"_4" : [4, 4],
				"_5" : [5, 5],
				"_6" : [6, 6],
				"_7" : [7, 7],
				"_8" : [8, 8],
				"_9" : [9, 9],
			}
		};
		var spriteSheet = new createjs.SpriteSheet(data);
		var animation = new createjs.Sprite(spriteSheet);

		// Build reels
		var reelContainer = stage.addChild(new createjs.Container());
		for(var i = 0; i < digits; i++) {
			var rc = reelContainer.addChild(new createjs.Container());
			rc.x = -(REEL_WIDTH * digits)/2 + (i * REEL_WIDTH + (REEL_WIDTH/2));
				
			var reel = {
				container : rc,
				symbols : [],
				position : 0,
				target : 0,
				previousPosition : 0,
				blur : new createjs.BlurFilter(),
			}
			reel.blur.blurX = 0;
			reel.blur.blurY = 0;
			rc.filter = [reel.blur];
			
			// Build symbols
			for(var j = 0; j < 4; j++) {
				var symbolContainer = rc.addChild(new createjs.Container());
				symbolContainer.y = j * SYMBOL_HEIGHT;
				
				var symbolBG = symbolContainer.addChild(new createjs.Shape());
				symbolBG.graphics
					.beginFill("#808080")
					.drawRect(0, 0, REEL_WIDTH-5, SYMBOL_HEIGHT);
				symbolBG.regX = symbolBG.graphics.command.w/2;
		
				var symbol = animation.clone();
				symbol.gotoAndStop("_"+Math.floor(Math.random() * numbers.length));
				symbol.scaleX = Math.min(REEL_WIDTH / symbol.spriteSheet._frameWidth, SYMBOL_HEIGHT / symbol.spriteSheet._frameHeight);
				symbolContainer.addChild(symbol);
				
				reel.symbols.push(symbolContainer);
			}
			
			reels.push(reel);
		}
		
		// Build top & bottom covers and position of reelContainer
		var margin = (stage.canvas.height - SYMBOL_HEIGHT * 3) / 2;
		reelContainer.y = margin;
		reelContainer.x = stage.canvas.width/2;
		
		var top = stage.addChild(new createjs.Shape());
		top.graphics
			.beginFill("#000")
			.drawRect(0, 0, stage.canvas.width, margin);
			
		var bottom = stage.addChild(new createjs.Shape());
		bottom.graphics
			.beginFill("#000")
			.drawRect(0, SYMBOL_HEIGHT * 3 + margin, stage.canvas.width, margin);
		
		// Add play text
		var playText = stage.addChild(new createjs.Text());
		playText.text = 'SPIN';
		playText.font = 'Bold 36px Arial';
		playText.color = '#fff';
		playText.x = Math.round((bottom.graphics.command.w - playText.getMeasuredWidth())/2);
		playText.y = stage.canvas.height - margin + Math.round((margin - playText.getMeasuredHeight()) / 2);
		
		// Set the interactivity
		bottom.on('click', function() {
			startPlay();
		});
		
		/*****
		 * ANIMATION
		 *****/
		// Reels animation
		createjs.Ticker.on("tick", function() {
			if(!running) return;
			for(var i = 0; i < reels.length; i++) {
				var r = reels[i];
				// Update blur filter
				r.blur.blurY = (r.position - r.previousPosition) * 8;
				r.previousPosition = r.position;
				
				for(var j = 0; j < r.symbols.length; j++) {
					var s = r.symbols[j];
					var prevy = s.y;
					s.y = Math.floor(((r.position + j) % r.symbols.length) * SYMBOL_HEIGHT - SYMBOL_HEIGHT);
					if(s.y < 0 && prevy > SYMBOL_HEIGHT) {
						// Detect if going over and swap a texture
						var o = s.children[1];
						
						// Modify the result of 3rd object which is located on the center of slot
						// If position !== target, generate random nuber
						var n = (Math.floor(r.position) === r.target-2) ? result[i]:Math.floor(Math.random() * numbers.length);
						o.gotoAndStop("_"+n);
					}
				}
			}
		});
		
		// Tween animation
		createjs.Ticker.on("tick", function() {
			if(!running) return;
			var now = Date.now();
			var remove = [];
			// console.log("TWEEEN",tweening.length);
			for(var i = 0; i < tweening.length; i++) {
				var t = tweening[i];
				var phase = Math.min(1, (now - t.start) / t.time);

				t.object[t.property] = lerp(t.propertyBeginValue, t.object.target, t.easing(phase));
				
				if(phase === 1) {
					t.object[t.property] = t.object.target;
					if(t.complete) t.complete(t);
					remove.push(t);
				}
			}
			for(var i = 0; i < remove.length; i++) {
				tweening.splice(tweening.indexOf(remove[i]), 1);
			}
		});
		
		createjs.Ticker.on("tick", stage);
	}
	
	// Onload
	window.onload = function() {
		// Update list on load
		list = [
			"11111111",
			"22222222",
			"33333333",
			"44444444",
			"55555555",
		];
		
		stage = new createjs.Stage("canvas");
		init();
	}
}());