/*
* @version $Id$
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module User
 * @namespace Brick.mod.user
 */

var Component = new Brick.Component();
Component.requires = {
	yahoo: ['tabview'],
	mod:[
	     {name: 'sys', files: ['form.js','data.js','container.js']},
	     {name: 'user', files: ['api']}
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

(function(){
	
	var MyProfileAbstract = function(userid){
		this.init(userid);
	};
	MyProfileAbstract.prototype = {
		constructor: MyProfileAbstract,
		init: function(userid){
			this.userid = userid;

			var tables = {
				'user': DATA.get('user', true)
			};
			this.tables = tables;
			this.param = { 'id': userid };
			this.rows = tables['user'].getRows(this.param);
			
			DATA.onComplete.subscribe(this.onDSComplete, this, true);
			if (DATA.isFill(tables)){ this.render(); }
		},
		onDSComplete: function(type, args){if (args[0].checkWithParam('user', this.param)){ this.render(); }}, 
		destroy: function(){DATA.unsubscribe(this.onDSComplete);},
		render: function(){
			this.row = this.rows.getById(this.userid);
			this.onRender();
		},
		onRender: function(){},
		onClick: function(el){ return false; },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		saverow: function(){
			this.tables['user'].applyChanges();
			DATA.request(false);
		}
	};
	
	var MyLoginWidget = function(container, userid){
		
		var TM = TMG.build('login'),
			T = TM.data,
			TId = TM.idManager;
		this._T = T; this._TId = TId; this._TM = TM;

		container.innerHTML = T['login'];
		MyLoginWidget.superclass.constructor.call(this, userid);
	};
	YAHOO.extend(MyLoginWidget, MyProfileAbstract, {
		onClick: function(el){
			if (el.id == this._TId['login']['bsave']){ this.save(); return true; }
		},
		el: function(name){ return Dom.get(this._TId['login'][name]); },
		save: function(){
			
			var pass = this.elv('passnew');
			var passret = this.elv('passnewret');
			
			if (pass != passret){
				alert(Brick.util.Language.getc('user.form.error.pass.conf'));
				return;
			}
			
			this.row.update({
				'pass': pass,
				'oldpass': this.elv('passold')
			});
			this.saverow();
		},
		onRender: function(){
			var di = this.row.cell;
			this.setelv('unm', di['unm']);
			this.setelv('eml', di['eml']);
			
			this.setelv('passold', '');
			this.setelv('passnew', '');
			this.setelv('passnewret', '');
		}
	});

	var MyContactWidget = function(container, userid){
		var TM = TMG.build('contact'),
			T = TM.data,
			TId = TM.idManager;
		this._T = T; this._TId = TId; this._TM = TM;

		container.innerHTML = T['contact'];
		MyContactWidget.superclass.constructor.call(this, userid);
	};
	YAHOO.extend(MyContactWidget, MyProfileAbstract, {
		onClick: function(el){
			if (el.id == this._TId['contact']['bsave']){ this.save(); return true; }
		},
		el: function(name){ return Dom.get(this._TId['contact'][name]); },
		onRender: function(){
			var di = this.row.cell;
			this.setelv('hpnm', di['hpnm']);
			this.setelv('hp', di['hp']);
			this.setelv('icq', di['icq']);
			this.setelv('skype', di['skype']);
		},
		save: function(){
			this.row.update({
				'hpnm': this.elv('hpnm'),
				'hp': this.elv('hp'),
				'icq': this.elv('icq'),
				'skype': this.elv('skype')
			});
			this.saverow();
		}
	});
	
	var MyPersonWidget = function(container, userid){
		
		var TM = TMG.build('person,optionrow'),
			T = TM.data,
			TId = TM.idManager;
		this._T = T; this._TId = TId; this._TM = TM;

		
		var lst = "", tt;
		var cd = new Date();
		var begin = cd.getFullYear()-10;
		for (var i=begin;i>=1901;i--){
			lst += TM.replace('optionrow', {
				'v': i, 't': i
			});
		}
		var lstDay = "";
		for (var i=1;i<=31;i++){
			lstDay += TM.replace('optionrow', {'v': i, 't': i});
		}

		container.innerHTML = TM.replace('person',{
			'lst': lst,
			'lstday': lstDay
		});
		MyPersonWidget.superclass.constructor.call(this, userid);
	};
	YAHOO.extend(MyPersonWidget, MyProfileAbstract, {
		onClick: function(el){
			if (el.id == this._TId['person']['bsave']){ this.save(); return true; }
		},
		el: function(name){ return Dom.get(this._TId['person'][name]); },
		onRender: function(){
			var di = this.row.cell;
			this.setelv('rnm', di['rnm']);
			this.setelv('sex', di['sex']);
			if (di['bday'] > 0){
				var arr = Brick.dateExt.unixToArray(di['bday']);
				this.setelv('bd_day', arr['day']);
				this.setelv('bd_month', arr['month']);
				this.setelv('bd_year', arr['year']);
			}
		},
		save: function(){
			var day = this.elv('bd_day');
			var month = this.elv('bd_month');
			var year = this.elv('bd_year');
			var bdate = 0;
			if (day>0&&month>0&&year>0){
				bdate = (new Date(year, month, day))/1000;
			}
			this.row.update({
				'rnm': this.elv('rnm'),
				'sex': this.elv('sex'),
				'bday': bdate
			});
			this.saverow();
		}
	});
	
	var MyProfileWidget = function(container){
		this.init(container);
	};
	
	MyProfileWidget.prototype = {
		pages: {},
		init: function(container){
			
			var TM = TMG.build('panel'),
				T = TM.data,
				TId = TM.idManager;
			
			container.innerHTML = T['panel'];
			
			var tabView = new YAHOO.widget.TabView(TId['panel']['id']);
			var userid = Brick.env.user.id;
			
			var tp = TId['panel'];
			
			var pages = {};
			pages['login'] = new MyLoginWidget(Dom.get(tp['login']), userid);
			pages['contact'] = new MyContactWidget(Dom.get(tp['contact']), userid); 
			pages['person'] = new MyPersonWidget(Dom.get(tp['person']), userid);
			this.pages = pages;
			
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
		},
		onClick: function(el){
			for (var n in this.pages){
				if (this.pages[n].onClick(el)){ return true;}
			}
			return false;
		}
	};
	
	NS.MyProfileWidget = MyProfileWidget;
})();	
};
