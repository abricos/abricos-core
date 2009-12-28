/*
@version $Id$
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * Модуль обратной связи.
 * 
 * @module Feedback
 * @namespace Brick.mod.feedback
 */

var Component = new Brick.Component();
Component.requires = {
	yahoo: ['dom']
};
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
	
	/**
	 * Открыть панель "Отправить сообщение администрации сайта"
	 * 
	 * @method showNewMessagePanel
	 * @static
	 * @param {Object} param
	 */
	API.showNewMessagePanel = function(param){
		API.fn('form', function(param){
			new NS.NewMessagePanel(param);
		});
	};

	/**
	 * Показать виджет "Отправить сообщение администрации сайта"
	 * 
	 * @method showNewMessageWidget
	 * @static
	 * @param {String | HTMLElement} container
	 * @param {Object} param
	 */
	API.showNewMessageWidget = function(container, param){
		API.fn('form', function(param){
			var widget = new NS.NewMessageWidget(container, param);
			API.addWidget('NewMessageWidget', widget);
		});
	};

	/**
	 * Открыть панель "Администрирование модуля"
	 * 
	 * @method showManagerPanel
	 * @static 
	 */
	API.showManagerPanel = function(){
		API.fn('manager', function(){
			new NS.ManagerPanel();
			API.dsRequest();
		});
	};
	
	/**
	 * Показать виджет "Администрирование модуля"
	 * 
	 * @method showManagerWidget
	 * @static
	 * @param {String | HTMLElement} container
	 */
	API.showManagerWidget = function(container){
		API.fn('manager', function(){
			var widget = new NS.ManagerWidget(container);
			API.addWidget('ManagerWidget', widget);
			API.dsRequest();
		});
	};

	/**
	 * Запросить DataSet произвести обновление данных.
	 * 
	 * @method dsRequest
	 */
	API.dsRequest = function(){
		if (!Brick.objectExists('Brick.mod.feedback.data')){
			return;
		}
		Brick.mod.feedback.data.request(true);
	};

};
