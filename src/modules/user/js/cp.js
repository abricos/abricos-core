/*
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[{name: 'user', files: ['cpanel.js']}]
};
Component.entryPoint = function(){
	
	if (Brick.Permission.check('user', '50') != 1){ return; }
	var cp = Brick.mod.user.cp;

	var menuItem = new cp.MenuItem('{C#MODNAME}', 'manager');
	menuItem.icon = '/modules/user/css/images/cp_icon.gif';
	menuItem.titleId = 'mod.user.cp.title';
	menuItem.entryComponent = 'manager';
	menuItem.entryPoint = 'Brick.mod.user.API.showManagerWidget';
	cp.MenuManager.add(menuItem);
};
