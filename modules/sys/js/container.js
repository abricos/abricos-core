/*
@version $Id$
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Sys
 * @namespace Brick.widget
 */

var Component = new Brick.Component();
Component.requires = {
	yahoo: ['container']
};
Component.entryPoint = function(){
	
	Brick.namespace('widget');

	var Dom = YAHOO.util.Dom,
		UA = YAHOO.env.ua,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var TMG = this.template,
		TM = TMG.get(),
		T = TM.data,
		TId = TM.idManager;
	
	var m_oMinimizedIconTemplate,
		m_oMaximizedIconTemplate,
		m_oNormalIconTemplate,
		m_oCloseIconTemplate;
	
	// счетчик глобального идентификатора каждой панели 
	var _globalIdCounter = 0;
	
	YAHOO.widget.Overlay.VIEWPORT_OFFSET = 0;

	/**
	 * Панель
	 * 
	 * @class Panel
	 * @extends YAHOO.widget.Panel
	 * @constructor
	 * @param {Object} config Конфигурация панели. 
	 */
	var Panel = function(config){
		
		/**
		 * Уникальный идентификатор панели.
		 * 
		 * @property globalId
		 * @type String
		 */
		this.globalId = 'panel'+ (_globalIdCounter++);
		
		config = L.merge({
            draggable: true,
            visible: false,
            autofillheight: "body", 
            constraintoviewport:true,
            template: "",
            elbody: null,
            parentNode: document.body,
            zindex: Brick.DEFAULT_ZINDEX || null
        }, config || {});
		
		var el = this._buildPanel(config);
        Panel.superclass.constructor.call(this, el, config);
	};

	Panel.CONTROLBOX_CLOSE = 0;
	Panel.CONTROLBOX_FULL = 1;
	Panel.CONTROLBOX_HIDE = 2;
	
	Panel.STATE_NORMAL = 0;
	Panel.STATE_MAXIMIZED = 1;
	Panel.STATE_MINIMIZED = 2;

    DEFAULT_CONFIG = {
        "STATE": { 
            key: "state", 
            value: Panel.STATE_NORMAL, 
            validator: L.isNumber,
            supercedes: ['x', 'y', 'xy', 'fixedcenter', 'iframe']
        },
        "CONTROLBOX" : {
            key: "controlbox", 
            value: Panel.CONTROLBOX_CLOSE, 
            validator: L.isNumber 
        },
        "MINWIDTH" : {
            key: "minwidth", 
            value: 350, 
            validator: L.isNumber 
        },
        "MINHEIGHT" : {
            key: "minheight", 
            value: 200, 
            validator: L.isNumber 
        },
        "RESIZE" : {
            key: "resize", 
            value: true, 
            validator: L.isBoolean 
        },
        "OVERFLOW" : {
            key: "overflow", 
            value: true, 
            validator: L.isBoolean 
        },
        "RIGHT" : {
            key: "right", 
            value: null, 
            validator: L.isNumber, 
            supercedes: ['x','fixedcenter', 'iframe']
        },
        "BOTTOM" : {
            key: "bottom", 
            value: null, 
            validator: L.isNumber, 
            supercedes: ['y','fixedcenter', 'iframe']
        }
    };

	YAHOO.extend(Panel, YAHOO.widget.Panel, {
		_actionBlocked: false,
		_actionBlockedElements: null,
		_actionBlockedIgnore: {},
		
        initDefaultConfig: function () {
            Panel.superclass.initDefaultConfig.call(this);
            
            var cfg = this.cfg;

            cfg.addProperty(DEFAULT_CONFIG.RESIZE.key, { 
                handler: this.configResize, 
                value: DEFAULT_CONFIG.RESIZE.value, 
                validator: DEFAULT_CONFIG.RESIZE.validator, 
                supercedes: DEFAULT_CONFIG.RESIZE.supercedes 
            });

            cfg.addProperty(DEFAULT_CONFIG.CONTROLBOX.key, { 
                handler: this.configControlBox, 
                value: DEFAULT_CONFIG.CONTROLBOX.value, 
                validator: DEFAULT_CONFIG.CONTROLBOX.validator, 
                supercedes: DEFAULT_CONFIG.CONTROLBOX.supercedes 
            });

            cfg.addProperty(DEFAULT_CONFIG.STATE.key, { 
                handler: this.configState, 
                value: DEFAULT_CONFIG.STATE.value, 
                validator: DEFAULT_CONFIG.STATE.validator, 
                supercedes: DEFAULT_CONFIG.STATE.supercedes 
            });

            cfg.addProperty(DEFAULT_CONFIG.MINWIDTH.key, { 
                handler: this.configMinWidth, 
                value: DEFAULT_CONFIG.MINWIDTH.value, 
                validator: DEFAULT_CONFIG.MINWIDTH.validator, 
                supercedes: DEFAULT_CONFIG.MINWIDTH.supercedes 
            });

            cfg.addProperty(DEFAULT_CONFIG.MINHEIGHT.key, { 
                handler: this.configMinHeight, 
                value: DEFAULT_CONFIG.MINHEIGHT.value, 
                validator: DEFAULT_CONFIG.MINHEIGHT.validator, 
                supercedes: DEFAULT_CONFIG.MINHEIGHT.supercedes 
            });
            
            cfg.addProperty(DEFAULT_CONFIG.OVERFLOW.key, { 
                handler: this.configOverflow, 
                value: DEFAULT_CONFIG.OVERFLOW.value, 
                validator: DEFAULT_CONFIG.OVERFLOW.validator, 
                supercedes: DEFAULT_CONFIG.OVERFLOW.supercedes 
            });
            cfg.addProperty(DEFAULT_CONFIG.RIGHT.key, { 
                handler: this.configRight, 
                value: DEFAULT_CONFIG.RIGHT.value, 
                validator: DEFAULT_CONFIG.RIGHT.validator, 
                supercedes: DEFAULT_CONFIG.RIGHT.supercedes 
            });
            cfg.addProperty(DEFAULT_CONFIG.BOTTOM.key, { 
                handler: this.configBottom, 
                value: DEFAULT_CONFIG.BOTTOM.value, 
                validator: DEFAULT_CONFIG.BOTTOM.validator, 
                supercedes: DEFAULT_CONFIG.BOTTOM.supercedes 
            });
		},
		
        configClose: function (type, args, obj) {},
		
        configControlBox: function (type, args, obj) {
            var val = args[0],
            	elMinimized = this.elMimimized,
            	elMaximized = this.elMaximized,
            	elNormal = this.elNormal,
            	elClose = this.elClose;

            if (!elMinimized){
            	if (!m_oMinimizedIconTemplate){
            		m_oMinimizedIconTemplate = document.createElement("a");
            		m_oMinimizedIconTemplate.className = "container-minimized";
            		m_oMinimizedIconTemplate.href = "#";
            	}
            	elMinimized = m_oMinimizedIconTemplate.cloneNode(true);
            	this.innerElement.appendChild(elMinimized);
            	elMinimized.innerHTML = "";
            	E.on(elMinimized, "click", this._doMinimized, this, true);
            	this.elMinimized = elMinimized;
            }
            
            if (!elMaximized){
            	if (!m_oMaximizedIconTemplate){
            		m_oMaximizedIconTemplate = document.createElement("a");
            		m_oMaximizedIconTemplate.className = "container-maximized";
            		m_oMaximizedIconTemplate.href = "#";
            	}
            	elMaximized = m_oMaximizedIconTemplate.cloneNode(true);
            	this.innerElement.appendChild(elMaximized);
            	elMaximized.innerHTML = "";
            	E.on(elMaximized, "click", this._doMaximized, this, true);
            	this.elMaximized = elMaximized;
            }

            if (!elNormal){
            	if (!m_oNormalIconTemplate){
            		m_oNormalIconTemplate = document.createElement("a");
            		m_oNormalIconTemplate.className = "container-normal";
            		m_oNormalIconTemplate.href = "#";
            	}
            	elNormal = m_oNormalIconTemplate.cloneNode(true);
            	this.innerElement.appendChild(elNormal);
            	elNormal.innerHTML = "";
            	E.on(elNormal, "click", this._doMaximized, this, true);
            	this.elNormal = elNormal;
            }
            
            if (!elClose){
            	if (!m_oCloseIconTemplate){
            		m_oCloseIconTemplate = document.createElement("a");
            		m_oCloseIconTemplate.className = "container-close";
            		m_oCloseIconTemplate.href = "#";
            	}
            	elClose = m_oCloseIconTemplate.cloneNode(true);
            	this.innerElement.appendChild(elClose);
            	elClose.innerHTML = "";
            	E.on(elClose, "click", this._doClose, this, true);
            	this.elClose = elClose;
            }

            if (val == Panel.CONTROLBOX_HIDE){
                elMinimized.style.display = "none";
                elMaximized.style.display = "none";
                elNormal.style.display = "none";
                elClose.style.display = "none";
            }else if (val == Panel.CONTROLBOX_CLOSE){
                elMinimized.style.display = "none";
                elMaximized.style.display = "none";
                elNormal.style.display = "none";
                elClose.style.display = "block";
            } else {
                elMinimized.style.display = "block";
                elMaximized.style.display = "block";
                elNormal.style.display = "none";
                elClose.style.display = "block";
            }
		},
		
		_brickFirstPanelInit: true,
		
		_savedState: Panel.STATE_NORMAL,
		_savedX: 0, _savedY: 0, _savedW: 0, _savedH: 0,
		_savedShowState: Panel.STATE_NORMAL,

		_setState: function(val){
			var cfg = this.cfg,
				el = this.element;
			
			if (val == this._savedState){ return; }
			
			if (this._savedState == Panel.STATE_MINIMIZED){
				this._showPanel();
				this._savedState = this._savedShowState;
				return;
			}
			if (val == Panel.STATE_MAXIMIZED){
				this._savedShowState = val;
				if (this._savedState == Panel.STATE_NORMAL){
					this._savedX = cfg.getProperty('x') || 0; 
					this._savedY = cfg.getProperty('y') || 0; 
					this._savedW = cfg.getProperty('width'); 
					this._savedH = cfg.getProperty('height');
				}

				var rg = Dom.getRegion(el.parentNode);
				var w = rg.width;
				var h = rg.height;

				cfg.setProperty("xy", [0, 0]);
				cfg.setProperty("width", w+'px');
				cfg.setProperty("height", h+'px');
				cfg.setProperty('draggable', false);
				cfg.setProperty('resize', false);
	            this._onResizePanel();
			}else if (val == Panel.STATE_NORMAL){
				this._savedShowState = val;
				cfg.setProperty("x", this._savedX);
				cfg.setProperty("y", this._savedY);
				cfg.setProperty("width", this._savedW);
				cfg.setProperty("height", this._savedH);
				cfg.setProperty('draggable', true);
				cfg.setProperty('resize', true);
				if (cfg.getProperty('fixedcenter')){
					this.center();
				}
	            this._onResizePanel();
			}else if (val == Panel.STATE_MINIMIZED){
				this._hidePanel();
			}
			this._savedState = val;
		},
		
        configState: function (type, args, obj) {
            var val = args[0], 
            	cfg = this.cfg,
            	parentNode = this.element.parentNode;
            
   			this._setState(val);

			if (cfg.getProperty('controlbox') == Panel.CONTROLBOX_FULL){
				if (val == Panel.STATE_MAXIMIZED){
	                this.elMaximized.style.display = "none";
	                this.elNormal.style.display = "block";
				}else if (val == Panel.STATE_NORMAL){
	                this.elMaximized.style.display = "block";
	                this.elNormal.style.display = "none";
				}
			}
		},
		
        configMinWidth: function (type, args, obj) {},
        configMinHeight: function (type, args, obj) {},
        
        _initResize: function(){
        	if (!YAHOO.util.Resize){ 
        		return; 
        	}
        	var cfg = this.cfg;

			var resizeconfig = {
				minWidth: cfg.getProperty('minwidth'),
				minHeight: cfg.getProperty('minheight'),
	            handles: ['t', 'r','b','br','l'], 
	            autoRatio: false,
	            status: false,
	            hiddenHandles: true
			};
			var el = this.element;
			var resize = new YAHOO.util.Resize(el, resizeconfig);
			resize.on("startResize", function(args) {
			    if (cfg.getProperty("constraintoviewport")) {
	                var clientRegion = Dom.getClientRegion();
	                var elRegion = Dom.getRegion(el);
	
	                resize.set("maxWidth", clientRegion.right - elRegion.left - YAHOO.widget.Overlay.VIEWPORT_OFFSET);
	                resize.set("maxHeight", clientRegion.bottom - elRegion.top - YAHOO.widget.Overlay.VIEWPORT_OFFSET);
	            } else {
	                resize.set("maxWidth", null);
	                resize.set("maxHeight", null);
	        	}
	        }, this, true);
			
			resize.on("resize", function(args) {
				var w = args.width,
					h = args.height;
				if (w > 0){
					cfg.setProperty("width", args.width + "px");
				}
				if (h > 0){
					cfg.setProperty("height", args.height + "px");
				}
	            this._onResizePanel();
	        }, this, true);
			
			this.resizeManager = resize;
        },
        
        configResize: function (type, args, obj) {
            var val = args[0],
            	resize = this.resizeManager,
            	cfg = this.cfg;
            
            if (val){
            	if (!resize){
            		var __self = this;
            		setTimeout(function(){
            			__self._initResize();
            		}, 300);
            	}else{
                	resize.unlock();
            	}
            }else if (resize){
            	resize.lock();
            }
		},
		
		configOverflow: function(type, args, obj){
            var val = args[0];
            if (val){
	        	Dom.addClass(this.body, 'overflow');
	        }else{
	        	Dom.removeClass(this.body, 'overflow');
	        }
		},

		configRight: function(type, args, obj){
            var val = args[0];
            if (L.isNull(val)){ return; }
            
            var cfg = this.cfg, el = this.element, 
            	viewPortWidth = Dom.getViewportWidth(),
            	elWidth = el.offsetWidth,
            	y = cfg.getProperty("y"),
            	x = viewPortWidth - elWidth - val;
	
	        Dom.setX(this.element, x, true);
	        cfg.setProperty("xy", [x, y], true);
		},
		
		configBottom: function(type, args, obj){
            var val = args[0];
            if (L.isNull(val)){ return; }
            
            var cfg = this.cfg, el = this.element,
            	viewPortHeight = Dom.getViewportHeight(),
            	elHeight = el.offsetHeight,
            	x = cfg.getProperty("x"),
            	y = viewPortHeight - elHeight - val;
            
	        Dom.setY(el, y, true);
	        cfg.setProperty("xy", [x, y], true);
		},

		_doMinimized: function(e){
            E.preventDefault(e);
			this.cfg.setProperty('state', Panel.STATE_MINIMIZED);
		},
		
		_doMaximized: function(e){
            E.preventDefault(e);
            
			var state = this._savedState == Panel.STATE_NORMAL ? 
					Panel.STATE_MAXIMIZED : Panel.STATE_NORMAL; 
			this.cfg.setProperty('state', state);
		},
		
		_doClose: function(e){
            E.preventDefault(e);
            this.close();
		},
		
		_showPanel: function(){
			if (this._isDestroyPanel){ return; }
			Panel.superclass.show.call(this);
			this.onShow();
		},
		
		_hidePanel: function(){
			Panel.superclass.hide.call(this);
			this.onHide();
		},
		
		_onResizePanel: function(){
			var rg = Dom.getRegion(this.body);
			this.onResize(rg);
		},
		
		center: function(){
			if (this.cfg.getProperty('state') != Panel.STATE_NORMAL){
				return;
			}
			Panel.superclass.center.call(this);
		},

		show: function(){
			this.cfg.setProperty('state', this._savedShowState);
		},

		hide: function(){
			this.cfg.setProperty('state', Panel.STATE_MINIMIZED);
		},
		
		closeEvent: null,
		
		close: function(){
			this.closeEvent.fire(this);
			this.onClose();
			this.destroy();
		},
		
		init: function(el, config){
			Panel.superclass.init.call(this, el, config);
			
			this.closeEvent = new YAHOO.util.CustomEvent();
			
	        var __self = this;
	        
			E.on(el, 'click', function(e){
				var el = E.getTarget(e);
	        	if (__self._actionBlocked && !__self._actionBlockedIgnore[el.id]){ return; }
				if (__self.onClick(el)){ 
		            E.preventDefault(e);
				}
			});
			
			Panel.superclass.render.call(this, config.parentNode);
	        
			this.onLoad();
			
            setTimeout(function () {
            	__self._showPanel();
            }, 100);
		},
		
		doCenterOnDOMEvent: function(){
			// Panel.superclass.doCenterOnDOMEvent.call(this);
		},
		
		_buildPanel: function(config){
			var div = document.createElement('DIV');
			div.id = Dom.generateId();
			div.innerHTML = (config.template || this.initTemplate()) + "<div class='ft'></div>"; 
			return div;
		},

		resizeManager: null,
		
		destroy: function(){
			if (!L.isNull(this.resizeManager)){
				this.resizeManager.destroy();
			}
			Panel.superclass.destroy.call(this);
			this._isDestroyPanel = true;
		},
		
		isDestroy: function(){
			return this._isDestroyPanel;
		},
		
		/**
		 * Абстрактный метод, который возвращает HTML код панели.
		 * 
		 * @method initTemplate
		 * @return {String} HTML код панели
		 */
		initTemplate: function(){ return ""; },
		onClick: function(el){ return false; },
		
		/**
		 * Абстрактный метод, который будет вызван когда панель 
		 * будет создана.
		 * 
		 * @method onLoad
		 */
		onLoad: function(){},
		
		/**
		 * Абстрактный метод, который будет вызван когда панель 
		 * будет изменена в размере.
		 * 
		 * @method onResize
		 */
		onResize: function(){},
		
		/**
		 * Абстрактный метод, который будет вызван когда панель
		 * будет показана.
		 * @method onShow
		 */
		onShow: function(){},
		
		/**
		 * Абстрактный метод, который будет вызван когда панель
		 * будет закрыта.
		 * 
		 * @method onClose
		 */
		onClose: function(){},

		/**
		 * Абстрактный метод, который будет вызван когда панель
		 * будет скрыта.
		 * 
		 * @method onHide
		 */
		onHide: function(){},
		
		onStateChange: function(){},

		/**
		 * Заблокировать элементы панели на клик, при этом, все элементы типа
		 * INPUT будут выставлены в disabled. 
		 * Применяется в случаях, когда например отправляется запрос на 
		 * сервер и ожидается ответ.
		 * 
		 * @method actionDisable
		 * @param {String} (optional) ignore Список идентификаторов HTML элементов, указанные
		 * через запятую, которые будет игнорированы.
		 */
		actionDisable: function(ignore){
			if (this._actionBlocked){ return; }
			this._actionBlocked = true;

			var aIgnore = (ignore || '').split(',');
			var oIgnore = {};
        	for (var i=0;i<aIgnore.length;i++){
        		var id = L.trim(aIgnore[i]);
        		if (id != ''){
        			oIgnore[id] = id;
        		}
        	}
			this._actionBlockedIgnore = oIgnore;
			
			var els = {};
            Dom.getElementsBy(function (el) {
            	if (el.id in oIgnore){ return; }
                switch (el.nodeName.toUpperCase()) {
                case "BUTTON": case "INPUT": case "TEXTAREA":
                	if (el.id == ''){
                		el.id = Dom.generateId();
                	}
                	var attr = (Dom.getAttribute(el, 'disabled') || '').toUpperCase();
                	if (attr != 'DISABLED'){
                		els[el.id] = el;
                		Dom.setAttribute(el, 'disabled', 'disabled');
                	}
                    break;                        
                }
            }, "*", this.body);
            
            this._actionBlockedElements = els;
		},
		
		/**
		 * Разблокировать элементы панели на клик.
		 * 
		 * @method actionEnable
		 */
		actionEnable: function(){
			if (!this._actionBlocked){ return; }
			var els = this._actionBlockedElements;
			for (var n in els){
				els[n]['disabled'] = '';
			}
			this._actionBlocked = false;
			this._actionBlockedElements = null;
			this._actionBlockedIgnore = {};
		},
		
		isActionDisabled: function(){
			return this._actionBlocked;
		}
	});
	
	Brick.widget.Panel = Panel;
	
	/**
	 * Простой способ создать и отобразить панель. Достаточно в config-е 
	 * указать необходимый шаблон + дополнительные настройки. 
	 * 
	 * @method showPanel
	 * @static 
	 * @param {Object} config
	 * @return {Brick.widget.Panel}
	 */
	Panel.showPanel = function(config){
		var panel = new Panel(config); 
		return panel;
	};
	
	var Dialog = function(config){
		config = L.merge({
			fixedcenter: true
		}, config || {});
		config.modal = true;
		
		Dialog.superclass.constructor.call(this, config);
	};
	YAHOO.extend(Dialog, Panel, {});

	Brick.widget.Dialog = Dialog;
};
