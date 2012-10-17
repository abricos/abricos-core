/*
@version $Id$
@package Abricos
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		// {name: '{C#MODNAME}', files: ['lib.js']}
	]
};
Component.entryPoint = function(NS){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var UID = Brick.env.user.id;
	var buildTemplate = this.buildTemplate;
	
	var RegisterWidget = function(container, config){
		config = L.merge({ }, config || {});
		this.init(container, config);
	};
	RegisterWidget.prototype = {
		init: function(container, config){
			this.cfg = config;
			
			var TM = buildTemplate(this, 'widget'), __self = this;
			container.innerHTML = TM.replace('widget');
			
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
		},
		destroy: function(){
			var el = this._TM.getEl('list.id');
			el.parentNode.removeChild(el);
		},
		onClick: function(el){
			var TId = this._TId, tp = TId['widget'];
			switch(el.id){
			// case (tp['bcancel']+'-'): return true;
			}
			return false;
		},
		getSaveData: function(){
			var sd = {};
			
			return sd;
		}
	});
	NS.RegisterWidget = RegisterWidget;	
};