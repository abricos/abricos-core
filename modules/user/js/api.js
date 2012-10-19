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
	yahoo: ['dom']
};
Component.entryPoint = function(){
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		BC = Brick.util.Connection;
	
	var NS = this.namespace;
	
	// Добавить в список страницы запрещенных на перезагрузку
	Brick.Page.addNotOverloadPage("/user/activate");
	Brick.Page.addNotOverloadPage("/user/recpwd");
	Brick.Page.addNotOverloadPage("/user/login");
	
	/**
	 * Типы запросов сервера
	 * 
	 * @class API.REQUEST_TYPE
	 * @static
	 */
	var REQUEST_TYPE = {
		/**
		 * Авторизация пользователя
		 * @property LOGIN
		 * @type String
		 */
		LOGIN: 'login',
		
		/**
		 * Выход пользователя
		 * @property LOGOUT
		 * @type String
		 */
		LOGOUT: 'logout',
		
		/**
		 * Регистрация пользователя
		 * @property REGISTER
		 * @type String 
		 */
		REGISTER: 'register',
		
		/**
		 * Восстановление пароля
		 * @property PASSWORD_RESTORE
		 * @type String 
		 */
		PASSWORD_RESTORE: 'pwdrestore'
	};  
	NS.API.REQUEST_TYPE = REQUEST_TYPE;

	
	/**
	 * API модуля User
	 * 
	 * @class API
	 * @extends Brick.Component.API
	 * @static
	 */
	var API = NS.API;
	
	/**
	 * Отобразить панель управления
	 * 
	 * @method showControlPanel
	 * @static
	 * @param {Object} containerId Идентификатор HTML элемента контейнера в котором 
	 * будет отображена панель управления.
	 */
	API.showControlPanel = function(containerId){
		API.fn('cpanel', function(){
			var widget = new NS.cp.WrapWidget(containerId);
			API.addWidget('ControlPanel', widget);
		});
	};
	
	API.runControlPanelApp = function(){
		API.fn('application', function(){
			new NS.cp.Application();
		});
	};
	
	API.showUserEditorPanel = function(userid, callback){
		API.fn('manager', function(){
			var widget = new NS.UserEditorPanel(userid, callback);
			API.addWidget('UserEditorPanel', widget);
			API.dsRequest();
		});
	};

	/**
	 * Отобразить панель авторизации 
	 * <a href="Brick.mod.user.LoginPanel.html">LoginPanel</a>
	 * @method showLoginPanel
	 * @static
	 * @param {Object} param (optional) Дополнительные параметры панели
	 */
	API.showLoginPanel = function(param){
		API.fn('guest', function(){
			var widget = new Brick.mod.user.LoginPanel(param);
			API.addWidget('LoginPanel', widget);
		});
	};
	
	/**
	 * Отобразить панель "Регистрация - отправлен email для подверждения"
	 * 
	 * @method showRegisterSendEmailPanel
	 * @static
	 * @param {Object} param 
	 */
	API.showRegisterSendEmailPanel = function(param){
		API.fn('guest', function(){
			var widget = new NS.RegisterSendEmailPanel(param);
			API.addWidget('RegisterSendEmailPanel', widget);
		});
	};
	
	/**
	 * Отобразить панель "Восстановление пароля"
	 * 
	 * @method showPwdRestPanel
	 * @static
	 */
	API.showPwdRestPanel = function(){
		API.fn('guest', function(){
			var widget = new NS.PwdRestPanel();
			API.addWidget('PwdRestPanel', widget);
		});
	};
	
	/**
	 * Отобразить панель "Восстановление пароля - отправлено письмо на изменение пароля"
	 * 
	 * @method showPwdRestSendEmailPanel
	 * @static
	 * @param {Object} param 
	 */
	API.showPwdRestSendEmailPanel = function(param){
		API.fn('guest', function(){
			var widget = new NS.PwdRestSendEmailPanel(param);
			API.addWidget('PwdRestSendEmailPanel', widget);
		});
	};

	/**
	 * Отправить запрос серверу.<br>
	 * На стороне сервера запрос обрабатывает кирпич /modules/user/brick/js_api.html<br>
	 * Ответ сервера обрабатывает метод 
	 * <a href="Brick.mod.user.API.html#method_getResponse">getResponse</a>
	 * 
	 * @method sendResponse 
	 * @static
	 * @param {String} type Тип запроса, см. <a href="Brick.mod.user.API.REQUEST_TYPE.html">REQUEST_TYPE</a>
	 * @param {Object} data Данные запроса
	 */
	API.sendResponse = function(type, data){
		data = data || {};
		BC.sendCommand('user', 'js_api', {
			json: {
				'type': type,
				'data': data
			} 
		});
	};
	
	/**
	 * Обработать ответ сервера.<br>
	 * 
	 * @method getResponse
	 * @static
	 * @param {Object} response Объект данных ответа сервера
	 */
	API.getResponse = function(response){
		var error = response['data']['error'];
		var data = response['data'];
		switch(response['type']){
		case REQUEST_TYPE.LOGIN:
			if (error > 0){
				API.showLoginPanel(data);
			}else{
				Brick.Page.reload();
			}
			break;
		case REQUEST_TYPE.REGISTER:
			if (error > 0){
				API.showRegisterPanel(data);
			}else{
				API.showRegisterSendEmailPanel(data);
			}
			break;
		case REQUEST_TYPE.LOGOUT:
			Brick.Page.reload();
			break;
		case REQUEST_TYPE.PASSWORD_RESTORE:
			if (error > 0){
				var s = Brick.util.Language.getc('mod.user.password.error.'+error);
				alert(s);
			}else{
				API.showPwdRestSendEmailPanel(data);
			}
			break;
		}
	};
	
	/**
	 * Авторизовать пользователя.
	 * 
	 * @method userLogin
	 * @static
	 * @param {String} username Имя пользователя
	 * @param {String} password Пароль
	 * @param {Function} (optional) fmsg Обработчик события
	 */
	API.userLogin = function(username, password, autologin, callback){
		Brick.ajax('user', {
			'data': {
				'do': 'loginext',
				'username': username,
				'password': password,
				'autologin': autologin || 0
			},
			'event': function(r){
				var d = L.isNull(r) ? {} : r.data;

				if (d['error']==0 && !!d['user'] && d['user']['id']>0 &&  d['user']['agr']==0){
					if (L.isFunction(callback)){
						callback(0, true);
					}
					var u = d['user'];
					Brick.env.user.id = u['id']; // hack
					Brick.ff('user', 'guest', function(){
						new NS.TermsOfUsePanel(function(st){
							if (st=='ok'){
								Brick.Page.reload();
							}else{
								NS.API.userLogout();
							}
						}, u['id']);
					});
				}else{
					if (L.isFunction(callback)){
						callback(d['error']);
					}
				}
			}
		});
	};
	
	/**
	 * Осущиствить выход пользователя.
	 * @method userLogout
	 * @static
	 */
	API.userLogout = function(){
		API.sendResponse(REQUEST_TYPE.LOGOUT);
	};
	
	API.userPasswordRestore = function(email){
		API.sendResponse(REQUEST_TYPE.PASSWORD_RESTORE, {
			'email': email
		});
	};
	
	/**
	 * Запросить DataSet произвести обновление данных.
	 * 
	 * @method dsRequest
	 */
	API.dsRequest = function(){
		if (!NS.data){ return; }
		NS.data.request(true);
	};
};
