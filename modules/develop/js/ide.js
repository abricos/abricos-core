/*
@version $Id: manager.js 156 2009-11-09 08:17:11Z roosit $
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Develop
 * @namespace Brick.mod.develop
 */

var Component = new Brick.Component();
Component.requires = {
    mod:[
	    {name: 'sys', files: ['data.js','form.js','container.js']},
        {name: 'webos', files: ['os.js']}
    ]
};
Component.entryPoint = function(){
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var OS = Brick.mod.webos;

	var __selfCT = this;
	
	var NS = this.namespace,
		TMG = this.template;

	var API = NS.API;
	
	if (!Brick.objectExists('Brick.mod.webos.data')){
		Brick.mod.webos.data = new Brick.util.data.byid.DataSet('webos');
	}
	var DATA = Brick.mod.webos.data;

	
	NS.createNamespace = function(){
		// var site = "webos.abricos.org";
		var site = location.host;
		
		var arr = site.split('.');
		var narr = [];
		for (var i=arr.length-1;i >= 0; i--){
			narr[narr.length] = arr[i];
		}
		// var ns = narr.join('.') +'.'+Brick.util.Translite.ruen(Brick.env.user.name);
		var ns = narr.join('.');
		return ns;
	};
	
(function(){
	
	var panelId = 1;
	
	var IDEPanel = function(){
		this._TM = TMG.get(panelId++, 'developpanel,menubar');
		this._T = this._TM.data;
		this._TId = this._TM.idManager;
		
		IDEPanel.superclass.constructor.call(this, {
			width: "640px", height: "480px",
			menubar: this._TId['menubar']['id']
		});
	};
	
	YAHOO.extend(IDEPanel, OS.Panel, {
		initTemplate: function(){
			return this._TM.replace('developpanel', {
				'menubar': this._T['menubar']
			});
		},
		onLoad: function(){
			this.applist = new NS.ApplicationListWidget(this._TM.getEl('developpanel.applist'));
		},
		onClick: function(el){
			
			var tp = this._TId['menubar'];
			switch(el.id){
			case tp['newapp']:
				this.showCreateApplicationPanel();
				return true;
			case tp['about']:
				this.showAboutPanel();
				return true;
			}
			return false;
		},
		
		showCreateApplicationPanel: function(){
			new NS.ApplicationInfoPanel();
		},
		
		showAboutPanel: function(){
			Brick.widget.Panel.showPanel({
				template: TMG.build('about').data['about'],
				modal: true,
				width: '300px'
			});
		}
	});

	NS.IDEPanel = IDEPanel;
	
})();

(function(){
	
	var ApplicationListWidget = function(container){
		container = L.isString(container) ? Dom.get(container) : container;
		this.init(container);
	};
	
	ApplicationListWidget.prototype = {
		init: function(container){
			var TM = TMG.build('applistwidget,applisttable,applistrow,applistrowwait');
				T = TM.data;
				TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T['applistwidget'];
			this.renderAwaitTable();
		},
		renderAwaitTable: function(){
			this._TM.getEl('applistwidget.table').innerHTML = this._TM.replace('applisttable',{
				'rows': this._T['applistrowwait']
			});
		}
	};
	
	NS.ApplicationListWidget = ApplicationListWidget;
	
})();

(function(){
	
	var TM, T, TId;
	
	var ApplicationInfoPanel = function(){
		
		TM = TMG.build('appinfo');
		T = TM.data;
		TId = TM.idManager;
		
		ApplicationInfoPanel.superclass.constructor.call(this, {
			width: "400px", height: "250px",
			modal: true, resize: false
		});
	};
	YAHOO.extend(ApplicationInfoPanel, Brick.mod.webos.Panel, {
		el: function(name){ return Dom.get(TId['appinfo'][name]);},
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			return T['appinfo'];
		},
		onLoad: function(){
			var gel = this.el;
			gel('bcreate').style.display = '';
			this.setelv('namespace');
			gel('namespace').value = NS.createNamespace(); 
		}, 
		onClick: function(el){
			var tp = TId['appinfo'];
			switch(el.id){
			case tp['bcreate']:
				this.actionDisable(tp['bcancel']);
				return true;
			case tp['bcancel']:
				this.actionEnable();
				return true;
			}
			return false;
		}

	});
	NS.ApplicationInfoPanel = ApplicationInfoPanel;
})();

};