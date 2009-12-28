/*
@version $Id: api.js 55 2009-09-20 11:57:32Z roosit $
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { yahoo: ['dom'] };
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace;
	
	/**
	 * API модуля 
	 * 
	 * @class API
	 * @extends Brick.Component.API
	 * @static
	 */
	var API = NS.API;
	
	API.runApplication = function(){
		API.fn('employee', function(){
			new NS.EmployeeListPanel();
			API.dsRequest();
		});
	};
	
	API.showEmployeeEditorPanel = function(empid, callback){
		API.fn('employee', function(){
			new NS.EmployeeEditorPanel(empid, callback);
			API.dsRequest();
		});
	};
	
	/**
	 * Запросить DataSet произвести обновление данных.
	 * 
	 * @method dsRequest
	 */
	API.dsRequest = function(){
		if (!Brick.objectExists('Brick.mod.company.data')){
			return;
		}
		Brick.mod.company.data.request(true);
	};
	
	/**
	 * Привелегии пользователя.
	 * 
	 * @class Action
	 * @static
	 */
	API.Action = {

		/**
		 * Администрирование
		 * 
		 * @property COMMENTS_ADMIN
		 * @default 50
		 */
		COMPANY_ADMIN: '50'
	};

};
