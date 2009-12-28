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
		API.fn('calendar', function(){
			var cal = new NS.CalendarPanel();
		});
	};
	
	/**
	 * Запросить DataSet произвести обновление данных.
	 * 
	 * @method dsRequest
	 */
	API.dsRequest = function(){
		var DATA = API.getDataManager();
		DATA.request(true);
	};
	
	API.getDataManager = function(){
		if (!Brick.objectExists('Brick.mod.calendar.data')){
			return null;
		}
		return Brick.mod.calendar.data;
	};
	
	/**
	 * Привелегии пользователя.
	 * 
	 * @class Action
	 * @static
	 */
	API.Action = {

		/**
		 * Доступ к работе с календарем
		 * 
		 * @property CALENDAR_VIEW
		 * @default 10
		 */
		CALENDAR_VIEW: '10',
		
		/**
		 * Администрирование
		 * 
		 * @property CALENDAR_ADMIN
		 * @default 50
		 */
		CALENDAR_ADMIN: '50'
	};

};
