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
	 	{name: 'sys', files: ['api.js','data.js','form.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace,
		TMG = this.template;
	
	var tSetVar = Brick.util.Template.setProperty;
	
	var API = NS.API;

	if (!Brick.objectExists('Brick.mod.sys.data')){
		Brick.mod.sys.data = new Brick.util.data.byid.DataSet('sys');
	}
	var DATA = Brick.mod.sys.data;

	var ConfigWidget = function(container){
		this.init(container);
	};
	ConfigWidget.prototype = {
		init: function(container){
			var TM = TMG.build(),
				T = TM.data,
				TId = TM.idManager;
			this._T = T;
			this._TId = TId;
		
			var __self = this;
			container.innerHTML = T['panel'];
			
			this.tables = {
				'config': DATA.get('config', true),
				'styles': DATA.get('styles', true)
			};
			this.rows = {
				'config': this.tables['config'].getRows({'mod': 'sys'})
			};
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}
		},
		onDSUpdate: function(type, args){if (args[0].check(['config','styles'])){ this.render(); }},
		destroy: function(){DATA.onComplete.unsubscribe(this.onDSUpdate, this);},
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
			var T = this._T, TId = this._TId;
			
			var __self = this;
			var lst = "";
			this.tables['styles'].getRows().foreach(function(row){
				var di = row.cell;
				var t = T['option'];
				t = tSetVar(t, 'id', di['nm']);
				t = tSetVar(t, 'tl', di['nm']);
				lst += t;
			});
			lst = tSetVar(T['select'], 'list', lst);
			this.el('styles').innerHTML = lst;
			this.rows['config'].foreach(function(row){
				var di = row.cell;
				if (di['nm'] == 'style'){
					var el = Dom.get(TId['select']['id']);
					Brick.util.Form.setValue(el, di['ph']);
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
