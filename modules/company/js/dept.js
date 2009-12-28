/*
* @version $Id: dept.js 177 2009-11-16 15:40:07Z roosit $
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'sys', files: ['data.js', 'form.js', 'container.js']},
		{name: 'company', files: ['api.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace,
		TMG = this.template;
	
	var API = NS.API;

	if (!Brick.objectExists('Brick.mod.company.data')){
		Brick.mod.company.data = new Brick.util.data.byid.DataSet('company');
	}
	var DATA = Brick.mod.company.data;
	
(function(){
	
	var DeptSelectWidget = function(container, deptid, config){
		this.deptid = deptid * 1 || 0;
		config = L.merge({
			manvisible: true
		}, config || {});
		this.init(container, config);
	};
	DeptSelectWidget.prototype = {
		init: function(container, config){
			var TM = TMG.build('deptwidget,depttable,deptrow,deptrowwait,deptrowempty'), 
				T = TM.data, TId = TM.idManager;

			this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T['deptwidget'];
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
			
			if (Brick.Permission.check('company', '50') > 0 && config.manvisible){
				TM.getEl('deptwidget.man').style.display = '';
			}

			this.tables = {'deptlist': DATA.get('deptlist', true)};
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}else{
				this.renderTableAwait();
			}
		},
		destroy: function(){DATA.onComplete.unsubscribe(this.onDSUpdate, this);},
		onDSUpdate: function(type, args){
			if (args[0].check(['deptlist'])){ this.render(); }
		},
		renderTableAwait: function(){
			var TM = this._TM;
			TM.getEl('deptwidget.table').innerHTML = TM.replace('depttable', {
				'rows': this._T['deptrowwait']
			});
		},
		render: function(){
			var TM = this._TM, T = this._T;
			var lst = T['deptrowempty'];
			
			DATA.get('deptlist').getRows().foreach(function(row){
				var di = row.cell;
				lst += TM.replace('deptrow', {
					'id': di['id'],
					'nm': di['nm']
				});
			});
			TM.getEl('deptwidget.table').innerHTML = TM.replace('depttable', { 'rows': lst });
			
			var __self = this;
			E.on(TM.getEl('depttable.id'), 'change', function(){
				__self.onSelect();
			});
			this.setValue(this.deptid);
		},
		onSelect: function(){},
		setValue: function(deptid){
			this.deptid = deptid;
			var el = this._TM.getEl('depttable.id');
			el.value = deptid;
			el.disabled = '';
		},
		getValue: function(){
			var el = this._TM.getEl('depttable.id');
			return el.value * 1;
		},
    	onClick: function(el){
			var TId = this._TId;
			switch(el.id){
			case TId['deptwidget']['bedit']:
			case TId['deptwidget']['beditimg']:
				new NS.DeptListPanel();
				return true;
			}
			return false;
    	}
		
	};
	
	NS.DeptSelectWidget = DeptSelectWidget;
	
})();	
	
(function(){
	
	var DeptListPanel = function(){
		this._TM = TMG.build('deptlistpanel');
		this._T = this._TM.data;
		this._TId = this._TM.idManager;
		
		DeptListPanel.superclass.constructor.call(this, {
			width: "400px", height: "480px", fixedcenter: true
		});
	};
	YAHOO.extend(DeptListPanel, Brick.widget.Panel, {
		initTemplate: function(){
			return this._T['deptlistpanel'];
		},
		onLoad: function(){
			this.deptList = new NS.DeptListWidget(this._TM.getEl('deptlistpanel.container'));
		}
	});

	NS.DeptListPanel = DeptListPanel; 	
	
})();
	
(function(){
	
	var DeptListWidget = function(container){
		this.init(container);
	};
	DeptListWidget.prototype = {
    	init: function(container){
			var TM = TMG.build('deptlistwidget,deptlisttable,deptlistrow,deptlistrowwait'),
				T = TM.data, TId = TM.idManager;
		
			this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T['deptlistwidget'];
		
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
		
			this.tables = { 'deptlist': DATA.get('deptlist', true) };
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}else{
				this.renderTableAwait();
			}
		},
		onDSUpdate: function(type, args){
			if (args[0].check(['deptlist'])){ this.render(); }
		},
		destroy: function(){DATA.onComplete.unsubscribe(this.onDSUpdate, this);},
		renderTableAwait: function(){
			var TM = this._TM;
			TM.getEl('deptlistwidget.table').innerHTML = TM.replace('deptlisttable', {
				'rows': this._T['deptlistrowwait']
			});
		},
		render: function(){
			var TM = this._TM;
			var lst = "";
			DATA.get('deptlist').getRows().foreach(function(row){
				var di = row.cell;
				lst += TM.replace('deptlistrow', {
					'id': di['id'],
					'nm': di['nm'],
					'ord': di['ord']
				});
			});
			TM.getEl('deptlistwidget.table').innerHTML = TM.replace('deptlisttable', { 'rows': lst });
		},
    	onClick: function(el){
			
			var TId = this._TId;
			switch(el.id){
			case TId['deptlistwidget']['bcreate']:
				new NS.DeptEditorPanel(0);
				return true;
			}
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['deptlistrow']['edit']+'-'):
				new NS.DeptEditorPanel(numid);
				return true;
			}
			return false;
    	}
	};
	NS.DeptListWidget = DeptListWidget;
	
})();	

(function(){
	
	var DeptEditorPanel = function(deptid){
		this.deptid = deptid * 1 || 0; 
		DeptEditorPanel.superclass.constructor.call(this, {
			modal: true, fixedcenter: true
		});
	};
	YAHOO.extend(DeptEditorPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(this._TId['depteditor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			var TM = TMG.build('depteditor'), T = TM.data, TId = TM.idManager;
		
			this._TM = TM; this._T = T; this._TId = TId; 
		
			return  T['depteditor'];
		}, 
		onLoad: function(){
			var TId = this._TId;
			
			if (this.deptid > 0){
				var row = DATA.get('deptlist').getRows().getById(this.deptid);
				var di = row.cell;
				this.setelv('nm', di['nm']);
				this.setelv('ord', di['ord']);
			}else{
				
			}
		},
    	onClick: function(el){
			var tp = this._TId['depteditor'];
			switch(el.id){
			case tp['bsave']: this.save(); return true;
			case tp['bcancel']: this.close(); return true;
			}
			return false;
    	},
    	save: function(){
    		var table = DATA.get('deptlist');
    		var rows = table.getRows();
    		var row = this.deptid > 0 ? rows.getById(this.deptid) : table.newRow();
    		row.update({
    			'nm': this.elv('nm'),
    			'ord': this.elv('ord')
    		});
    		if (this.deptid == 0){
    			rows.add(row);
    		}
    		table.applyChanges();
    		API.dsRequest();
    		this.close();
    	}
	});	
	
	NS.DeptEditorPanel = DeptEditorPanel;

})();
};
