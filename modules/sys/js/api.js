/*
@version $Id$
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Sys
 * @namespace Brick.mod.sys
 */
var Component = new Brick.Component();
Component.entryPoint = function(){
	
	var NS = this.namespace;
	
	/**
	 * API модуля Sys
	 * 
	 * @class API
	 * @extends Brick.Component.API
	 * @static
	 */
	var API = NS.API;
	
	API.showConfigWidget = function(container){
		API.fn('cp_config', function(){
			var widget = new NS.ConfigWidget(container);
			API.addWidget('ConfigWidget', widget);
			API.dsRequest();
		});
	};

	API.showTemplateWidget = function(container){
		API.fn('cp_template', function(){
			var widget = new NS.TemplateWidget(container);
			API.addWidget('TemplateWidget', widget);
			API.dsRequest();
		});
	};
	
	API.showPermissionWidget = function(container){
		API.fn('cp_permission', function(){
			var widget = new NS.PermissionWidget(container);
			API.addWidget('PermissionWidget', widget);
			API.dsRequest();
		});
	};

	API.showModulesWidget = function(container){
		API.fn('cp_modules', function(){
			new NS.ModulesWidget(container);
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
