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
	
	var buildTemplate = this.buildTemplate;
	var LNG = this.language;
 
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
			resize: false, fixedcenter: true
		}, this.param.panelConfig || {});
		LoginPanel.superclass.constructor.call(this, config);
	};
	YAHOO.extend(LoginPanel, Brick.widget.Dialog, {
		el: function(name){ return Dom.get(this._TId['loginpanel'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			return buildTemplate('loginpanel').replace('loginpanel');
		},
		onLoad: function(){
			var __self = this;
			var TM = this._TM,
				gel = function(n){ return  TM.getEl('loginpanel.'+n); };

			E.on(gel('form'), 'submit', function(){ __self.send();});
			
			var p = this.param;
			gel('username').value = p['username'];
			gel('userpass').value = p['password'];
			
			if (p['error'] > 0){
				var lng = Brick.util.Language.getc('mod.user.guest.loginpanel.error.srv');
				var err = gel('error');
				Dom.setStyle(err, 'display', '');
				err.innerHTML = lng[p['error']];
			}
			if (p.hideClose){
				Dom.setStyle(gel('bcancel'), 'display', 'none');
			}
		},
		send: function(){
			API.userLogin(this.elv('username'), this.elv('userpass'));
			this.close();
		},
		onClick: function(el){
			var tp = this._TId['loginpanel']; 
			switch(el.id){
			case tp['blogin']: this.send(); return true;
			case tp['bcancel']: this.close(); return true;
			case tp['breg']: API.showRegisterPanel(); return true;
			case tp['bpwd']: API.showPwdRestPanel(); return true;
			}
			return false;
		}
	});
	
	NS.LoginPanel = LoginPanel;
	
	var EasyAuthRegWidget = function(container, config){
		config = L.merge({
			'onAuthCallback': null
		}, config || {});
		this.init(container, config);
	};
	EasyAuthRegWidget .prototype = {
		init: function(container, cfg){
			this.cfg = cfg;
			
			var TM = buildTemplate(this, 'authregwidget'), __self = this;
			container.innerHTML = TM.replace('authregwidget');
			
			this.authWidget = new NS.AuthWidget(TM.getEl('authregwidget.authwidget'), {
				'onClickRegCallback': function(){
					__self.showRegister();
				},
				'onAuthCallback': function(userid){
					__self.onAuth(userid);
				}
			});
			
			this.regWidget = null;
			
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
		},
		onClick: function(el){
			return false;
		},
		onAuth: function(userid){
			var cfg = this.cfg;
			if (L.isFunction(cfg['onAuthCallback'])){
				cfg['onAuthCallback'](userid);
			}
		},
		showAuth: function(){
			var TM = this._TM, gel = function(n){ return TM.getEl('authregwidget.'+n);};
			Dom.setStyle(gel('auth'), 'display', '');
			Dom.setStyle(gel('reg'), 'display', 'none');
		},
		showRegister: function(){
			var __self = this;
			var TM = this._TM, gel = function(n){ return TM.getEl('authregwidget.'+n);};
			Dom.setStyle(gel('auth'), 'display', 'none');
			Dom.setStyle(gel('reg'), 'display', '');
			
			this.regWidget = new RegisterWidget(gel('regwidget'), {
				'onRegOkCallback': function(d){
					__self.auth(d['username'], d['password']);
				},
				'onRegCancelCallback': function(){
					__self.showAuth();
				}
			});
		},
		auth: function(uname, upass){
			this.showAuth();
			this.authWidget.setValue(uname, upass);
			this.authWidget.auth();
		}
	};
	NS.EasyAuthRegWidget = EasyAuthRegWidget;
	
	var AuthWidget = function(container, config){
		config = L.merge({
			'onAuthCallback': null,
			'onClickRegCallback': null,
			'onClickPwdCallback': null
		}, config || {});
		this.init(container, config);
	};
	AuthWidget.prototype = {
		init: function(container, config){
			this.cfg = config;
			
			var TM = buildTemplate(this, 'authwidget'), __self = this;
			container.innerHTML = TM.replace('authwidget');
			
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
		},
		destroy: function(){
			var el = this._TM.getEl('authwidget.id');
			el.parentNode.removeChild(el);
		},
		onClick: function(el){
			this.clearError();
			var tp = this._TId['authwidget'];
			switch(el.id){
			case tp['breg']: this.showRegister(); return true;
			case tp['bauth']: this.auth(); return true;
			case tp['bpwd']: this.showRestPass(); return true;

			}
			return false;
		},
		showRegister: function(){
			var cfg = this.cfg;
			
			if (L.isFunction(cfg['onClickRegCallback'])){
				cfg['onClickRegCallback']();
			}else{
				return new RegisterPanel();
			}
		},
		
		showRestPass: function(){
			API.showPwdRestPanel();
		},
		clearError: function(){
			Dom.setStyle(this._TM.getEl('authwidget.error'), 'display', 'none');
			Dom.setStyle(this._TM.getEl('authwidget.erroract'), 'display', 'none');
		},
		showError: function(err){
			var TM = this._TM, gel = function(n){ return TM.getEl('authwidget.'+n);};
			Dom.setStyle(gel('error'), 'display', '');
			gel('error').innerHTML =  
				Brick.util.Language.getc('mod.user.guest.loginpanel.error.srv.'+err);
		},
		getAuthData: function(){
			var TM = this._TM, gel = function(n){ return TM.getEl('authwidget.'+n);},
				fill = function(v){ return L.isString(v) && v.length>0; };
				
			var sd = {
				'username': L.trim(gel('username').value),
				'password': L.trim(gel('password').value)
			};

			if (!fill(sd['username']) || !fill(sd['password'])){
				this.showError('empty'); return null;
			}
			
			return sd;
		},
		setValue: function(uname, upass, autologin){
			var TM = this._TM, gel = function(n){ return TM.getEl('authwidget.'+n);};
			
			gel('username').value = L.trim(uname);
			gel('password').value = L.trim(upass);
		},
		auth: function(){
			var sd = this.getAuthData();
			if (L.isNull(sd)){ return null; }
			
			var TM = this._TM, gel = function(n){ return TM.getEl('authwidget.'+n);};
			var __self = this, cfg = this.cfg;
			
			Dom.setStyle(gel('bauth'), 'display', 'none');
			Dom.setStyle(gel('saved'), 'display', '');

			sd['do'] = 'auth';
			this._savedata = sd;
			
			API.userLogin(sd['username'], sd['password'], 0, function(err, userid){
				
				Dom.setStyle(gel('bauth'), 'display', '');
				Dom.setStyle(gel('saved'), 'display', 'none');
				
				if (err > 0){
					__self.showError(err);
				}else{
					if (L.isFunction(cfg['onAuthCallback'])){
						cfg['onAuthCallback'](userid);
					}else{
						Brick.Page.reload();
					}
				}
			});
		}
	};
	NS.AuthWidget = AuthWidget;
	
	var RegisterWidget = function(container, config){
		config = L.merge({ 
			'onRegOkCallback': null,
			'onRegCancelCallback': null
		}, config || {});
		this.init(container, config);
	};
	RegisterWidget.prototype = {
		init: function(container, cfg){
			this.cfg = cfg;
			
			var TM = buildTemplate(this, 'regwidget'), __self = this;
			container.innerHTML = TM.replace('regwidget');
			
			if (L.isFunction(cfg['onRegCancelCallback'])){
				Dom.setStyle(TM.getEl('regwidget.bregcancel'), 'display', '');
			}
			
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
		},
		destroy: function(){
			var el = this._TM.getEl('regwidget.id');
			el.parentNode.removeChild(el);
		},
		onClick: function(el){
			this.clearError();
			var TId = this._TId, tp = TId['regwidget'];
			switch(el.id){
			case tp['breg']: this.register(); return true;
			case tp['bact']: this.activate(); return true;
			case tp['termsofuse']: this.showTermsOfUsePanel(); return true;
			case tp['bregcancel']: this.regCancel(); return true;
			}
			return false;
		},
		regCancel: function(){
			var cfg = this.cfg;
			if (L.isFunction(cfg['onRegCancelCallback'])){
				cfg['onRegCancelCallback']();
			}
		},
		showTermsOfUsePanel: function(){
			new NS.TermsOfUsePanel();
		},
		clearError: function(){
			Dom.setStyle(this._TM.getEl('regwidget.error'), 'display', 'none');
			Dom.setStyle(this._TM.getEl('regwidget.erroract'), 'display', 'none');
		},
		showError: function(err){
			var TM = this._TM, gel = function(n){ return TM.getEl('regwidget.'+n);};
			Dom.setStyle(gel('error'), 'display', '');
			gel('error').innerHTML =  
				gel('erroract').innerHTML = Brick.util.Language.getc('mod.user.register.error.'+err)
		},
		getRegData: function(){
			var TM = this._TM, gel = function(n){ return TM.getEl('regwidget.'+n);},
				fill = function(v){ return L.isString(v) && v.length>0; };
				
			var sd = {
				'username': L.trim(gel('username').value),
				'email': L.trim(gel('email').value),
				'password': L.trim(gel('password').value),
				'agr': gel('agreement').checked
			};

			if (!fill(sd['username']) ||
				!fill(sd['password']) ||
				!fill(sd['email'])
				){
				this.showError('empty'); return null;
			}
			
			if (sd['password'] != L.trim(gel('passwordconf').value)){ this.showError('passconf'); return null; }
			if (!sd['agr']){ this.showError('agreement'); return null; }
			
			gel('actemail').innerHTML = sd['email'];
			
			return sd;
		},
		register: function(){
			var sd = this.getRegData();
			if (L.isNull(sd)){ return null; }
			
			var TM = this._TM, gel = function(n){ return TM.getEl('regwidget.'+n);};
			var __self = this;
			
			Dom.setStyle(gel('breg'), 'display', 'none');
			Dom.setStyle(gel('saved'), 'display', '');

			sd['do'] = 'register';
			this._savedata = sd;
			Brick.ajax('user', {
				'data': sd,
				'event': function(r){
					Dom.setStyle(gel('breg'), 'display', '');
					Dom.setStyle(gel('saved'), 'display', 'none');
					
					var err = !L.isNull(r) ? r.data*1 : 100;
					
					if (err > 0){
						__self.showError('s'+err);
					}else{
						__self.showActivate();
					}
				}
			});
		},
		showActivate: function(){
			var TM = this._TM, gel = function(n){ return TM.getEl('regwidget.'+n);};
			
			Dom.setStyle(gel('regform'), 'display', 'none');
			Dom.setStyle(gel('actform'), 'display', '');
		},
		getActData: function(){
			var TM = this._TM, gel = function(n){ return TM.getEl('regwidget.'+n);},
				fill = function(v){ return L.isString(v) && v.length>0; };
				
			var sd = {
				'userid': 0,
				'actcode': L.trim(gel('actcode').value)
			};
			if (!fill(sd['actcode'])){
				this.showError('empty'); return null;
			}
			return sd;
		},
		activate: function(){
			var sd = this.getActData();
			if (L.isNull(sd)){ return null; }
			
			var TM = this._TM, gel = function(n){ return TM.getEl('regwidget.'+n);};
			var __self = this;
			
			Dom.setStyle(gel('bact'), 'display', 'none');
			Dom.setStyle(gel('savedact'), 'display', '');

			sd['do'] = 'useremailconfirm';
			Brick.ajax('user', {
				'data': sd,
				'event': function(r){
					Dom.setStyle(gel('bact'), 'display', '');
					Dom.setStyle(gel('savedact'), 'display', 'none');
					
					var err = !L.isNull(r) ? r.data.error*1 : 100;
					if (err > 0){
						__self.showError('a1');
					}else{
						__self.showRegOK();
					}
				}
			});
		},
		showRegOK: function(){
			var cfg = this.cfg;
			var sd = this._savedata;
			
			if (L.isFunction(cfg['onRegOkCallback'])){
				cfg['onRegOkCallback'](sd);
				return;
			}
			
			var TM = this._TM, gel = function(n){ return TM.getEl('regwidget.'+n);};
			
			Dom.setStyle(gel('actform'), 'display', 'none');
			Dom.setStyle(gel('regok'), 'display', '');
			
			API.userLogin(sd['username'], sd['password'], 0, function(error){
				Brick.Page.reload();
			});
		}
	};
	NS.RegisterWidget = RegisterWidget;	
	
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
			resize: false,
			fixedcenter: true
		});
	};
	YAHOO.extend(RegisterPanel, Brick.widget.Dialog, {
		initTemplate: function(){
			return buildTemplate(this, 'regpanel').replace('regpanel');
		},
		onLoad: function(){
			this.regWidget = new NS.RegisterWidget(this._TM.getEl('regpanel.widget'), this.param);
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
	API.showRegisterPanel = function(cfg){
		return new NS.RegisterPanel(cfg);
	};

	/**
	 * Панель "Восстановление пароля"
	 * 
	 * @class PwdRestPanel
	 * @extends Brick.widget.Panel
	 */
	var PwdRestPanel = function (){
		PwdRestPanel.superclass.constructor.call(this, {
			resize: false,
			fixedcenter: true
		});
	};
	YAHOO.extend(PwdRestPanel, Brick.widget.Dialog, {
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
			resize: false,
			fixedcenter: true
		});
	};
	YAHOO.extend(PwdRestSendEmailPanel, Brick.widget.Dialog, {
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
	
	var TermsOfUsePanel = function(callback, userid){
		this.callback = callback;
		this.userid = userid;
		TermsOfUsePanel.superclass.constructor.call(this, {});
	};
	YAHOO.extend(TermsOfUsePanel, Brick.widget.Dialog, {
		initTemplate: function(){
			return buildTemplate(this, 'termsofuse').replace('termsofuse'); 
		},
		onLoad: function(el){
			
			var TM = this._TM; 
			Brick.ajax('user', {
				'data': {'do':'termsofuse'},
				'event': function(r){
					var text = L.isNull(r) ? "" : r.data.text;
					TM.getEl('termsofuse.text').innerHTML = text;
				}
			});
			if (this.userid > 0){
				Dom.setStyle(TM.getEl('termsofuse.btns'), 'display', '');
			}
		},
		onClick: function(el){
			var tp = this._TId['termsofuse'];
			switch(el.id){
			case tp['bok']:
				this.agreement();
				return true;
			case tp['bcancel']:
				this.close();
				return true;
			}
			return false;
		},
		_callback: function(st){
			if (L.isFunction(this.callback)){
				this.callback(st);
			}
		},
		onClose: function(){
			if (!this.isOk){
				this._callback('cancel');
			}
		},
		agreement: function(){
			var TM = this._TM, gel = function(n){ return TM.getEl('termsofuse.'+n);};
			
			Dom.setStyle(gel('bok'), 'display', 'none');
			Dom.setStyle(gel('bcancel'), 'display', 'none');
			Dom.setStyle(gel('saved'), 'display', '');
			this.isOk = true;

			var __self = this;
			Brick.ajax('user', {
				'data': {
					'do':'termsofuseagreement',
					'userid': this.userid
				},
				'event': function(r){
					__self._callback('ok');
					__self.close();
				}
			});
		}
	});
	NS.TermsOfUsePanel = TermsOfUsePanel;
	
};