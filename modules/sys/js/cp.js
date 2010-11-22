/*
@version $Id$
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Sys
 */

var Component = new Brick.Component();
Component.requires = {
	mod:[{name: 'user', files: ['cpanel.js']}]
};
Component.entryPoint = function(){
	
	if (!Brick.env.user.isAdmin()){ return; }
	var cp = Brick.mod.user.cp;

	var menuItem = new cp.MenuItem(this.moduleName, 'manager');
	menuItem.icon = '/modules/sys/images/cp_icon.gif';
	menuItem.titleId = 'sys.title';
	menuItem.entryComponent = 'api';
	menuItem.entryPoint = 'Brick.mod.sys.API.showConfigWidget';
	cp.MenuManager.add(menuItem);

	var menuItem = new cp.MenuItem(this.moduleName, 'templates');
	menuItem.icon = '/modules/sys/images/cp_icon.gif';
	menuItem.titleId = 'sys.templates.title';
	menuItem.entryComponent = 'api';
	menuItem.entryPoint = 'Brick.mod.sys.API.showTemplateWidget';
	cp.MenuManager.add(menuItem);
	
	var menuItem = new cp.MenuItem(this.moduleName, 'modules');
	menuItem.icon = '/modules/sys/images/cp_icon.gif';
	menuItem.titleId = 'sys.modules.title';
	menuItem.entryComponent = 'api';
	menuItem.entryPoint = 'Brick.mod.sys.API.showModulesWidget';
	cp.MenuManager.add(menuItem);

	// TODO: Временно отключено
	return;
	var menuItem = new cp.MenuItem(this.moduleName, 'permission');
	menuItem.icon = '/modules/sys/images/cp_icon.gif';
	menuItem.titleId = 'sys.permission.title';
	menuItem.entryComponent = 'api';
	menuItem.entryPoint = 'Brick.mod.sys.API.showPermissionWidget';
	cp.MenuManager.add(menuItem);
	
};
