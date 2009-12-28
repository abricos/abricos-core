/*
@version $Id$
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module User
 * @namespace Brick.mod.user
 */

var Component = new Brick.Component();
Component.requires = {
	mod:[
	     {name: 'sys', files: ['container.js','form.js']},
	     {name: 'user', files: ['api.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace,
		TMG = this.template,
		TM = TMG.build(),
		T = TM.data,
		TId = TM.idManager;
	
	var API = NS.API;
	
	/**
	 * Блок информативной строки пользователя
	 * 
	 * @class UserBlockWidget
	 * @constructor
	 * @param {String} elId (optional) Идентификатор HTML элемента контейнера
	 */
	NS.UserBlockWidget = function(elId){
		elId = elId || 'mod-user-userblock';
		var div = Dom.get(elId);
		if (L.isNull(div)){ return; }
		
		var usr = Brick.env.user;
		div.innerHTML = usr.isRegistred() ? TM.replace('user',{'name': usr.name}) : T['guest'];  
		
		var __self = this;
		E.on(div, 'click', function(e){
			if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
		});
	};
	NS.UserBlockWidget.prototype = {
		/**
		 * Обработчик события клика мыши 
		 * @param el
		 * @return Boolean
		 */
		onClick: function (el){
			switch(el.id){
			case TId['guest']['blogin']: 
				API.showLoginPanel(); 
				return true;
			case TId['guest']['breg']:
				API.showRegisterPanel();
				return true;
			case TId['user']['blogout']: 
				API.userLogout(); 
				return true;
			}
			return false;
		}
	};
		
	/**
	 * Панель авторизации пользователя.<br>
	 * Для авторизации использует метод <a href="Brick.mod.user.API.html#method_login">Brick.mod.user.API.login()</a>
	 * 
	 * @class LoginPanel
	 * @extends Brick.widget.Panel
	 * @constructor
	 * @param {Object} param (optional) Дополнительные параметры панели.
	 */
	var LoginPanel = function(param){
		this.param = L.merge({
			'username': '', 'password': '', 'url': ''
		}, param || {});
		LoginPanel.superclass.constructor.call(this, {
			modal: true, 
			resize: false,
			fixedcenter: true
		});
	};
	
	YAHOO.extend(LoginPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['loginpanel'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			return T['loginpanel'];
		},
		onLoad: function(){
			var __self = this;
			E.on(TId['loginpanel']['form'], 'submit', function(){ __self.send();});
			
			var p = this.param;
			this.setelv('username', p['username']);
			this.setelv('userpass', p['password']);
			if (p['error'] > 0){
				var lng = Brick.util.Language.getc('mod.user.loginpanel.error.srv');
				var err = this.el('error');
				err.style.display = "block";
				err.innerHTML = lng[p['error']];
			}
		},
		send: function(){
			API.userLogin(this.elv('username'), this.elv('userpass'));
			this.close();
		},
		onClick: function(el){
			var tp = TId['loginpanel']; 
			switch(el.id){
			case tp['blogin']:
				this.send();
				return true;
			case tp['bcancel']: this.close(); return true;
			case tp['breg']:
				Brick.Component.API.fire('user', 'guest', 'showRegisterPanel');
				return true;
			case tp['bpwd']:
				Brick.Component.API.fire('user', 'guest', 'showPwdRestPanel');
				return true;
			}
			return false;
		}
	});
	
	NS.LoginPanel = LoginPanel;
	
};
