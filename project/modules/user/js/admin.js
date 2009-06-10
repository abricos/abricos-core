/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('mod.user.admin');
	
	var Bmua = Brick.mod.user.admin;
	
	var T, TId, DATA,
		Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var dateExt = Brick.dateExt;
	var elClear = Brick.elClear;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;
	
	Brick.Loader.add({
    yahoo: ["paginator"],
		mod:[
		     {name: 'sys', files: ['data.js', 'form.js', 'container.js']},
		     {name: 'user', files: ['language.js']}
		    ],
    onSuccess: function() {
		
			if (!Brick.objectExists('Brick.mod.user.data')){
				Brick.mod.user.data = new Brick.util.data.byid.DataSet('user');
			}
			DATA = Brick.mod.user.data;
			
			T = Brick.util.Template['user']['admin'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			
			moduleInitialize();
			delete moduleInitialize;
	  }
	});

(function(){
	
	Bmua.cp = function(){
		return {
			initialize: function(container){
				container.innerHTML = T['panel'];
				
				var __self = this;
				E.on(container, 'click', function(e){
					if (__self.clickEvent(E.getTarget(e))){ E.stopEvent(e); }
				});
				
				this.userlist = new Userlist();
				
				DATA.request();
			},
			clickEvent: function(el){
				if (this.userlist.onClick(el)){ return true; }
				// if (el.id == TId['panel']['refresh']){ this.userlist.refresh(); return true; }
				return false;
			}
		}
	}();

	var PAGEROWLIMIT = 15;

	var Userlist = function(){ this.init(); };
	Userlist.prototype = {
		init: function(){
			this.savedCountUser = -1;
			var __self = this;
	
			this.pagtop = new YAHOO.widget.Paginator({containers : TId['panel']['pagtop'], rowsPerPage: PAGEROWLIMIT});
			this.pagbot = new YAHOO.widget.Paginator({containers : TId['panel']['pagbot'], rowsPerPage: PAGEROWLIMIT});
			
			var hdlPagination = function (state) { __self.refreshPage(state.page, true) };
			this.pagtop.subscribe('changeRequest', hdlPagination);
			this.pagbot.subscribe('changeRequest', hdlPagination);
	
			this.tables = { 
				'userlist': DATA.get('userlist', true),
				'usercount': DATA.get('usercount', true)
			};
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			this.refreshPage(1, false);
		},
		onDSUpdate: function(type, args){
			var __self = this;
			var checkParam = this.send;
			if (args[0].checkWithParam('userlist', checkParam)){ __self.render(checkParam); }
		},
		destroy: function(){ DATA.onComplete.unsubscribe(this.onDSUpdate, this); },
		refreshPage: function(page, request){
			this.send = {page: page, limit: PAGEROWLIMIT}
			this.rows = this.tables['userlist'].getRows(this.send)
			if (DATA.isFill(this.tables)){
				this.render(this.send);
			}else if (request){
				Brick.mod.user.data.request(); 
			}
		},
		getrow: function(userid){ return DATA.get('userlist').getRows(this.send).getById(userid); },
		render: function(param){
			var tableuser = DATA.get('userlist');
			var rows = tableuser.getRows(param);
			var page = param['page']*1; 
			var total = DATA.get('usercount').getRows().getByIndex(0).cell['cnt']*1;
			
			if (this.savedCountUser < 0){
				this.savedCountUser = total;
			}else if (this.savedCountUser != total){
				tableuser.removeNonParam(param);
			}
			this.savedCountUser = total;
			
			this.pagtop.setState({ page: page, totalRecords: total});
			this.pagtop.render();

			this.pagbot.setState({ page: page, totalRecords: total});
			this.pagbot.render();

			var ugp = Brick.util.Language.getData()['user']['group'];

			var lst="";
			rows.foreach(function(row){
				var di=row.cell;
				var t = T['row'];
				t = tSetVar(t, 'unm', di['unm']);
				t = tSetVar(t, 'eml', di['eml']);
				t = tSetVar(t, 'dl', dateExt.convert(di['dl']));
				t = tSetVar(t, 'vst', dateExt.convert(di['vst']));
				t = tSetVar(t, 'ugp', ugp[di['ugp']]);
				t = tSetVar(t, 'id', di['id']);
				lst += t;
			});
			var div = Dom.get(TId['panel']['table']);
			elClear(div);
			div.innerHTML = tSetVar(T['table'], 'rows', lst); 
		},
		onClick: function(el){
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['row']['edit']+'-'):
				Brick.mod.user.admin.api.edit(numid);
				return true;
			}
			return false;
		},
		refresh: function(){this.refreshPage(this.currentPage);}
	};
	
})();

var moduleInitialize = function(){

(function(){
	
	var Editor = function(rows){
		this.rows = rows;
		Editor.superclass.constructor.call(this, T['editor']);
	};
	YAHOO.extend(Editor, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['editor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		onLoad: function(){
			
	 		var row = this.rows.getByIndex(0);
	 		var d = row.cell;
	 		this.setelv('unm', d['unm']);
	 		this.setelv('eml', d['eml'])
	 		
	 		var ugp = Brick.util.Language.getData()['user']['group'];
	 		this.setelv('ugrplbl', ugp[d['ugp']]);
	 		
	 		this.el('ugrp'+d['ugp']).checked = true;

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
	
	Brick.mod.user.admin.Editor = Editor;

})();
};
})();