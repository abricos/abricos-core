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
		API = this.namespace.API;
 
	var TMG = this.template,
		TM = TMG.build(),
		T = TM.data,
		TId = TM.idManager;
	
	var tSetVar = Brick.util.Template.setProperty;
	
	/**
	 * Элемент блока пользователя
	 * 
	 * @class GuestBlockWidget
	 * @constructor
	 * @param {String} elId (optional) Идентификатор HTML элемента контейнера
	 */
	NS.GuestBlockWidget = function(elId){
		elId = elId || 'mod-user-userblock';
		var div = Dom.get(elId);
		if (L.isNull(div)){ return; }
		
		var usr = Brick.env.user, t=""; 
		
		if (usr.isRegistred()){
			t = T['user'];
			t = tSetVar(t, 'name', usr.name);
			div.innerHTML = t;
		}else{
			div.innerHTML = T['guest'];
		}
		var __self = this;
		E.on(div, 'click', function(e){
			if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
		});
	};
	
	NS.GuestBlockWidget.prototype = {
		/**
		 * Обработчик события клика мыши 
		 * @param el
		 * @return
		 */
		onClick: function (el){
			switch(el.id){
			case TId['guest']['blogin']: 
				API.showLoginPanel(); 
				return true;
			case TId['guest']['breg']:
				Brick.Component.API.fire('user', 'guest', 'showRegisterPanel');
				return true;
			case TId['user']['blogout']: 
				API.logout(); 
				return true;
			}
			return false;
		}
	};
	
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
			
			API.userRegister(unm.value, pass.value, email.value);
			this.close();
		}
	});
	
	NS.RegisterPanel = RegisterPanel;
	
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
	 * Панель "Активация зарегистрированного пользователя"
	 * 
	 * @class RegActivatePanel
	 * @extends Brick.widget.Panel
	 * @constructor
	 * @param {Object} param 
	 */
	var RegActivatePanel = function(param){
		this.param = L.merge({
			'username': '', 'error': '0'
		}, param || {});
		
		this._showLogin = false;

		RegActivatePanel.superclass.constructor.call(this, {
			modal: true, resize: false,
			fixedcenter: true
		});
	};
	YAHOO.extend(RegActivatePanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['activate'][name]); },
		initTemplate: function(){
			var t = T['activate'];
			var body = "";
			var p = this.param;
			if (p['error']>0){
				var lng = Brick.util.Language.getc('mod.user.activate.error');
				body = tSetVar(T['activerror'], 'err', lng[p['error']]);
			}else{
				body = tSetVar(T['activok'], 'unm', p['username']);
			}
			return tSetVar(t, 'body', body);
		},
		onClose: function(){
			if (this._showLogin){
				API.showLoginPanel();
			}
		},
		onClick: function(el){
			switch(el.id){
			case TId['activerror']['bclose']:
				this._showLogin = this.param['error'] == 2;
				this.close(); 
				return true;
			case TId['activok']['blogin']:
				this._showLogin = true;
				this.close(); 
				return true;
			case TId['activok']['bclose']:
				this.close(); 
				return true;
			}
			return false;
		}
	});
	
	NS.RegActivatePanel = RegActivatePanel;

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
			var t = T['pwdokpanel'];
			return tSetVar(t, 'email', this.param['email']);
		},
		onClick: function(el){
			switch(el.id){
			case TId['pwdokpanel']['bcancel']: this.close(); return true;
			}
			return false;
		}
	});
	NS.PwdRestSendEmailPanel = PwdRestSendEmailPanel;
	
	
	/**
	 * Панель "Восстановление пароля - новый пароль отправлен на email"
	 * 
	 * @class PwdRestChangeOkPanel
	 * @extends Brick.widget.Panel
	 */
	var PwdRestChangeOkPanel =  function (){
		PwdRestChangeOkPanel.superclass.constructor.call(this, {
			modal: true, resize: false,
			fixedcenter: true
		});
	};
	YAHOO.extend(PwdRestChangeOkPanel, Brick.widget.Panel, {
		initTemplate: function(){
			return T['pwdchangeok'];
		},
		onClick: function(el){
			switch(el.id){
			case TId['pwdchangeok']['bclose']: this.close(); return true;
			case TId['pwdchangeok']['blogin']:
				NS.API.showLoginPanel();
				this.close(); 
				return true;
			}
			return false;
		}
	});
	NS.PwdRestChangeOkPanel = PwdRestChangeOkPanel;
	
	/**
	 * Панель "Восстановление пароля - ошибка"
	 * 
	 * @class PwdRestChangeErrorPanel
	 * @extends Brick.widget.Panel
	 */
	var PwdRestChangeErrorPanel =  function (){
		PwdRestChangeErrorPanel.superclass.constructor.call(this, {
			modal: true, resize: false,
			fixedcenter: true
		});
	};
	YAHOO.extend(PwdRestChangeErrorPanel, Brick.widget.Panel, {
		initTemplate: function(){
			return T['pwdchangeerror'];
		},
		onClick: function(el){
			switch(el.id){
			case TId['pwdchangeerror']['bclose']: this.close(); return true;
			case TId['pwdchangeerror']['bpwd']:
				NS.API.showPwdRestPanel();
				this.close(); 
				return true;
			}
			return false;
		}
	});
	NS.PwdRestChangeErrorPanel = PwdRestChangeErrorPanel;

};