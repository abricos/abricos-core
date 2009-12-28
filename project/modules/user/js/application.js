/*
@version $Id: cpanel.js 155 2009-11-09 06:41:35Z roosit $
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module User
 * @namespace Brick.mod.user.cp
 */

var Component = new Brick.Component();
Component.requires = {
	mod:[
	     {name: 'webos', files: ['os.js']},
	     {name: 'user', files: ['cpanel.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace,
		API = this.namespace.API,
		TMG = this.template;

	Brick.namespace('Brick.mod.user.cp');
	
	var Application = function(){
		this._TM = TMG.build('app');
		this._T = this._TM.data;
		this._TId = this._TM.idManager,
		
		Application.superclass.constructor.call(this, {
			controlbox: 1,
			fixedcenter: true,
            width: '920px',
            height: '570px',
			minWidth: 800,
			minHeight: 400
		});
	};
	
	YAHOO.extend(Application, Brick.mod.webos.Panel, {
		initTemplate: function(){
			return this._T['app'];
		},
		onLoad: function(){
			this.widget = new NS.cp.Widget(this.body);
		}
	});
	
	NS.cp.Application = Application;
};
