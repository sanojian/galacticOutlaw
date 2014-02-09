g_game.quests = {
	currentQuest: undefined,
	
	dummyTest: function() { return false; },

	Template: {
	    startQuest: function() {
			g_game.quests.currentQuest = 'Template';
		},
		testCompleted: function() {
			return false;
		},
		getShips: function() {
			return [];
		}
    },

	DogWalker: {
		startQuest: function() {
			g_game.quests.currentQuest = 'DogWalker';
			var mobIDs = Crafty('AIMob');
			for (var i=0;i<mobIDs.length;i++) {
				var mob = Crafty(mobIDs[i]);
				if (mob.charName == 'Snaps') {
					mob.addComponent('Companion').Companion(g_game.player, 'faction2');
				}
			}
		},
		testCompleted: function() {
			var mobIDs = Crafty('faction2');
			if (mobIDs.length) {
				return false;
			}

			var mobIDs = Crafty('AIMob');
			for (var i=0;i<mobIDs.length;i++) {
				var mob = Crafty(mobIDs[i]);
				if (mob.charName == 'Snaps') {
					mob.removeComponent('Companion', false);
				}
			}
			g_game.quests.currentQuest = 'AfterDogWalker';

			return true;
		},
		getShips: function() {
			return [];
		}
	},

	AfterDogWalker: {
		startQuest: function() {
			g_game.quests.currentQuest = 'AfterDogWalker';
		},
		testCompleted: function() {
			return false;
		},
		getShips: function() {
			return [];
		}
	},

	SpaceShip: {
		startQuest: function() {
			g_game.quests.currentQuest = 'SpaceShip';
			Crafty.e('Zone')
				.Zone('ship', 'space', false)
				.attr({ x: 9.5 * TILE_SIZE, y: 8.5 * TILE_SIZE, z: 90 });
		},
		testCompleted: function() {
			return false;
		},
		getShips: function() {
			return [
				{	x: 400,		y: 400,		sprite: 'friendShip1',	faction: 'faction1',	enemyFaction: 'factionX',	follows: 'PlayerShip'	},
				{	x: 2100,	y: 400,		sprite: 'enemyShip1',	faction: 'faction2',	enemyFaction: 'factionX',	follows: 'planet1'	}
			];
		}
	},

	SpaceWar: {
		startQuest: function() {
			g_game.quests.currentQuest = 'SpaceWar';
		},
		testCompleted: function() {
			return false;
		},
		getShips: function() {
			return [
				{ 	x: 800, 	y: 800,		sprite: 'enemyShip1', 	faction: 'faction2', 	enemyFaction: 'faction1', 	follows: 'planet0' },
				{	x: 1600, 	y: 400,		sprite: 'friendShip1',	faction: 'faction1',	enemyFaction: 'faction2',	follows: 'PlayerShip' },
				{	x: 2100,	y: 300,		sprite: 'enemyShip1',	faction: 'faction2',	enemyFaction: 'faction1',	follows: 'planet1'	},
				{	x: 1900,	y: 200,		sprite: 'enemyShip1',	faction: 'faction2',	enemyFaction: 'faction1',	follows: 'planet1'	}
			];
		}
	},

	AfterSpaceWar: {
		startQuest: function() {
			g_game.quests.currentQuest = 'AfterSpaceWar';
		},
		testCompleted: function() {
			return false;
		},
		getShips: function() {
			return [];
		}
	}

};
