function initCraftySpace() {

	Crafty.c('Ship', {
		maxSpeed: 2,

		Ship: function (x, y, type, faction) {
			this.requires('2D, ' + RENDERING_MODE + ', Collision, solid, ' + type + ',' + faction)
				.attr({
					x: x,
					y: y,
					z: 100
				})
				.collision()
				.bind('EnterFrame', function (frameObj) {
					var speed = this.velocity.magnitude();
					if (speed > this.maxSpeed) {
						this.velocity = this.velocity.scale(this.maxSpeed / speed);
					}
					var from = { x: this.x, y: this.y };
					this.attr({
						x: this.x + this.velocity.x,
						y: this.y + this.velocity.y
					});
					this.trigger('Moved', from);
					if (this.shield && frameObj.frame % 10 == 0) {
						this.shield.alpha = 1 * this.shieldPart.power / 100;
					}
				})
				.origin('center')


			this.velocity = new Crafty.math.Vector2D(0, 0);
			this.direction = new Crafty.math.Vector2D(0, 0);
			this.turn(0);
			this.hitPoints = 3;
			this.maxHitPoints = 3;

			return this;
		},
		addShield: function (part) {
			this.shield = Crafty.e('2D, ' + RENDERING_MODE + ', shield')
				.attr({
					x: this.x + this.w / 2 - 16 * 3 / 2,
					y: this.y + this.h / 2 - 16 * 3 / 2,
					z: 100,
					alpha: 0.5
				});
			this.attach(this.shield);
			this.shieldPart = part;
		},
		removeShield: function () {
			this.detach(this.shield);
			this.shield.destroy();
			this.shieldPart = undefined;
			this.shield = undefined;
		},
		turn: function (amt) {
			this.rotation = (this.rotation + amt) % 360;
			var vY = 1 * Math.sin(this.rotation * Math.PI / 180);
			var vX = 1 * Math.cos(this.rotation * Math.PI / 180);
			this.direction.setValues(vX, vY);
		},
		takeDamage: function (amt) {
			if (this.shield && this.shieldPart.power > 20) {
				this.shieldPart.changePower(-amt * 20);
			} else {
				this.hitPoints = Math.max(0, this.hitPoints - amt);
				for (var i = 0; i < 2; i++) {
					g_game.collideEffects.getNextEffect().show(this.x, this.y);
				}
				if (this.hitPoints <= 0) {
					for (var i = 0; i < 3; i++) {
						g_game.collideEffects.getNextEffect().show(this.x, this.y);
					}
					Crafty.e('SpaceLoot').SpaceLoot(this.x, this.y, this.velocity);
					this.destroy();
				}
			}
		}
	});

	Crafty.c('AIShip', {

		AIShip: function (x, y, type, faction, enemyFaction, home) {
			this.requires('Ship')
				.Ship(x, y, type, faction)
				.bind('EnterFrame', function (frameObj) {
					var enemies = Crafty(enemyFaction);
					var bEnemyFound = false;
					for (var i=0;!bEnemyFound && i<enemies.length;i++) {
						
						var target = Crafty(enemies[0]);
						// turn towards enemy
						var dx = target.x - this.x;
						var dy = target.y - this.y;
						var dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
						if (dist < 1200) {
							bEnemyFound = true;
							this.chaseTarget(target, frameObj);
							var angleToTarget = Math.atan2(dy, dx);
							var rotationRads = this.rotation * Math.PI / 180;
							var angleDiff = rotationRads - angleToTarget;
							angleDiff = (angleDiff + Math.PI) % (Math.PI * 2) - Math.PI;
							// fire?
							if (Math.abs(angleDiff) < Math.PI / 4 && frameObj.frame % 100 == 0) {
								Crafty.e('Bullet').Bullet(this.x, this.y, this.direction, this[0], g_game.defines.partDefs.weapon.blaster);
							}
						}
					}
					if (!bEnemyFound) {
						// go home
						this.chaseTarget(home, frameObj);
					}
				})

			return this;
		},
		chaseTarget: function(target, frameObj) {
			// turn towards enemy
			var dx = target.x - this.x;
			var dy = target.y - this.y;
			var dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
			var angleToTarget = Math.atan2(dy, dx);
			var rotationRads = this.rotation * Math.PI / 180;
			var angleDiff = rotationRads - angleToTarget;
			angleDiff = (angleDiff + Math.PI) % (Math.PI * 2) - Math.PI;
			if (angleDiff < 0) {
				this.turn(1);
			} else if (angleDiff > 0) {
				this.turn(-1);
			}
			// chase?
			if (Math.abs(angleDiff) < Math.PI / 4 && dist > 200) {
				this.velocity.add(new Crafty.math.Vector2D(this.direction.x * 0.02, this.direction.y * 0.02));
				if (frameObj.frame % 10 == 0) {
					g_game.exhaustEffects.getNextEffect().show(this.x + this.w / 2, this.y + this.h / 2);
				}
			}
		
		}
	});


	Crafty.c('PlayerShip', {

		PlayerShip: function (x, y) {
			this.requires('Keyboard, Ship, Delay')
				.Ship(x, y, 'ship', 'faction1')
				.bind('EnterFrame', function (frameObj) {
					if (this.isDown(Crafty.keys.UP_ARROW) || this.isDown(Crafty.keys.W)) {
						this.velocity.add(new Crafty.math.Vector2D(this.direction.x * 0.05, this.direction.y * 0.05));
						if (frameObj.frame % 10 == 0) {
							g_game.exhaustEffects.getNextEffect().show(this.x + this.w / 2, this.y + this.h / 2);
						}
						if (g_game.sounds.engine.isPaused()) {
							g_game.sounds.engine.play();
						}
					}
					else if (!g_game.sounds.engine.isPaused()) {
						g_game.sounds.engine.pause();
					}
					if (this.isDown(Crafty.keys.LEFT_ARROW) || this.isDown(Crafty.keys.A)) {
						this.turn(-4);
					}
					if (this.isDown(Crafty.keys.RIGHT_ARROW) || this.isDown(Crafty.keys.D)) {
						this.turn(4);
					}
					if (this.isDown(Crafty.keys.SPACE)) {
						for (var i=0;i<this.shipConfiguration.weapon.length;i++) {
							if (this.shipConfiguration.weapon[i].readyToUse && this.shipConfiguration.weapon[i].power >= 20) {
								this.shipConfiguration.weapon[i].fire(this.x, this.y, this.direction, this[0], 2);
							}
						}
					}
					
					var planets = this.hit('Planet');
					if (planets) {
						g_game.zoneFromLoc = { x: planets[0].obj.x, y: planets[0].obj.y + planets[0].obj.h/2 };

						loadMap(planets[0].obj.planetMap);
					}
					
					if (frameObj.frame % 10 == 0) {
						for (var i = 0; i < g_game.shipSlots.length; i++) {
							g_game.shipSlots[i].tick();
						}
					}

					g_game.$stage.css('background-position', '' + Math.floor(-this.x / 4) + 'px ' + Math.floor(-this.y / 4) + 'px');
					updateMiniMap();
				})
				.bind('Moved', function(from) {
					if (g_game.cDialogBox.currentlyWriting) {
						positionDialogBox();
					}
				})

			return this;
		},
		reconfigureShip: function() {
			this.shipConfiguration = {
				weapon: [],
				shield: [],
				battery: []
			}
			for (var i = 0; i < g_game.shipSlots.length; i++) {
				if (g_game.shipSlots[i].part) {
					this.shipConfiguration[g_game.shipSlots[i].part.type].push(g_game.shipSlots[i].part);
				}
			}		
		}
	});

	Crafty.c('Planet', {

		Planet: function (x, y, type, map) {
			this.requires('2D, ' + RENDERING_MODE + ', Collision, ' + type)
				.attr({	x: x, y: y,	z: 60 })
				.collision([this.w/2-this.w/4, this.h/2-this.w/4], [this.w/2+this.w/4, this.h/2-this.w/4], [this.w/2+this.w/4, this.h/2+this.w/4], [this.w/2-this.w/4, this.h/2+this.w/4])
				
			this.planetMap = map;
			
			return this;
		}
	});

	Crafty.c('Bullet', {
		range: 1000,
		speed: 10,

		Bullet: function (x, y, dir, sourceId, def) {
			this.requires('2D, ' + RENDERING_MODE + ', Collision, ' + def.sprite)
				.attr({
					x: x,
					y: y,
					z: 100
				})
				.collision([this.w/2-4, this.h/2-4], [this.w/2+4, this.h/2-4], [this.w/2+4, this.h/2+4], [this.w/2-4, this.h/2+4])
				.bind('EnterFrame', function (frameObj) {
					this.attr({
						x: this.x + this.velocity.x,
						y: this.y + this.velocity.y
					});
					this.travelled += Math.sqrt(Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.y, 2));
					var hits = this.hit('solid');
					if (hits) {
						if (hits[0].obj[0] != sourceId) {
							if (hits[0].obj.has('Ship')) {
								hits[0].obj.takeDamage(def.damage);
							}
							else if (hits[0].obj.has('Mob')) {
								hits[0].obj.takeDamage(def.damage);
							}
							g_game.sounds[def.sound_hit].play();
							this.destroy();
							return;
						}
					}
					if (this.travelled > this.range) {
						this.destroy();
					}
				})

			this.velocity = new Crafty.math.Vector2D(dir.x * this.speed, dir.y * this.speed);
			this.travelled = 0;

			g_game.sounds[def.sound_shoot].play();
			return this;
		}
	});

	Crafty.c('SpaceLoot', {
		SpaceLoot: function (x, y, v) {
			this.requires('2D, ' + RENDERING_MODE + ', loot, Collision, Delay')
				.attr({
					x: x,
					y: y,
					z: 90
				})
				.bind('EnterFrame', function (frameObj) {
					this.attr({
						x: this.x + this.velocity.x,
						y: this.y + this.velocity.y
					});
					if (this.hit('PlayerShip')) {
						var newPart = new ShipPart('weapon', 'weapon', 11);
						g_game.parts[newPart.guid] = newPart;
						g_game.shipInventory.addPart(newPart);
						this.destroy();
					}
				})
				.collision()

			this.velocity = v.scale(0.1);
			return this;
		}
	});

	Crafty.c('Exhaust', {
		Exhaust: function () {
			this.requires('2D, ' + RENDERING_MODE + ', exhaust, Delay')
				.attr({
					z: 80
				})

			this.visible = false;
			return this;
		},
		show: function (x, y) {
			this.attr({
				x: x,
				y: y
			})
			this.visible = true;
			var self = this;
			this.delay(function () {
				self.visible = false;
			}, 1000);
		}
	});

	Crafty.c('Fragment', {
		Fragment: function () {
			this.requires('2D, ' + RENDERING_MODE + ', fragment, Delay')
				.attr({
					z: 100
				})
				.bind('EnterFrame', function (frameObj) {
					if (this.visible) {
						this.attr({
							x: this.x + this.velocity.x,
							y: this.y + this.velocity.y
						});
					}
				})

			this.visible = false;
			this.range = 100;
			this.speed = 4;
			this.direction = new Crafty.math.Vector2D(-1 + Math.random() * 2, -1 + Math.random() * 2);
			this.velocity = new Crafty.math.Vector2D(this.direction.x * this.speed, this.direction.y * this.speed);

			return this;
		},
		show: function (x, y) {
			this.attr({
				x: x,
				y: y,
				z: 100
			})
			this.direction = new Crafty.math.Vector2D(-1 + Math.random() * 2, -1 + Math.random() * 2);
			this.velocity = new Crafty.math.Vector2D(this.direction.x * this.speed, this.direction.y * this.speed);
			this.visible = true;
			var self = this;
			this.delay(function () {
				self.visible = false;
			}, 250 + Math.random() * 500);
		}
	});

	Crafty.scene('space', function () {
		Crafty.background('url(./images/background.png)');

		for (var i = 0; i < 10; i++) {
			g_game.collideEffects.objArray.push(Crafty.e('Fragment').Fragment());
		}
		for (var i = 0; i < 20; i++) {
			g_game.exhaustEffects.objArray.push(Crafty.e('Exhaust').Exhaust());
		}

		$('#divGUI').css('visibility', 'visible');
		g_game.$stage = $('#cr-stage');
		g_game.$stage.unbind('mousedown');

		initDialogBox();

		g_game.player = Crafty.e('PlayerShip').PlayerShip(g_game.zoneFromLoc.x + 100, g_game.zoneFromLoc.y);
		Crafty.viewport.clampToEntities = false;
		Crafty.viewport.follow(g_game.player, g_game.player.w / 2, g_game.player.h / 2);

		g_game.planets = [];
		g_game.planets.push(Crafty.e('Planet, planet' + g_game.planets.length).Planet(600, 600, 'planetBig5', 'homePlanet' ));
		g_game.planets.push(Crafty.e('Planet, planet' + g_game.planets.length).Planet(700, 500, 'planetMoon1', 'moon' ));
		//g_game.planets.push(Crafty.e('Planet').Planet(startX - 400, startY + 900, 'planet2' ));
		g_game.planets.push(Crafty.e('Planet, planet' + g_game.planets.length).Planet(1700, 200, 'planetBig6', 'alienPlanet' ));

		// ships
		var ships = g_game.quests[g_game.quests.currentQuest].getShips();
		for (var i=0;i<ships.length;i++) {
			var follow = Crafty(ships[i].follows);
			Crafty.e('AIShip').AIShip(ships[i].x, ships[i].y, ships[i].sprite, ships[i].faction, ships[i].enemyFaction, follow);
		}
		
		// some inventory
		/*var newPart = new ShipPart('weapon', 'weapon', 11);
		g_game.parts[newPart.guid] = newPart;
		g_game.shipInventory.addPart(newPart);

		var newPart = new PlayerPart('weapon', 'pistol', 11);
		g_game.parts[newPart.guid] = newPart;
		g_game.shipInventory.addPart(newPart);*/

		var newPart = new ShipPart('weapon', g_game.defines.partDefs.weapon.pelletGun);
		g_game.parts[newPart.guid] = newPart;
		g_game.shipSlots[2].addPart(newPart);
		var newPart = new ShipPart('shield', g_game.defines.partDefs.shield.shield1);
		g_game.parts[newPart.guid] = newPart;
		g_game.shipSlots[3].addPart(newPart);
		var newPart = new ShipPart('battery', g_game.defines.partDefs.battery.battery1);
		g_game.parts[newPart.guid] = newPart;
		g_game.shipSlots[4].addPart(newPart);


		playSong('DST-IceStar');
		//playDialog('Escort');

		if (g_game.quests.currentQuest == "AfterSpaceWar") {
			playDialog('Player')
		}

	});
	
}
