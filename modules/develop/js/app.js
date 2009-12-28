/*
@version $Id: api.js 55 2009-09-20 11:57:32Z roosit $
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
	
	var app = new os.Application(this.moduleName, 'develop');
	app.icon = '/modules/develop/images/app_icon.gif';
	app.titleId = 'mod.develop.app.title';
	app.entryComponent = 'api';
	app.entryPoint = 'Brick.mod.develop.API.runDevelopApp';
	
	os.ApplicationManager.register(app);
};
