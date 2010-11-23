/*
* @version $Id$
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	yahoo: ['tabview','dragdrop'],
	mod:[
		{name: 'sys', files: ['data.js', 'form.js', 'container.js','widgets.js']},
		{name: 'user', files: ['guest.js']}
	]
};
(function(){
	var rm = Component.requires.mod;
	// загрузить api.js каждого модуля для редактора групп. 
	for (var m in Brick.Modules){
		if (Brick.componentExists(m, 'api') && !Brick.componentLoaded(m, 'api')){
			rm[rm.length] = {name: m, files: ['api.js']}; 
		}
	}
})();

var profileExist = false;
if (Brick.componentExists('uprofile', 'profile')){
	profileExist = true;
	var rm = Component.requires.mod;
	rm[rm.length] = {name: 'uprofile', files: ['profile.js']}; 
}

Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		LNG = Brick.util.Language;
	
	var NS = this.namespace,
		TMG = this.template;
	
	var API = NS.API;

	if (!NS.data){
		NS.data = new Brick.util.data.byid.DataSet('user');
	}
	var DATA = NS.data;
	
	var UProfileExist = Brick.componentExists('uprofile', 'profile');
	
	var ManagerWidget = function(container){
		this.init(container);
	};
	ManagerWidget.prototype = {
		pages: null,
		init: function(container){
			var TM = TMG.build('manager'), T = TM.data, TId = TM.idManager;
			
			container.innerHTML = T['manager'];
			
			var tabView = new YAHOO.widget.TabView(TM.getElId('manager.id'));
			
			var pages = {};
			pages['users'] = new NS.UsersWidget(TM.getEl('manager.users'));
			pages['groups'] = new NS.GroupsWidget(TM.getEl('manager.groups'));
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
	
	
	var UsersWidget = function(el){
		
		var TM = TMG.build('users,utable,urow,urowwait'),
			T = TM.data, TId = TM.idManager;
		this._TM = TM; this._T = T; this._TId = TId;

		var config = {
			tm: TM, DATA: DATA, rowlimit: 10,
			tables: { 'list': 'userlist', 'count': 'usercount' },
			paginators: ['users.pagtop', 'users.pagbot']
		};
		UsersWidget.superclass.constructor.call(this, el, config);    
	};
    YAHOO.extend(UsersWidget, Brick.widget.TablePage, {
    	initTemplate: function(){
    		return this._T['users'];
    	},
    	
    	refresh: function(){
    		var prm = this.getParam();
    		DATA.get('usergrouplist', true).getRows(prm).clear();
    		
    		UsersWidget.superclass.refresh.call(this);    
    	},
    	initTables: function(){
    		UsersWidget.superclass.initTables.call(this);
    		var prm = this.getParam();
    		DATA.get('usergrouplist', true).getRows(prm);
    		DATA.get('grouplist', true).getRows();
    	},
    	renderTableAwait: function(){
    		this._TM.getEl("users.table").innerHTML = this._TM.replace('utable', {'rows': this._T['urowwait']});
    	},
		renderRow: function(di){
    		var prm = this.getParam();
			var gRows = DATA.get('grouplist').getRows();
			var ugRows = DATA.get('usergrouplist', true).getRows(prm).filter({
				'uid': di['id']
			});
			var lst = [];
			ugRows.foreach(function(row){
				var rg = gRows.getById(row.cell['gid']);
				if (L.isNull(rg)){ return; }
				lst[lst.length] = rg.cell['nm']; 
			});
			
    		return this._TM.replace('urow', {
    			'unm': di['unm'],
    			'eml': di['eml'],
    			'dl': Brick.dateExt.convert(di['dl']),
    			'vst': Brick.dateExt.convert(di['vst']),
    			'ugp': lst.join(','),
    			'id': di['id'],
    			'dis': UProfileExist ? '' : 'none'
			});
    	},
    	renderTable: function(lst){
    		var TM = this._TM;
    		TM.getEl("users.table").innerHTML = TM.replace('utable', {'rows': lst});
    	}, 
    	onClick: function(el){
    		var TM = this._TM;
    		if (el.id == TM.getElId("users.refresh")){
    			this.refresh();
    			return true;
    		}else if (el.id == TM.getElId("users.badd")){
    			this.showUserEditor(); 
    			return true;
    		}
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");

			switch(prefix){
			case (this._TId['urow']['edit']+'-'):
				this.showUserEditor(numid);
				return true;
			case (this._TId['urow']['profile']+'-'):
				this.showUserProfile(numid);
				return true;
			}
			return false;
    	},
    	showUserEditor: function(userid){
    		var __self = this;
			API.showUserEditorPanel(userid || 0, function(){
				__self.refresh();
			});
    	},
    	showUserProfile: function(userid){
    		Brick.mod.uprofile.API.showProfilePanel(userid);
    	}
    });
	NS.UsersWidget = UsersWidget;	

	var UserEditorPanel = function(userid, callback){
		this.userid = userid || 0;
		this.callback = callback;
		UserEditorPanel.superclass.constructor.call(this, {
			modal: true,
			fixedcenter: true
		});
	};
	YAHOO.extend(UserEditorPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(this._TId['editor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			var TM = TMG.build('editor'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			return  T['editor'];
		},
		destroy: function(){
			this.userGroupWidget.destroy();
			UserEditorPanel.superclass.destroy.call(this);
		},
		onLoad: function(){
			var userid = this.userid;
			if (userid == 0){
				this._TM.getEl('editor.unm').disabled = '';
				this.showPassField();
			}
			this.userGroupWidget = new UserGroupWidget(this._TM.getEl('editor.group'), this.userid);

			var __self = this;
			Brick.ajax('user', {
				'data': {'do': 'user','userid': userid},
				'event': function(request){
					__self.renderUser(request.data);
				}
			});
		},
		renderUser: function(d){
			d = L.merge({
				'unm': '', 'eml': '', 'gp': ''
			}, d || {});
	 		
	 		this.setelv('unm', d['unm']);
	 		this.setelv('eml', d['eml']);

	 		this.userGroupWidget.setValue(d['gp']);
	 		this.userGroupWidget.render();
		},
		onClick: function(el){
			
			if (this.userGroupWidget.onClick(el)){ return true; }
			
			var tp = this._TId['editor']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bsave']: this.save(); return true;
			case tp['bpass']: this.showPassField(); return true;
			}
		},
		showPassField: function(){
			this.el('bpass').style.display = 'none';
			this.el('passcont').style.display = '';
		},
		save: function(){
			var pass = this.elv('pass'); 
			if (pass != this.elv('passconf')){
		 		alert(Brick.util.Language.getData()['user']['form']['error']['pass']['conf']);
				return;
			}
			
			var __self = this, userid = this.userid;
			
			Brick.ajax('user', {
				'data': {
					'do': 'usersave',
					'userid': userid,
					'unm': this.elv('unm'),
					'eml': this.elv('eml'),
					'pass': pass,
		 			'gp': this.userGroupWidget.getValue()
				},
				'event': function(request){
					__self._saveResponse(request);
				}
			});
		},
		_saveResponse: function(request){
			
			var err = request.data * 1;
			
			if (err > 0){
				var lng = Brick.util.Language.getc('mod.user.register.error.srv');
				alert(lng[err]);
				return;
			}
			
			var tableUserList = DATA.get('userlist');
	 		if (tableUserList){
	 			var rows = tableUserList.getLastUpdateRows();
	 			rows.clear();
	 		}
	 		if (!L.isFunction(this.callback)){
				DATA.request();
	 		}else{
	 			this.callback();
	 		}
	 		this.close();
		}
	});
	
	NS.UserEditorPanel = UserEditorPanel;
	
	var UserGroupWidget = function(container, userid){
		this.init(container, userid);
	};
	UserGroupWidget.prototype = {
		init: function(container, userid){
			this.userid = userid;
			var TM = TMG.build('ugwidget,ugstable,ugsrow,ugsrowwait,ugtable,ugrowwait,ugrow'), 
				T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T['ugwidget'];

			TM.getEl('ugwidget.selgroups').innerHTML = TM.replace('ugstable', {
				'rows': this._T['ugsrowwait']
			});

			TM.getEl('ugwidget.table').innerHTML = TM.replace('ugtable', {
				'rows': this._T['ugrowwait']
			});
		},
		destroy: function(){},
		render: function(){
			var lst = "", TM = this._TM, T = this._T;
			DATA.get('grouplist').getRows().foreach(function(row){
				var di = row.cell;
				lst += TM.replace('ugsrow', {
					'nm': di['nm'],
					'id': di['id']
				});
			});
			TM.getEl('ugwidget.selgroups').innerHTML = TM.replace('ugstable', {
				'rows': lst
			});
		},
		renderGroupTable: function(){
			var arr = this.groups, TM = this._TM,
				groupRows = DATA.get('grouplist').getRows(),
				lst = "";
			for (var i=0;i<arr.length;i++){
				var group = groupRows.getById(arr[i]);
				if (!L.isNull(group)){
					lst += TM.replace('ugrow', {
						'nm': group.cell['nm'],
						'id': group.cell['id']
					});
				}
			}
			TM.getEl('ugwidget.table').innerHTML = TM.replace('ugtable', {
				'rows': lst
			});
		},
		setValue: function(groups){
			this.groups = groups.split(',');
			this.renderGroupTable();
		},
		addGroup: function(groupid){
			var find = false, arr = this.groups;
			for (var i=0;i<arr.length;i++){
				if (arr[i]*1 == groupid*1){
					find = true;
				}
			}
			if (find){ return; }
			this.groups[this.groups.length] = groupid;
			this.renderGroupTable();
		},
		removeGroup: function(groupid){
			var find = false, arr = this.groups, newarr = [];
			
			for (var i=0;i<arr.length;i++){
				if (arr[i]*1 != groupid*1){
					newarr[newarr.length] = arr[i];
				}
			}
			this.groups = newarr;
			this.renderGroupTable();
		},
		getValue: function(){
			return this.groups.join(',');
		}, 
		onClick: function(el){
			var TId = this._TId, TM = this._TM;
			
			if (el.id == TId['ugstable']['badd']){
				var groupid = TM.getEl('ugstable.id').value;
				this.addGroup(groupid);
				return true;
			}
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");

			switch(prefix){
			case (this._TId['ugrow']['remove']+'-'):
				this.removeGroup(numid);
				return true;
			}
			
			return false;
		}
	};
	
	
	var GroupsWidget = function(el){
		
		var TM = TMG.build('groups,gtable,grow,growwait'),
			T = TM.data, TId = TM.idManager;
		this._TM = TM; this._T = T; this._TId = TId;

		var config = {
			rowlimit: 10,
			fulldata: true,
			tables: { 'list': 'grouplist', 'count': 'groupcount' },
			tm: TM,
			paginators: ['groups.pagtop', 'groups.pagbot'],
			DATA: DATA
		};
		GroupsWidget.superclass.constructor.call(this, el, config);    
	};
	
    YAHOO.extend(GroupsWidget, Brick.widget.TablePage, {
    	initTemplate: function(){
    		return this._T['groups'];
    	},
    	renderTableAwait: function(){
    		this._TM.getEl("groups.table").innerHTML = this._TM.replace('gtable', {'rows': this._T['growwait']});
    	},
		renderRow: function(di){
    		return this._TM.replace('grow', {
    			'nm': di['nm'],
    			'id': di['id']
			});
    	},
    	renderTable: function(lst){
    		var TM = this._TM;
    		TM.getEl("groups.table").innerHTML = TM.replace('gtable', {'rows': lst});
    	}, 
    	onClick: function(el){
			switch(el.id){
			case (this._TId['groups']['badd']):
				new NS.GroupEditorPanel();
				return true;
			}

			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (this._TId['grow']['edit']+'-'):
				new NS.GroupEditorPanel(numid);
				return true;
			}
			return false;
    	}
    });
    
	NS.GroupsWidget = GroupsWidget;	
	
	var GroupEditorPanel = function(groupid){
		this.groupid = groupid || 0;
		GroupEditorPanel.superclass.constructor.call(this, {
			modal: true, fixedcenter: true, width: '600px'
		});
	};
	YAHOO.extend(GroupEditorPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(this._TId['geditor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			var TM = TMG.build('geditor'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			return T['geditor'];
		},
		onLoad: function(){
			
			if(this.groupid == 0){
				this.el('badd').style.display = '';
			}else{
				this.el('bsave').style.display = '';
			}
			
			this.roles = new NS.RolesWidget(this._TM.getEl('geditor.roles'), this.groupid);
			
			var tables = {'grouplist': DATA.get('grouplist', true)};
			
			DATA.onComplete.subscribe(this.dsComplete, this, true);
			if (DATA.isFill(tables)){
				this.renderElements();
			}
			API.dsRequest();
		},
		
		dsComplete: function(type, args){
			if (args[0].checkWithParam('grouplist', {})){ 
				this.renderElements(); 
			}
		},
		
		renderElements: function(){
			var row = DATA.get('grouplist').getRows().getById(this.groupid);
			if (L.isNull(row)){ return; }
			this.setelv('gnm', row.cell['nm']);
		},
		
		destroy: function(){
			DATA.onComplete.unsubscribe(this.dsComplete);
			GroupEditorPanel.superclass.destroy.call(this);
		},
		
		onClick: function(el){
			var tp = this._TId['geditor']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bsave']: this.save(); return true;
			case tp['badd']: this.save(); return true;
			}
		},
		save: function(){
			var table = DATA.get('grouplist');
			var rows = table.getRows();
			var row;
			if (this.groupid == 0){
				row = table.newRow();
				rows.add(row);
			}else{
				row = rows.getById(this.groupid);
			}
			row.update({
				'nm': this.elv('gnm')
			});
			table.applyChanges();
			this.roles.save();
			
			this.close();
			API.dsRequest();
		}
	});
	
	NS.GroupEditorPanel = GroupEditorPanel;
	
	var RolesWidget = function(container, groupid){
		this.init(container, groupid);
	};
	RolesWidget.prototype = {
		init: function(container, groupid){
			groupid = groupid || 0;
			this.groupid = groupid;
		
			var TM = TMG.build('roles,rltable,rlrowwait,rlrow,rlaction'), 
				T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			container.innerHTML = T['roles'];
			
			var tables = {
				'grouplist': DATA.get('grouplist', true),
				'modactionlist': DATA.get('modactionlist', true),
				'rolelist': DATA.get('rolelist', true)
			};
			var rows = tables['rolelist'].getRows({groupid: groupid});
			
			DATA.onComplete.subscribe(this.dsComplete, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}
		},
		
		dsComplete: function(type, args){
			if (args[0].checkWithParam('rolelist', {'groupid': this.groupid})){ 
				this.render(); 
			}
		},
		
		destroy: function(){
			DATA.onComplete.unsubscribe(this.dsComplete);
		},
		
		buildModRoles: function(modname){
			
			var lst = "", TM = this._TM;
			DATA.get('modactionlist').getRows().filter({'md': modname}).foreach(function(row){
				var di = row.cell;
				lst += TM.replace('rlaction', {
					'md': modname,
	    			'title': LNG.getc('mod.'+modname+'.roles.'+di['act']) || di['act'],
	    			'id': di['id']
				}); 
			});
			return lst;
		},
		
		
		render: function(){
			
			var modules = {};
			DATA.get('modactionlist').getRows().foreach(function(row){modules[row.cell['md']]=true;});

			var lst = "", TM = this._TM;
			
			for (var nn in modules){
				lst += TM.replace('rlrow', {
	    			'nm': LNG.getc('mod.'+nn+'.title') || nn,
	    			'lst': this.buildModRoles(nn)
				}); 
			}
    		TM.getEl("roles.table").innerHTML = TM.replace('rltable', {'rows': lst});
    		
			this.setRolesValue();

		},
		
		setRolesValue: function(){
			var TId = this._TId,
				roleRows = DATA.get('rolelist').getRows({'groupid': this.groupid});
			
			DATA.get('modactionlist').getRows().foreach(function(row){
				var di = row.cell;
				var role = roleRows.find({'maid': di['id']});
				if (L.isNull(role)){
					role = {'st': 0};
				}else{
					role = role.cell;
				}
				var el = Dom.get(TId['rlaction']['id']+'-'+di['id']);
				el.checked = role['st']*1 > 0;
			});
		},
		
		save: function(){
			var TId = this._TId,
				roleTable = DATA.get('rolelist'),
				roleRows = roleTable.getRows({'groupid': this.groupid});
		
			DATA.get('modactionlist').getRows().foreach(function(row){
				var di = row.cell;
				var el = Dom.get(TId['rlaction']['id']+'-'+di['id']);
				var role = roleRows.find({'maid': di['id']});

				if (el.checked){
					if (L.isNull(role)){
						role = roleTable.newRow();
						role.update({ 'maid': di['id'] });
						roleRows.add(role);
					}
					role.update({ 'st': 1 });
				}else if (!L.isNull(role)){
					role.remove();
				}
			});
			
			roleTable.applyChanges();
		},

		onClick: function(el){ return false; }
	
	};
	NS.RolesWidget = RolesWidget; 

};
