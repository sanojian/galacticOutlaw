function initCraftySurface() {


	Crafty.c('Zone', {
		Zone: function (type, destination, bMap) {
			this.requires('2D, ' + RENDERING_MODE + ', Collision, ' + type)
				.collision()
				.bind('EnterFrame', function(frameObj) {
					if (this.hit('PlayerMan')) {
						if (bMap) {
							loadMap(destination);
						}
						else {
							Crafty.scene(destination);
						}
					}
				})
				
			
			return this;
		}
	});

	Crafty.c('Mob', {
		Mob: function (type, name) {
			this.requires('2D, ' + RENDERING_MODE + ', Collision, SpriteAnimation, solid, ' + type)
				.attr({	z: 100 })
				.collision()
				.reel('WalkRight', 300, [[this.__coord[0] + 0*TILE_SIZE, this.__coord[1]], [this.__coord[0] + 1*TILE_SIZE, this.__coord[1]], [this.__coord[0] + 2*TILE_SIZE, this.__coord[1]]])
				.reel('WalkDown', 300, [[this.__coord[0] + 3*TILE_SIZE, this.__coord[1]], [this.__coord[0] + 4*TILE_SIZE, this.__coord[1]], [this.__coord[0] + 5*TILE_SIZE, this.__coord[1]]])
				.reel('WalkLeft', 300, [[this.__coord[0] + 6*TILE_SIZE, this.__coord[1]], [this.__coord[0] + 7*TILE_SIZE, this.__coord[1]], [this.__coord[0] + 8*TILE_SIZE, this.__coord[1]]])
				.reel('WalkUp', 300, [[this.__coord[0] + 9*TILE_SIZE, this.__coord[1]], [this.__coord[0] + 10*TILE_SIZE, this.__coord[1]], [this.__coord[0] + 11*TILE_SIZE, this.__coord[1]]])
				.bind('NewDirection', function(dir) {
					if (dir.x > 0) {
						this.animate('WalkRight', -1);
					}
					else if (dir.x < 0) {
						this.animate('WalkLeft', -1);
					}
					else if (dir.y < 0) {
						this.animate('WalkUp', -1);
					}
					else if (dir.y > 0) {
						this.animate('WalkDown', -1);
					}
					else {
						this.pauseAnimation();
					}
				})
				.bind('Moved', function(from) {
					var solids = this.hit('solid');
					if (solids && solids[0].normal) {
						// slide around object
						this.x += Math.ceil(solids[0].normal.x * -solids[0].overlap);
						this.y += Math.ceil(solids[0].normal.y * -solids[0].overlap);
						if (this.hit('solid')) {
							// still hitting, give up
							this.attr({x: from.x, y:from.y});
						}
						return;
					}
					else if (solids) {
						this.attr({x: from.x, y:from.y});
						return;
					}
				})

			this.charName = name;
			return this;
		},
		takeDamage: function() {
			this.destroy();
			
			// check if this ends quest
			if (g_game.quests.currentQuest) {
				g_game.quests[g_game.quests.currentQuest].testCompleted();
			}
			
			// flying bones
			for (var i=0;i<2 + Math.floor(Math.random()*2);i++) {
				Crafty.e('2D, ' + RENDERING_MODE + ', ' + (i==0 ? 'skull' : 'bone'))
					.attr({ x: this.x + TILE_SIZE/4 + TILE_SIZE*Math.random(), y: this.y + TILE_SIZE/4 + Math.random()*TILE_SIZE/2, z: this.z+1 })
					.bind('EnterFrame', function() {
						this.frameCount = this.frameCount ? this.frameCount + 1 : 1;
						this.dx = this.dx ? this.dx : 1 - Math.random() * 2;
						this.dy = this.dy ? this.dy : -2 - Math.random() * 3;
						this.dy += 0.3;
						this.duration = this.duration ? this.duration : 10 + 15 * Math.random();
						this.attr({ x: this.x + this.dx, y: this.y + this.dy });
						if (this.frameCount > this.duration) {
							this.destroy();
						}
					});
			}

		}
	});

	Crafty.c('PlayerMan', {
		PlayerMan: function (type) {
			this.requires('Mob, Fourway')
				.fourway(2)
				.Mob(type)
				.bind('Moved', function(from) {
					var dlgChars = this.hit('DialogSource');
					if (dlgChars) {
						var dlgChar = dlgChars[0].obj;
						playDialog(dlgChar.charName);
						this.attr({ x: from.x, y: from.y });
						
					}
				})
				
			return this;
		}
	});

	Crafty.c('DialogSource', {
		DialogSource: function (type, name) {
			this.requires('2D, ' + RENDERING_MODE + ', Collision, ' + type)
				.attr({ z: 100 })
				.collision()
				
			this.charName = name;
			return this;
		}
	});
	
	Crafty.c('Dialog', {
		delayTime: 100,
		
		Dialog: function () {
			this.requires('2D, DOM, Color, Text, textbox')
			   .attr({x: 200, y: 200, w: VIEW_WIDTH-24, h: 64})
			   .color("rgb(200,200,200)")
			   .text("")
			   .css({ 'overflow-y': 'scroll' })
			   .textColor('#000')
			   .textFont({ size: '16px', family: GAME_FONT })
			   .bind("EnterFrame", function(frameobj) {
					if (this.performDisplay) {
						this.timeAccumulator += frameobj.dt;
						if (this.timeAccumulator >= this.delayTime) {
							this.timeAccumulator -= this.delayTime;
							this.text(this.textToDisplay.substr(0,this.charIndex++));
							if (this.charIndex > this.textToDisplay.length) {
								this.performDisplay = false;
								//this.visible = false;
							}
						}
					}
			   })
			
			this.visible = false;
			
			return this;
		},
		showText: function(txt) {
			if (!this.performDisplay) {
				this.visible = true;
				this.timeAccumulator = 0;
				this.charIndex = 0;
				this.textToDisplay = txt;
				this.performDisplay = true;
				this.attr({ x: 0 - Crafty.viewport.x + 12, y: 0 - Crafty.viewport.y + 12 });
			}
		}
	});
	
	Crafty.c('Companion', {
		
		Companion: function (target, enemy) {
			this.bind('EnterFrame', function(frameObj) {
				var newTarget = undefined;
				var enemies = Crafty(enemy);
				var dist = 10000;
				for (var i=0;i<enemies.length;i++) {
					var newDist = Math.sqrt(Math.pow(this.x - Crafty(enemies[i]).x, 2) + Math.pow(this.y - Crafty(enemies[i]).y, 2));
					if (newDist < 100 && newDist < dist) {
						if (newDist < TILE_SIZE*1.5) {
							Crafty(enemies[i]).takeDamage();
						}
						newTarget = Crafty(enemies[i]);
					}
				}
				
				newTarget = newTarget ? newTarget : target;
				
				var dx =  newTarget.x - this.x;
				var dy = newTarget.y - this.y;
				dx = dx ? (dx > 0 ? 1 : -1) : 0;
				dy = dy ? (dy > 0 ? 1 : -1) : 0;
				if (this.direction.x != dx || this.direction.y != dy) {
					this.direction = { x: dx, y: dy };
					this.trigger('NewDirection', this.direction);
				}
			})
				
			this.target = target;
			return this;
		}
		
	});
	
	
	Crafty.c('AIMob', {
		direction: { x: 0, y: 0 },
		
		AIMob: function (type, name) {
			this.requires('Mob, Delay')
				.bind('EnterFrame', function(frameObj) {
					var from = { x: this.x, y: this.y };
					this.attr({ x: this.x + this.direction.x, y: this.y + this.direction.y });
					this.trigger('Moved', from);
				})
				.Mob(type, name)
			
			this.walkRandomDirection();
			
			return this;
		},
		walkRandomDirection: function() {
			if (!this.target) {
				this.direction = { x: 1 - Math.floor(Math.random()*3), y: 1 - Math.floor(Math.random()*3) };
				this.trigger('NewDirection', this.direction);
				var self = this;
				this.delay(function() { self.walkRandomDirection(); }, 1500);
			}
		}
	});
	
	Crafty.scene("planetSurface", function () {
		Crafty.background('url(./images/background.png)');

		$('#divGUI').css('visibility', 'visible');
		g_game.$stage = $('#cr-stage');
		var startX = 300;
		var startY = 220;

		for (var i=0;i<g_game.map.layers.length;i++) {
			if (g_game.map.layers[i].type == 'objectgroup') {
				// objects
				for (var j=0;j<g_game.map.layers[i].objects.length;j++) {
					var obj = g_game.map.layers[i].objects[j];
					var el = Crafty.e('2D, ' + RENDERING_MODE + ', maptile_' + obj.gid 
									+ (obj.properties && obj.properties.components ? ',' + obj.properties.components : ''))
								.attr({ x: obj.x, y: obj.y - TILE_SIZE, z: 10 });
					if (obj.properties && obj.properties.entity) {
						el.addComponent(obj.properties.entity);
						el[obj.properties.entity]('maptile_' + obj.gid, obj.properties.name);
					}
					if (obj.properties && obj.properties.components) {
						var comps = obj.properties.components.split(',');
						for (var c=0;c<comps.length;c++) {
							el.addComponent(comps[c]);
						}
					}
					
				}
			}
			else {
				// tiles
				for (var y=0;y<g_game.map.layers[i].height;y++) {
					for (var x=0;x<g_game.map.layers[i].width;x++) {
						var tile = g_game.map.layers[i].data[x + y * g_game.map.layers[i].width];
						if (tile > 0) {
							var el = Crafty.e('2D, ' + RENDERING_MODE + ', maptile_' + g_game.map.layers[i].data[x + y * g_game.map.layers[i].width])
										.attr({ x: x * g_game.map.tilewidth, y: y * g_game.map.tileheight, z: 1 });
							if (g_game.map.layers[i].properties && g_game.map.layers[i].properties.components && g_game.map.layers[i].properties.components.indexOf('solid') != -1) {
								el.addComponent('solid').addComponent('Collision').collision();
							}
						}
					}
				}
			}
		}
		
		g_game.player = Crafty(Crafty('PlayerMan')[0]);
		Crafty.viewport.clampToEntities = false;
		Crafty.viewport.follow(g_game.player, g_game.player.w / 2, g_game.player.h / 2);
		
		initDialogBox();
		
		g_game.$stage.bind('mousedown', function(evt) {
			var pos = $(this).offset();
			var craftyX = evt.offsetX || evt.pageX - pos.left;
			var craftyY = evt.offsetY || evt.pageY - pos.top;
			
			var dx = craftyX - g_game.player.x - Crafty.viewport.x;
			var dy = craftyY - g_game.player.y - Crafty.viewport.y;
			var direction = new Crafty.math.Vector2D(dx, dy).scaleToMagnitude(1);
			Crafty.e('Bullet').Bullet(g_game.player.x, g_game.player.y, direction, g_game.player[0], 2);
		});
		
	});
	
}
