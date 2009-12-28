/*
* @version $Id: employee.js 177 2009-11-16 15:40:07Z roosit $
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'sys', files: ['data.js', 'form.js', 'container.js']},
		{name: 'company', files: ['api.js', 'post.js', 'dept.js']}
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
	
	var shortFIO = function(di){
		var str = di['elnm'];
		
		if (di['efnm'].length > 0){
			str += ' '+di['efnm'].substr(0, 1).toUpperCase() + '.';
		}
		if (di['epnc'].length > 0){
			str += ' '+di['epnc'].substr(0, 1).toUpperCase() + '.';
		}
		return str;
	};
	
(function(){
	var EmployeeData = function(cfg){
		this.init(cfg);
	};
	EmployeeData.prototype = {
		init: function(cfg){
			
			this.cfg = cfg || {};
			
			this.tables = {
				'employeelist': DATA.get('employeelist', true),
				'userconfig': DATA.get('userconfig', true),
				'postlist': DATA.get('postlist', true),
				'deptlist': DATA.get('deptlist', true)
			};
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
		},
		isFill: function(){
			return DATA.isFill(this.tables);
		},
		onDSUpdate: function(type, args){
			if (args[0].check(['employeelist']) && L.isFunction(this.cfg.onDataUpdate)){ 
				this.cfg.onDataUpdate(type, args);
			}
		},
		destroy: function(){DATA.onComplete.unsubscribe(this.onDSUpdate);}

	};
	NS.EmployeeData = EmployeeData;
})();
	
(function(){
	
	var EmployeesSelectPanel = function(items, callback){
		this.items = items;
		this.callback = callback;
		
		EmployeesSelectPanel.superclass.constructor.call(this, {
			width: "500px", height: "480px", fixedcenter: true, modal: true
		});
	};
	YAHOO.extend(EmployeesSelectPanel, Brick.widget.Panel, {
		initTemplate: function(){
			this._TM = TMG.build('selpanel');
			this._T = this._TM.data;
			this._TId = this._TM.idManager;
			return this._T['selpanel'];
		},
		onLoad: function(){
			this.employeeList = new NS.EmployeesSelectWidget(this._TM.getEl('selpanel.container'), this.items);
		},
		destroy: function(){
			this.employeeList.destroy();
			EmployeesSelectPanel.superclass.destroy.call(this);
		},
		onClick: function(el){
			if (this.employeeList.onClick(el)){ return true; }
			var tp = this._TId['selpanel'];
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bselect']:
				if (L.isFunction(this.callback)){
					this.callback(this.employeeList.getSelectedItems());
				}
				this.close();
				return true;
			}
			return false;
		}
	});

	NS.EmployeesSelectPanel = EmployeesSelectPanel;
	
	var lastSelPostId = 0, lastSelDeptId = 0;
	
	var EmployeesSelectWidget = function(container, items, config){
		this.init(container, items, config);
	};
	EmployeesSelectWidget.prototype = {
		_items: [],
		init: function(container, items, config){
			this.config = L.merge({}, config || {});
			
			var TM = TMG.build('selwidget,seltable,selrow,selrowwait'),
				T = TM.data, TId = TM.idManager;
		
			this._TM = TM; this._T = T; this._TId = TId;
			container.innerHTML = T['selwidget'];
			
			var __self = this;
			
			this.myFilter = new MyFilterWidget(TM.getEl('selwidget.myfilter'), this);
			
			this.postSelectWidget = new NS.PostSelectWidget(TM.getEl('selwidget.post'), lastSelPostId, {
				manvisible: false
			});
			this.postSelectWidget.onSelect = function(){ __self.render(); };
			this.deptSelectWidget = new NS.DeptSelectWidget(TM.getEl('selwidget.dept'), lastSelDeptId, {
				manvisible: false
			});
			this.deptSelectWidget.onSelect = function(){ __self.render(); };

			this.employeeData = new NS.EmployeeData({
				'onDataUpdate': function(){
					__self.render();
				}
			});
			
			if (this.employeeData.isFill()){
				this.render();
			}else{
				this.renderTableAwait();
			}
    	},
		destroy: function(){
    		this.employeeData.destroy();
    		this.myFilter.destroy();
    	},
    	onClick: function(el){
    		if (this.myFilter.onClick(el)){ return true; }
    		return false;
    	},
		renderTableAwait: function(){
			var TM = this._TM;
			TM.getEl('selwidget.table').innerHTML = TM.replace('table', {
				'rows': this._T['selrowwait']
			});
		},
		render: function(){
			
			lastSelPostId = this.postSelectWidget.getValue();
			lastSelDeptId = this.deptSelectWidget.getValue();
			
			var myEmps = this.myFilter.getEmployees();
			
			var postRows = DATA.get('postlist').getRows();
			var deptRows = DATA.get('deptlist').getRows();
			
			var TM = this._TM, T = this._T;
			var lst = "", deptid = 0;
			
			var selItems = [];
			
			DATA.get('employeelist').getRows().foreach(function(row){
				var di = row.cell;
				if (di.id*1 == Brick.env.user.id*1){ return; }
				var post = postRows.getById(di['ptid']);
				var dept = deptRows.getById(di['dtid']);
				
				if (myEmps.length == 0){
					if (lastSelPostId > 0 && (L.isNull(post) || post.id*1 != lastSelPostId)){
						return;
					}
					if (lastSelDeptId > 0 && (L.isNull(dept) || dept.id*1 != lastSelDeptId)){
						return;
					}
				}else{
					var find = false;
					for (var i=0;i<myEmps.length;i++){
						if (di.id*1 == myEmps[i]*1){
							find = true;
						}
					}
					if (!find){ return; }
				}
				selItems[selItems.length] = di.id;
				var cdeptid = L.isNull(dept) ? 0 : dept.id*1;
				
				var ph = di['phs'].split('|');
				
				lst += TM.replace('selrow', {
					'id': di['id'],
					'fio': shortFIO(di),
					'post': !L.isNull(post) ? post.cell['nm'] : '',
					'checked': myEmps.length > 0 ? 'checked' : ''
				});
			});
			TM.getEl('selwidget.table').innerHTML = TM.replace('seltable', {
				'rows': lst
			});
			this._items = selItems;
		},
		getSelectedItems: function(){
			var items = this._items, tp = this._TId['selrow'], ret = [];
			for (var i=0;i<items.length;i++){
				var empid = items[i]*1;
				var elCH = Dom.get(tp['id']+'ch-'+empid);
				if (!L.isNull(elCH) && elCH.checked){
					ret[ret.length] = empid;
				}
			}
			return ret;
		}
	};
	NS.EmployeesSelectWidget = EmployeesSelectWidget;
	
	var MyFilterWidget = function(container, parent){
		this.init(container, parent);
	};
	
	MyFilterWidget.prototype = {
		init: function(container, parent){
			this.parent = parent;
			var TM = TMG.build('myfilter,myfiltertable,myfilterrow'), 
				T = TM.data, TId = TM.idManager;
	
			this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T['myfilter'];
			
			TM.getEl('myfilter.table').innerHTML = TM.replace('myfiltertable', {'rows': ''});
			this.tables = {
				'userconfig': DATA.get('userconfig', true)
			};
			if (this.isFill()){
				this.render();
			}
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
		},
		isFill: function(){
			return DATA.isFill(this.tables);
		},
		onDSUpdate: function(type, args){
			if (args[0].check(['userconfig'])){ this.render(); }
		},
		destroy: function(){DATA.onComplete.unsubscribe(this.onDSUpdate);},
		_getRow: function(){
			return DATA.get('userconfig').getRows().find({nm: 'se-myfilter'});
		},
		render: function(){
			var row = this._getRow();
			if (L.isNull(row)){
				return;
			}
			var TM = this._TM, T = this._T;
			var cfg = YAHOO.lang.JSON.parse(row.cell['vl']);
			var lst = TM.replace('myfilterrow', { 'id': '', 'nm': '' });
			for (var i=0;i<cfg.length;i++){
				lst += TM.replace('myfilterrow', {
					'id': cfg[i]['nm'],
					'nm': cfg[i]['nm']
				});
			}
			TM.getEl('myfilter.table').innerHTML = TM.replace('myfiltertable', {
				'rows': lst
			});
			var __self = this;
			E.on(TM.getEl('myfiltertable.id'), 'change', function(){
				__self.parent.render(); 
			});
		},
		getEmployees: function(){
			var selname = this._TM.getEl('myfiltertable.id').value;
			
			var row = this._getRow();
			if (L.isNull(row)){ return []; }
			var TM = this._TM, T = this._T;
			var cfg = YAHOO.lang.JSON.parse(row.cell['vl']);
			for (var i=0;i<cfg.length;i++){
				if (cfg[i]['nm'] == selname){
					return cfg[i]['emps'];
				}
			}
			return [];
		},
		remove: function(){
			var selname = this._TM.getEl('myfiltertable.id').value;
			if (selname == ''){
				return;
			}
			this.save(selname, true);
		},
		save: function(name, isRemove){
			isRemove = isRemove || false;
			
			var emps = this.parent.getSelectedItems();
			var J = YAHOO.lang.JSON;
			var table = DATA.get('userconfig');
			
			var row = this._getRow();
			if (L.isNull(row)){
				row = table.newRow();
				table.getRows().add(row);
				row.update({
					'nm': 'se-myfilter',
					'vl': J.stringify([])
				});
			}
			
			var cfg = J.parse(row.cell['vl']);
			if (isRemove){
				var ncfg = [];
				for (var i=0;i<cfg.length;i++){
					if (cfg[i]['nm'] != name){
						ncfg[ncfg.length] = cfg[i];
					}
				}
				cfg = ncfg;
			}else{
				cfg[cfg.length] = {
					'nm': name,
					'emps': emps
				};
			}
			row.update({
				'nm': 'se-myfilter',
				'vl': J.stringify(cfg)
			});
			table.applyChanges();
			API.dsRequest();
			if (isRemove){
				this.parent.render();
			}
		},
		onClick: function(el){
			var tp = this._TId['myfilter'];
			var __self = this;
			switch(el.id){
			case tp['bsave']:
				new MyFilterSavePanel(function(name){
					__self.save(name);
				});
				return true;
			case tp['bremove']:
				this.remove();
				return true;
			}
			return false;
		}
	};
	
	var MyFilterSavePanel = function(callback){
		this.callback = callback;
		
		MyFilterSavePanel.superclass.constructor.call(this, {
			width: "400px", fixedcenter: true, modal: true
		});
	};
	YAHOO.extend(MyFilterSavePanel, Brick.widget.Panel, {
		initTemplate: function(){
			this._TM = TMG.build('myfiltersave');
			this._T = this._TM.data;
			this._TId = this._TM.idManager;
			return this._T['myfiltersave'];
		},
		onClick: function(el){
			var tp = this._TId['myfiltersave'];
			switch(el.id){
			case tp['bsave']:
				this.callback(this._TM.getEl('myfiltersave.name').value);
				this.close();
				return true;
			case tp['bcancel']:
				this.close();
				return true;
			}
			return false;
		}
	});

	
})();

(function(){
	
	var EmployeeListPanel = function(){
		this._TM = TMG.build('panel');
		this._T = this._TM.data;
		this._TId = this._TM.idManager;
		
		EmployeeListPanel.superclass.constructor.call(this, {
			width: "800px", height: "480px", fixedcenter: true,
			controlbox: 1,
			state: Brick.widget.Panel.STATE_MAXIMIZED
		});
	};
	YAHOO.extend(EmployeeListPanel, Brick.widget.Panel, {
		initTemplate: function(){
			return this._T['panel'];
		},
		onLoad: function(){
			this.employeeList = new NS.EmployeeListWidget(this._TM.getEl('panel.container'));
		}
	});
	NS.EmployeeListPanel = EmployeeListPanel; 	

	
	var EmployeeListWidget = function(container){
		this.init(container);
	};
	
	EmployeeListWidget.prototype = {
    	init: function(container){
			var TM = TMG.build('widget,table,tableman,row,rowman,rowwait,rowdept'),
				T = TM.data, TId = TM.idManager;
	
			this._TM = TM; this._T = T; this._TId = TId;

			container.innerHTML = T['widget'];

			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
			if (Brick.Permission.check('company', '50') > 0){
				TM.getEl('widget.man').style.display = '';
			}
			
			this.employeeData = new NS.EmployeeData({
				'onDataUpdate': function(){
					__self.render();
				}
			});
			if (this.employeeData.isFill()){
				this.render();
			}else{
				this.renderTableAwait();
			}
    	},
		destroy: function(){
    		this.employeeData.destroy();
    	},
		renderTableAwait: function(){
			var isMan = Brick.Permission.check('company', '50') > 0; 
			var TM = this._TM;
			TM.getEl('widget.table').innerHTML = TM.replace('table', {
				'man': (!isMan ? '' : this._T['tableman']),
				'rows': this._T['rowwait']
			});
		},
		render: function(){
			
			var isMan = Brick.Permission.check('company', '50') > 0; 

			var postRows = DATA.get('postlist').getRows();
			var deptRows = DATA.get('deptlist').getRows();
			
			var TM = this._TM, T = this._T;
			var lst = "", deptid = 0;
			var colspan = isMan ? 7 : 5;
			
			DATA.get('employeelist').getRows().foreach(function(row){
				var di = row.cell;
				var tMan = !isMan ? '' : (
					TM.replace('rowman', {
						'id': di['id']
					}));
				var post = postRows.getById(di['ptid']);
				var dept = deptRows.getById(di['dtid']);
				var cdeptid = L.isNull(dept) ? 0 : dept.id*1;
				
				if (cdeptid != deptid){
					deptid = cdeptid;
					lst += TM.replace('rowdept', {
						'name': !L.isNull(dept) ? dept.cell['nm'] : '&nbsp;',
						'colspan': colspan
					});
				}
				var ph = di['phs'].split('|');
				
				lst += TM.replace('row', {
					'id': di['id'],
					'room': di['rm'],
					'elnm': di['elnm'],
					'efnm': di['efnm'],
					'epnc': di['epnc'],
					'post': !L.isNull(post) ? post.cell['nm'] : '',
					'ph': ph.length >= 1 ? ph[0] : '',
					'phin': ph.length >= 2 ? ph[1] : '',
					'man': tMan
				});
			});
			TM.getEl('widget.table').innerHTML = TM.replace('table', {
				'man': (!isMan ? '' : T['tableman']),
				'rows': lst 
			});
		},
    	onClick: function(el){
			var __self = this;
			var TId = this._TId;
			switch(el.id){
			case TId['widget']['bcreate']:
				API.showEmployeeEditorPanel(0, function(){
					__self.refresh();
				});
				return true;
			}
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['rowman']['edit']+'-'):
				API.showEmployeeEditorPanel(numid, function(){
					__self.refresh();
				});
				return true;
			case (TId['rowman']['remove']+'-'):
				this.removeEmployee(numid);
				return true;
			}
			return false;
    	}, 
    	refresh: function(){
    		this.renderTableAwait();
    		DATA.get('employeelist').getRows().clear();
    		API.dsRequest();
    	},
    	removeEmployee: function(empid){
    		var table = DATA.get('employeelist');
    		var rows = table.getRows();
    		var row = rows.getById(empid);
    		if (L.isNull(row)){ return; }
    		var di = row.cell;
    		var name = di['elnm']+' '+di['efnm']+di['epnc'];
    		var __self = this;
    		new NS.EmployeeRemovePanel(name, function(){
    			row.remove();
    			table.applyChanges();
    			__self.renderTableAwait();
        		API.dsRequest();
    		});
    	}
    };
    
	NS.EmployeeListWidget = EmployeeListWidget;	
})();	

(function(){
	
	var TM = TMG.build('removepanel'), T = TM.data, TId = TM.idManager;
	
	var EmployeeRemovePanel = function(name, callback){
		this.name = name;
		this.callback = callback;
		
		EmployeeRemovePanel.superclass.constructor.call(this, {
			width: '400px', modal: true, fixedcenter: true
		});
	};
	YAHOO.extend(EmployeeRemovePanel, Brick.widget.Panel, {
		initTemplate: function(){
			return TM.replace('removepanel', {
				'nm': this.name
			});
		},
		onClick: function(el){
			if (el.id == TM.getElId('removepanel.bremove')){
				this.close();
				this.callback();
				return true;
			}else if (el.id == TM.getElId('removepanel.bcancel')){
				this.close();
			}
			return false;
		}
	});
	
	NS.EmployeeRemovePanel = EmployeeRemovePanel;
})();

(function(){
	
	var EmployeeWidget = function(container, id, idtype){
		this.init(container, id, idtype);
	};
	EmployeeWidget.prototype = {
		el: function(name){ return Dom.get(this._TId['employee'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		init: function(container, id, idtype){
			this.id = id*1;
			this.idtype = idtype || 'emp';
			
			var TM = TMG.build('employee'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;

			container.innerHTML = T['employee'];
			
			var readonly = this.idtype == 'user';
			
			this.postSelectWidget = new NS.PostSelectWidget(TM.getEl('employee.post'));
			this.deptSelectWidget = new NS.DeptSelectWidget(TM.getEl('employee.dept'));

			if (id > 0){ 
				this._initTables();
				
				DATA.onComplete.subscribe(this.onDSUpdate, this, true);
				if (DATA.isFill(this.tables)){
					this.renderElements();
				}else{
					this.onStartLoadData();
				}
			}else{
				if (Brick.Permission.check('company', '50') > 0){
					TM.getEl('employee.unm').disabled = '';
					TM.getEl('employee.userinfo').style.display = 'block';
				}
			}
		},
		onLoadData: function(){},
		onStartLoadData: function(){},
		_getRowsParam: function(){
			var p = {};
			p[this.idtype+'id'] = this.id;
			return p;
		},
		_initTables: function(){
			this.tables = {'employee': DATA.get('employee', true)};
			DATA.get('employee').getRows(this._getRowsParam());
		},
		onDSUpdate: function(type, args){
			if (args[0].checkWithParam('employee', this._getRowsParam())){ 
				this.renderElements(); 
			}
		},
		destroy: function(){DATA.onComplete.unsubscribe(this.onDSUpdate);},
		renderElements: function(){
			var rows = DATA.get('employee').getRows(this._getRowsParam());
			var row = rows.getByIndex(0);
			if (L.isNull(row)){
				this._TM.getEl('employee.noemp').style.display = '';
				this._TM.getEl('employee.table').style.display = 'none';
				this.postSelectWidget.setValue(0);
				this.deptSelectWidget.setValue(0);
			}else{
				var di = row.cell;
				this.setelv('unm', di['unm']);
				this.setelv('elnm', di['elnm']);
				this.setelv('efnm', di['efnm']);
				this.setelv('epnc', di['epnc']);
				this.setelv('room', di['rm']);
				
				var ph = di['phs'].split('|');
				
				this.setelv('ph', ph.length >= 1 ? ph[0] : '');
				this.setelv('phin', ph.length >= 2 ? ph[1] : '');
				
				this.postSelectWidget.setValue(di['postid']);
				this.deptSelectWidget.setValue(di['deptid']);
				
				this.setelv('ueml', di['ueml']);
			}
			this.onLoadData();
		},
    	save: function(){
    		this._initTables();
    		var table = DATA.get('employee');
    		var rows = table.getRows(this._getRowsParam());

    		var row = this.id > 0 ? rows.getByIndex(0) : table.newRow();
    		
    		row.update({
    			'elnm': this.elv('elnm'),
    			'efnm': this.elv('efnm'),
    			'epnc': this.elv('epnc'),
    			'postid': this.postSelectWidget.getValue(),
    			'deptid': this.deptSelectWidget.getValue(),
    			'rm': this.elv('room'),
    			'phs': this.elv('ph').replace('|', ',') + '|' + this.elv('phin').replace('|', ',')
    		});
    		
    		if (this.id == 0){
        		row.update({
        			'unm': this.elv('unm'),
        			'ueml': this.elv('ueml'),
        			'upwd': this.elv('upwd')
        		});
    			rows.add(row);
    		}
    		table.applyChanges();
    	}
	};
	NS.EmployeeWidget = EmployeeWidget;
	
	var EmployeeInfoPanel = function(userid){
		this.userid = userid;
		EmployeeInfoPanel.superclass.constructor.call(this, {
			width: '470px',
			height: '290px',
			right: 20, y: 20
		});
	};
	YAHOO.extend(EmployeeInfoPanel, Brick.widget.Panel, {
		initTemplate: function(){
			var TM = TMG.build('info'), T = TM.data, TId = TM.idManager;
		
			this._TM = TM; this._T = T; this._TId = TId; 
		
			return  T['info'];
		},
		onLoad: function(){
			var TM = this._TM, TId = this._TId;
			
			this.employee = new EmployeeWidget(TM.getEl('info.container'), this.userid, 'user');
			
			var __self = this;
			this.employee.onStartLoadData = function(){
				__self.actionDisable(TId['editor']['bcancel']);
			};
			this.employee.onLoadData = function(){
				__self.actionEnable();
			};
		}
	});
	NS.EmployeeInfoPanel = EmployeeInfoPanel;
	
	var EmployeeEditorPanel = function(empid, callback){
		this.callback = callback;
		this.empid = empid * 1 || 0;
		EmployeeEditorPanel.superclass.constructor.call(this, {
			modal: true, fixedcenter: true
		});
	};
	YAHOO.extend(EmployeeEditorPanel, Brick.widget.Panel, {
		initTemplate: function(){
			var TM = TMG.build('editor'), T = TM.data, TId = TM.idManager;
		
			this._TM = TM; this._T = T; this._TId = TId; 
		
			return  T['editor'];
		},
		onLoad: function(){
			var TM = this._TM, TId = this._TId;
			
			this.employee = new EmployeeWidget(TM.getEl('editor.container'), this.empid, 'emp');
			var __self = this;
			this.employee.onStartLoadData = function(){
				__self.actionDisable(TId['editor']['bcancel']);
			};
			this.employee.onLoadData = function(){
				__self.actionEnable();
			};
		},
    	onClick: function(el){
			var TId = this._TId;
			switch(el.id){
			case TId['editor']['bsave']:
				this.save();
				return true;
			case TId['editor']['bcancel']: 
				this.close(); 
				return true;
			}
			return false;
    	},
    	save: function(){
			this.employee.save();
    		if (L.isFunction(this.callback)){
    			this.callback();
    		}
			this.close();
    	}
	});
	NS.EmployeeEditorPanel = EmployeeEditorPanel;
})();


};
