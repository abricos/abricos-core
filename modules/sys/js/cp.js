/*
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
	
	if (Brick.Permission.check('user', '50') != 1){ return; }
	
	var cp = Brick.mod.user.cp;

	var menuItem = new cp.MenuItem(this.moduleName, 'manager');
	menuItem.icon = '/modules/sys/images/cp_icon.gif';
	menuItem.titleId = 'mod.sys.cp.title';
	menuItem.entryComponent = 'api';
	menuItem.entryPoint = 'Brick.mod.sys.API.showConfigWidget';
	cp.MenuManager.add(menuItem);
	
	var menuItem = new cp.MenuItem(this.moduleName, 'modules');
	menuItem.icon = '/modules/sys/images/cp_icon.gif';
	menuItem.titleId = 'mod.sys.cp.modules.title';
	menuItem.entryComponent = 'api';
	menuItem.entryPoint = 'Brick.mod.sys.API.showModulesWidget';
	cp.MenuManager.add(menuItem);

	// TODO: Временно отключено
	return;
	var menuItem = new cp.MenuItem(this.moduleName, 'permission');
	menuItem.icon = '/modules/sys/images/cp_icon.gif';
	menuItem.titleId = 'mod.sys.cp.permission.title';
	menuItem.entryComponent = 'api';
	menuItem.entryPoint = 'Brick.mod.sys.API.showPermissionWidget';
	cp.MenuManager.add(menuItem);
	
};
