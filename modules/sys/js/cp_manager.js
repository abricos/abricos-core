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
	yahoo: ["tabview"],
	mod:[
		{name: 'sys', files: ['api.js', 'data.js', 'cp_template.js', 'cp_config.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		LNG = Brick.util.Language;
	
	var NS = this.namespace,
		TMG = this.template;
	
	if (!Brick.objectExists('Brick.mod.sys.data')){
		Brick.mod.sys.data = new Brick.util.data.byid.DataSet('sys');
	}
	var DATA = Brick.mod.sys.data;
	
	var API = NS.API;

(function(){
	
	var ManagerWidget = function(container){
		this.init(container);
	};
	ManagerWidget.prototype = {
		pages: null,
		init: function(container){
			var TM = TMG.build('panel'),
				T = TM.data,
				TId = TM.idManager;
			
			container.innerHTML = T['panel'];
			
			var tabView = new YAHOO.widget.TabView(TId['panel']['id']);
			this.tabView = tabView;
			
			var pages = {};
			pages['config'] = new NS.ConfigWidget(Dom.get(TId['panel']['tabconfig']));
			pages['template'] = new NS.TemplateWidget(Dom.get(TId['panel']['tabtemplate']));
			this.pages = pages;
	
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
		},
		onClick: function(el){
			for (var n in this.pages){
				if (this.pages[n].onClick(el)){ return true; }
			}
			return false;
		}
	};
	NS.ManagerWidget = ManagerWidget;
})();	

(function(){
	
	var PermissionWidget = function(container){
		this.init(container);
	};
	PermissionWidget.prototype = {
		modPermissionWidget: null,
		init: function(container){
			var TM = TMG.build('permission,permmodstable,permmodsrow'),
				T = TM.data,
				TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T['permission'];
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
			
			this.tables = {
				'permission_mods': DATA.get('permission_mods', true)
			};
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}
		},
		onDSUpdate: function(type, args){
			if (args[0].check(['permission_mods'])){ 
				this.render(); 
			}
		},
		destroy: function(){DATA.onComplete.unsubscribe(this.onDSUpdate, this);},
		el: function(name){ return Dom.get(this._TId['permission'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		onClick: function(el){
			if (el.id == this._TM.getElId('permission.bconfig')){
				var module = Brick.util.Form.getValue(this._TM.getEl('permmodstable.mods'));
				this.configModule(module);
				return true;
			}
			return false;
		},
		render: function(){
			var TM = this._TM;
			var lst = "";
			DATA.get('permission_mods').getRows().foreach(function(row){
				var di = row.cell;
				var title = LNG.getc('mod.'+di['nm']+'.cp.title');
				if (L.isNull(title)){
					title = di['nm'];
				}
				lst += TM.replace('permmodsrow', {'v': di['nm'], 't': title });
			});
			TM.getEl('permission.mods').innerHTML = TM.replace('permmodstable', {
				'rows': lst
			});
			TM.getEl('permission.bconfig').disabled = "";
		},
		configModule: function(module){
			if (L.isNull(this.modPermissionWidget)){
				this.modPermissionWidget = 
					new NS.ModulePermissionWidget(module, this._TM.getEl('permission.perm'));
			}else{
				this.modPermissionWidget.setModule(module);				
			}
			DATA.request(true);
		}
	};
	
	NS.PermissionWidget = PermissionWidget;
	
})();

(function(){
	var ModulePermissionWidget = function(module, container){
		this.init(module, container);
	};
	ModulePermissionWidget.prototype = {
		init: function(module, container){
			var TM = TMG.build('permmodwidget,permmodtable,permmodrowwait,permmodrow'),
				T = TM.data,
				TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T['permmodwidget'];
			
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
			
			this.tables = {
				'permission_mod': DATA.get('permission_mod', true)
			};
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			this.setModule(module);
		},
		onDSUpdate: function(type, args){
			if (args[0].checkWithParam('permission_mod', {'module': this.module})){ 
				this.render(); 
			}
		},
		destroy: function(){DATA.onComplete.unsubscribe(this.onDSUpdate, this);},
		setModule: function(module){
			this.module = module;
			
			var rows = DATA.get('permission_mod').getRows({'module': module});
			
			if (DATA.isFill(this.tables)){
				this.render();
			}else{
				this.renderTableAwait();
			}
		},
		renderTableAwait: function(){
			this._TM.getEl('permmodwidget.table').innerHTML = this._TM.replace('permmodtable', {
				'rows': this._T['permmodrowwait']
			});
		}, 
		render: function(){
			
			var __self = this;
			if (Brick.componentExists(this.module, 'api') && 
				!Brick.componentLoaded(this.module, 'api') &&
				!this._tempflag){
				
				Brick.Component.API.fireFunction(this.module, 'api', function(){
					__self.render();
				});
				__self._tempflag = true;
				return;
			}
			this._tempflag = false;
			
			var TM = this._TM;
			var rows = DATA.get('permission_mod').getRows({'module': this.module});
			var lst = "";
			var actTitle = LNG.getc('mod.'+this.module+'.permission');
			if (L.isNull(actTitle)){
				actTitle = {};
			}
			var lngGGroup = LNG.getc('mod.sys.permission.group');
			rows.foreach(function(row){
				var di = row.cell;
				var act = actTitle[di['act']] || di['act'];
				var subject = di['sbj'];
				var ag = di['sbj'].split(',');
				if (ag.length > 0 && lngGGroup[ag[0]]){
					subject = lngGGroup[ag[0]];
				}

				lst += TM.replace('permmodrow', {
					'id': di['id'],
					'sbj': subject,
					'act': act,
					'st': LNG.getc('mod.sys.permission.status')[di['st']]
				});
			});
			TM.getEl('permmodwidget.table').innerHTML = TM.replace('permmodtable', {
				'rows': lst
			});
		}
	};
	NS.ModulePermissionWidget = ModulePermissionWidget;

})();

};
