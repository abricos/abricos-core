/*
* @version $Id$
* @copyright Copyright (C) 2008 Abricos All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module News
 * @namespace Brick.mod.news
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

	API.showNewsListPanel = function(){
		API.fn('manager', function(){
			var widget = new NS.NewsListPanel();
			API.addWidget('NewsListPanel', widget);
			API.dsRequest();
		});
	};
	/**
	 * Показать виджет "Список новостей"
	 * 
	 * @method showNewsListWidget
	 * @param {String | HTMLElement} container HTML элемент в котором будет отображен 
	 * виджет.
	 */
	API.showNewsListWidget = function(container){
		API.fn('manager', function(){
			var widget = new NS.NewsListWidget(container);
			API.addWidget('NewsListWidget', widget);
			API.dsRequest();
		});
	};
	
	API.showEditorPanel = function(newsId){
		API.fn('editor', function(){
			var widget = new NS.EditorPanel(newsId);
			API.addWidget('EditorPanel', widget);
			API.dsRequest();
		});
	};

	/**
	 * Запросить DataSet произвести обновление данных.
	 * 
	 * @method dsRequest
	 */
	API.dsRequest = function(){
		if (!Brick.objectExists('Brick.mod.news.data')){
			return;
		}
		Brick.mod.news.data.request(true);
	};
};