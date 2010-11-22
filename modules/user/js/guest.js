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
	     {name: 'sys', files: ['container.js','form.js','wait.js']},
	     {name: 'user', files: ['api.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace,
		API = this.namespace.API;
 
	var TMG = this.template,
		TM = TMG.build(),
		T = TM.data,
		TId = TM.idManager;
	
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
			'username': '', 'password': '', 'url': '',
			'hideClose': false,
			'panelConfig': {}
		}, param || {});
		var config = L.merge({
			modal: true, resize: false, fixedcenter: true
			// ,width: '400px'
		}, this.param.panelConfig || {});
		LoginPanel.superclass.constructor.call(this, config);
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
			if (p.hideClose){
				this.el('bcancel').style.display = 'none';
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
				API.showRegisterPanel();
				return true;
			case tp['bpwd']:
				API.showPwdRestPanel();
				return true;
			}
			return false;
		}
	});
	
	NS.LoginPanel = LoginPanel;
	
	/**
	 * Панель регистрации пользователя
	 * 
	 * @class RegisterPanel
	 * @extends Brick.widget.Panel
	 * @constructor
	 * @param {Object} param (optional) 
	 */
	var RegisterPanel = function(param){
		this.param = L.merge({
			'username': '', 'email': '', 'error': '0'
		}, param || {});

		RegisterPanel.superclass.constructor.call(this, {
			modal: true, resize: false,
			fixedcenter: true
		});
	};
	YAHOO.extend(RegisterPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['register'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			return T['register'];
		},
		onLoad: function(){
			var p = this.param;
			this.setelv('username', p['username']);
			this.setelv('email', p['email']);
			if (p['error'] > 0){
				var lng = Brick.util.Language.getc('mod.user.register.error.srv');
				var err = this.el('error');
				err.style.display = "block";
				err.innerHTML = lng[p['error']];
			}
		},
		onClick: function(el){
			var tp = TId['register']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['breg']: this.send(); return true;
			}
			return false;
		},
		send: function(){
			var unm = this.el('username');
			var pass = this.el('pass');
			var passconf = this.el('passconf');
			var email = this.el('email');
			var emailconf = this.el('emailconf');

			var lng = Brick.util.Language.getc("mod.user.register.error.client"); 
			
			var validobj = {
				elements: {
					'username':{ obj: unm, rules: ["empty","username"], args:{"field": lng['username']}},
					'pass':{ obj: pass, rules: ["empty"], args:{"field": lng['pass']}},
					'passconf':{ obj: passconf, rules: ["empty"], args:{"field": lng['passc']}},
					'email':{ obj: email, rules: ["empty","email"], args:{"field": lng['email']}},
					'emailconf':{ obj: emailconf, rules: ["empty","email"], args:{"field": lng['emailc']}}
				}
			};
			
			var validator = new Brick.util.Form.Validator(validobj);
			var errors = validator.check();
			if (errors.length > 0){ return; }
			
			if (pass.value != passconf.value){ alert(lng['passconf']); return; }
			if (email.value != emailconf.value){ alert(lng['emailconf']); return; }
			
			var __self = this;
			var lw = new Brick.widget.LayWait(TM.getEl('register.breg').parentNode, true);
			Brick.ajax('user', {
				'data': {
					'do': 'register',
					'username': unm.value,
					'password': pass.value,
					'email': email.value
				},
				'event': function(r){
					lw.hide();
					__self._setResult(r.data);

				}
			});
		},
		_setResult: function(error){
			if (error > 0){
				var lng = Brick.util.Language.getc('mod.user.register.error.srv');
				alert(lng[error]);
				return;
			}
			var email = this.el('email').value;
			setTimeout(function(){
				new RegisterSendEmailPanel({'email': email});
    		}, 300);
			this.close();
		}
	});
	NS.RegisterPanel = RegisterPanel;
	
	/**
	 * Отобразить панель "Регистрация пользователя".
	 * 
 	 * @class API
	 * @method showRegisterPanel
	 * @static
	 */
	API.showRegisterPanel = function(param){
		return new NS.RegisterPanel(param);
	};
	
	/**
	 * Панель "Регистрация - отправлен email для подверждения"
	 * 
	 * @class RegisterSendEmailPanel
	 * @extends Brick.widget.Panel
	 * @constructor
	 * @param {Object} param 
	 */
	var RegisterSendEmailPanel = function(param){
		this.param = L.merge({
			'username': '', 'email': ''
		}, param || {});

		RegisterSendEmailPanel.superclass.constructor.call(this, {
			modal: true, resize: false,
			fixedcenter: true
		});
	};
	YAHOO.extend(RegisterSendEmailPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['regokpanel'][name]); },
		initTemplate: function(){
			return T['regokpanel'];
		},
		onLoad: function(){
			this.el('email').innerHTML = this.param['email'];
		},
		onClick: function(el){
			if (el.id == TId['regokpanel']['bclose']){
				this.close(); return true;
			}
			return false;
		}
	});
	
	NS.RegisterSendEmailPanel = RegisterSendEmailPanel;

	/**
	 * Панель "Восстановление пароля"
	 * 
	 * @class PwdRestPanel
	 * @extends Brick.widget.Panel
	 */
	var PwdRestPanel = function (){
		PwdRestPanel.superclass.constructor.call(this, {
			modal: true, resize: false,
			fixedcenter: true
		});
	};
	YAHOO.extend(PwdRestPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['password'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		initTemplate: function(){
			return T['password'];
		},
		onClick: function(el){
			switch(el.id){
			case TId['password']['bsend']: this.send(); return true;
			case TId['password']['bcancel']: this.close(); return true;
			}
			return false;
		},
		send: function(){
			API.userPasswordRestore(this.elv('email'));
			this.close();
		}
	});
	NS.PwdRestPanel = PwdRestPanel;
	
	/**
	 * Панель "Восстановление пароля - отправлено письмо на изменение пароля"
	 * 
	 * @class PwdRestSendEmailPanel
	 * @extends Brick.widget.Panel
	 * @constructor
	 * @param {Object} param 
	 */
	var PwdRestSendEmailPanel = function (param){
		this.param = param;
		PwdRestSendEmailPanel.superclass.constructor.call(this, {
			modal: true, resize: false,
			fixedcenter: true
		});
	};
	YAHOO.extend(PwdRestSendEmailPanel, Brick.widget.Panel, {
		initTemplate: function(){
			return TM.replace('pwdokpanel', {
				'email': this.param['email']
			}); 
		},
		onClick: function(el){
			switch(el.id){
			case TId['pwdokpanel']['bclose']: this.close(); return true;
			}
			return false;
		}
	});
	NS.PwdRestSendEmailPanel = PwdRestSendEmailPanel;
	
};