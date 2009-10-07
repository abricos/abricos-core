/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	
	Brick.namespace('widget');

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	Brick.Loader.add({
    yahoo: ['container'],
    onSuccess: function() {
			moduleInitialize();
			delete moduleInitialize;
		}
	});
	
var moduleInitialize = function(){
(function(){
	
	Brick.widget.Panel = function(template, userConfig){
		userConfig = L.merge(userConfig || {}, {
			zindex: 1000,
			draggable: true, 
			modal:true, 
			visible:false
		})
		this.init(template, userConfig);
	};
	
	var Panel = Brick.widget.Panel;
	
	Panel.prototype = {
		
		constructor: Panel,

		init: function(template, userConfig){

			template = template || "";
			template = this.initTemplate(template);
			
			var div = document.createElement('div');
			div.innerHTML = template;
	
			var win = new YAHOO.widget.Panel(div, userConfig);
			this._basePanel = win;
			win.render(document.body);
			
			this.onLoad();
			
			win.show();
			win.center();
			
			this.onShow();
			
			var __self = this;
			E.on(div, 'click', function(e){
				var el = E.getTarget(e);
				if (__self.onClick(el)){ E.stopEvent(e); }
			});
			win.hideEvent.subscribe(function(){__self.close();});
			
			this.isOpen = true;
		},
		center: function(){
			this._basePanel.center();
		},
		initTemplate: function(template){
			return template;
		},
		close: function (){
			this._basePanel.hide();
			this.onClose();
			this.isOpen = false;
		},
		destroy: function(){
			if (!this._basePanel){
				return;
			}
			this._basePanel.destroy();
			this._basePanel = null;
		},
		onClick: function(el){ return false; },
		onClose: function(){}, 
		onLoad: function(){},
		onShow: function(){}
	};
	
})();	
};
})();
