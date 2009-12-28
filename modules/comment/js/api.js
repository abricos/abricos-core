/*
@version $Id: api.js 55 2009-09-20 11:57:32Z roosit $
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * Модуль комментариев.
 * 
 * @module Comment
 * @namespace Brick.mod.comment
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
	
	/**
	 * Построить дерево комментариев на странице.
	 * 
	 * @method buildComments
	 * @static
	 * @param {Object} oArgs Объект параметров:<br>
	 * oArgs.elementId - Идентификатор HTML элемента, который содержит 
	 * в себе список комментариев: имя пользователя, идентификатор и текст комментария.<br>
	 * oArgs.dbContentId - Идентификатор из таблицы контента на сервера. <br>
	 * oArgs.data - Сопутствующие данные комментариев.
	 */
	API.buildComments = function(oArgs){
		API.fn('comment', function(){
			var widget = new NS.Builder(oArgs.elementId, oArgs.dbContentId, oArgs.data);
			API.dsRequest();
		});
	};
	
	/**
	 * Открыть панель "Список комментариев"
	 * 
	 * @method showCommentListPanel
	 * @static
	 */
	API.showCommentListPanel = function(){
		API.fn('manager', function(){
			var widget = new NS.CommentListPanel();
			API.dsRequest();
		});
	};
	
	/**
	 * Показать виджет "Список комментариев"
	 * 
	 * @method showCommentListWidget
	 * @static
	 * @param {Object} container Идентификатор HTML элемента или 
	 * HTML элемент, контейнер  в котором будет показан виджет.
	 */
	API.showCommentListWidget = function(container){
		API.fn('manager', function(){
			var widget = new NS.CommentListWidget(container);
			API.addWidget('CommentListWidget', widget);
			API.dsRequest();
		});
	};

	
	/**
	 * Запросить DataSet произвести обновление данных.
	 * 
	 * @method dsRequest
	 */
	API.dsRequest = function(){
		if (!Brick.objectExists('Brick.mod.comment.data')){
			return;
		}
		Brick.mod.comment.data.request(true);
	};

	/**
	 * Привелегии пользователя.
	 * 
	 * @class Action
	 * @static
	 */
	API.Action = {
		/**
		 * Доступ на чтение комментариев
		 * 
		 * @property COMMENTS_VIEW
		 * @default 10
		 */
		COMMENTS_VIEW: '10',
		
		/**
		 * Доступ на запись комментария
		 * 
		 * @property COMMENT_WRITE
		 * @default 20
		 */
		COMMENT_WRITE: '20',

		/**
		 * Доступ на администрирование комментариев
		 * 
		 * @property COMMENTS_ADMIN
		 * @default 50
		 */
		COMMENTS_ADMIN: '50'
	};
};
