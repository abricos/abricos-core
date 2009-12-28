/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('mod.rss');

	var T, J, TId;

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		W = YAHOO.widget;

	var DATA;

	var dateExt = Brick.dateExt;
	var elClear = Brick.elClear;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
		mod:[
		     {name: 'sys', files: ['data.js', 'form.js']}
		    ],
    onSuccess: function() {
		
			if (!Brick.objectExists('Brick.mod.rss.data')){
				Brick.mod.rss.data = new Brick.util.data.byid.DataSet('rss');
			}
			DATA = Brick.mod.rss.data;

			T = Brick.util.Template['rss']['cp_config'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);

			moduleInitialize();
			delete moduleInitialize;
	  }
	});
	
var moduleInitialize = function(){

(function(){
	
	var Config = function(container){ this.init(container); };
	Config.prototype = {
		init: function(container){
			var __self = this;
			container.innerHTML = T['panel'];
			
			this.tables = {
				'config': DATA.get('config', true),
				'modules': DATA.get('modules', true)
			};
			this.rows = {
				'config': this.tables['config'].getRows({'mod': 'rss'})
			}
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}
		},
		onDSUpdate: function(type, args){if (args[0].check(['config','modules'])){ this.render(); }},
		destroy: function(){DATA.onComplete.unsubscribe(this.onDSUpdate, this);},
		el: function(name){ return Dom.get(TId['panel'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		onClick: function(el){
			if (el.id == TId['panel']['bsave']){
				this.save();
				return true;
			}			
			return false;
		},
		render: function(){
			var __self = this;
			var lst = T['optionmod'];
			this.tables['modules'].getRows().foreach(function(row){
				var di = row.cell;
				var t = T['option'];
				t = tSetVar(t, 'id', di['nm']);
				t = tSetVar(t, 'tl', di['nm']);
				lst += t;
			});
			this.el('default').innerHTML = lst;
			this.rows['config'].foreach(function(row){
				var di = row.cell;
				var el = __self.el(di['nm']);
				if (!el){ return; }
				__self.setelv(di['nm'], di['ph']);
			});
		},
		save: function(){
			var __self = this;
			this.rows['config'].foreach(function(row){
				var di = row.cell;
				var el = __self.el(di['nm']);
				if (!el){ return; }
				row.update({'ph': __self.elv(di['nm'])});
			});
			this.tables['config'].applyChanges();
			DATA.request();
		}
	}

	Brick.mod.rss.Config = Config;
})();
};
})();