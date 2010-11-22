/*
@version $Id$
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[{name: 'webos', files: ['os.js']}]
};
Component.entryPoint = function(){
	
	if (!Brick.env.user.isRegister()){ return; }
	
	var os = Brick.mod.webos;
	
	var app = new os.Application(this.moduleName, 'user-cp');
	app.icon = '/modules/user/images/app_icon.gif';
	app.titleId = 'mod.user.app.title.cp';
	app.entryComponent = 'api';
	app.entryPoint = 'Brick.mod.user.API.runControlPanelApp';
	
	os.ApplicationManager.register(app);
	
	
	app = new os.Application(this.moduleName, 'user-exit');
	app.icon = '/modules/user/images/app_icon_logout.gif';
	app.titleId = 'mod.user.app.title.exit';
	app.entryComponent = 'api';
	app.entryPoint = 'Brick.mod.user.API.userLogout';
	
	os.ApplicationManager.register(app);

	
};
