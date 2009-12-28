/*
@version $Id: manager.js 173 2009-11-11 14:35:16Z roosit $
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Feedback
 * @namespace Brick.mod.feedback
 */
var Component = new Brick.Component();
Component.requires = {
	yahoo: ['tabview','dragdrop'],
	mod:[
		{name: 'feedback', files: ['api.js']},
		{name: 'sys', files: ['data.js', 'form.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace, 
		TMG = this.template; 
	
	var API = NS.API;
	
	if (!Brick.objectExists('Brick.mod.filemanager.data')){
		Brick.mod.feedback.data = new Brick.util.data.byid.DataSet('filemanager');
	}
	var DATA = Brick.mod.filemanager.data;
	
(function(){
	
	var ManagerWidget = function(container){
		
		var TM = TMG.build('widget'), T = TM.data, TId = TM.idManager;
		this._TM = TM; this._T = T; this._TId = TId;

		
		container = L.isString(container) ? Dom.get(container) : container;
		this.init(container);
	};
	ManagerWidget.prototype = {
		pages: null,
		
		init: function(container){
			container.innerHTML = this._T['widget'];
			
			var tabView = new YAHOO.widget.TabView(this._TId['widget']['id']);
			var pages = {};
			
			// pages['messages'] = new NS.MessageListWidget(Dom.get(TId['widget']['messages']));
			// pages['config'] = new NS.ConfigWidget(Dom.get(TId['widget']['config']));
			
			this.pages = pages;
	
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
		}, 
		onClick: function(el){
			for (var n in this.pages){
				if (this.pages[n].onClick(el)){ return true; }
			}
			return false;
		}
	};
	
	NS.ManagerWidget = ManagerWidget;
})();

(function(){
	var UserGroupLimitWidget = function(container){
		var TM = TMG.build('limitwidget,limitrowwait,limitrow,limittable'), 
			T = TM.data, TId = TM.idManager;
		this._TM = TM; this._T = T; this._TId = TId;

		container = L.isString(container) ? Dom.get(container) : container;
		this.init(container);
	};
	UserGroupLimitWidget.prototype = {
		init: function(container){
		
		}
	};
	
	NS.UserGroupLimitWidget = UserGroupLimitWidget;
	
})();

};