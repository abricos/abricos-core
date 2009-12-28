/*
* @version $Id$
* @copyright Copyright (C) 2008 Abricos All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * Модуль "Менеджер файлов".
 * 
 * @module FileManager
 * @namespace Brick.mod.filemanager
 */
var Component = new Brick.Component();
Component.requires = { yahoo: ['dom'] };
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
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
	
	API.showFileBrowserPanel = function(callback){
		API.fn('filemanager', function(){
			API.activeBrowser = new NS.BrowserPanel(callback);
			API.dsRequest();
		});
	};
	
	API.showManagerWidget = function(container){
		API.fn('manager', function(){
			new NS.ManagerWidget(container);
		});
	};
	
	API.showImageEditorPanel = function(file){
		API.fn('editor', function(){
			new NS.ImageEditorPanel(new NS.File(file));
		});
	};

	/**
	 * Запросить DataSet произвести обновление данных.
	 * 
	 * @method dsRequest
	 */
	API.dsRequest = function(){
		if (!Brick.objectExists('Brick.mod.filemanager.data')){
			return;
		}
		Brick.mod.filemanager.data.request(true);
	};
};
