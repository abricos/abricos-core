/**
* @version $Id: user.js 727 2009-03-31 11:18:10Z AKuzmin $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('User');

	var Dom, E,	L, W,	C, T, J, TId;
	
	var uniqurl = Brick.uniqurl;
	var readScript = Brick.readScript;
	var wWait = Brick.widget.WindowWait;
	var elClear = Brick.elClear;
	function connectFailure(o){ wWait.hide(); alert("CONNECTION FAILED!"); };
	var connectCallback = {success: function(o) {	wWait.hide();	readScript(o.responseText);	}, failure: connectFailure };
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
    yahoo: ["connection","container"], 
    onSuccess: function() { 
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;
			W = YAHOO.widget;
			C = YAHOO.util.Connect;
			
			T = Brick.util.Template['user']['user'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			
			Brick.User.Manager.init();
	  }
	});

	var url = '/ajax/query.html?md=user&bk=login&do=';
	
	function refreshPage(url){
		wWait.show();
		if (url){
			window.location.href = url;
			return;
		}
		window.location.reload(false);
	}

(function(){
	
	var globalPanel=null;
	
	var loginpanel = function(obj){
		this.fromActive = false;
		this.init(obj);
	};
	loginpanel.prototype = {
		init: function(obj){
			
			obj = obj || {};
			obj['unm'] = obj['unm'] || '';
			obj['pass'] = obj['pass'] || '';
			obj['url'] = obj['url'] || '';
			this.obj = obj;
		
			Brick.User.LoginPanel.active = this;
			if (!L.isNull(globalPanel)){ globalPanel.destroy(); }
	
			var t = T['loginpanel'];
	
			var div = document.createElement('div');
			div.innerHTML = t;
	
			var win = new YAHOO.widget.Panel(div, {zindex:1000, draggable: true, modal:true, visible:false});
			win.render(document.body);
			globalPanel = this.win = win;
	
			if (obj['unm'].length > 0){
				this.el('username').value = obj['unm']; 
				this.el('userpass').value = obj['pass'];
				this.fromActive = true;
			}
			win.hideEvent.subscribe(function(){ __self.close(); });
			win.show();
			win.center();
	
			var __self = this;
			E.on(div, 'click', function(e){
				if (__self.clickEvent(E.getTarget(e))){ E.stopEvent(e); }
			});
			E.on(TId['loginpanel']['form'], 'submit', function(){ __self.send();});
		},
		el: function(name){
			return Dom.get(TId['loginpanel'][name]);
		},
		clickEvent: function (el){
			switch(el.id){
			case TId['loginpanel']['blogin']:
				this.send();
				return true;
			case TId['loginpanel']['bcancel']:
				this.close();
				return true;
			case TId['loginpanel']['breg']:
				Brick.User.Manager.register();
				return true;
			case TId['loginpanel']['bpwd']:
				Brick.User.Manager.password();
				return true;
			}
			return false;
		},
		send: function(){
			this.el('error').style.display = 'none';
			wWait.show();
			C.setForm(this.el('form'));
			C.asyncRequest("POST", uniqurl(url+'login'), connectCallback);
		},
		result: function(d){
			if (d.error.length > 0){
				var err;
				var un = this.el('username'); 
				un.value = '';
				un.focus();
				this.el('userpass').value = '';
				var err = this.el('error');
				err.style.display = "block";
				err.innerHTML = d.error;
			}else{
				refreshPage(this.obj['url']);
			}
		},
		close: function(){
			this.win.hide();
		}
	}
	
	Brick.User.LoginPanel = loginpanel;
	Brick.User.LoginPanel.active = null;
})();

(function(){

	Brick.User.Manager = function(){
		return {
			init: function(){
				var div = Dom.get('bkt_user');
				if (L.isNull(div)){ return; }
				
				var usr = Brick.env.user, t=""; 
				
				if (usr.isRegistred()){
					t = T['blockuser'];
					t = tSetVar(t, 'name', usr.name);
					div.innerHTML = t;
				}else{
					div.innerHTML = T['blockguest'];
				}
				var __self = this;
				E.on(div, 'click', function(e){
					if (__self.clickEvent(E.getTarget(e))){ E.stopEvent(e); }
				});
			},
			clickEvent: function (el){
				switch(el.id){
				case TId['blockguest']['blogin']:
					this.login();
					return true;
				case TId['blockguest']['breg']:
					this.register();
					return true;
				case TId['blockuser']['blogout']:
					this.logout();
					return true;
				}
				return false;
			},
			login: function(obj){
				new Brick.User.LoginPanel(obj);
			},
			logout: function(){
				wWait.show();
				C.asyncRequest("GET", uniqurl(url+'logout'), connectCallback); 
			},
			password: function(){
				if (typeof Brick.User.Guest == 'undefined'){
					wWait.show();
					Brick.Loader.add({
						mod:[{name: 'user', files: ['guest.js']}],
				    onSuccess: function() {
							wWait.hide();
							Brick.User.Guest.Password.show();
					  }
					});
				}else{
					Brick.User.Guest.Password.show();
				}
			},
			register: function(){
				if (typeof Brick.User.Guest == 'undefined'){
					wWait.show();
					Brick.Loader.add({
						mod:[{name: 'user', files: ['guest.js']}],
				    onSuccess: function() {
							wWait.hide();
							Brick.User.Guest.Register.show();
					  }
					});
				}else{
					Brick.User.Guest.Register.show();
				}
			},
			result: function(d){
				if (d.t == 'login'){
					Brick.User.LoginPanel.active.result(d);
				}else if (d.t == 'logout'){
					refreshPage(); 
				}
			}
		}
	}();

})();
})();
