/*
@version $Id$
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Sys
 * @namespace Brick.widget
 */

Brick.namespace('widget');

var Component = new Brick.Component({
	buildTemplate: false
});
Component.requires = { 
	yahoo: ['element', 'button'], 
	mod:[
	     {name: 'user', files: ['permission.js']}
		]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var TM = this.template,
		BU = Brick.util;

	var isFileUploadRole = false;

	var loadRoles = function(callback){
		Brick.Permission.load(function(){
			isFileUploadRole = Brick.Permission.check('filemanager', '30') == 1;
			callback();
		});
	};


(function(){
	
	/**
	 * Менеджер визуальных редакторов.
	 * <p>
	 * В момент инициализации менеджера, выполняется метод
	 * EditorManager.findEditors, который осуществляет поиск в имеющихся модулях, 
	 * компонент с именем <b>v_editor</b>. Менеджер предполагает,
	 * что именно в компонентах с таким именем описана реализация
	 * визуального редактора. Например, модуль TinyMCE.
	 * </p>
	 * @class EditorManager
	 * @static
	 */
	var EditorManager = {
	
		/**
		 * Имя компонента содержащий реализацию визуального редактора.
		 * 
		 * @property VEDITOR_NAME
		 * @static
		 * @type String
		 * @default v_editor
		 */
		VEDITOR_NAME: 'v_editor',
		
		/**
		 * Массив имен модулей имеющих компонент с именем указанным в VEDITOR_NAME
		 * 
		 * @property editors
		 * @static
		 * @type Object
		 */
		editors: {},
		
		/**
		 * Хеш таблица зарегистрированных движков визуального редактора.
		 * 
		 * @property engines
		 * @static
		 * @type Object
		 */
		engines: {},

		/**
		 * В существующих модулях осуществить поиск компонентов 
		 * имеющих имя VEDITOR_NAME.
		 * Результат поиска занести в editors.
		 * 
		 * @method findEditors
		 * @static
		 */
		findEditors: function(){
			for (var modName in Brick.Modules){
				if (Brick.componentExists(modName, EditorManager.VEDITOR_NAME)){
					EditorManager.editors[modName] = EditorManager.VEDITOR_NAME;
				}
			}
		},
		
		/**
		 * Проверить, существует ли движок визуального редактора.
		 * 
		 * @method editorExist
		 * @param {String} name Имя редактора.
		 * @return {Boolean}
		 */
		editorExist: function(name){
			if (EditorManager.editors[name]){
				return true;
			}
			return false;
		},
		
		/**
		 * Зарегистрировать движок редактора.
		 * 
		 * @method registerEngine
		 * @static
		 * @param {String} name Наименование редактора.
		 * @param {Brick.widget.VisualEditor} engine Движок визуального редактора.
		 */
		registerEngine: function(name, engine){
			this.engines[name] = engine;
		},
		
		/**
		 * Загрузить визуальный редактор. 
		 * По окончанию загрузки выполнить callback.
		 * 
		 * @method loadEngine
		 * @static
		 * @param {String} name Имя движка визуального редактора.
		 * @param {Function} callback Функция, которая будет выполнена по
		 * окончанию загрузки визуального редактора. Параметр функции 
		 * oArgs.name - Имя движка визуального редактора, 
		 * oArgs.engine - Движок визуального редактора.
		 * Если null, компонент был загружен, но движок визуального редактора
		 * не зарегистрирован. 
		 */
		loadEngine: function(name, callback){
			if (L.isNull(name)){
				name = Brick.widget.Editor.CURRENT_VISUAL_EDITOR;
			}
			var fire = function(){
				callback({
					'name': name,
					engine: EditorManager.engines[name]
				});
			};
			if (!this.engines[name]){
				Brick.Component.API.fireFunction(name, EditorManager.VEDITOR_NAME, function(){
					fire();
				});
			}else{
				fire();
			}
		},
		preloadVisualEditor: function(name, callback){
			EditorManager.loadEngine(name, function(oArgs){
	    		if (L.isNull(oArgs.engine)){
	    			callback();
	    		}else{
	    			oArgs.engine.preload(callback);
	    		}
	    	});
		}
		
	};
	
	EditorManager.findEditors();
	
	Brick.widget.EditorManager = EditorManager;
})();

	var EM = Brick.widget.EditorManager, 
		_T = {}, _TId = {};

	/**
     * @class Editor
     * @description <p>Прототип редактора.</p>
     * @constructor
     * @extends YAHOO.util.Element
     * @param {String/HTMLElement} el HTML элемент TEXTAREA.
     * @param {Object} attrs Object liternal containing configuration parameters.
	 */
	var Editor = function (el, attrs){
		
        var oConfig = {
            element: el,
            attributes: attrs || {}
        };
        var __self = this;
        loadRoles(function(){
            Editor.superclass.constructor.call(__self, oConfig.element, oConfig.attributes);    
        });
	};
	
	/**
	 * Имя текущего визуального редактора.
	 * 
	 * @property CURRENT_VISUAL_EDITOR
	 * @static 
	 * @default tinymce
	 */
	Editor.CURRENT_VISUAL_EDITOR = 'tinymce';
	
	/**
	 * Режим редактора "Код HTML"
	 * 
	 * @property MODE_CODE
	 * @static
	 * @type String
	 * @value code
	 */
	Editor.MODE_CODE = 'code';
	
	/**
	 * Режим редактора "Визуальный"
	 * 
	 * @property MODE_VISUAL
	 * @static
	 * @type String
	 * @value code
	 */
	Editor.MODE_VISUAL = 'visual';
	
	/**
	 * Режим панели инструментов - Расширеный.
	 * 
	 * @property TOOLBAR_FULL
	 * @static
	 * @type String
	 */
	Editor.TOOLBAR_FULL = 'full';

	/**
	 * Режим панели инструментов - Средний.
	 * 
	 * @property TOOLBAR_STANDART
	 * @static
	 * @type String
	 */
	Editor.TOOLBAR_STANDART = 'average';

	/**
	 * Режим панели инструментов - Минимальный.
	 * 
	 * @property TOOLBAR_MINIMAL
	 * @static
	 * @type String
	 */
	Editor.TOOLBAR_MINIMAL = 'minimal';
    
	/**
	 * Хеш таблица экземпляров Editor.
	 * 
	 * @private
	 * @static
	 * @property _instances
	 * @type Object
	 */
	Editor._instances = {};

	/**
	 * Получить объект Editor по HTML идентификатору .
	 * @method getEditorById
	 * @static
	 * @param {String} Идентификатор HTML элемента.
	 */
	Editor.getEditorById = function(id) {
        if (Editor._instances[id]) {
            return Editor._instances[id];
        }
        return null;
    };
    
	/**
	 * Предварительно подгрузить визуальный редактор
	 * @method preload
	 * @static
	 * @param {Function} Функция callback
	 */
	Editor.preload = function(callback){
		if (!L.isFunction(callback)){ return; }
		callback();
	};
	
    YAHOO.extend(Editor, YAHOO.util.Element, {
    	
    	/**
    	 * Экземпляр визуального редактора.
    	 * 
    	 * @property _ve
    	 * @private
    	 */
    	_ve: null,

    	/**
    	 * HTML элемент обертка текстового редактора
    	 * 
    	 * @property _wrap
    	 * @private
    	 */
        _wrap: null,
        
        /**
         * Дополнительные кнопки редактора (справа от редактора).
         * 
         * @property _buttons
         * @type Object
         * @private
         */
        _buttons: {},
        
    	/**
    	 * Обвернуть текстовый редактор.
    	 * 
    	 * @method _createTextArea
    	 * @private
    	 */
        _createTextArea: function() {
    	
    		var el = this.get('element');

    		var T = _T[el.id];
    		var TId = _TId[el.id];
    		
	        this._wrap = document.createElement('div');
	        this._wrap.id = el.id + '_wrap';
	        this._wrap.innerHTML = T['editor'];
	        
	        var par = el.parentNode;
	        par.replaceChild(this._wrap, el);
	        Dom.get(TId['editor']['editowrap']).appendChild(el);
	    },
	    
	    _initButtons: function(){
	    	
	    	var __self = this;
	    	
	    	this._buttons = {};
	    	
	    	this._buttons['code'] = new EditorButton(this, {
	    		name: 'code',
	    		image: '/modules/sys/images/ed_code.gif',
	    		onClick: function(){
	    			__self.set('mode', Editor.MODE_CODE);
	    		}
	    	});
	    	
	    	this._buttons['visual'] = new EditorButton(this, {
	    		name: 'visual',
	    		image: '/modules/sys/images/ed_visual.gif',
	    		onClick: function(){
	    			__self.set('mode', Editor.MODE_VISUAL);
	    		}
	    	});
	    	this._buttons['tb_full'] = new EditorButton(this, {
	    		name: 'tb_full',
	    		image: '/modules/sys/images/ed_tb_full.gif',
	    		onClick: function(){
	    			__self.set('toolbar', Editor.TOOLBAR_FULL);
	    		}
	    	});
	    	this._buttons['tb_standart'] = new EditorButton(this, {
	    		name: 'tb_standart',
	    		image: '/modules/sys/images/ed_tb_standart.gif',
	    		onClick: function(){
	    			__self.set('toolbar', Editor.TOOLBAR_STANDART);
	    		}
	    	});
	    	this._buttons['tb_minimal'] = new EditorButton(this, {
	    		name: 'tb_minimal',
	    		image: '/modules/sys/images/ed_tb_minimal.gif',
	    		onClick: function(){
	    			__self.set('toolbar', Editor.TOOLBAR_MINIMAL);
	    		}
	    	});
	    	if (isFileUploadRole){
		    	this._buttons['filemanager'] = new EditorButton(this, {
		    		name: 'filemanager',
		    		image: '/modules/sys/images/ed_filemanager.gif',
		    		onClick: function(){
			    		Brick.Component.API.fire('filemanager', 'api', 'showFileBrowserPanel', function(result){
			    			__self.insertValue(result['html']);
			        	});
		    		}
		    	});
	    	}
	    	this._updateButtons();
	    },
	    
	    _updateButtons: function(){
	    	
	    	var btns = this._buttons;
	    	
	    	var showOrHide = function(show, buttons){
	    		var arr = buttons.split(',');
	    		for (var i=0;i<arr.length;i++){
	    			if (show){
	    				btns[arr[i]].show();
	    			}else{
	    				btns[arr[i]].hide();
	    			}
	    		}
	    	};
	    	
	    	var isConfigButtons = this.get('configButtons');
	    	
	    	if(isConfigButtons){
		    	var mode = this.get('mode');
		    	if (mode == Editor.MODE_CODE){
		    		showOrHide(true, 'visual');
		    		showOrHide(false, 'code,tb_full,tb_standart,tb_minimal');
		    	}else{
		    		showOrHide(false, 'visual');
		    		showOrHide(true, 'code,tb_full,tb_standart,tb_minimal');
		    	}
		    	
		    	if (isFileUploadRole){
		    		showOrHide(this.get('fileManager'), 'filemanager');
		    	}
	    	} else {
	    		for (var n in btns){
	    			btns[n].hide();
	    		}
	    	}
	    },
	    
	    /**
	     * Загрузить и создать визуальный редактор.
	     * 
	     * @method _createVisualEditor
	     * @private
	     */
	    _createVisualEditor: function(){
	    	if (!L.isNull(this._ve)){ return; }
	    	var veName = this.get('veName');
	    	if (!veName){ return; }
	    	var __self = this;
	    	EM.loadEngine(veName, function(oArgs){
	    		if (L.isNull(oArgs.engine)){
	    			return;
	    		}
	    		__self._ve = new oArgs.engine(__self);
	    	});
	    },
	    
	    _removeVisualEditor: function(){
	    	if (L.isNull(this._ve)){ return; }
	    	this._ve.destroy();
	    	this._ve = null;
	    },
	    
	    _onModeChange: function(){
	    	var mode = this.get('mode');
        	if (mode == Editor.MODE_CODE){
        		this._removeVisualEditor();
        	}else if (mode == Editor.MODE_VISUAL){
        		this._createVisualEditor();
        	}                	
	    	this._updateButtons();
	    },
	    
	    _onToolbarChange: function(){
	    	if (L.isNull(this._ve)){ return; }
	    	var toolbarMode = this.get('toolbar');
    		this._ve.setToolbar(toolbarMode);
	    	this._updateButtons();
	    },
	    
	    _onConfigButtons: function(){
	    	this._updateButtons();
	    },
	    
	    _onFileManager: function(){
	    	this._updateButtons();
	    },
    	
	    /**
	     * Инициализация Editor.
	     * 
	     * @method init
	     * @private
	     */
        init: function(p_oElement, p_oAttributes) {
    		Editor.superclass.init.call(this, p_oElement, p_oAttributes);

	        var id = p_oElement;
	        
	        if (!L.isString(id)) {
	            if (id.tagName && (id.tagName.toLowerCase() == 'textarea')) {
	                id = Dom.generateId(id);                    
	            } else { return false; }
	        } else {
	            var el = Dom.get(id);
	            if (el.tagName && el.tagName.toLowerCase() == 'textarea') {
	                //All good
	            } else { return false; }
	        }
	
	        Editor._instances[id] = this;

	        var tm = TM.get(id);
			_T[id] = tm.data; 
			_TId[id] = tm.idManager;
	        
	        this._createTextArea();
	        this._initButtons();
	        this._onModeChange();
	        
			this.on("modeChange", this._onModeChange);
			this.on("toolbarChange", this._onToolbarChange);
	    },
        initAttributes: function(attr) {
            Editor.superclass.initAttributes.call(this, attr);
            
            /**
             * Имя модуля платформы Abricos, который содержит в себе
             * реализацию визуального редактора.
             * 
             * @attribute veName
             * @type String
             */
            this.setAttributeConfig('veName', {
                value: attr.veName || Editor.CURRENT_VISUAL_EDITOR,
                writeOnce: true,
                validator: function(value) {
            		return EM.editorExist(value);
                }
            });

            /**
             * Режим работы редактора. <br>
             * Атрибут принимает следующие значения:
             * <a href="Brick.widget.Editor.html#property_MODE_CODE">MODE_CODE</a> |
             * <a href="Brick.widget.Editor.html#property_MODE_VISUAL">MODE_VISUAL</a>.<br>
             * <i>Примечание: для режима визуального редактора, должен быть указан артибут 
             * <a href="Brick.widget.Editor.html#config_veName">veName</a></i>
             * 
             * @attribute mode
             * @type String
             */
            this.setAttributeConfig('mode', {
                value: attr.mode || Editor.MODE_CODE,
                validator: function(value) {
            		return value == Editor.MODE_CODE || value == Editor.MODE_VISUAL;
                }
            });
            
            /**
             * Режим панели инструментов.<br>
             * Атрибут принимает следующие значения:
             * <a href="Brick.widget.Editor.html#property_TOOLBAR_FULL">TOOLBAR_FULL</a> |
             * <a href="Brick.widget.Editor.html#property_TOOLBAR_STANDART">TOOLBAR_STANDART</a> |
             * <a href="Brick.widget.Editor.html#property_TOOLBAR_MINIMAL">TOOLBAR_MINIMAL</a>.
             * 
             * @attribute toolbar
             * @type String
             */
            this.setAttributeConfig('toolbar', {
                value: attr.toolbar || Editor.TOOLBAR_STANDART,
                validator: function(value) {
            		return value == Editor.TOOLBAR_STANDART 
            			|| value == Editor.TOOLBAR_FULL
            			|| value == Editor.TOOLBAR_MINIMAL;
                }
            });

            /**
             * Показать кнопки конфигурации редактора (группа кнопок справа).
             * 
             * @attribute configButtons
             * @type Boolean
             * @default true
             */
            this.setAttributeConfig('configButtons',{
            	value: attr.configButtons || true
            });

            /**
             * Показать кнопку вызова менеджера файлов.
             * Если модуль "Менеджер файлов" не установлен, кнопка будет скрыта
             * в любом случае.
             * 
             * @attribute fileManager
             * @type Boolean
             * @default true
             */
            this.setAttributeConfig('fileManager',{
            	value: L.isBoolean(attr.fileManager) ? attr.fileManager : true,
            	validator: function(value){
            		if (!value){
            			return false;
            		}
            		if (Brick.Modules['filemanager']){
            			return Brick.componentExists('filemanager', 'api');
            		}
            		return false;
            	}
            });
            
	    },
	    /**
	     * Отписаться от всех событий, удалить обертку элемента TEXTAREA,
	     * вызвать destroy визуального редактора, если он был создан.
	     * 
	     * @method destroy
	     */
	    destroy: function(){
	    	if (!L.isNull(this._ve)){ 
	    		this._ve.destroy();
	    		this._ve = null;
	    	}
	    	
	        var el = this.get('element');
			delete _T[el.id]; 
			delete _TId[el.id];

	        var par = this._wrap.parentNode;
	        // this._wrap.removeChild(el);
	        par.replaceChild(el, this._wrap);
	        this._wrap = null;
	        
	    },
	    
    	/**
    	 * Установить текст в текстовый редактор.
    	 * 
    	 * @method setContent
    	 * @param {String} text
    	 */
    	setContent: function(text){  
	    	if (L.isNull(this._ve)){ 
	    		this.get('element').value = text;
	    	}else{
		   		this._ve.setContent(text);
	    	}
	    },
    	
    	/**
    	 * Получить значение текстового редактора.
    	 * 
    	 * @method getContent
    	 * @return {String}
    	 */
    	getContent: function(){
	    	if (L.isNull(this._ve)){
	    		return this.get('element').value;
	    	}else{
	    		return this._ve.getContent();
	    	}
	    },
	    
	    /**
	     * Вставить текст по положению курсора в текстовый редактор.
	     * 
	     * @method insertValue
	     * @param {String} text
	     */
	    insertValue: function(text){
	    	if (L.isNull(this._ve)){ 
	    		
	    		var editor = this.get('element');
				if (document.selection) { // ie
					editor.focus();  
					sel = document.selection.createRange();  
					sel.text = text;  
				} else if (editor.selectionStart || editor.selectionStart == '0') { // firefox, opera  
					var startPos = editor.selectionStart;  
					var endPos = editor.selectionEnd;  
					editor.value = editor.value.substring(0, startPos) + text + editor.value.substring(endPos, editor.value.length);  
				} else { // over  
					editor.value += text;  
				}  
	    	}else{
		   		this._ve.insertValue(text);
	    	}
	    }

    });
    
    Brick.widget.Editor = Editor;
    
    var _buttonsAddedCss = {};
    
    var EditorButton = function(owner, config){
    	config = L.merge({
    		name: Dom.generateId(),
    		image: '',
    		title: '',
    		titleId: '',
    		onClick: null
    	}, config || {});
    	this.init(owner, config);
    };
    
    EditorButton.prototype = {
    	
    	_element: null,
    	
    	init: function(owner, config){
    		
    		this.owner = owner;
    		this.name = config.name;
			var el = owner.get('element');
			
			var T = _T[el.id];
			var TId = _TId[el.id];
			var tm = TM.get(el.id);
			
			if (!_buttonsAddedCss[this.name]){
		    	Brick.util.CSS.update(tm.replace('css', {
		    		name: this.name,
		    		image: config.image
		    	}));
		    	_buttonsAddedCss[this.name] = true;
			}
			
	    	this._element = new YAHOO.widget.Button({ 
	    		label:"", 
	    		id: this.name, 
	    		container: TId['editor']['buttons']
	    	});
	    	this._element.on("click", function(){
		    	if (L.isFunction(config.onClick)){
		    		config.onClick();
		    	}
		    	return true;
	    	});
	    	
    	},
    	
    	hide: function(){
    		var el = this._element.get('element');
    		el.style.display = 'none';
    	},
    	
    	show: function(){
    		var el = this._element.get('element');
    		el.style.display = '';
    	}
    };
    
    Brick.widget.EditorButton = EditorButton;
    
    /**
     * Абстрактный класс визуального редактора.
     * 
     * @class VisualEditor
     * @constructor
     * @param {String} name Имя визуального редактора
     * @param {Brick.widget.Editor} owner Экземпляр класса редактора
     */
    var VisualEditor = function(name, owner){
    	this.name = name;
    	this.owner = owner;
    	
    	this.init();
    };
    
    VisualEditor.prototype = {
    	
    	/**
    	 * Имя визуального редактора.
    	 * 
    	 * @property name
    	 * @type String
    	 */
    	name: '',
    	
    	/**
    	 * Экземпляр класса редактора.
    	 * 
    	 * @property owner
    	 * @type Brick.widget.Editor
    	 */
    	owner: null,
    	
    	/**
    	 * Абстрактный метод. Инициализировать класс
    	 * 
    	 * @method init
    	 */
    	init: function(){},
    	
    	/**
    	 * Абстрактный метод. Запросить визуальный редактор 
    	 * сменить режим.
    	 * 
    	 * @method setMode
    	 * @param {String} mode Режим редактора: 
    	 * <a href="Brick.widget.Editor.html#property_MODE_CODE">Editor.MODE_CODE</a> |
    	 * <a href="Brick.widget.Editor.html#property_MODE_VISUAL">Editor.MODE_VISUAL</a>.
    	 */
    	setMode: function(mode){},
    	
    	/**
    	 * Абстрактный метод. Запросить визуальный редактор
    	 * сменить режим панели инструментов.
    	 * 
    	 * @method setToolbar
    	 * @param {String} toolbarMode Режим панели инструментов, имеет значение: 
         * <a href="Brick.widget.Editor.html#property_TOOLBAR_FULL">Editor.TOOLBAR_FULL</a> |
         * <a href="Brick.widget.Editor.html#property_TOOLBAR_STANDART">Editor.TOOLBAR_STANDART</a> |
         * <a href="Brick.widget.Editor.html#property_TOOLBAR_MINIMAL">Editor.TOOLBAR_MINIMAL</a>.
    	 */
    	setToolbar: function(toolbarMode){},
    	
    	/**
    	 * Абстрактный метод. Разрушить экзепляр класса.
    	 * 
    	 * @method destroy
    	 */
    	destroy: function(){},
    	
    	/**
    	 * Получить HTML элемент TEXTAREA.
    	 * 
    	 * @method getElement
    	 * @return {HTMLElement} Элемент TEXTAREA
    	 */
    	getElement: function(){
    		return this.owner.get('element');
    	},
    	
    	/**
    	 * Абстрактный метод. Установить текст в текстовый редактор.
    	 * 
    	 * @method setContent
    	 * @param {String} text
    	 */
    	setContent: function(text){  },
    	
    	/**
    	 * Абстрактный метод. Получить текст из текстового редактора.
    	 * 
    	 * @method getContent
    	 * @return {String}
    	 */
    	getContent: function(){return '';},
    	
	    /**
	     * Абстрактный метод. Вставить текст по положению курсора в текстовый редактор.
	     * 
	     * @method insertValue
	     * @param {String} text
	     */
    	insertValue: function(text){}
    };
    
    Brick.widget.VisualEditor = VisualEditor;
};
