/*
@version $Id: cp.js 177 2009-11-16 15:40:07Z roosit $
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

	var menuItem = new cp.MenuItem(this.moduleName, 'filemanager');
	menuItem.icon = '/modules/filemanager/images/cp_icon.gif';
	menuItem.titleId = 'mod.filemanager.cp.title';
	menuItem.entryComponent = 'api';
	menuItem.entryPoint = 'Brick.mod.filemanager.API.showManagerWidget';
	cp.MenuManager.add(menuItem);
};
