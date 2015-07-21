/**
 * @module Sys
 * @namespace Brick.widget
 */

var Component = new Brick.Component();
Component.requires = {
	yahoo:['dom']
};
Component.entryPoint = function(){
	
	Brick.namespace('widget');

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var buildTemplate = this.buildTemplate;
	
	var LayWait = function(container, placeInBody){
		this.init(container, placeInBody);
	};
	LayWait.prototype = {
		init: function(container, placeInBody){
			placeInBody = placeInBody || true;
			container = L.isString(container) ? Dom.get(container) : container;
			this.el = null;
			var TM = buildTemplate(this, 'laywait');
			
			if (L.isNull(container)){ return; }
			
			var rg = Dom.getRegion(container);
			
			var out = 5;
			
			var div = document.createElement('div');
			div.innerHTML = TM.replace('laywait', {
				'w': rg['width']+out*2, 
				'h': rg['height']+out*2, 
				'top': rg['top']-out,
				'left': rg['left']-out
			});
			this.el = div.childNodes[0];
			if (placeInBody){
				document.body.appendChild(this.el);
			}else{
				container.appendChild(this.el);
			}
		},
		hide: function(){
			if (L.isNull(this.el)){ return; }
			this.el.parentNode.removeChild(this.el);
			this.el = null;
		}
	};
	Brick.widget.LayWait = LayWait;
	
	
	var WaitManager = function(cfg){
		this.init(cfg);
	};
	WaitManager.prototype = {
		init: function(cfg){
			this.cfg = L.merge({
				'type': 'lay' 
			}, cfg || {});
			
			this.wait = {};
		},
		show: function(container, placeInBody){
			container = L.isString(container) ? Dom.get(container) : container;

			container.id = container.id || Dom.generateId();
			var cid = container.id;
			if (this.wait[cid]){ return; }
			switch(this.cfg.type){
			case 'lay':
				this.wait[cid] = new LayWait(container, placeInBody); 
				break;
			}
		},
		hide: function(container){
			if (container && this.wait[container.id]){
				this.wait[container.id].hide();
				delete this.wait[container.id];
			}else if (!container){
				var arr = [];
				for (var nn in this.wait){
					this.wait[nn].hide();
					arr[arr.length] = nn;
				}
				for (var i=0;i<arr.length;i++){
					delete this.wait[arr[i]];
				}
			}
		}
	};
	Brick.widget.WaitManager = WaitManager;
	

(function(){
	
	var panel = null;
	
	var loadLib = function(callback){
		if (!L.isNull(panel)){
			callback();
		}else{
			Brick.ff('sys', 'container', function(){
				
				panel = function(){
					panel.superclass.constructor.call(this, {
						fixedcenter: true, resize: false
					});
				};
				YAHOO.extend(panel, Brick.widget.Panel, {
					initTemplate: function(){
						var TM = TMG.build('loadingpanel'), T = TM.data, TId = TM.idManager;
						return T['loadingpanel'];
					},
					destroy: function(){
						LoadPanel.instance = null;
						panel.superclass.destroy.call(this);
					}
				});
				
				callback();
			});
		}
	};
	
	var LoadPanel = {
		instance: null,
		show: function(){
			// TODO: временно отключено в связи с багами
			return;
			loadLib(function(){
				
				if (!L.isNull(LoadPanel.instance)){
					LoadPanel.instance.show();
				}else{
					LoadPanel.instance = new panel();
				}
			});
		},
		hide: function(){
			// TODO: временно отключено в связи с багами
			return;
			if (L.isNull(LoadPanel.instance)){
				return;
			}
			LoadPanel.instance.close();
			LoadPanel.instance = null;
		}		
	};
	
	Brick.widget.LoadPanel = LoadPanel; 

})();
};