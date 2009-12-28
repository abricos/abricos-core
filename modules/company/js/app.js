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
	
	var app = new os.Application(this.moduleName);
	app.icon = '/modules/company/images/app_icon.gif';
	app.entryComponent = 'api';
	app.entryPoint = 'Brick.mod.company.API.runApplication';
	
	os.ApplicationManager.register(app);
	
	var NS = this.namespace;
	var API = NS.API;
	os.ApplicationManager.startupRegister(function(){
		API.fn('employee', function(){
			new NS.EmployeeInfoPanel(Brick.env.user.id);
			API.dsRequest();
		});
	});
};
