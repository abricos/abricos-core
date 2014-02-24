/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
        {name: 'user', files: ['cpanel.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace, 
		TMG = this.template,
		API = NS.API,
		R = NS.roles;

	var buildTemplate = this.buildTemplate;	
	
	var BoardPanel = function(){
		BoardPanel.superclass.constructor.call(this, {
			fixedcenter: true, width: '790px',
			controlbox: 1
		});
	};
	YAHOO.extend(BoardPanel, Brick.widget.Panel, {
		initTemplate: function(){
			buildTemplate(this, 'panel');
			return this._TM.replace('panel');
		},
		onLoad: function(){
			var TM = this._TM;
			
			this.cpWidget = new NS.cp.Widget(TM.getEl('panel.widget'));
		},
		destroy: function(){
			this.cpWidget.destroy();
			BoardPanel.superclass.destroy.call(this);
		}
	});
	NS.BoardPanel = BoardPanel;
	
	var activePanel = null;
	API.showBoardPanel = function(){
		if (L.isNull(activePanel) || activePanel.isDestroy()){
			activePanel = new BoardPanel();
		}
		return activePanel;
	};
};