/**
* @version $Id: cp_man_profile.js 19 2009-06-10 20:01:29Z AKuzmin $
* @package Abricos
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'sys', files: ['form.js', 'data.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace,
		TMG = this.template;
	
	if (!Brick.objectExists('Brick.mod.sys.data')){
		Brick.mod.sys.data = new Brick.util.data.byid.DataSet('sys');
	}
	var DATA = Brick.mod.sys.data;

(function(){

	var ModulesWidget = function(container){
		this.init(container);
	};
	
	ModulesWidget.prototype = {
		init: function(container){
		
			var TM = TMG.build('panel,table,row'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T['panel'];

			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});

			
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
			var rows = DATA.get('modules').getRows();
			var lst = "", TM = this._TM;

			rows.foreach(function(row){
				var di = row.cell;
				lst += TM.replace('row', {
					'id': di['id'],
					'nm': di['nm'],
					'vs': di['vs'],
					'rv': di['rv']
				}); 
			});
			TM.getEl('panel.table').innerHTML = TM.replace('table', {
				'rows': lst
			});
		},
		onClick: function(el){
			return false;
		}
	};
	
	NS.ModulesWidget = ModulesWidget;
	
})();	
};