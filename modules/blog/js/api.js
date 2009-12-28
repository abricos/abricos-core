/*
@version $Id: api.js 55 2009-09-20 11:57:32Z roosit $
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Blog
 * @namespace Brick.mod.blog
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
	 * API модуля Blog
	 * 
	 * @class API
	 * @extends Brick.Component.API
	 * @static
	 */
	var API = NS.API;
	
	/**
	 * Показать панель "Список моих записей в блоге"
	 * 
	 * @method showTopicListPanel
	 * @static
	 */
	API.showTopicListPanel = function(){
		API.fn('topic', function(){
			var widget = new NS.TopicListPanel();
			API.addWidget('TopicListPanel', widget);
			API.dsRequest();
		});
	};
	
	/**
	 * Показать виджет "Список моих записей в блоге"
	 * 
	 * @method showTopicListByUserWidget
	 * @static
	 * @param {Object} container Идентификатор HTML элемента или 
	 * HTML элемент, контейнер  в котором будет показан виджет.
	 */
	API.showTopicListByUserWidget = function(container){
		API.fn('topic', function(){
			var widget = new NS.TopicListWidget(container);
			API.addWidget('TopicListByUserWidget', widget);
			API.dsRequest();
		});
	};
	
	/**
	 * Отобразить панель "Редактор записи в блоге"
	 * 
	 * @method showTopicEditorPanel
	 * @static
	 * @param {Integer} topicid Идентификатор записи в блоге, 
	 * если 0, создать новый. 
	 */
	API.showTopicEditorPanel = function(topicid){
		API.fn('topic', function(){
			var widget = new NS.TopicEditorPanel(topicid);
			API.addWidget('TopicEditorPanel', widget);
			API.dsRequest();
		});
	};
	
	/**
	 * Показать панель "Список категорий блога"
	 *
	 * @method showCategoryListPanel
	 * @static
	 * @param {Function} callback
	 */
	API.showCategoryListPanel = function(callback){
		API.fn('topic', function(){
			var widget = new NS.CategoryListPanel(callback);
			API.addWidget('CategoryListPanel', widget);
			API.dsRequest();
		});
	};

	/**
	 * Показать панель "Редактор категории блога"
	 *
	 * @method showCategoryEditorPanel
	 * @static
	 * @param {Integer} categoryId Идентификатор категории, если 0, 
	 * то создание новой категории
	 */
	API.showCategoryEditorPanel = function(categoryId){
		API.fn('topic', function(){
			var widget = new NS.CategoryEditorPanel(categoryId);
			API.addWidget('CategoryEditorPanel', widget);
			API.dsRequest();
		});
	};
	
	/**
	 * Запросить DataSet произвести обновление данных.
	 * 
	 * @method dsRequest
	 */
	API.dsRequest = function(){
		if (!Brick.objectExists('Brick.mod.blog.data')){
			return;
		}
		Brick.mod.blog.data.request(true);
	};

};
