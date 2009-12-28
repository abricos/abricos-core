/*
@version $Id: api.js 55 2009-09-20 11:57:32Z roosit $
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Sys
 * @namespace Brick.mod.sys
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
	 * API модуля Sys
	 * 
	 * @class API
	 * @extends Brick.Component.API
	 * @static
	 */
	var API = NS.API;
	
	API.showManagerWidget = function(container){
		API.fn('cp_manager', function(){
			var widget = new NS.ManagerWidget(container);
			API.addWidget('ManagerWidget', widget);
			API.dsRequest();
		});
	};
	
	API.showPermissionWidget = function(container){
		API.fn('cp_manager', function(){
			var widget = new NS.PermissionWidget(container);
			API.addWidget('PermissionWidget', widget);
			API.dsRequest();
		});
	};

	/**
	 * Запросить DataSet произвести обновление данных.
	 * 
	 * @method dsRequest
	 */
	API.dsRequest = function(){
		if (!Brick.objectExists('Brick.mod.sys.data')){
			return;
		}
		Brick.mod.sys.data.request(true);
	};
	
};