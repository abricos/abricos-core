/*
@version $Id$
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[{name: 'user', files: ['cpanel.js']}]
};
Component.entryPoint = function(){
	
	if (!Brick.env.user.isAdmin()){ return; }
	var cp = Brick.mod.user.cp;

	var menuItem = new cp.MenuItem(this.moduleName, 'manager');
	menuItem.icon = '/modules/user/css/images/cp_icon.gif';
	menuItem.titleId = 'mod.user.cp.title';
	menuItem.entryComponent = 'api';
	menuItem.entryPoint = 'Brick.mod.user.API.showManagerWidget';
	cp.MenuManager.add(menuItem);
};
