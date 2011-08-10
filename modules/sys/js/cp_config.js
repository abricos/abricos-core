/*
@version $Id$
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Sys
 */

var Component = new Brick.Component();
Component.requires = {
	mod:[
	 	{name: 'sys', files: ['api.js','data.js','form.js','wait.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace,
		TMG = this.template;
	
	var API = NS.API;

	if (!NS.data){
		NS.data = new Brick.util.data.byid.DataSet('sys');
	}
	var DATA = NS.data;

	var ConfigWidget = function(container){
		this.init(container);
	};
	ConfigWidget.prototype = {
		init: function(container){
			var TM = TMG.build(), T = TM.data, TId = TM.idManager;
			
			this._TM = TM; this._T = T; this._TId = TId;
			
			this.wait = new Brick.widget.WaitManager();
		
			var __self = this;
			container.innerHTML = T['panel'];
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
			this.container = container;
			
			this.tables = {
				'config': DATA.get('config', true),
				'styles': DATA.get('styles', true)
			};
			this.rows = {
				'config': this.tables['config'].getRows({'mod': 'sys'})
			};
			DATA.onStart.subscribe(this.onDSUpdate, this, true);
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}
		},
		onDSUpdate: function(type, args){
			if (args[0].check(['config','styles'])){
				if (type == 'onStart'){
					this.wait.show(this.container);
				}else{
					this.wait.hide();
					this.render(); 
				}
			}
		},
		destroy: function(){
			DATA.onComplete.unsubscribe(this.onDSUpdate, this);
			DATA.onStart.unsubscribe(this.onDSUpdate, this);
		},
		el: function(name){ return Dom.get(this._TId['panel'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		onClick: function(el){
			if (el.id == this._TId['panel']['bsave']){
				this.save();
				return true;
			}			
			return false;
		},
		render: function(){
			var TM = this._TM, T = this._T, TId = this._TId;
			
			var __self = this;
			var lst = "";
			
			var ast = [];
			
			this.tables['styles'].getRows().foreach(function(row){
				ast[ast.length] = row.cell;
			});
			ast = ast.sort(function(a, b){
				if (a['nm'] > b['nm']){ return 1; }
				if (a['nm'] < b['nm']){ return -1; }
				return 0;
			});
			for (var i=0;i<ast.length;i++){
				var di = ast[i];
				lst += TM.replace('option', {'id': di['nm'], 'tl': di['nm']});
			}
			
			this.el('styles').innerHTML = TM.replace('select', {'list': lst});
			this.rows['config'].foreach(function(row){
				var di = row.cell;
				if (di['nm'] == 'style'){
					Brick.util.Form.setValue(TM.getEl('select.id'), di['ph']);
					return;
				}
				var el = __self.el(di['nm']);
				if (!el){ return; }
				__self.setelv(di['nm'], di['ph']);
			});
		},
		save: function(){
			var T = this._T, TId = this._TId;
			var __self = this;
			this.rows['config'].foreach(function(row){
				var di = row.cell;
				
				if (di['nm'] == 'style'){
					var el = Dom.get(TId['select']['id']);
					row.update({ 'ph': Brick.util.Form.getValue(el) });
					return;
				}

				var el = __self.el(di['nm']);
				if (!el){ return; }
				row.update({ 'ph': __self.elv(di['nm']) });
			});
			this.tables['config'].applyChanges();
			DATA.request();
		}
	};
	
	NS.ConfigWidget = ConfigWidget;
	
};
