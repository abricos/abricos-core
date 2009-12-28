/*
* @version $Id$
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'sys', files: ['data.js', 'form.js', 'container.js','widgets.js']},
		{name: 'user', files: ['api.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace,
		TMG = this.template;
	
	var API = NS.API;

	if (!Brick.objectExists('Brick.mod.user.data')){
		Brick.mod.user.data = new Brick.util.data.byid.DataSet('user');
	}
	var DATA = Brick.mod.user.data;
	
	var UserListWidget = function(el){
		
		var TM = TMG.build('panel,table,row,rowwait'),
			T = TM.data,
			TId = TM.idManager;
		
		this._TM = TM; this._T = T; this._TId = TId;

		var config = {
			rowlimit: 10,
			tables: {
				'list': 'userlist',
				'count': 'usercount'
			},
			tm: TM,
			paginators: ['panel.pagtop', 'panel.pagbot'],
			DATA: DATA
		};
		UserListWidget.superclass.constructor.call(this, el, config);    
	};
	
    YAHOO.extend(UserListWidget, Brick.widget.TablePage, {
    	initTemplate: function(){
    		return this._T['panel'];
    	},
    	renderTableAwait: function(){
    		this._TM.getEl("panel.table").innerHTML = this._TM.replace('table', {'rows': this._T['rowwait']});
    	},
		renderRow: function(di){
			var ugp = Brick.util.Language.getData()['user']['group'];
    		return this._TM.replace('row', {
    			'unm': di['unm'],
    			'eml': di['eml'],
    			'dl': Brick.dateExt.convert(di['dl']),
    			'vst': Brick.dateExt.convert(di['vst']),
    			'ugp': ugp[di['ugp']],
    			'id': di['id']
			});
    	},
    	renderTable: function(lst){
    		this._TM.getEl("panel.table").innerHTML = this._TM.replace('table', {'rows': lst}); 
    	}, 
    	onClick: function(el){
    		if (el.id == this._TM.getElId("panel.refresh")){
    			this.refresh();
    			return true;
    		}
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (this._TId['row']['edit']+'-'):
				API.showUserEditorPanel(numid);
				return true;
			}
			return false;
    	}
    });
    
	NS.UserListWidget = UserListWidget;	

(function(){
	
	var TM = TMG.build('editor'),
		T = TM.data,
		TId = TM.idManager;
	
	var UserEditorPanel = function(userid){
		this.userid = userid;
		UserEditorPanel.superclass.constructor.call(this, {
			modal: true,
			fixedcenter: true
		});
	};
	YAHOO.extend(UserEditorPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['editor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			return  T['editor'];
		},
		onLoad: function(){
			this.tables = {'user': DATA.get('user', true)};
			this.rows = this.tables['user'].getRows({id: this.userid});
			DATA.onComplete.subscribe(this.dsComplete, this, true);
			if (DATA.isFill(this.tables)){
				this.renderElements();
			}
		},
		
		dsComplete: function(type, args){
			if (args[0].checkWithParam('user', {id: this.userid})){ 
				this.renderElements(); 
			}
		},
		
		renderElements: function(){
	 		var row = this.rows.getByIndex(0);
	 		var d = row.cell;
	 		this.setelv('unm', d['unm']);
	 		this.setelv('eml', d['eml']);
	 		
	 		var ugp = Brick.util.Language.getData()['user']['group'];
	 		this.setelv('ugrplbl', ugp[d['ugp']]);
	 		
	 		this.el('ugrp'+d['ugp']).checked = true;
		},
		
		onClose: function(){
			DATA.onComplete.unsubscribe(this.dsComplete);
		},
		
		onClick: function(el){
			var tp = TId['editor']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bsave']: this.save(); return true;
			case tp['bugrpch']: 
				this.el('ugrpcont').style.display = 'none';
				this.el('ugrpcontch').style.display = '';
				return true;
			case tp['bpass']: 
				this.el('bpass').style.display = 'none';
				this.el('passcont').style.display = '';
				return true;
			}
		},
		save: function(){
			var pass = this.elv('pass'); 
			if (pass != this.elv('passconf')){
		 		alert(Brick.util.Language.getData()['user']['form']['error']['pass']['conf']);
				return;
			}
			
	 		var row = this.rows.getByIndex(0);
			for (var i=1;i<=6;i++){
				if (i!=2){
					if (this.el('ugrp'+i).checked){ row.update({'ugp': i+''}); break; }
				}
			}
			
	 		row.update({'eml': this.elv('eml')});
	 		if (pass.length > 0){
		 		row.update({'pass': pass});
	 		}
	 		
	 		if (!row.isUpdate()){ this.close(); return; }
	 		
			var table = DATA.get('user');
	 		table.applyChanges();
			var tableUserList = DATA.get('userlist');
	 		if (tableUserList){
	 			var rows = tableUserList.getLastUpdateRows();
	 			rows.clear();
	 		}
			DATA.request();
			this.close();
		}
	});
	
	NS.UserEditorPanel = UserEditorPanel;
})();
};
