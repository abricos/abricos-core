/**
* @version $Id: container.js 721 2009-03-26 14:19:32Z AKuzmin $
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
	
	Brick.widget.Panel = function(template, userConfig/*, tman/**/){
		userConfig = L.merge(userConfig || {}, {
			zindex: 1000,
			draggable: true, 
			modal:true, 
			visible:false
		})
		this.init(template, userConfig /*, tman/**/);
	};
	
	var Panel = Brick.widget.Panel;
	
	Panel.prototype = {
		
		/**
		 * The class's constructor function
		 * @property contructor
     * @type Function
     */
		constructor: Panel,
		// templateManager: null,

		init: function(template, userConfig/*, tman/**/){
			
			// this.templateName = userConfig['templateName']; // на будущее: передача шаблона, его имени и мендеджера идентификатора элемента. Создание функции el, которая возвращает элемент и кеширует его, чтоб при следующем запросе не использовал Dom.get
			// this.templateManager = tman;
			// this._elCache = {};
	
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
		/*
		el: function(name){
			var tman = this.templateManager;
			alert(tman);
			if (typeof tman  == 'undefined'){
				alert('Error in Brick.widget.Panel: Template manager can`t initialized');
				return null;
			}
			var t = tman['T'];
			var tId = tman['TId'];
			var tName = tman['TName'];
			var id = tId[tName][name];
			if (typeof this._elCache[id] == 'undefined'){
				this._elCache[id] = Dom.get(id);
			}
			return this._elCache[id];
		},
		/**/
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
		onClick: function(el){
			return false;
		},
		onClose: function(){}, 
		onLoad: function(){}
	};
	
})();	
};
})();
