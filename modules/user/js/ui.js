/*
* @version $Id$
* @copyright Copyright (C) 2008 Abricos All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

// Обработчик интерфейса размещенного на страницах сайта
var Component = new Brick.Component();
Component.requires = {
	yahoo: ['dom'],
	mod:[{name: 'sys', files: ['wait.js']}]
};
Component.entryPoint = function(NS){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var API = NS.API, F = Brick.f, FF = Brick.ff;
	
	NS['ui'] = NS['ui'] || {};
	
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
	
	var notDouble = {};
	
	NS.ui.userblockInit = function(elId){
		if (notDouble[elId]){ return; }
		notDouble[elId] = true;
		
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
								var lng = Brick.util.Language.getc('mod.user.guest.loginpanel.error.srv');
								alert(lng[msg.data]);
							});
						}else{
							Brick.Page.reload();
							/*
							var u = Brick.env.user;
							if (u.id>0 && u.agr==1){
								Brick.ff('user', 'guest', function(){
									Brick.console('asdf');
									new NS.TermsOfUsePanel(function(st){
										if (st=='ok'){
											Brick.Page.reload();
										}else{
											NS.API.userLogout();
										}
									});
								});
							}
							/**/
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
		
		var findel = function(el, id){
			el = Dom.get(el);
			if (el.id == id){ return el; }
			if (!el.childNodes || el.childNodes.length == 0){ return null; }
			var chs = el.childNodes;
			for (var i=0;i<chs.length;i++){
				var cel = findel(chs[i], id);
				if (!L.isNull(cel)){ return cel; }
			}
			return null;
		};
		
		var elShowAppList = findel(elId, 'bshowbosui'),
			elCont = findel(elId, 'appbosuicont'),
			elAppList = findel(elId, 'appbosuilist');
		
		if (!L.isNull(elShowAppList) && !L.isNull(elShowAppList)){
			var elAppBosList = null;
			
			E.on(elShowAppList, 'mousemove', function(){
				if (L.isNull(elAppBosList)){
					elAppBosList = new AppBosUIListWidget(elShowAppList, elCont, elAppList);
				}else{
					elAppBosList.show();
				}
			});
		}
	};
	
	var AppBosUIListWidget = function(elBtn, elCont, elList){
		this.init(elBtn, elCont, elList);
	};
	AppBosUIListWidget.prototype = {
		init: function(elBtn, elCont, elList){
			this.elCont = elCont;
			
			var __self = this;
			E.on(elBtn, 'mouseout', function(){
				setTimeout(function(){ __self.hide(); }, 200);
			});
			
			Brick.f('bos', 'label', function(){
				Brick.Permission.load(function(){
					__self.widget = new Brick.mod.bos.LabelListWidget(elList, {
			    		'startupBeforeEventDisable': true,
			    		'startupAfterEventDisable': true,
			    		'uriPrefix': '/bos/'
					});
				});
			});
		},
		show: function(){
			Dom.addClass(this.elCont, 'visiblelist');
		},
		hide: function(){
			Dom.removeClass(this.elCont, 'visiblelist');
		}
	};
	NS.AppBosUIListWidget = AppBosUIListWidget;
	
};