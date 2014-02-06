/*
 * Crafty WPMessagebox
 * Version 1.0
 *
 * Copyright 2013, Wagner Paz <wagner.o.paz@gmail.com>
 * Dual licensed under the MIT or GPL licenses.
 * 
 * @trigger WPMessageBoxClosed - When the message box is closed
 */
Crafty.c("WPMessageBox",
{
	WPMessageBox: function(characters, tileSize) {
		this.requires("2D");
		
		this.tileSize = tileSize;
		
		this.portrait = Crafty.e('2D, Canvas, playerMan').attr( { x: this.x + this.w - tileSize*2 - 12, y: this.y + 12, z: this.z + 1 });
		this.portrait.visible = false;
		this.attach(this.portrait);
		
		var width = Math.floor(this.w / tileSize);
		var height = Math.floor(this.h / tileSize);
		// fill space with character slots
		this.charSlots = [];
		for (var j=0;j<height;j++) {
			this.charSlots[j] = [];
			for (var i=0;i<width;i++) {
				this.charSlots[j][i] = Crafty.e('CharacterImage').CharacterImage(characters, tileSize).attr({ x: this.x + i*tileSize, y: this.y + j*tileSize, z: this.z + 1 });
				this.attach(this.charSlots[j][i]);
			}
		}
	}
,
	/**@
	* #.messageBox
	* @comp WPMessageBox
	* @sign public this.messageBox(String[] text, Object style)
	* @param text  - Each element of the array will be a frame in the message box. To break line use '\n'.
	* @param style - An object with a set of properties to customize the message box. See _processStyle(style).
	* 
	* Create a customized message box showing the text in a typewriter style.
	* 
	* @example
	* ~~~
	* Crafty.e("2D, DOM, WPMessageBox")
	*       .attr({x: 10, y:10, w: 350, h: 70})
	*       .messageBox(["Hello!\nHow are you doing?", "I'm fine, and you?"],
	*                   {borderSize: 3, font: {size: '12px'}});
	* ~~~
	*/
	messageBox: function(text, style)
	{
		if (!this.currentlyWriting) {
			this.currentlyWriting = true;

			this._text     = text;
			this._style    = style = this._processStyle(style);
			this._txtIndex = 0;

			this._fixContent();
			this._createNextIndicator();
			this._createBackground();
			this._createBorders();
			this._createAndWriteText();
		}

		return this;
	}
,
	next: function()
	{
		this._nextIndicator.blinkStop();

		if(this._txt.finished)
        {
            if(this._txtIndex < this._text.content.length)
            {
                this._createAndWriteText();
            }
            else
            {
				this._clearText();
                this._background.destroy();
                this._destroyBorders();
                this._nextIndicator.destroy();
                //this._txt.destroy();
				this.currentlyWriting = false;
                
                this.trigger("WPMessageBoxClosed");
                
                //this.destroy();
            }
        }
        else
        {
            this._txt.skipped = true;
        }
	}
,
	_clearText: function()
	{
		this.portrait.visible = false;
		for (var j=0;j<this.charSlots.length;j++) {
			for (var i=0;i<this.charSlots[j].length;i++) {
				this.charSlots[j][i].visible = false;
			}
		}
	}
,
	_createAndWriteText: function()
	{
		this._clearText();
        if(this._txt == undefined)
        {
			var self = this;
			//CREATE THE TEXT ENTITY
			this._txt = Crafty.e("WPTypewriter")
							  .bind("WPTypewriterFinished", function()
							  {
								  self._nextIndicator.blinkStart();
							  });
        }
        
		//this.portrait.addComponent(this._text.content[this._txtIndex].image)
		var map = g_game.mainSpriteMap[this._text.content[this._txtIndex].image];
		this.portrait.sprite(map[0], map[1], map[2], map[3]);
		this.portrait.attr({ w: map[2]*2, h: map[3]*2 });
		this.portrait.visible = true;
		var textContent = this._breakLines(this._text.content[this._txtIndex++].text);
		this._txt.write(textContent, null, 75, 40, this.charSlots);
        
	}
,
	_createBackground: function()
	{
		this._background = Crafty.e("2D, WPDynamicRender")
                                 .dynamicRender(this)
                                 .attr({x: this._x + this._style.borderSize + this._style.margin,
                                        y: this._y + this._style.borderSize + this._style.margin,
                                        w: this._w - (2 * this._style.borderSize ) - (2 * this._style.margin),
                                        h: this._h - (2 * this._style.borderSize ) - (2 * this._style.margin),
										z: this._z });
		this.attach(this._background);
        if(this._style.background !== undefined && this._style.background !== '' && this._style.background != "transparent")
		{
			this._background.addComponent("Color");

			//IF THE MESSAGEBOX RENDER TYPE IS CANVAS THEN GIVE SUPPORT TO ALPHA STYLE
			if(this._background.__c["Canvas"])
			{
				this._background.addComponent("Tint").tint(this._style.background, this._style.alpha);
			}
			else
			//OTHERWISE USE A SOLID COLOR
			{
				this._background.color(this._style.background);
			}
		}
	}
,
	_fixContent: function()
	{
		var fixed = null;

		if(this._text instanceof Array)
		{
			fixed = {content: this._text};
		}
		else if(typeof this._text == 'string')
		{
			fixed = {content: [{text : [this._text]}]};
		}
		else if(this._text instanceof Object)
		{
			fixed = this._text;
			if(!fixed.content)
			{
				fixed.content = [];
			}
		}

		for(var i = 0; i < fixed.content.length; i++)
		{
			if(typeof fixed.content[i] == 'string')
			{
				fixed.content[i] = {text: [fixed.content[i]]};
			}
			else if(fixed.content[i] instanceof Array)
			{
				fixed.content[i] = {text: fixed.content[i]};
			}

			if(typeof fixed.content[i].text == 'string')
			{
				fixed.content[i].text = [fixed.content[i].text];
			}

			for(var j = 0; j < fixed.content[i].text.length; j++)
			{
				var text = fixed.content[i].text[j];
				if(typeof text == 'string')
				{
					fixed.content[i].text[j] = text.split('\n');
				}
			}
		}

		this._text = fixed;
	}
,
	_createNextIndicator: function()
	{
		this._nextIndicator = Crafty.e("2D, WPDynamicRender, Color, WPBlink")
                                    .dynamicRender(this)
                                    .attr({x: this._x + this._w - this._style.borderSize - this._style.nextIndicatorSize - this._style.nextIndicatorMargin,
                                           y: this._y + this._h - this._style.borderSize - this._style.nextIndicatorSize - this._style.nextIndicatorMargin,
                                           w: this._style.nextIndicatorSize,
                                           h: this._style.nextIndicatorSize,
                                           z: this._z + 1,
                                           alpha: 0.0})
                                    .color(this._style.foreground)
                                    .blink(400, 1.0, false)
                                    ;
		this.attach(this._nextIndicator);

		if(this._nextIndicator.__c["DOM"])
		{
			this.css('display', 'none');
		}
	}
,
	_createBorders: function()
	{
		if(this._style.borderSize !== null && this._style.borderSize > 0)
		{
			this.cornerNW = Crafty.e("2D, WPDynamicRender, Color")
			                      .dynamicRender(this)
			                      .attr({x: this._x,
			                             y: this._y,
			                             w: this._style.borderSize,
			                             h: this._style.borderSize,
			                             z: this._z + 1})
			                      .color(this._style.borderColor);
			this.attach(this.cornerNW);
			if(this._style.borderSkin != undefined)
			{
				this.cornerNW.addComponent("Image").image(this._style.borderSkin + "/corner-nw.png");
			}

			this.cornerNE = Crafty.e("2D, WPDynamicRender, Color")
			                      .dynamicRender(this)
			                      .attr({x: this._x + this._w - this._style.borderSize,
			                             y: this._y,
			                             w: this._style.borderSize,
			                             h: this._style.borderSize,
			                             z: this._z + 1})
			                      .color(this._style.borderColor);
			this.attach(this.cornerNE);
			if(this._style.borderSkin != undefined)
			{
				this.cornerNE.addComponent("Image").image(this._style.borderSkin + "/corner-ne.png");
			}

			this.cornerSW = Crafty.e("2D, WPDynamicRender, Color")
			                      .dynamicRender(this)
			                      .attr({x: this._x,
			                             y: this._y + this._h - this._style.borderSize,
			                             w: this._style.borderSize,
			                             h: this._style.borderSize,
			                             z: this._z + 1})
			                      .color(this._style.borderColor);
			this.attach(this.cornerSW);
			if(this._style.borderSkin != undefined)
			{
				this.cornerSW.addComponent("Image").image(this._style.borderSkin + "/corner-sw.png");
			}

			this.cornerSE = Crafty.e("2D, WPDynamicRender, Color")
			                      .dynamicRender(this)
			                      .attr({x: this._x + this._w - this._style.borderSize,
			                             y: this._y + this._h - this._style.borderSize,
			                             w: this._style.borderSize,
			                             h: this._style.borderSize,
			                             z: this._z+1})
			                      .color(this._style.borderColor);
			this.attach(this.cornerSE);
			if(this._style.borderSkin != undefined)
			{
				this.cornerSE.addComponent("Image").image(this._style.borderSkin + "/corner-se.png");
			}

			this.edgeN = Crafty.e("2D, WPDynamicRender, Color")
			                   .dynamicRender(this)
			                   .attr({x: this._x + this._style.borderSize,
			                          y: this._y, 
			                          w: this._w - (this._style.borderSize * 2),
			                          h: this._style.borderSize,
			                          z: this._z + 1})
			                   .color(this._style.borderColor);
			this.attach(this.edgeN);
			if(this._style.borderSkin != undefined)
			{
				this.edgeN.addComponent("Image").image(this._style.borderSkin + "/edge-n.png", "repeat-x");
			}

			this.edgeE = Crafty.e("2D, WPDynamicRender, Color")
			                   .dynamicRender(this)
			                   .attr({x: this._x + this._w - this._style.borderSize,
			                          y: this._y + this._style.borderSize,
			                          w: this._style.borderSize,
			                          h: this._h - (2 * this._style.borderSize),
			                          z: this._z + 1})
			                   .color(this._style.borderColor);
			this.attach(this.edgeE);
			if(this._style.borderSkin != undefined)
			{
				this.edgeE.addComponent("Image").image(this._style.borderSkin + "/edge-e.png", "repeat-y");
			}

			this.edgeS = Crafty.e("2D, WPDynamicRender, Color")
			                   .dynamicRender(this)
			                   .attr({x: this._x + this._style.borderSize,
			                          y: this._y + this._h - this._style.borderSize,
			                          w: this._w - (this._style.borderSize * 2),
			                          h: this._style.borderSize,
			                          z: this._z + 1})
			                   .color(this._style.borderColor);
			this.attach(this.edgeS);
			if(this._style.borderSkin != undefined)
			{
				this.edgeS.addComponent("Image").image(this._style.borderSkin + "/edge-s.png", "repeat-x");
			}

			this.edgeW = Crafty.e("2D, WPDynamicRender, Color")
			                   .dynamicRender(this)
			                   .attr({x: this._x,
			                          y: this._y + this._style.borderSize, 
			                          w: this._style.borderSize,
			                          h: this._h - (this._style.borderSize * 2),
			                          z: this._z + 1})
			                   .color(this._style.borderColor);
			this.attach(this.edgeW);
			if(this._style.borderSkin != undefined)
			{
				this.edgeW.addComponent("Image").image(this._style.borderSkin + "/edge-w.png", "repeat-y");
			}
		}
	}
,
	_destroyBorders: function()
	{
		if(this.cornerNW != undefined) this.cornerNW.destroy();
		if(this.cornerNE != undefined) this.cornerNE.destroy();
		if(this.cornerSW != undefined) this.cornerSW.destroy();
		if(this.cornerSE != undefined) this.cornerSE.destroy();
  
		if(this.edgeN != undefined) this.edgeN.destroy();
		if(this.edgeE != undefined) this.edgeE.destroy();
		if(this.edgeS != undefined) this.edgeS.destroy();
		if(this.edgeW != undefined) this.edgeW.destroy();
	}
,
	_processStyle: function(style)
	{
		if(!style)
		{
			style = new Object();
		}

		if(style.foreground          == undefined) style.foreground          = "#000000";
		if(style.background          == undefined) style.background          = "#FFFFFF";
		if(style.alpha               == undefined) style.alpha               = 0.7;
		if(style.margin              == undefined) style.margin              = 0;
		if(style.padding             == undefined) style.padding             = 5;
		if(style.borderSize          == undefined) style.borderSize          = 2;
		if(style.borderColor         == undefined) style.borderColor         = "#000000";
		if(style.borderSkin          == undefined) style.borderSkin          = undefined;
		if(style.font                == undefined) style.font                = {};
		if(style.nextIndicatorSize   == undefined) style.nextIndicatorSize   = 5;
		if(style.nextIndicatorMargin == undefined) style.nextIndicatorMargin = 5;

		return style;
	}
,
	_breakLines: function(stringArray)
	{
		var result = "";
		if(stringArray !== undefined && stringArray instanceof Array)
		{
			for(var i = 0; i < stringArray.length; i++)
			{
				if(i != 0)
				{
					result += '\n';
				}
				result += stringArray[i];
			}
		}
		return result;
	}
});

Crafty.c("CharacterImage",
{	
	CharacterImage: function(characters) {
		this.requires('2D, Canvas, fontChar');
	
		this.characters = characters;
		this.visible = false;
		
		return this;
	},
	setCharacter: function(chr) {
		for (var j=0;j<this.characters.length;j++) {
			for (var i=0;i<this.characters[j].length;i++) {
				if (this.characters[j][i] == chr || (chr == ' ' && this.characters[j][i] == '_')) {
					this.sprite( i, j );
					this.visible = true;
					return;
				}
			}
		}
		
	}
});

/*
 * Crafty WPTypewriter
 * Version 1.0
 *
 * Modified version:
 * Copyright 2013, Wagner Paz <wagner.o.paz@gmail.com>
 * Dual licensed under the MIT or GPL licenses.
 * 
 * Original version:
 * Copyright 2012, Mike Sheldon <elleo@gnu.org>
 * Dual licensed under the MIT or GPL licenses.
 *
 * @trigger Change - when the text is changed
 * @trigger WPTypewriterFinished - when the typewriter animation finishes displaying all text
 */
Crafty.c("WPTypewriter",
{
	init : function()
	{
		this._l = 1;
		this.finished = false;
		this.addComponent("Delay");
		//this.addComponent("Text");
	},

	/**@
	* #.write
	* @comp WPTypewriter
	* @sign public this.write(String sentence, String keysound, Number maxkeytime, Number minkeytime)
	* @param sentence - The string to write in the style of a typewriter, "\n" characters will be replaced with <br />s.
	* @param keysound - A sound to make when each letter is displayed.
	* @param maxkeytime - Maximum amount of time between key presses.
	* @param minkeytime - Minimum amount of time between key presses.
	* 
	* Writes out a string of text one character at a time in the style of a typewriter.
	*
	* If maxkeytime and minkeytime have different values then the amount of time
	* between key presses will be a randomised based on these two limits.
	* This allows for a more realistic simulation of typing.
	* 
	* @example
	* ~~~
	* Crafty.audio.add("typekey", [
	* 	"audio/typewriter_key.ogg"
	* ]);
	* Crafty.e("2D, DOM, WPTypewriter").attr({w: 100, h: 20, x: 200, y: 280})
	* 	.write("Hello World!", "typekey", 200, 100);
	* ~~~
	*/
	write : function(sentence, keysound, maxkeytime, minkeytime, charSlots)
	{
        this.skipped  = false;
		this.finished = false;

		keydiff = maxkeytime - minkeytime;
		var y = 0;
		var x = 0;
		this.len = 0;
		for(var i = 0 ; i < sentence.length; i++)
		{
			this.delay(function()
			{
                if(!this.finished)
                {
                    if(this.skipped)
                    {
                        //sentence = sentence.replace(/\n/g, '<br/>');
                        this.len = sentence.length;
                    }
                    else
                    {
                        if( this.len < sentence.length && sentence.charAt(this.len) == '\n' )
                        {
                            //sentence = sentence.substr(0, this._l + 1) + "<br/>" + sentence.substr(this._l + 2, sentence.length);
                            //this._l += 5;
							y++;
							x = 0;
							this.len++;	// skip /n
                        }
                
                        Crafty.audio.play(keysound);
                    }

					var chr = sentence.charAt(this.len) == ' ' ? '_' : sentence.charAt(this.len);
					charSlots[y][x].setCharacter(chr);
                    this.len++;
					x++;
                    
                    if(this.len > sentence.length)
                    {
                        this.len = 1;
                        this.finished = true;
                        this.trigger("WPTypewriterFinished");
				    }
				}
			}, i * maxkeytime - Math.random() * keydiff);
		}

		return this;
	}
});

/*
 * Crafty WPBlink
 * Version 1.0
 *
 * Copyright 2013, Wagner Paz <wagner.o.paz@gmail.com>
 * Dual licensed under the MIT or GPL licenses.
 */
Crafty.c("WPBlink",
{
	init: function()
	{
		this.requires("2D");
		this.requires("Delay");
	}
,
	blink: function(rate, opaqueAlpha, started)
	{
		this._originalAlpha = this._alpha;
		this._rate          = rate;
		this._visible       = this._originalAlpha != 0.0;
		this._stopped       = started     != undefined ? !started    : true;
		this._opaqueAlpha   = opaqueAlpha != undefined ? opaqueAlpha : 1.0;

		this._changeStateLoop();

		return this;
	}
,
	blinkStart: function()
	{
		this.blink(this._rate, this._opaqueAlpha, true);
		this._changeState();
	}
,
	blinkStop: function()
	{
		this.attr({alpha: this._originalAlpha});
		this._stopped = true;
	}
,
	_changeStateLoop: function()
	{
		if(!this._stopped)
		{
			this.delay(function()
			{
				this._changeState();
				this._changeStateLoop();

			}, this._rate / 2);
		}
		else
		{
			this.attr({alpha: this._originalAlpha});
		}
	}
,
	_changeState: function()
	{
		this._visible = !this._visible;
		this.attr({alpha: this._visible ? this._opaqueAlpha : 0.0});
		if(this.__c["DOM"])
		{
			this.css('display', this._visible ? 'block' : 'none');
		}
	}
});

/*
 * Crafty WPDynamicRender
 * Version 1.0
 *
 * Copyright 2013, Wagner Paz <wagner.o.paz@gmail.com>
 * Dual licensed under the MIT or GPL licenses.
 */
Crafty.c("WPDynamicRender",
{
	dynamicRender: function(copyFrom)
	{
		if(copyFrom.__c["Canvas"])
		{
			this.addComponent("Canvas");
		}
		else
		{
			this.addComponent("DOM");
		}

		return this;
	}
});

Crafty.loadMessageBoxSkin = function(path, onComplete)
{
	var resources = [path + "/corner-ne.png"
	                ,path + "/corner-nw.png"
	                ,path + "/corner-se.png"
	                ,path + "/corner-sw.png"
	                ,path + "/edge-n.png"
	                ,path + "/edge-e.png"
	                ,path + "/edge-s.png"
	                ,path + "/edge-w.png"];

	Crafty.load(resources, onComplete);
};

Crafty.extend(
{
	load: function(data, oncomplete, onprogress, onerror)
	{
		var i     = 0;
		var qtReq = 0;
		var qtRsp = 0;

		var checkComplete = function(sync)
		{
			if(qtReq == qtRsp && i == (data.length - (sync ? 1 : 0)))
			{
				oncomplete();
			}
		};

		for(i = 0; i < data.length; i++)
		{
			var current = data[i];
			var suffix = ".json";
			if(current.indexOf(suffix, current.length - suffix.length) !== -1)
			{
				qtReq++;

				if(!Crafty.asset(current))
				{
					var req = new XMLHttpRequest();
					req.open("GET", data[i], false);
					req.onreadystatechange = function()
					{
						if(req.readyState == 4 && req.status == 200)
						{
							Crafty.asset(current, JSON.parse(req.response));
							qtRsp++;
							checkComplete(true);
						}
					};
					req.send(null);
				}
				else
				{
					qtRsp++;
				}
			}
		}

		this._originalLoad(data, checkComplete, onprogress, onerror);
	}
,
	_originalLoad: Crafty.load
});