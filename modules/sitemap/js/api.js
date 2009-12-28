/*
* @version $Id$
* @copyright Copyright (C) 2008 Abricos All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * Модуль "Структура сайта".
 * 
 * @module Sitemap
 * @namespace Brick.mod.sitemap
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
	
	API.showPageEditorPanel = function(pageId, withMenu, parentMenuId, isOnlyPage){
		API.fn('editor', function(){
			var widget = new NS.PageEditorPanel(pageId, withMenu, parentMenuId, isOnlyPage);
			API.addWidget('PageEditorPanel', widget);
			API.dsRequest();
		});	
	};
	
	API.showLinkEditorPanel = function(linkId, withMenu, parentMenuId){
		API.fn('editor', function(){
			var widget = new NS.LinkEditorPanel(linkId, withMenu, parentMenuId);
			API.addWidget('LinkEditorPanel', widget);
			API.dsRequest();
		});		
	};

	/**
	 * Запросить DataSet произвести обновление данных.
	 * 
	 * @method dsRequest
	 */
	API.dsRequest = function(){
		if (!Brick.objectExists('Brick.mod.sitemap.data')){
			return;
		}
		Brick.mod.sitemap.data.request(true);
	};

};
