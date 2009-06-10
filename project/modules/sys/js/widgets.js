/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
Brick.namespace('widget');

(function(){
	var Dom, E,	L,	W;
	Brick.Loader.add({
    onSuccess: function() {
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;
			W = YAHOO.widget;
	  }
	});
	
	var elClear = Brick.elClear;
	var elCreate = Brick.elCreate;

(function(){

	Brick.widget.InPlaceEditor = {};
	Brick.widget.InPlaceEditor.open = function(o){
		Brick.widget.InPlaceEditor = new editor();
		Brick.widget.InPlaceEditor.open(o);
	};
	
	var edata = {
		active: false,
		editObject: null,
		editChildObject: null,
		editor: null,
		input: null,
		data: null,
		saveEvent: null
	};
	
	var editor = function(o){this.init();};
	editor.prototype = {
		init: function(){},
		close: function(save){
			if (typeof edata.saveEvent == 'function'){
				var ev = {
					save: save,
					value: L.trim(edata.input.value),
					data: edata.data
				};
				var ret = edata.saveEvent(ev);
				if (typeof ret != 'undefined' && !ret){return;}
			}
			elClear(edata.editObject);
			for (var i=0;i<edata.editChildObject.length;i++){
				edata.editObject.appendChild(edata.editChildObject[i]);
			}
			edata.active = false;
		},
		open: function(o){
			if (edata.active){
				this.close(false);
			}
			edata.active = true;
			var eel = edata.editObject = o.element;
			edata.saveEvent = o.saveEvent;
			
			edata.editChildObject = [];
			for (var i=0;i<eel.childNodes.length;i++){
				edata.editChildObject[i] = eel.childNodes[i];
			}
			elClear(eel);
			
			var ed = edata.editor = elCreate('div', eel);
			var input = elCreate('input', ed);
			edata.input = input;

			var btns = elCreate('div', ed) 
			Dom.addClass(btns,'ygtv-button-container');
			
			var btn;
			btn = elCreate('button', btns);
			Dom.addClass(btn,'ygtvok');
			btn.innerHTML = ' ';

			btn = elCreate('button', btns);
			Dom.addClass(btn,'ygtvcancel');
			btn.innerHTML = ' ';
			
			E.on(btns, 'click', function (ev) {
				var target = E.getTarget(ev);
				if (Dom.hasClass(target,'ygtvok')) {
					E.stopEvent(ev);
					this.close(true);
				}
				if (Dom.hasClass(target,'ygtvcancel')) {
					E.stopEvent(ev);
					this.close(false);
				}
			}, this, true);

			// Dom.addClass(input, 'ygtv-input');
			
			E.on(ed, 'keydown', function (ev) {
				var KEY = YAHOO.util.KeyListener.KEY;
				switch (ev.keyCode) {
					case KEY.ENTER:
						E.stopEvent(ev);
						this.close(true);
						break;
					case KEY.ESCAPE:
						E.stopEvent(ev);
						this.close(false);
						break;
				}
			},this,true);
			Dom.setStyle(ed,'display','block');
			ed.focus();
		}
	}
	
	
})();
})();
