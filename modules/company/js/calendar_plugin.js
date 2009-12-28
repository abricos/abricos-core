/*
* @version $Id: post.js 177 2009-11-16 15:40:07Z roosit $
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	yahoo: ['json'],
	mod:[
		{name: 'company', files: ['api.js','employee.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace,
		TMG = this.template;

	var API = NS.API;
	
	var CAL = Brick.mod.calendar;

	if (!Brick.objectExists('Brick.mod.company.data')){
		Brick.mod.company.data = new Brick.util.data.byid.DataSet('company');
	}
	var DATA = Brick.mod.company.data;

	// NS['calendar'] = {};
	// NS = NS['calendar'];
	
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
	
	var clrs = [];
	clrs[clrs.length] = {'title': '41, 82, 163', 'body': '102, 140, 217'};
	clrs[clrs.length] = {'title': '163, 41, 41', 'body': '217, 102, 102'};
	clrs[clrs.length] = {'title': '40, 117, 78', 'body': '101, 173, 137'};
	clrs[clrs.length] = {'title': '134, 90, 90', 'body': '190, 148, 148'};
	clrs[clrs.length] = {'title': '177, 54, 95', 'body': '230, 115, 153'};
	clrs[clrs.length] = {'title': '13, 120, 19', 'body': '76, 176, 82'};
	clrs[clrs.length] = {'title': '112, 87, 112', 'body': '169, 146, 169'};
	clrs[clrs.length] = {'title': '122, 54, 122', 'body': '179, 115, 179'};
	clrs[clrs.length] = {'title': '82, 136, 0', 'body': '140, 191, 64'};
	clrs[clrs.length] = {'title': '78, 93, 108', 'body': '140, 102, 217'};
	
	clrs[clrs.length] = {'title': '82, 41, 163', 'body': '102, 140, 217'};
	clrs[clrs.length] = {'title': '41, 82, 163', 'body': '102, 140, 217'};
	clrs[clrs.length] = {'title': '41, 82, 163', 'body': '102, 140, 217'};
	clrs[clrs.length] = {'title': '41, 82, 163', 'body': '102, 140, 217'};
	clrs[clrs.length] = {'title': '41, 82, 163', 'body': '102, 140, 217'};
	clrs[clrs.length] = {'title': '41, 82, 163', 'body': '102, 140, 217'};
	clrs[clrs.length] = {'title': '41, 82, 163', 'body': '102, 140, 217'};

	var TASK_COLORS = clrs;	

(function(){
	
	var CalTaskEditPanel = CAL.TaskEditPanel;
	
	var TaskEditPanel = function(task, callback){
		TaskEditPanel.superclass.constructor.call(this, task, callback, {
			height: "460px"
		});
	};
	YAHOO.extend(TaskEditPanel, CalTaskEditPanel, { });
	CAL.TaskEditPanel = TaskEditPanel;

	var CalTaskEditWidget = CAL.TaskEditWidget;
	
	var _savedTPL = 0, _savedTTP = 0;
	
	var TaskEditWidget = function(container, task){
		TaskEditWidget.superclass.constructor.call(this, container, task);
	};
	YAHOO.extend(TaskEditWidget, CalTaskEditWidget, {
		el: function(name){ return Dom.get(this._TId['taskeditwidget'][name]); },
		initTemlate: function(){
			var TM = TMG.build('taskeditwidget'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			return T['taskeditwidget'];
		},
		initElements: function(container){
			TaskEditWidget.superclass.initElements.call(this, container);
			var task = this.task, TM = this._TM;

			var isMan = task.id == 0 || Brick.env.user.id*1 == task.uid*1;
			this.mEmployees = new MeetingEmployees(TM.getEl('taskeditwidget.mwidget'), isMan);
			
			this._updateTaskType();
			var __self = this;
			E.on(TM.getEl('taskeditwidget.tasktype'), 'change', function(){
				__self._updateTaskType();
				_savedTTP = this.value;
			});
			E.on(TM.getEl('taskeditwidget.permlevel'), 'change', function(){
				_savedTPL = this.value;
			});
		},
		_updateTaskType: function(){
			var TM = this._TM;
			var elType = TM.getEl('taskeditwidget.tasktype');
			var elTP = TM.getEl('taskeditwidget.tp');
			var elTM = TM.getEl('taskeditwidget.tm');
			
			switch (elType.value*1){
			case 0:
				elTP.style.display = '';
				elTM.style.display = 'none';
				break;
			case 1:
				elTP.style.display = 'none';
				elTM.style.display = '';
				break;
			}
		},
		getTaskType: function(){ return this.el('tasktype').value*1; },
		getPermLevel: function(){ return this.el('permlevel').value*1; },
		updateElements: function(row){
			var TM = this._TM;
			var elType = TM.getEl('taskeditwidget.tasktype');
			var elPermLevel = TM.getEl('taskeditwidget.permlevel');
			
			var isNew = L.isNull(row);
			elType.value = isNew ? _savedTTP : row.cell['tp'];
			elPermLevel.value = isNew ? _savedTPL : row.cell['plvl'];
			this._updateTaskType();
			
			if (isNew){ 
				this.mEmployees.setEmployees([]);
				return; 
			}
			var di = row.cell, pfx = 'tp';
			if (this.getTaskType() == 1){
				var emps = di['ops'].replace(/#/gi, '').split(',');
				this.mEmployees.setEmployees(emps);
				pfx = 'tm';
			}
			this.setelv(pfx+'title', di['tl']);
			this.setelv(pfx+'desc', di['dsc']);
		},
		onClick: function(el){
			var pret = TaskEditWidget.superclass.onClick.call(this, el);
			if (pret) {return true; }
			if (this.mEmployees.onClick(el)){ return true; }
			return false;
		},
		updateRow: function(row){
			
			row.update({
				'bdt': CAL.dateClientToServer(this.beginDate.getDate()),
				'edt': CAL.dateClientToServer(this.endDate.getDate())
			});
			
			var tType = this.getTaskType();

			var pfx = "";
			if (tType == 0){
				pfx = "tp";
			}else{
				pfx = "tm";
				var emps = this.mEmployees.employees;
				var sa = [];
				for (var i=0;i<emps.length;i++){
					sa[sa.length] = '#'+emps[i];
				}
				row.update({
					'ops': sa.join(',')
				});
			}
			
			row.update({
				'tl': this.elv(pfx+'title'),
				'dsc': this.elv(pfx+'desc'),
				'plvl': this.getPermLevel(),
				'tp': tType
			});
		}
	});
	
	CAL.TaskEditWidget = TaskEditWidget;
	
	var MeetingEmployees = function(container, isMan){
		this.init(container, isMan);
	};
	MeetingEmployees.prototype = {
		employees: [],
		isMan: false,
		init: function(container, isMan){
			var TM = TMG.build('mwidget,mtable,mtableman,mrowwait,mrow,mrowman'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			this.isMan = isMan;
			
			container.innerHTML = T['mwidget'];
			this.renderWait();
			
			this._TM.getEl('mwidget.man').style.display = isMan ? '' : 'none';
		},
		setEmployees: function(employees){
			this.employees = employees;
			this.render();
		},
		render: function(){
			var emps = this.employees;
			
			var TM = this._TM, T = this._T;
			var lst = "";
			DATA.get('employeelist').getRows().foreach(function(row){
				var di = row.cell;
				var id = di.id*1, find = false;
				for (var i=0;i<emps.length;i++){
					if (id == emps[i]*1){
						find = true;
					}
				}
				if (!find){ return; }
				lst += TM.replace('mrow', {
					'id': di['id'],
					'fio': shortFIO(di),
					'man': ''
				});
			});
			

			TM.getEl('mwidget.table').innerHTML = TM.replace('mtable',{
				'man': this.isMan ? T['mtableman'] : '',
				'rows': lst
			});
		},
		renderWait: function(){
			var TM = this._TM, T = this._T;
			
			TM.getEl('mwidget.table').innerHTML = TM.replace('mtable',{
				'man': this.isMan ? T['mtableman'] : '',
				'rows': T['mrowwait']
			});
		},
		onClick: function(el){
			var __self = this;
			if (el.id == this._TM.getElId('mwidget.badd')){
				new NS.EmployeesSelectPanel([], function(items){
					__self.addEmps(items);
				});
				return true;
			}
			return false;
		},
		addEmps: function(emps){
			var cemps = this.employees;
			for (var i=0;i<emps.length;i++){
				var find = false;
				for (var ii=0;ii<cemps.length;ii++){
					if (cemps[ii] == emps[i]){
						find = true;
					}
				}
				if (!find){
					cemps[cemps.length] = emps[i];
				}
			}
			this.employees = cemps;
			this.render();
		}
	};
	
})();

(function(){
	
	var _isOverrideCalClasses = false;
	var _overrideCalClasses = function(){
		if (_isOverrideCalClasses){ return; }
		_isOverrideCalClasses = true;
		
		// Заменить DataSet календаря на свой DataSet
		CAL.CalendarWidget.DATA = DATA;

		// Все запросы к БД теперь пойдут через модуль "Company"
		CAL.API.dsRequest = function(){
			API.dsRequest();
		};
		
	};
	
	var CalendarPlugin = function(calWidget){
		CalendarPlugin.superclass.constructor.call(this, 'company', calWidget);
		this.init();
	};
	
	YAHOO.extend(CalendarPlugin, CAL.Plugin, {
		init: function(){
			_overrideCalClasses();
		},
		onLoadCalendar: function(){
			this.manager = new Manager(this.calWidget);
		},
		onClose: function(){
			this.manager.destroy();
		}
	});
	
	CAL.PluginManager.register(CalendarPlugin);
	
	
	var Manager = function(calWidget){
		this.init(calWidget);
	};
	Manager.prototype = {
		_isInitElements: false,
		employee: null,
		employees: [],
		taskcolors: {},

		init: function(calWidget){
			this.calWidget = calWidget;
			
			var TM = TMG.build('manager,emptable,emprow,empmyrow'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			var tables = {
				'employeelist': DATA.get('employeelist', true),
				'employee': DATA.get('employee', true),
				'calperm': DATA.get('calperm', true),
				'userconfig': DATA.get('userconfig', true)
			};
			DATA.get('employee').getRows({userid: Brick.env.user.id});
			DATA.get('calperm').getRows({userid: Brick.env.user.id});
			
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(tables)){
				this.render();
			}
		},
		onDSUpdate: function(type, args){
			if (!args[0].checkWithParam('calperm', {userid: Brick.env.user.id})){ return;}
			this.render();
		},
		destroy: function(){DATA.onComplete.unsubscribe(this.onDSUpdate);},
		_initElements: function(){
			var row = DATA.get('employee').getRows({userid: Brick.env.user.id}).getByIndex(0);
			if (L.isNull(row)){ 
				// Пользователь не является сотрудником 
				return; 
			}
			
			this.employee = row.cell;
			
			var div = document.createElement('div');

			this.calWidget.elPlugins.appendChild(div);
			var calW = this.calWidget;
			
			var __self = this;
			E.on(div, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
			div.innerHTML = this._T['manager'];

			this.calWidget.getUsers = function(){
				return __self.getUsers();
			};
			
			this.calWidget.getTaskColor = function(userid){
				var clr = __self.getTaskColor(userid);
				return clr;
			};
			
			var oldShowTask = this.calWidget.showTask;
			this.calWidget.showTask = function(task){
				var taskEditor = oldShowTask(task,
					function(){
						calW.refresh(true);
					}
				);
			};
			
			var oldCreateTask = this.calWidget.createTask;
			this.calWidget.createTask = function(bdate, edate){
				var taskEditor = oldCreateTask(bdate, edate,
					function(){
						calW.refresh(true);
					}
				);
				var emp = __self.employee;
				if (L.isNull(emp)){ return; }
			};
			
			_overrideCalClasses();
		},
		
		_getConfig: function(){
			var cfg = {
				ch: []
			};
			if (L.isNull(this.employee)){ return cfg; }
			cfg.ch = [this.employee.id*1];
			var row = DATA.get('calperm').getRows({userid: Brick.env.user.id}).getByIndex(0);
			if (L.isNull(row)){ return cfg; }
			if (row.cell['ops']){
				cfg = YAHOO.lang.JSON.parse(row.cell['ops']);
			}
			return cfg;
		},
		
		_updateConfig: function(){
			var users = this.getUsers(true);
			var cfg = this._getConfig();
			cfg['ch'] = users;
			var row = DATA.get('calperm').getRows({userid: Brick.env.user.id}).getByIndex(0);
			row.update({
				'ops': YAHOO.lang.JSON.stringify(cfg)
			});
			row.cell['cin'] = null;
			row.cell['cout'] = null;
			row.cell['act'] = 'cfg';
			DATA.get('calperm').applyChanges();
		},
		
		render: function(){
			if (!this._isInitElements){
				this._isInitElements = true;
				this._initElements(); 
			}

			if (L.isNull(this.employee)){ return; }
			
			var TM = this._TM, T = this._T;
			var lst = "";
			
			var clrindex = 0; 			
			var clrs = {};
			var curclr = clrs[Brick.env.user.id] = TASK_COLORS[clrindex++];
			
			lst += TM.replace('empmyrow', {
				'fio': shortFIO(this.employee),
				'clrbody': curclr['body'], 
				'clrtitle': curclr['title'] 
			});
			
			var emps = [];
			
			var row = DATA.get('calperm').getRows({userid: Brick.env.user.id}).getByIndex(0);
			var acin = !L.isNull(row.cell['cin']) ? row.cell['cin'].split(',') : '';
			var cfg = this._getConfig();
			var ids = {};
			for (var i=0;i<acin.length;i++){
				ids[acin[i].replace('#', '')] = true;
			};
			
			DATA.get('employeelist').getRows().foreach(function(row){
				if (!ids[row.cell.id]){ return; }

				var di = row.cell;
				emps[emps.length] = di;
				clrs[di.uid] = TASK_COLORS[clrindex++];
				lst += TM.replace('emprow', {
					'id': di['id'],
					'fio': shortFIO(di),
					'clrbody': clrs[di.uid]['body'], 
					'clrtitle': clrs[di.uid]['title'] 
				});
			});
			
			TM.getEl('manager.table').innerHTML = TM.replace('emptable', { 'rows': lst });
			
			this.employees = emps;
			this.taskcolors = clrs;
			
			this.setUsers(cfg['ch']);
			this.calWidget.refresh();
		},
		
		getTaskColor: function(userid){
			var clr = this.taskcolors[userid];
			if (!clr){
				return TASK_COLORS[0];
			}
			return clr;
		},
		
		setUsers: function(empids){
			empids = empids || [];
			var emps = this.employees;
			var elCH; 
			
			for (var i=0;i<empids.length;i++){
				var empid = empids[i]*1;
				if (empid == this.employee.id*1){
					elCH = this._TM.getEl('empmyrow.id');
				}else{
					elCH = Dom.get(this._TId['emprow']['id']+'ch-'+empid);
				}
				if (!L.isNull(elCH)){
					elCH.checked = true;
				}
			}
		},
		
		getUsers: function(retEmpIds){
			retEmpIds = retEmpIds || false;
			
			if (L.isNull(this.employee)){
				return [Brick.env.user.id];
			}
			
			var users = [];
			if (this._TM.getEl('empmyrow.id').checked){
				users[users.length] = retEmpIds ? this.employee.id : Brick.env.user.id;
			}
			
			var emps = this.employees;
			for (var i=0;i<emps.length;i++){
				var emp = emps[i];
				if (Dom.get(this._TId['emprow']['id']+'ch-'+emp['id']).checked){
					users[users.length] = emp[retEmpIds ? 'id' : 'uid']*1;
				}
			}
			
			return users;
		},

		onClick: function(el){
			var TId = this._TId;
			var tp = TId['manager']; 
			switch(el.id){
			case tp['bconfig']: this.showConfigPanel(); return true;
			case tp['bselall']: this.selectAll(); return true;
			case tp['bunselall']: this.unSelectAll(); return true;
			case TId['empmyrow']['id']: this.changeOptions(); return false;
			}
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case TId['emprow']['id']+'ch-':
				this.changeOptions();
				return false;
			}
			
			return false;
		},
		showConfigPanel: function(){
			new NS.ConfigPanel(this.employee);
		},
		
		changeOptions: function(){
			this._updateConfig();
			this.calWidget.refresh();
		},
		
		_selectItems: function(flag){
			var TM = this._TM;
			TM.getEl('empmyrow.id').checked = flag;
			
			var emps = this.employees;
			for (var i=0;i<emps.length;i++){
				var emp = emps[i];
				Dom.get(this._TId['emprow']['id']+'ch-'+emp['id']).checked = flag;
			}
		},

		selectAll: function(){
			this._selectItems(true);
			this.changeOptions();
		},
		
		unSelectAll: function(){
			this._selectItems(false);
			this.changeOptions();
		}
	};
	
})();

(function(){
	
	var ConfigPanel = function(employee){
		this.employee = employee;
		this._TM = TMG.build('configpanel');
		this._T = this._TM.data;
		this._TId = this._TM.idManager;
		
		ConfigPanel.superclass.constructor.call(this, {
			width: "700px", height: "550px", modal: true,
			overflow: false,
			fixedcenter: true
		});
	};
	YAHOO.extend(ConfigPanel, Brick.widget.Panel, {
		initTemplate: function(){
			return this._T['configpanel'];
		},
		onLoad: function(){
			this.configWidget = new ConfigWidget(this._TM.getEl('configpanel.container'), this.employee);
			API.dsRequest();
		},
		onClick: function(el){
			if (this.configWidget.onClick(el)){ return true; }
			var tp = this._TId['configpanel'];
			switch(el.id){
			case tp['bsave']:
				this.configWidget.save();
				API.dsRequest();
				this.close();
				return true;
			case tp['bcancel']:
				this.close();
				return true;
			}
			return false;
		}
	});
	NS.ConfigPanel = ConfigPanel;
	
	var TableEmployee = function(type, container, employee){
		this.init(type, container, employee);
	};
	TableEmployee.prototype = {
		init: function(type, container, employee){
			this.type = type;
			this.container = container;
			this.employee = employee;
			
			var TM = TMG.build('table,rowwait,row'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
		},
		renderTableAwait: function(){
			var TM = this._TM;
			this.container.innerHTML = TM.replace('table', {
				'rows': this._T['rowwait']
			});
		},
		_emps: [],
		render: function(){
			var TM = this._TM, T = this._T;
			
			var type = this.type, level = this.employee.lvl * 1;
			
			var checked = {}, access = {};
			var first = true;
			
			DATA.get('calperm').getRows({userid: Brick.env.user.id}).foreach(function(row){
				if (first){
					first = false;
					var acperm = (row.cell['c'+type] || '').split(',');
					for (var i=0;i<acperm.length;i++){
						var empid = acperm[i].replace('#', '');
						checked[empid] = true;
					};
				}else{
					access[row.cell['id']] = true;
				}
			});
			var emps = []; 
			var lst = "";
			var emp = this.employee;
			if (emp.postid*1 > 0){
				
				DATA.get('employeelist').getRows().foreach(function(row){
					var di = row.cell;
					
					if (emp.id == di.id){ return; }

					if (type == 'in' && level > di.lvl*1 && !access[di.id]){ return; }
					if (type == 'out' && level >= di.lvl*1){ return; }

					emps[emps.length] = di;
					
					lst += TM.replace('row', {
						'id': di['id'],
						'elnm': di['elnm'],
						'efnm': di['efnm'],
						'epnc': di['epnc'],
						'ch': checked[di['id']] ? 'checked' : ''
					});
				});
			}
			this._emps = emps;
			
			this.container.innerHTML = TM.replace('table', {
				'rows': lst 
			});
		},
		getValues: function(){
			var vals = [];
			for (var i=0;i<this._emps.length;i++){
				var emp = this._emps[i];
				var el = Dom.get(this._TId['row']['id']+'-'+emp.id+'-ch');
				if (el.checked){
					vals[vals.length] = emp.id;
				}
			}
			return vals;
		}
	};
	
	var ConfigWidget = function(container, employee){
		this.init(container, employee);
	};
	ConfigWidget.prototype = {
    	init: function(container, employee){
			this.employee = employee;

			var TM = TMG.build('config'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T['config'];
			
			this.tblEmpIn = new TableEmployee('in', TM.getEl('config.tblin'), employee);
			this.tblEmpOut = new TableEmployee('out', TM.getEl('config.tblout'), employee);
			
			var tables = {
				'employeelist': DATA.get('employeelist', true)
			};
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(tables)){
				this.render();
			}else{
				this.renderTableAwait();
			}
		},
		onDSUpdate: function(type, args){
			if (args[0].check(['employeelist'])){ this.render(); }
		},
		destroy: function(){DATA.onComplete.unsubscribe(this.onDSUpdate, this);},
		renderTableAwait: function(){
			this.tblEmpIn.renderTableAwait();
			this.tblEmpOut.renderTableAwait();
		},
		render: function(){
			this.tblEmpIn.render();
			this.tblEmpOut.render();
		},
		onClick: function(el){ return false;},
		_convertToServer: function(vals){
			var ret = [];
			for (var i=0;i<vals.length;i++){
				ret[ret.length] = '#'+vals[i];
			}
			return ret.join(',');
		},
		save: function(){
			var inVals = this.tblEmpIn.getValues();
			var outVals = this.tblEmpOut.getValues();
			
			var table = DATA.get('calperm');
			var rows = table.getRows({userid: Brick.env.user.id});
			var row = rows.getByIndex(0);
			
			row.update({
				'cin': this._convertToServer(inVals), 
				'cout': this._convertToServer(outVals) 
			});
			table.applyChanges();
		}
	};
	NS.ConfigWidget = ConfigWidget;
})();


};
