/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('User.Guest');

	var Dom, E,	L, C, T, J, TId;

	var uniqurl = Brick.uniqurl;
	var readScript = Brick.readScript;
	var elClear = Brick.elClear;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;
	function connectFailure(o){ wWait.hide(); alert("CONNECTION FAILED!"); };
	var connectCallback = {success: function(o) {wWait.hide(); readScript(o.responseText);}, failure: connectFailure};

	Brick.Loader.add({
		yahoo: ['json'],
		mod:[{name: 'sys', files: ['form.js']}],
    onSuccess: function() {
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;
			C = YAHOO.util.Connect;
			J = YAHOO.lang.JSON;
			
			T = Brick.util.Template['user']['guest'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			
			Brick.User.Guest.initialize();
	  }
	});

/* * * * * * * * * * * Password Change * * * * * * * * * * */
(function(){
	
	var globalPanel=null;
	
	var pwdchange = function(obj){
		this.init(obj);
	};
	pwdchange.prototype = {
		init: function(obj){
			
			if (!L.isNull(globalPanel)){ globalPanel.destroy(); }
			var __self = this;
			
			var t = T['pwdchange'];
			
			if (obj.error > 0){
				t = tSetVar(t, 'body', T['pwdchangeerror']);
			}else{
				t = tSetVar(t, 'body', T['pwdchangeok']);
			}
	
			var div = document.createElement('div');
			div.innerHTML = t;
	
			var win = new YAHOO.widget.Panel(div, {zindex:1000, draggable: true, modal:true, visible:false});
			win.render(document.body);
			globalPanel = this.win = win;
	
			win.show();
			win.center();
	
			E.on(div, 'click', function(e){
				var el = E.getTarget(e);
				if (el.id == TId['pwdchangeok']['bclose'] || el.id == TId['pwdchangeerror']['bclose']){
					win.hide();
				}else if (el.id == TId['pwdchangeok']['blogin']){
					win.hide();
					Brick.User.Manager.login({'url':'/'});
				}else if (el.id == TId['pwdchangeerror']['bpwd']){
					win.hide();
					Brick.User.Manager.password();
				}
			});
		}
	}
	
	Brick.User.Guest.PasswordChange = function(){
		var activatePanel = null;
		return {
			initialize: function(obj){
				activatePanel = new pwdchange(obj);
			}
		}
	}();
})();
	
/* * * * * * * * * * * Restore Password * * * * * * * * * * */
(function(){
	var globalPanel=null;
	
	var password = function(obj){
		this.init(obj);
	};
	password.prototype = {
		init: function(obj){
			
			if (!L.isNull(globalPanel)){ globalPanel.destroy(); }
			var __self = this;
			
			var t = T['password'];
			
			var div = document.createElement('div');
			div.innerHTML = t;
	
			var win = new YAHOO.widget.Panel(div, {zindex:1000, draggable: true, modal:true, visible:false});
			win.render(document.body);
			globalPanel = this.win = win;
	
			win.show();
			win.center();
	
			E.on(div, 'click', function(e){
				var el = E.getTarget(e);
				if (el.id == TId['password']['bsend']){
					__self.send();
				}else if (el.id == TId['password']['bcancel']){
					__self.close();
				}
			});
		},
		close: function(){
			this.win.hide();
		},
		el: function(name){
			return Dom.get(TId['password'][name]);
		},
		send: function(){
			var email = this.el('email');
			var emailconf = this.el('emailconf');

			var validobj = {
				elements: {
					'email':{ obj: email, rules: ["empty","email"], args:{"field":"E-mail"}}
				}
			};
			
			var validator = new Brick.util.Form.Validator(validobj);
			var errors = validator.check();
			if (errors.length > 0){
				return;
			}
			
			var obj = { 'act':'pwd', 'eml': email.value }
			var post = "json="+encodeURIComponent(J.stringify(obj));
			wWait.show();
			C.asyncRequest("POST", 
				uniqurl('/ajax/query.html?md=user&bk=guest'), 
				connectCallback, 
				post
			);
		}
	}
	
	Brick.User.Guest.Password = function(){
		var activePwdPanel = null;
		return {
			show: function(){
				activePwdPanel = new password(); 
			},
			result: function(d){
				if (d.error > 0){
					var s = Brick.util.Language.getc('user.guest.password.error.'+d.error);
					alert(s);
					return;
				}
				activePwdPanel.close();

				var t = T['pwdokpanel'];
				t = tSetVar(t, 'email', d.eml);
		
				var div = document.createElement('div');
				div.innerHTML = t;
		
				var win = new YAHOO.widget.Panel(div, {zindex:1000, draggable: true, modal:true, visible:false});
				win.render(document.body);
				
				win.show();
				win.center();
		
				E.on(div, 'click', function(e){
					var el = E.getTarget(e);
					if (el.id == TId['pwdokpanel']['bclose']){
						win.hide();
					}
				});
			}
		}
	}();
	
})();
	
/* * * * * * * * * * * Guest Register Activate * * * * * * * * * * */
(function(){
	
	var globalPanel=null;
	
	var activate = function(obj){
		this.init(obj);
	};
	activate.prototype = {
		init: function(obj){
			
			if (!L.isNull(globalPanel)){ globalPanel.destroy(); }
			var __self = this;
			
			var t = T['activate'];
			
			if (obj.error > 0){
				t = tSetVar(t, 'body', T['activerror']);
				t = tSetVar(t, 'err', Brick.util.Language.getc('user.guest.activate.error.'+obj.error));
			}else{
				t = tSetVar(t, 'body', T['activok']);
				t = tSetVar(t, 'unm', obj.unm);
			}
	
			var div = document.createElement('div');
			div.innerHTML = t;
	
			var win = new YAHOO.widget.Panel(div, {zindex:1000, draggable: true, modal:true, visible:false});
			win.render(document.body);
			globalPanel = this.win = win;
	
			win.show();
			win.center();
	
			E.on(div, 'click', function(e){
				var el = E.getTarget(e);
				if (el.id == TId['activok']['bclose'] || el.id == TId['activerror']['bclose']){
					win.hide();
				}else if (el.id == TId['activok']['blogin']){
					win.hide();
					obj['url'] = '/';
					Brick.User.Manager.login(obj);
				}
			});
		}
	}
	
	Brick.User.Guest.Activate = function(){
		var activatePanel = null;
		return {
			initialize: function(obj){
				activatePanel = new activate(obj);
			}
		}
	}();
	
})();
	
/* * * * * * * * * * * Guest Register Manager * * * * * * * * * * */
(function(){
	
	var globalPanel=null;
	
	var register = function(){
		this.init();
	};
	register.prototype = {
		init: function(){

			if (!L.isNull(globalPanel)){ globalPanel.destroy(); }
			var __self = this;
			
			var t = T['register'];
	
			var div = document.createElement('div');
			div.innerHTML = t;
	
			var win = new YAHOO.widget.Panel(div, {zindex:1000, draggable: true, modal:true, visible:false});
			win.render(document.body);
			globalPanel = this.win = win;

			win.hideEvent.subscribe(function(){ __self.close(); });
			win.show();
			win.center();
	
			var __self = this;
			E.on(div, 'click', function(e){
				if (__self.clickEvent(E.getTarget(e))){ E.stopEvent(e); }
			});
			E.on(TId['register']['form'], 'submit', function(){ __self.send();});
		},
		close: function(){
			this.win.hide();
		},
		el: function(name){
			return Dom.get(TId['register'][name]);
		},
		clickEvent: function (el){
			switch(el.id){
			case TId['register']['breg']:
				this.send();
				return true;
			case TId['register']['bcancel']:
				this.close();
				return true;
			}
			return false;
		},
		send: function(){
			var unm = this.el('username');
			var pass = this.el('pass');
			var passconf = this.el('passconf');
			var email = this.el('email');
			var emailconf = this.el('emailconf');

			var validobj = {
				elements: {
					'username':{ obj: unm, rules: ["empty","username"], args:{"field":"Имя пользователя"}},
					'pass':{ obj: pass, rules: ["empty"], args:{"field":"Пароль"}},
					'passconf':{ obj: passconf, rules: ["empty"], args:{"field":"Пароль подтв."}},
					'email':{ obj: email, rules: ["empty","email"], args:{"field":"E-mail"}},
					'emailconf':{ obj: emailconf, rules: ["empty","email"], args:{"field":"E-mail подтв."}}
				}
			};
			
			var validator = new Brick.util.Form.Validator(validobj);
			var errors = validator.check();
			if (errors.length > 0){
				return;
			}
			
			if (pass.value != passconf.value){ alert('Пароли не совпадают'); return; }
			if (email.value != emailconf.value){ alert('E-mail не совпадают'); return; }
			
			var obj = {
				'act':'reg',
				'unm': unm.value,
				'pass': pass.value,
				'eml': email.value
			}
			
			var post = "json="+encodeURIComponent(J.stringify(obj));
			wWait.show();
			C.asyncRequest("POST", 
				uniqurl('/ajax/query.html?md=user&bk=guest'), 
				connectCallback, 
				post
			);
			
		}
	}
	
	Brick.User.Guest.Register = function(){
		var activeRegPanel = null;
		return {
			show: function(){
				activeRegPanel = new register(); 
			},
			result: function(d){
				if (d.error > 0){
					var s = Brick.util.Language.getc('user.guest.register.error.srv.'+d.error);
					alert(s);
					return;
				}
				activeRegPanel.close();

				var t = T['regokpanel'];
		
				var div = document.createElement('div');
				div.innerHTML = t;
		
				var win = new YAHOO.widget.Panel(div, {zindex:1000, draggable: true, modal:true, visible:false});
				win.render(document.body);
				
				var el = Dom.get(TId['regokpanel']['email']);
				el.innerHTML = d.eml;
				
				win.show();
				win.center();
		
				E.on(div, 'click', function(e){
					var el = E.getTarget(e);
					if (el.id == TId['regokpanel']['bclose']){
						win.hide();
					}
				});
			}
		}
	}();

})();

/* * * * * * * * * * * * Guest Manager * * * * * * * * * * */
(function(){

	var guest = function(){
		this.init();
	};
	
	guest.prototype = {
		init: function(){
			var __self = this;
			var div = Dom.get('bk_user');
			
			if (L.isNull(div)){return;}
			div.innerHTML = T['panel'];
	
			E.on(div, 'click', function(e){
				if (__self.clickEvent(E.getTarget(e))){ E.stopEvent(e); }
			});
		}, 
		clickEvent: function(el){
			switch(el.id){
			case TId['panel']['blogin']:
				Brick.User.Manager.login();
				return true;
			case TId['panel']['breg']:
				Brick.User.Guest.Register.show();
				return true;
			case TId['panel']['bpwd']:
				Brick.User.Guest.Password.show();
				return true;
			}
			return false;
		}
	}
	
	Brick.User.Guest.initialize = function(){ 
		new guest(); 
	};

})();

})();