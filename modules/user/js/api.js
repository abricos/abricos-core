/*
@version $Id: api.js 55 2009-09-20 11:57:32Z roosit $
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
	
	/**
	 * Показать на странице виджет <a href="Brick.mod.user.UserBlockWidget.html">UserBlockWidget</a>
	 * - блок информативной строки пользователя.
	 *  
	 * @method showUserBlockWidget
	 * @static
	 * @param {String} elId (optional) Идентификатор HTML элемента. 
	 * Если параметр не указан, то elId = 'mod-user-userblock'  
	 */
	API.showUserBlockWidget = function(elId){
		API.fn('user', function(){
			elId = elId || 'mod-user-userblock';
			var el = Dom.get(elId);
			if (L.isNull(el)) { return; }
			API.addWidget('UserBlockWidget', new NS.UserBlockWidget());
		});
	};
	
	API.showMyProfileWidget = function(container){
		API.fn('profile', function(){
			var widget = new NS.MyProfileWidget(container);
			API.addWidget('MyProfileWidget', widget);
			API.dsRequest();
		});
	};
	
	API.showUserListWidget = function(container){
		API.fn('manager', function(){
			var widget = new NS.UserListWidget(container);
			API.addWidget('UserListWidget', widget);
			API.dsRequest();
		});
	};

	API.showUserEditorPanel = function(userid){
		API.fn('manager', function(){
			var widget = new NS.UserEditorPanel(userid);
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
		API.fn('user', function(){
			var widget = new Brick.mod.user.LoginPanel(param);
			API.addWidget('LoginPanel', widget);
		});
	};
	
	/**
	 * Отобразить панель "Регистрация пользователя"
	 * 
	 * @method showRegisterPanel
	 * @static
	 */
	API.showRegisterPanel = function(param){
		API.fn('guest', function(){
			var widget = new NS.RegisterPanel(param);
			API.addWidget('RegisterPanel', widget);
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
	 * Отобразить панель "Активация зарегистрированного пользователя"
	 * 
	 * @method showRegActivatePanel
	 * @static
	 * @param {Object} param 
	 */
	API.showRegActivatePanel = function(param){
		API.fn('guest', function(){
			var widget = new Brick.mod.user.RegActivatePanel(param);
			API.addWidget('RegActivatePanel', widget);
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
	 * Отобразить панель "Изменение пароля" в зависимости от результата сервера 
	 * 
	 * @method showPwdRestResult
	 * @static
	 * @param {Object} param 
	 */
	API.showPwdRestResult = function(param){
		API.fn('guest', function(){
			if (param['error']>0){
				API.showPwdRestChangeErrorPanel();
			}else{
				API.showPwdRestChangeOkPanel();
			}
		});
	};
	
	/**
	 * Отобразить панель "Восстановление пароля - новый пароль отправлен на email"
	 * 
	 * @method showPwdRestChangeOkPanel
	 * @static
	 */
	API.showPwdRestChangeOkPanel = function(){
		API.fn('guest', function(){
			var widget = new NS.PwdRestChangeOkPanel();
			API.addWidget('PwdRestChangeOkPanel', widget);
		});
	};
	
	/**
	 * Отобразить панель "Восстановление пароля - ошибка"
	 * 
	 * @method showPwdRestChangeErrorPanel
	 * @static
	 */
	API.showPwdRestChangeErrorPanel = function(){
		API.fn('guest', function(){
			var widget = new NS.PwdRestChangeErrorPanel();
			API.addWidget('PwdRestChangeErrorPanel', widget);
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
	 */
	API.userLogin = function(username, password){
		API.sendResponse(REQUEST_TYPE.LOGIN, {
			'username': username,
			'password': password
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
	
	/**
	 * Зарегистрировать пользователя
	 * @method register
	 * @static
	 */
	API.userRegister = function(username, password, email){
		API.sendResponse(REQUEST_TYPE.REGISTER, {
			'username': username,
			'password': password,
			'email': email
		});
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
		if (!Brick.objectExists('Brick.mod.user.data')){
			return;
		}
		Brick.mod.user.data.request(true);
	};
};
