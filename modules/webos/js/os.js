/*
@version $Id: manager.js 156 2009-11-09 08:17:11Z roosit $
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Webos
 * @namespace Brick.mod.webos
 */

var Component = new Brick.Component();
Component.requires = {
	yahoo: ['dom', 'dragdrop', 'resize'],
    mod:[
         {name: 'webos', files: ['api.js']},
         {name: 'sys', files: ['container.js', 'permission.js']}
    ]
};
Component.entryPoint = function(){
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var __selfCT = this;
	
	var NS = this.namespace,
		TMG = this.template,
		TM = TMG.get(),
		T = TM.data,
		TId = TM.idManager;
	
(function(){

	var BrickPanel = Brick.widget.Panel;
	
	var Panel = function(config){
		config = config || {};
		
		if (config.modal){
			config.parentNode = document.body;
		}else{
			config.parentNode = NS.Workspace.instance.container;
		}
		
        Panel.superclass.constructor.call(this, config);
	};
	Panel.STATE_NORMAL = 0;
	Panel.STATE_MAXIMIZED = 1;
	Panel.STATE_MINIMIZED = 2;
	
	YAHOO.extend(Panel, BrickPanel, {
		init: function(el, config){
			Panel.superclass.init.call(this, el, config);
			if (!config.modal){
				NS.Workspace.instance.registerPanel(this);
			}
		}
	});
	
	Panel.showPanel = BrickPanel.showPanel;
	
	NS.Panel = Panel;

	Brick.widget.Panel = Panel;
})();

(function(){
	
	var ApplicationManager = new (function(){
		
		var apps = [];

		// зарегистрировать приложение
		this.register = function(app){
			apps[apps.length] = app;
		};
		
		this.each = function(func){
			for (var i=0;i<apps.length;i++){
				if (func(apps[i])){
					return apps[i];
				}
			}
			return null;
		};
		
		
		// Автозагрузка
		var startup = [];
		
		this.startupRegister = function(func){
			startup[startup.length] = func;
		};
		
		this.startupEach = function(func){
			for (var i=0;i<startup.length;i++){
				func(startup[i]);
			}
		};
		
	});
	
	NS.ApplicationManager = ApplicationManager;
})();

(function(){
	
	var LW = 80, LH = 80, DX = 20, DY = 20;
	
	var Workspace = function(){
		var container = Dom.get("workspace");
		this.init(container);
	};
	
	Workspace.instance = null;
	
	Workspace.prototype = {
		
		_panels: {},
		
		init: function(container){
			Workspace.instance = this;
			this.labels = {};
			this.container = container;
			this.panelManager = new YAHOO.widget.OverlayManager();
			
			var __self = this;
			Brick.Permission.load(function(){
				__self._initApplication();
			});
			
			var __self = this;
            E.on(window, "resize", function(event){
            	__self._setWorkspaceSize();
            });
		},
		
		_initApplication: function(){
			this._setWorkspaceSize();
			var list = [];
			// сформировать список модулей имеющих компонент 'app' в наличие
			for (var m in Brick.Modules){
				if (Brick.componentExists(m, 'app') && !Brick.componentLoaded(m, 'app')){
					list[list.length] = {name: m, files:['app.js']};
				}
			}
			var __self = this;
			if (list.length > 0){
				Brick.Loader.add({ 
					mod: list,
					onSuccess: function() { 
						__self.renderDesktopLabels(); 
					}
				});
			}else{
				__self.renderDesktopLabels(); 
			}
		},
		
		_setWorkspaceSize: function(){
			var r = Dom.getClientRegion();
			var el = this.container;
			
            Dom.setStyle(el, "width", r.width);
            Dom.setStyle(el, "height", r.height);
		},
		
		renderDesktopLabels: function(){
			var __self = this;
			NS.ApplicationManager.each(function(app){
				if (!__self.labelExist(app.getId())){
					var label = new NS.DesktopLabel(app);
					__self.addLabel(label);
				}
			});
			
			// startup
			NS.ApplicationManager.startupEach(function(startup){
				startup();
			});
		},
		
		labelExist: function(labelName){
			if (this.labels[labelName]){
				return true;
			}
			return false;
		},
		
		addLabel: function(label){
			if (this.labelExist(label.getId())){
				return;
			}
			label.buildLabel(this, DX, DX);
			this.labels[label.getId()] = label;
			this.orderLabelPosition();
		},
		
		orderLabelPosition: function(){
			var x = DX, y = DY;
			for (var n in this.labels){
				var lbl = this.labels[n];
				lbl.setPositionLabel(x, y);
				y += DX+LH;
			}
		},
		
		registerPanel: function(panel){
			
			var pnls = this._panels;
			for (var n in pnls){
				var pnl = pnls[n];
				if (pnl.isClosePanel){
					try{
						pnl.destroy();
					}catch(ex){
					};
					delete pnls[n];
				}
			}
			
			this._panels[panel.globalId] = panel;
			
			this.panelManager.register(panel);
		}
	};
	NS.Workspace = Workspace;
})();

(function(){
	
	var globalId = 1;
	
	var DesktopLabel = function(app){
		this.initLabel(app);
	};
	YAHOO.extend(DesktopLabel, YAHOO.util.DD, { 
		_TM: null,
		_T: null,
		_TId: null,
		initLabel: function(app){
		
			this.app = app;
		
			var tm = TMG.get(globalId++, 'label');
			this._T = tm.data;
			this._TId = tm.idManager;
			this._TM = tm;
			
		}, 
		getId: function(){
			return this.app.getId();
		},
		buildLabel: function(workspace){
			var app = this.app;
			var div = document.createElement('DIV');
			div.innerHTML = this._TM.replace('label', {
				'name': app.name,
				'icon': app.icon,
				'title': app.getTitle()
			});
			var el = div.childNodes[0];
			el.style.display = 'none';
			div.removeChild(el);
			
			workspace.container.appendChild(el);
			this.element = el;
			el.style.display = '';
			
			// call DragDrop.init method
			this.init(this.element, '', {});
			
			E.on(el, 'click', this.onClickLabel, this, true);
			
			this._ddmove = false;
		},
		
		onClickLabel: function(){
			if (this._ddmove){
				this._ddmove = false;
				return;
			}
			
			this.app.fireEntryPoint();
		}, 
		
		setPositionLabel: function(left, top){
			var el = this.element;
			el.style.left = left+'px';
			el.style.top = top+'px';
		},
		
		startDrag: function(x, y){
			var el = this.getEl();
			
			Dom.setStyle(el, "opacity", 0.2); 
			
			var style = el.style;

	        this.origZ = style.zIndex;
	        style.zIndex = 999;
	        this.origCursor = style.cursor;
	        style.cursor = 'move';
		},
		
		endDrag: function(e) {
			var el = this.getEl();
			Dom.setStyle(el, "opacity", 1); 
			var style = el.style;
			
	        style.zIndex = this.origZ;
	        style.cursor = this.origCursor;
	        this._ddmove = true;
	    }
		
	});
	
	NS.DesktopLabel = DesktopLabel; 
})();

(function(){
	
	/**
	 * Приложение WebOS.
	 * 
	 * @class Application
	 * @constructor
	 * @param {String} moduleName Имя модуля которому пренадлежит приложение.
	 * @param {String} name Имя приложения
	 */
	var Application = function(moduleName, name){
		name = name || moduleName;

		/**
		 * Имя модуля.
		 * @property moduleName
		 * @type String
		 */
		this.moduleName = moduleName;
		
		/**
		 * Имя приложения
		 * @property name
		 * @type String
		 * @default <i>moduleName</i>
		 */
		this.name = name;
		
		/**
		 * Надпись ярлыка.
		 * @property title
		 * @type String
		 */
		this.title = '';
		
		/**
		 * Идентификатор надписи в менеджере фраз. Например: "mod.user.cp.title"
		 * @property titleId
		 * @type String
		 * @default mod.<i>moduleName</i>.cp.title
		 */
		this.titleId = "mod."+moduleName+'.app.title';
		
		/**
		 * Путь к иконке
		 * @property icon
		 * @type String
		 * @default modules/user/css/images/cp_icon_default.gif
		 */
		this.icon = "";
		
		/**
		 * Компонент этого модуля, который должен быть загружен, 
		 * когда будет клик по ярлыку приложения.<br>
		 * Установите значение пустым, если подгрузка компонента ненужна.  
		 * @property entryComponent
		 * @type String
		 */
		this.entryComponent = '';
		
		/**
		 * Точка входа (функция), которая будет выполнена по клику на ярлык. 
		 * @property entryPoint
		 * @type String | Function
		 */
		this.entryPoint = null;
		
		/**
		 * Получить надпись.
		 * 
		 * @method getTitle
		 * @return {String}  
		 */
		this.getTitle = function(){
			var phrase = Brick.util.Language.getc(this.titleId);
			if (L.isString(phrase)){
				return phrase;
			}
			return this.title != '' ? this.title : this.name; 
		};
		
		/**
		 * Получить идентификатор. 
		 * 
		 * @method getId
		 * @return {String}  
		 */
		this.getId = function(){
			return this.moduleName+'_'+this.name;
		};
		
		/**
		 * Пользователь запустил приложение, необходимо выполнить 
		 * функцию указанную в entryPoint. Если указан entryComponent,
		 * то необходимо его подгрузить перед выполнением функции.
		 * 
		 * @method fireEntryPoint
		 */
		this.fireEntryPoint = function(){
			
			var __self = this;
			
			var fire = function(){
				var fn;
				if (L.isFunction(__self.entryPoint)){
					fn = __self.entryPoint;
				}else{
					fn = Brick.convertToObject(__self.entryPoint); 
				}
				if (L.isFunction(fn)){
					fn();
				}
			};
			
			if (this.entryComponent != ''){
				if (!Brick.componentLoaded(this.moduleName, this.entryComponent)){
					Brick.Component.API.fireFunction(this.moduleName, this.entryComponent, function(){
						fire();
					});
				}else{
					fire();
				}
			}else{
				fire();
			}
		};

	};
	
	NS.Application = Application;
	
})();

(function(){
	
	
})();

};