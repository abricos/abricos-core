/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	
	Brick.namespace('mod.user.my');

	var Dom, E,	L, C, T, J, TId;
	var DATA;

	var dateExt = Brick.dateExt;
	var elClear = Brick.elClear;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
		yahoo: ['json','tabview'],
		mod:[
		     {name: 'sys', files: ['form.js','data.js']}
		    ],
    onSuccess: function() {
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;
			C = YAHOO.util.Connect;
			J = YAHOO.lang.JSON;
			
			T = Brick.util.Template['user']['cp_man_profile'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			
			Brick.util.CSS.update(T['css']);
			
			if (!Brick.objectExists('Brick.mod.user.data')){
				Brick.mod.user.data = new Brick.util.data.byid.DataSet('user');
			}
			DATA = Brick.mod.user.data;
	  }
	});
	
/* * * * * * * * * * * * Profile * * * * * * * * * * */
(function(){
	var AbstractProfile = function(userid){
		this.init(userid);
	};
	AbstractProfile.prototype = {
		constructor: AbstractProfile,
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
			DATA.request();
		}
	};
	
	var Login = function(container, userid){
		container.innerHTML = T['login'];
		Login.superclass.constructor.call(this, userid);
	};
	YAHOO.extend(Login, AbstractProfile, {
		onClick: function(el){
			if (el.id == TId['login']['bsave']){ this.save(); return true; }
		},
		el: function(name){ return Dom.get(TId['login'][name]); },
		save: function(){ alert('save'); },
		onRender: function(){
			var di = this.row.cell;
			this.setelv('unm', di['unm']);
			this.setelv('eml', di['eml']);
		}
	});

	var Contact = function(container, userid){
		container.innerHTML = T['contact'];
		Contact.superclass.constructor.call(this, userid);
	};
	YAHOO.extend(Contact, AbstractProfile, {
		onClick: function(el){
			if (el.id == TId['contact']['bsave']){ this.save(); return true; }
		},
		el: function(name){ return Dom.get(TId['contact'][name]); },
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
				'skype': this.elv('skype'),
			});
			this.saverow();
		}
	});
	
	var Person = function(container, userid){
		var lst = "", tt;
		var cd = new Date();
		var begin = cd.getFullYear()-10;
		for (var i=begin;i>=1901;i--){
			tt = tSetVar(T['optionrow'], 'v', i);
			tt = tSetVar(tt, 't', i);
			lst += tt;
		}
		var t = tSetVar(T['person'], 'lst', lst);
		lst = "";
		for (var i=1;i<=31;i++){
			tt = tSetVar(T['optionrow'], 'v', i);
			tt = tSetVar(tt, 't', i);
			lst += tt;
		}
		
		container.innerHTML = tSetVar(t, 'lstday', lst);
		Person.superclass.constructor.call(this, userid);
	};
	YAHOO.extend(Person, AbstractProfile, {
		onClick: function(el){
			if (el.id == TId['person']['bsave']){ this.save(); return true; }
		},
		el: function(name){ return Dom.get(TId['person'][name]); },
		onRender: function(){
			var di = this.row.cell;
			this.setelv('rnm', di['rnm']);
			this.setelv('sex', di['sex']);
			if (di['bday'] > 0){
				var arr = dateExt.unixToArray(di['bday']);
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
	
	Brick.mod.user.my.cp = function(){
		return {
			initialize: function(container){
				container.innerHTML = T['panel'];
				
				var tabView = new YAHOO.widget.TabView(TId['_global']['panel']);
				var userid = Brick.env.user.id;
				
				this.login = new Login(Dom.get(TId['panel']['login']), userid);
				this.contact = new Contact(Dom.get(TId['panel']['contact']), userid);
				this.person = new Person(Dom.get(TId['panel']['person']), userid);
				
				var __self = this;
				E.on(container, 'click', function(e){
					if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
				});

				DATA.request();
			},
			onClick: function(el){
				if (this.login.onClick(el)){return true;}
				if (this.contact.onClick(el)){return true;}
				if (this.person.onClick(el)){return true;}
				return false;
			}
		}
	}();
	
})();
})();