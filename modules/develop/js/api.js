/*
@version $Id: api.js 55 2009-09-20 11:57:32Z roosit $
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Develop
 * @namespace Brick.mod.develop
 */
var Component = new Brick.Component();
Component.requires = { yahoo: ['dom'] };
Component.entryPoint = function(){
	
	var NS = this.namespace;
	
	/**
	 * API модуля 
	 * 
	 * @class API
	 * @extends Brick.Component.API
	 * @static
	 */
	var API = NS.API;
	
	API.runDevelopApp = function(){
		API.fn('ide', function(){
			new NS.IDEPanel();
		});
	};
};
