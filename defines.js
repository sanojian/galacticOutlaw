var RENDERING_MODE = 'Canvas';
var GAME_FONT = '"Press Start 2P", cursive';
var TILE_SIZE = 8*3;
var VIEW_WIDTH = 960 - 144; 
var VIEW_HEIGHT = 640; 

var g_game = {
	collideEffects: {
		objArray: [],
		cursor: 0,
		getNextEffect: function () {
			g_game.collideEffects.cursor = (g_game.collideEffects.cursor + 1) % g_game.collideEffects.objArray.length;
			return g_game.collideEffects.objArray[g_game.collideEffects.cursor];
		}
	},
	exhaustEffects: {
		objArray: [],
		cursor: 0,
		getNextEffect: function () {
			g_game.exhaustEffects.cursor = (g_game.exhaustEffects.cursor + 1) % g_game.exhaustEffects.objArray.length;
			return g_game.exhaustEffects.objArray[g_game.exhaustEffects.cursor];
		}
	},
	parts: {},
	sounds: {},
	music: {},
	curLevel: 0,
	defines: {}
};
