function ShipPart(type, def, faction, pow) {//icon, regen, pow) {
	this.guid = generateUid();
	this.type = type;
	this.regen = def.regen;
	this.power = pow || 1000;
	this.readyToUse = true;

	this.getInfo = function () {
		return {};
	};

	this.tick = function () {
		if (this.type == 'battery') {
			this.changePower(this.regen);
		}
		else {
			var powLeft = Math.min(this.regen, g_game.player.shipConfiguration.battery[0].power);
			var curPow = this.power;
			this.changePower(powLeft);
			var change = this.power - curPow;
			g_game.player.shipConfiguration.battery[0].changePower(-change);
		}
	};

	this.fire = function(x, y, direction, id, dmg) {
		if (this.readyToUse && this.power > def.cost) {
			this.readyToUse = false;
		}
		else {
			return;
		}
		this.changePower(0-def.cost);
		var self = this;
		setTimeout(function() {
			self.readyToUse = true;
		}, 1000 * def.rate);
		Crafty.e('Bullet').Bullet(x, y, direction, g_game.player[0], def);

	};

	this.changePower = function (amt) {
		this.power = Math.min(100, Math.max(0, this.power + amt));
	};

	//var icon = type;
	$('#divGUI').append('<div class="partBackground shipPart" data-guid="' + this.guid + '"><div class="icon icon-' + def.icon + ' part" title="' + type + '"/></div>');

	this.$image = $('div.shipPart[data-guid=' + this.guid + ']');
};

function PlayerPart(type, icon, regen, pow) {
	this.guid = generateUid();
	this.type = type;
	this.regen = regen;
	this.power = pow || 0;
	this.readyToUse = true;

	this.getInfo = function () {
		return {};
	};

	this.tick = function () {
		if (this.type == 'battery') {
			this.changePower(this.regen);
		}
		else {
			var powLeft = Math.min(this.regen, g_game.player.shipConfiguration.battery[0].power);
			var curPow = this.power;
			this.changePower(powLeft);
			var change = this.power - curPow;
			g_game.player.shipConfiguration.battery[0].changePower(-change);
		}
	};

	this.fire = function(x, y, direction, id, dmg) {
		if (this.readyToUse)
			this.readyToUse = false;
		this.changePower(-20);
		var self = this;
		setTimeout(function() {
			self.readyToUse = true;
		}, 1000);
		Crafty.e('Bullet').Bullet(x, y, direction, id, dmg);

	};

	this.changePower = function (amt) {
		this.power = Math.min(100, Math.max(0, this.power + amt));
	};

	//var icon = type;
	$('#divGUI').append('<div class="partBackground playerManPart" data-guid="' + this.guid + '"><div class="icon icon-' + icon + ' part" title="' + type + '"/></div>');

	this.$image = $('div.playerManPart[data-guid=' + this.guid + ']');
};

function Inventory() {

	this.count = 0;
	this.slots = [];
	for (var i = 0; i < 9; i++) {
		this.slots.push({
			contents: undefined
		});
	}

	this.addPart = function (part) {
		// find empty slot
		for (var i = 0; i < this.slots.length; i++) {
			if (this.slots[i].contents == undefined) {
				this.slots[i].contents = part;
				var posInv = $('#divInventory').offset();
				part.$image.css({
					top: posInv.top + Math.floor(i / 3) * 16 * 3,
					left: posInv.left + (i % 3) * 16 * 3
				});
				this.count += 1;
				return i;
			}
		}
		return -1;
	};

	this.removePart = function (part) {
		for (var i = 0; i < this.slots.length; i++) {
			if (this.slots[i].contents == part) {
				this.slots[i].contents = undefined;
				part.comesFrom = {
					place: 'inventory',
					slot: i
				};
			}
		}
	};
};

function ShipSlot(index) {

	this.index = index;

	$('#divShipParts').append('<div class="shipSlot" data-slot="' + index + '"></div>');
	this.$slotImage = $('div.shipSlot[data-slot=' + index + ']');
	this.$slotImage.append('<div class="powerBar" />');
	this.$slotPower = this.$slotImage.find('.powerBar');

	this.tick = function () {
		if (this.part) {
			this.part.tick();
			this.$slotPower.css('width', 60 * this.part.power / 100);
		} else {
			this.$slotPower.css('width', 0);
		}
	};

	this.addPart = function (part) {
		this.part = part;
		//part.power = part.power;
		var posSlot = this.$slotImage.offset();
		this.part.$image.css({
			top: posSlot.top,
			left: posSlot.left + this.$slotImage.width() - part.$image.width()
		});
		if (part.type == 'shield') {
			g_game.player.addShield(part);
		}
		g_game.player.reconfigureShip();
	};
	this.removePart = function (part) {
		if (this.part == part) {
			this.part = undefined;
			part.comesFrom = {
				place: 'slot',
				slot: index
			};
			if (part.type == 'shield') {
				g_game.player.removeShield();
			}
		}
		g_game.player.reconfigureShip();
	};

}
