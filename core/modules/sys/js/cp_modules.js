/**
* @version $Id: cp_man_profile.js 19 2009-06-10 20:01:29Z AKuzmin $
* @package Abricos
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	
	Brick.namespace('mod.user.modules');

	var T, J, TId;
	var DATA;
	
	var Dom = YAHOO.util.Dom;
	var E = YAHOO.util.Event;
	var L = YAHOO.lang;

	var dateExt = Brick.dateExt;
	var elClear = Brick.elClear;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
		mod:[
		     {name: 'sys', files: ['form.js','data.js']}
		    ],
    onSuccess: function() {
			
			T = Brick.util.Template['user']['cp_modules'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			
			if (!Brick.objectExists('Brick.mod.user.data')){
				Brick.mod.user.data = new Brick.util.data.byid.DataSet('user');
			}
			DATA = Brick.mod.user.data;
	  }
	});
	
(function(){
	
	var ModuleList = function(){
		this.init();
	};
	
	ModuleList.prototype = {
		init: function(){
		
			this.tables = { 
					'modules': DATA.get('modules', true)
			};

			DATA.onComplete.subscribe(this.onDSComplete, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}
		},
		onDSComplete: function(type, args){
			if (args[0].check(['modules'])){ this.render(); }
		},
		render: function(){
			var rows = this.tables['modules'].getRows();
			var lst = "", t, di;

			rows.foreach(function(row){
				di = row.cell;
				t = T['row'];
				t = tSetVar(t, 'id', di['id']);
				t = tSetVar(t, 'nm', di['nm']);
				t = tSetVar(t, 'vs', di['vs']);
				t = tSetVar(t, 'rv', di['rv']);
				lst += t;
			});
			var div = Dom.get(TId['panel']['table']);
			elClear(div);
			
			var tt = tSetVar(T['table'], 'rows', lst);
			div.innerHTML = tt;
		},
		onClick: function(el){
			return false;
		}
	};
	

	Brick.mod.user.modules.cp = function(){
		return {
			initialize: function(container){
				container.innerHTML = T['panel'];
				
				this.modules = new ModuleList();
				
				var __self = this;
				E.on(container, 'click', function(e){
					if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
				});
				DATA.request();
			},
			onClick: function(el){
				if (this.modules.onClick(el)){ return false;}
				return false;
			}
		}
	}();
	
})();
})();