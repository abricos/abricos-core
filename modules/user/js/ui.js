/*
* @version $Id$
* @copyright Copyright (C) 2008 Abricos All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

// Обработчик интерфейса размещенного на страницах сайта
var Component = new Brick.Component();
Component.requires = {
	yahoo: ['dom'],
	mod:[
	     {name: 'sys', files: ['wait.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace, 
		API = NS.API,
		F = Brick.Component.API.fire,
		FF = Brick.Component.API.fireFunction;
	
	NS['ui'] = NS['ui'] || {}; 
	
(function(){

	var LW = Brick.widget.LayWait;
	
	var getval = function(id){
		var el = L.isString(id) ? Dom.get(id) : id;
		if (L.isNull(el)){ return ''; }
		return el.value;
	};
	
	var setval = function(id, val){
		var el = L.isString(id) ? Dom.get(id) : id;
		if (L.isNull(el)){ return; }
		el.value = val;
	};
	
	var notDouble = {'userblockInit': {}};
	
	NS.ui.userblockInit = function(elId){
		if (notDouble['userblockInit'][elId]){ return; }
		notDouble['userblockInit'][elId] = true;
		
		var container = Dom.get(elId);
		if (L.isNull(container)){ return; }
		
		var onClick = function(el){
			if (Dom.hasClass(el, 'showlogin')){
				var lw = new LW(container);
				F('user', 'api', 'showLoginPanel', '', function(){lw.hide();});
			}else if (Dom.hasClass(el, 'showregister')){
				var lw = new LW(container);
				F('user', 'guest', 'showRegisterPanel', '', function(){lw.hide();});
			}else if (Dom.hasClass(el, 'showlogout')){
				var lw = new LW(container);
				F('user', 'api', 'userLogout', '', function(){lw.hide();});
			}else if (Dom.hasClass(el, 'showrecpwd')){ 
				var lw = new LW(container);
				F('user', 'api', 'showPwdRestPanel', '', function(){lw.hide();});
			}else if (Dom.hasClass(el, 'btn-authorize')){
				var lw = new LW(container);
				FF('user', 'api', function(){
					API.userLogin(getval('txt-login'), getval('txt-password'), getval('chk-autologin'), function(msg){
						if (msg.data > 0){
							FF('user', 'guest', function(){
								lw.hide();
								setval('txt-login', '');
								setval('txt-password', '');
								var lng = Brick.util.Language.getc('mod.user.loginpanel.error.srv');
								alert(lng[msg.data]);
							});
						}else{
							Brick.Page.reload();
							// lw.hide();
						}
					});
				});
			}else {
				return false;
			}
			return true;
		};
		
		E.on(container, 'click', function(e){
			var el = E.getTarget(e);
			if (onClick(el)){ E.preventDefault(e); }
		});
	};
})();
};
