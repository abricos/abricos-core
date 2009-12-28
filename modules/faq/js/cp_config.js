/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('mod.faq.admin');

	var T, J, TId;

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		W = YAHOO.widget,
		J = YAHOO.lang.JSON;

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
		
			if (!Brick.objectExists('Brick.mod.faq.data')){
				Brick.mod.faq.data = new Brick.util.data.byid.DataSet('faq');
			}
			DATA = Brick.mod.faq.data;
			
			T = Brick.util.Template['faq']['cp_config'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);

			moduleInitialize();
			delete moduleInitialize;
	  }
	});
	
var moduleInitialize = function(){

(function(){
	
	var Config = function(container){
		this.init(container);
	};
	Config.prototype = {
		init: function(container){
			var __self = this;
			container.innerHTML = T['panel'];
			
			this.tables = {
				'config': DATA.get('config', true)
			};
			this.rows = {
				'config': this.tables['config'].getRows({'mod': 'faq'})
			}
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){ this.render(); }
		},
		onDSUpdate: function(type, args){if (args[0].check(['config'])){ this.render(); }},
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
	Brick.mod.faq.admin.Config = Config;

})();
};
})();