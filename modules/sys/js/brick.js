/*
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * Ядро Abricos! User Interface Library 
 * @module Sys
 * @namespace 
 * @title Brick Global
 */

if (typeof Brick == 'undefined' || !Brick){
	/**
	 * Глобальный объект пространства имен
	 * @class Brick
	 * @static
	 */
	Brick = {};
}

/**
 * Вернуть True, если объект определен, иначе False
 * <p><strong>Usage:</strong><br>
 * <code> if (!Brick.objectExists('Brick.mod.mymodule')){ return; }</code></p>
 * @method objectExists
 * @static
 * @param {String} namespace Идентификатор объекта, 
 * например "Brick.mod.user.API"
 * @return {Boolean}
 */
Brick.objectExists = function(namespace){
	var obj = Brick.convertToObject(namespace);
	return !YAHOO.lang.isNull(obj);
};

/**
 * Конвертировать идентификатор объекта в объект.
 * 
 * @method convertToObject
 * @static
 * @param {String} path Идентификатор объекта, 
 * например "Brick.mod.blog.API.showTopicListByUserWidget"
 * @return {Object}
 */
Brick.convertToObject = function(path){
	var d=path.split(".");
	var o=Brick;
	for (j=(d[0] == "Brick")?1:0; j<d.length; j++) {
		if (typeof o[d[j]] == 'undefined'){ return null; }
		o=o[d[j]];
	}
	return o;
};

/**
 * Returns the namespace specified and creates it if it doesn't exist
 * <pre>
 * Brick.namespace("property.package");
 * Brick.namespace("YAHOO.property.package");
 * </pre>
 * Either of the above would create Brick.property, then
 * Brick.property.package
 *
 * Be careful when naming packages. Reserved words may work in some browsers
 * and not others. For instance, the following will fail in Safari:
 * <pre>
 * YAHOO.namespace("really.long.nested.namespace");
 * </pre>
 * This fails because "long" is a future reserved word in ECMAScript
 * 
 * @method namespace
 * @static
 * @param  {String*} arguments 1-n namespaces to create 
 * @return {Object}  A reference to the last namespace object created
 */
Brick.namespace = function() {
	var a=arguments, o=null, i, j, d;
	for (i=0; i<a.length; i=i+1) {
		d=a[i].split(".");
		o=Brick;
		for (j=(d[0] == "Brick") ? 1 : 0; j<d.length; j=j+1) {
			o[d[j]]=o[d[j]] || {};
			o=o[d[j]];
		}
	}
	return o;
};

/**
 * Найти в Dom элементы типа SCRIPT, удалить их, при этом 
 * собрав весь JavaScript текст 
 * @method cleanScript
 * @static
 * @param {Object} el Dom элемент 
 * @return {String} JavaScript текст
 */
Brick.cleanScript = function(el){
	if (!el.childNodes.length){
		return "";
	}
	var i, s = "", c;
	for (i=0;i<el.childNodes.length;i++){
		c = el.childNodes[i];
		if (typeof c.tagName != 'undefined'){
			if (c.tagName.toLowerCase() == 'script'){
				s += c.innerHTML;
				el.removeChild(c);
			}else{
				s += Brick.cleanScript(c);
			}
		}
	}
	return s;
};

/**
 * Удалить все дочернии элементы Dom элемента 
 * @method elClear
 * @static
 * @param {Object} el Dom элемент  
 */
Brick.elClear = function(el){ 
	while(el.childNodes.length){
		el.removeChild(el.childNodes[0]);
	} 
};

/**
 * Вернуть новый Dom элемент, если в параметрах указан элемент контейнер, 
 * то поместить этот элемент в него.
 * @method elCreate
 * @static
 * @param {String} tag Имя типа элемента, например 'DIV'
 * @param {Object} parent (optional) Элемент контейнер
 */
Brick.elCreate = function(tag, parent){
	var el = document.createElement(tag);
	if (typeof parent != 'undefined'){
		parent.appendChild(el);
	}
	return el;
};

/**
 * Выполнить JavaScript text
 * 
 * @method readScript
 * @static
 * @param {String} text JavaScript текст 
 */
Brick.readScript = function(text){
	var s = document.createElement("script");
	s.charset = "utf-8";
	s.text = text;
	document.body.appendChild(s);
};

Brick.console = function(obj){
	var console = window.console;
	if (!console){ return; }
	if (typeof console['log'] != 'function'){ return; }
	console.log(obj);
};

(function(){

	/**
	 * Проверить, существует ли компонент модуля в наличие на сервере. 
	 * Осуществляет поиск в Brick.Modules.
	 * 
	 * 
	 * @method componentExists
	 * @static
	 * @param {String} moduleName Имя модуля 
	 * @param {String} componentName Имя компонента
	 * @return {Boolean}  
	 */
	Brick.componentExists = function(moduleName, componentName){
		if (!Brick.Modules[moduleName]){ return false;}
		var enmods = Brick.env.enmod || [];
		if (enmods.length > 0){
			var find = false;
			for (var i=0;i<enmods.length;i++){
				if (enmods[i] == moduleName){
					find = true;
				}
			}
			if (!find){
				return false;
			}
		}
		var m = Brick.Modules[moduleName];
		for (var i=0;i<m.length;i++){
			if (m[i]['f'] == (componentName+'.js')){
				return true;
			}
		}
		return false;
	};
	
	// Ассоциативный массив компонентов
	var components = {};
	
	/**
	 * Проверить, загружен ли компонент модуля 
	 * 
	 * @method componentLoaded
	 * @static
	 * @param {String} moduleName Имя модуля 
	 * @param {String} componentName Имя компонента
	 * @return {Boolean}  
	 */
	Brick.componentLoaded = function(moduleName, componentName){
		return components[moduleName] && components[moduleName][componentName];
	};
	
	Brick.componentRegistered = function(moduleName, componentName){
		var cp = components[moduleName] && components[moduleName][componentName];
		if (!cp){ return false; }
		return cp.isRegistered;
	};

	
	var RegEngine = function(moduleName, componentName, component){
		this.init(moduleName, componentName, component);
	};
	RegEngine.prototype = {
		init: function(mName, cName, component){
			this.id = mName+':'+cName;
			this.mName = mName; 
			this.cName = cName;
			this.component = component;
			this.isReg = false;
		},
		buildId: function(mName, cName){
			return mName+':'+cName;
		},
		isLoadDep: function(){
			var rq = this.component.requires;
			var mods = rq.mod || [];
			for (var i=0;i<mods.length;i++){
				var mod = mods[i];
				var files = mod.files || [];
				for (var ii=0;ii<files.length;ii++){
					var ccName = files[ii].replace(/\.js$/, '');
					if (!Brick.componentExists(mod.name, ccName)){
						// Brick.console('ops: '+this.mName+':'+this.cName+'=>'+mod.name+':'+ ccName);
					}else if (!Brick.componentRegistered(mod.name, ccName)){
						// Brick.console('Нехватает: '+this.mName+':'+this.cName+'=>'+mod.name+':'+ ccName);
						return false;
					}
				}
			}
			return true;
		},
		register: function(){
			if (this.isReg){ return; }
			this.isReg = true;
			
			var moduleName = this.mName,
				componentName = this.cName,
				component = this.component;
				
			var namespace = 'mod';
			
			var NS = Brick.namespace(namespace);
			NS[moduleName] = NS[moduleName] || {};
			NS = NS[moduleName];
			component.namespace = NS;
			
			if (!NS['API']){
				NS['API'] = new Brick.Component.API(moduleName);
			}

			component.entryPoint(NS);

			delete component.entryPoint;
			component.isRegistered = true;
			component.onLoad();

			fireChecker(component);
			Brick.Component.registerEvent.fire(component);
		}
	};
	
	var waiter = [], counter = 0;
	
	/**
	 * Инициализация и регистрация JS компонента указанного модуля платформы Abricos
	 * @method add
	 * @static
	 * @param {String} moduleName Имя модуля
	 * @param {String} componentName Имя компонента
	 * @param {Brick.Component} component Компонент модуля
	 */
	Brick.add = function(moduleName, componentName, component){
		components[moduleName] = components[moduleName] || {};

		if (components[moduleName][componentName]){
			// что за безобразие?!
			alert('Error: The component is already registered!\nModuleName='+moduleName+'\nComponentName='+componentName);
			return;
		}
		Brick._ldCk[moduleName][componentName+'.js']['ok'] = true;

		component.isRegistered = false;
		
		components[moduleName][componentName] = component;
		component.moduleName = moduleName;
		component.name = componentName;

		component.template = new Brick.Template(component);
		component._counter = counter++;
		
		component.language = Brick.util.Language.geta(['mod', moduleName]) || {};
		component.language.get = function(path){
			var d=path.split("."), o=component.language;
			for (var j=0; j<d.length; j++) {
				if (typeof o[d[j]] == 'undefined'){ return path; }
				if (typeof o[d[j]] == 'string'){ return o[d[j]]; }
				o=o[d[j]];
			}
			return o;
		};
		
		var initCSS = false;
		
		component.buildTemplate = function(w, ts){
			if (!initCSS){
				var CSS = Brick.util.CSS;
				if (CSS[moduleName] && CSS[moduleName][componentName]){
					CSS.update(CSS[moduleName][componentName]);
					delete CSS[moduleName][componentName];
				}
				initCSS = true;
			}
			w._TM = component.template.build(ts); w._T = w._TM.data; w._TId = w._TM.idManager;
			return w._TM;
		};
		
		component.requires = component.requires || {};
		var loadinfo = component.requires;
		
		var rg = new RegEngine(moduleName, componentName, component);
		waiter[waiter.length] = rg;
		
		loadinfo.onSuccess = function() {
			
			// проверить, все ли вложенные компоненты прогружены
			var isReg = false;
			do {
				isReg = false;
				for (var i=waiter.length-1;i>=0;i--){
					var r = waiter[i];
					if (!r.isReg){ // еще не загружался
						if (r.isLoadDep()){ // зависимости все загружены
							r.register();
							isReg = true;
						}
					}
				}
				
			} while(isReg);
		};
		Brick.Loader.add(loadinfo);
	};
	
	/**
	 * Компонент модуля платформы Abricos. 
	 * 
	 * @class Brick.Component
	 * @constructor
	 * @param {Object} config (optional) Конфигурация компонента
	 */
	Brick.Component = function(config){
		
		/**
		 * Конфигурация компонента.
		 * Имеет значения: 
		 * config.buildTemplate - сформировать шаблон и менеджер его 
		 * идентификаторов, по умолчанию True.
		 * 
		 * @property config
		 * @type Object
		 */
		this.config = YAHOO.lang.merge({
			buildTemplate: true
		}, config || {});
		
		/**
		 * Имя компонента
		 * @property name
		 * @type String
		 */
		this.name = '';
		
		/**
		 * Имя модуля которому принадлежит этот компонент.
		 * @property moduleName
		 * @type String
		 */
		this.moduleName = '';
		
		/**
		 * Дополнительные компоненты (сторонние JavaScript и CSS файлы, компоненты 
		 * платформы Abricos), которые должны быть загружены, перед инициализацей
		 * данного компонента.
		 * См. <a href="Brick.Loader.html">Brick.Loader</a>.
		 * 
		 * @property requires
		 * @type Object
		 */
		this.requires = {};
		
		var __self = this;
		
		/**
		 * Точка входа в компонент. Вход будет осуществлен после
		 * загрузки всех необходимых дополнительных компонентов.
		 * 
		 * @property source
		 * @type Function
		 */
		this.entryPoint = function(){};
		
		/**
		 * Выполняется после того, как компонент загружен и инициализирован. <br>
		 * Особой надобности в этом методе нет, создан для удобства. Если слишком
		 * большой файл и необходимо выполнить ряд функций в конце инициализации всех
		 * классов, то удобнее этот ряд функций разместить в начале файла в этом методе.
		 *  
		 * @method onLoad 
		 */
		this.onLoad = function(){};
		
		/**
		 * Шаблон компонента.
		 * 
		 * @property template
		 * @type Brick.Template
		 */
		this.template = null;
		
	};
	
    /**
     * Событие регистрации модуля.
     *
     * @event registerEvent
     * @static
     */
	Brick.Component.registerEvent = new YAHOO.util.CustomEvent("registerEvent");

	/**
	 * API модуля. 
	 * 
	 * @class Brick.Component.API
	 * @constructor
	 * @param {String} name Имя модуля
	 */
	Brick.Component.API = function(name){ 
		var widgets = {};
		
		/**
		 * Имя модуля которому принадлежит API
		 * 
		 * @property name
		 * @type String
		 */
		this.name = name;
		
		/**
		 * Выполнить функцию, предварительно загрузив необходимый компонент 
		 * из текущего модуля.
		 * Использует статичный метод <a href="Brick.Component.API.html#method_fire">Brick.Component.API.fire()</a>.
		 * @method fn
		 * @param {String} componentName Имя компонента, который необходимо подгрузить
		 * @param {Function} fn Функция, которая будет выполнена
		 */
		this.fn = function(componentName, fn){
			Brick.Component.API.fireFunction(this.name, componentName, fn);
		};
		
		/**
		 * Добавить виджет в коллекцию
		 * 
		 * @method addWidget
		 * @param {String} name Имя виджета
		 * @param {Object} widget Объект виджета 
		 */
		this.addWidget = function(name, widget){
			this.removeWidget(name);
			widgets[name] = widget;
		};
		
		/**
		 * Удалить виджет из коллекции. Если у виджета определен 
		 * метод destroy, то вызвать его.
		 * 
		 * @method removeWidget
		 * @param {String} name Имя виджета
		 */
		this.removeWidget = function(name){
			if (widgets[name]){
				// if (typeof widgets[name]['destroy'] == 'function'){
				//	widgets[name].destroy();
				// }
				// this.removeWidget(name);
				delete widgets[name];
			}
		};
		
		/**
		 * Получить виджет из коллекции.
		 * 
		 * @method getWidget
		 * @param {String} name Имя виджета
		 * @return {Object}
		 */
		this.getWidget = function(name){
			return widgets[name];
		};
	};
	
	/**
	 * Вызвать метод API компонента из указанного модуля. 
	 * <p>
	 * Принцип работы метода:
	 * <ul>
	 * <li>
	 * 1. Проверяет, был ли зарегистрирован компонент указанного модуля.
	 * Если да, то п.3, иначе п.2.
	 * </li>
	 * <li>
	 * 2. Делает запрос загрузчику загрузить компонент из указанного модуля.
	 * </li>
	 * <li>
	 * 3. Проверяет, есть ли данный метод в API 
	 * (Brick.mod.[moduleName].[componentName].API.[methodName]), если да,
	 * то выплняет его, иначе...
	 * </li>
	 * </ul>
	 * 
	 * </p>
	 * @method fire
	 * @static
	 * @param {String} moduleName Имя модуля
	 * @param {String} componentName Имя компонента
	 * @param {String} methodName Имя метода
	 * @param {Object} param (optional) Параметры для вызываемого метода
	 * @param {Function} func (optional) Дополнительная функция, которая будет 
	 * выполнена по окончанию запуска метода.
	 */
	Brick.Component.API.fire = function(moduleName, componentName, methodName, param, func){
		var fr = new APIFireElement(moduleName, componentName, methodName, param, func);
		fr.start();
	};
	
	/**
	 * Выполнить указанную функцию, при необходимости, предварительно
	 * загрузить компонент модуля.
	 *   
	 * @method fireFunction
	 * @static
	 * @param {String} moduleName Имя модуля
	 * @param {String} componentName Имя компонента
	 * @param {Function} fn Функция, которая будет выполнена
	 */
	Brick.Component.API.fireFunction = function(moduleName, componentName, fn){
		var fr = new APIFireElement(moduleName, componentName, fn);
		fr.start();
	};
	
	var fireElements = {};
	var fireElementsIdInc = 0;
	var fireChecker = function(component){
		var ids = [];
		for (var n in fireElements){
			ids[ids.length] = n;
		}
		for (var i=0;i<ids.length;i++){
			var fel = fireElements[ids[i]];
			if (fel.checkComponent(component)){
				fel.fire();
			}
		}
	};
	
	var APIFireElement = function(moduleName, componentName, method, param, func){
		this.id = fireElementsIdInc++;
		this.moduleName = moduleName;
		this.componentName = componentName;
		this.method = method;
		this.param = param;
		this.func = func;
	};
	
	APIFireElement.prototype = {
		checkComponent: function(component){
			return component.moduleName == this.moduleName && component.name == this.componentName;
		},
		start: function(){
			if (!components[this.moduleName] || !components[this.moduleName][this.componentName]){
				Brick.Loader.add({mod:[{name: this.moduleName, files: [this.componentName+'.js']}]});
				fireElements[this.id] = this;
			}else{
				this.fire();
			}
		},
		fire: function(){
			delete fireElements[this.id];
			if (YAHOO.lang.isString(this.method)){
				var ffn = Brick.mod[this.moduleName]['API'][this.method];
				if (!YAHOO.lang.isFunction(ffn)){ return; }
				ffn(this.param);
			}else if (YAHOO.lang.isFunction(this.method)){
				this.method(this.param);
			}
			if (YAHOO.lang.isFunction(this.func)){
				this.func();
			}
		}
	};
	
	Brick.f = Brick.Component.API.fire;
	Brick.ff = Brick.Component.API.fireFunction;
	
	var templateId = 1;
	var templates = {};
	
	/**
	 * Шаблон компонента.
	 * 
	 * @class Brick.Template
	 * @constructor
	 * @param {Brick.Component} component Компонент модуля
	 */
	Brick.Template = function(component){
		
		/**
		 * Компонент модуля.
		 * 
		 * @property component
		 * @type Brick.Component
		 */
		this.component = component;

		/**
		 * Хеш менеджеров шаблона.
		 * 
		 * @property _managers
		 * @private
		 * @type Object
		 */
		this._managers = {};
		
		/**
		 * Исходный шаблон комонента.
		 * 
		 * @property source
		 * @type Object
		 */
		this.source = {};
		
		var moduleName = component.moduleName;
		var componentName = component.name;
		var BT = Brick.util.Template;
		if (BT[moduleName] && BT[moduleName][componentName]){
			this.source = BT[moduleName][componentName];
			Brick.util.Template.fillLanguage(this.source);
		}
	};
	
	Brick.Template.prototype = {
			
		/**
		 * Подготовить шаблона для работы.
		 * 
		 * @method build
		 * @param {String} names (optional) Разделы в шаблоне указанные через
		 * запятую из которых будет подготовлен шаблон для работы. 
		 * Если параметр не указан, то шаблон будет подготовлен из всех 
		 * разделов.
		 * @return {Brick.Template.Manager}
		 */
		build: function(names){
			names = names || '';
			return new Brick.Template.Manager(this, '', names);
		},
		
		/**
		 * Получить подготовленный для работы шаблон.
		 * <b>Не используется, оставлено для совместимости.</b>
		 * 
		 * @method get
		 * @param {String} id (optional) Идентификатор менеджера шаблона.
		 * @param {String} names (optional) Разделы в шаблоне указанные через
		 * запятую из которых будет подготовлен шаблон для работы. 
		 * Если параметр не указан, то шаблон будет подготовлен из всех 
		 * разделов.
		 * @return {Brick.Template.Manager}
		 */
		get: function(id, names){
			id = id || 'default';
			names = names || '';
			if (!this._managers[id]){
				this._managers[id] = new Brick.Template.Manager(this, id, names);
			}
			return this._managers[id];
		},
		
		/**
		 * Удалить менеджер шаблона.
		 *
		 * @method remove
		 * @param {String} id (optional) Идентификатор менеджера шаблона.
		 */
		remove: function(id){
			delete this._managers[id];
		},
		
		/**
		 * Очистить хеш таблицу менеджеров шаблона.
		 * 
		 * @method clear
		 */
		clear: function(){
			this._managers = {};
		}
	};

	/**
	 * Менеджер подготовленного для работы шаблона.
	 * 
	 * @class Brick.Template.Manager
	 * @constructor
	 * @param {Brick.Template} owner
	 * @param {String} id
	 * @param {String} names
	 */
	Brick.Template.Manager = function(owner, id, names){

		names = names || '';

		/**
		 * Основатель.
		 * 
		 * @property owner
		 * @type Brick.Template
		 */
		this.owner = owner;

		/**
		 * Идентификатор менеджера подготовленого шаблона.
		 * 
		 * @property id
		 * @type String
		 */
		this.id = id;
		
		var _clone = function(t){
			
			var ct = {};
			if (names != ''){
				var arr = names.split(',');
				for (var i=0;i<arr.length;i++){
					var name = YAHOO.lang.trim(arr[i]);
					if (t[name]){
						ct[name] = t[name];
					}
				}
			}else{
				for (var name in t){
					ct[name] = t[name]; 
				};
			}
			return ct;
		};
		
		/**
		 * Хеш элементов шаблона.
		 * 
		 * @property data
		 * @type Object
		 */
		this.data = _clone(owner.source);
		
		/**
		 * Менеджер идентификаторов HTML элементов шаблона.
		 * 
		 * @property idManager
		 * @type Brick.util.TIdManager
		 */
		this.idManager = new Brick.util.TIdManager(this.data);
	};
	
	Brick.Template.Manager.prototype = {

		/**
		 * Получить элемент шаблона по имени и заменить
		 * в нем имена переменных на их значения.
		 * 
		 * @method replace
		 * @param {String} tname Имя элемента шаблона.
		 * @param {Object} obj Имена переменных и их значения.
		 * @return {String}
		 */
		replace: function(tname, obj){
			var t = this.data[tname];
			if (!t){ 
				return "";
			}
			return Brick.util.Template.setPropertyArray(t, obj);
		},

		/**
		 * Получить идентификатор элемента по его пути в шаблоне.<br>
		 * Путь идентификатор в шаблоне: <i>tname</i>.<i>elname</i>, где <i>tname</i> - 
		 * элемент шаблона, <i>elname</i> - имя идентификатора HTML элемента в шаблоне.<br>
		 *
		 * @method getElId
		 * @param {String} teId Путь идентификатора HTML элемента в шаблоне.
		 * @return {String}
		 */
		getElId: function(teId){
			var arr = teId.split('.');
			if (arr.length != 2){
				return null;
			}
			var idM = this.idManager;
			if (!idM[arr[0]] || !idM[arr[0]][arr[1]]){
				return null;
			}
			return idM[arr[0]][arr[1]];
		},
		
		/**
		 * Получить элемент опираясь на данные из шаблона.
		 * 
		 * @method getEl
		 * @param {String} teId Путь идентификатора HTML элемента в шаблоне.
		 * @return {HTMLElement}
		 */
		getEl: function(teId){
			var id = this.getElId(teId);
			
			if (!YAHOO.util.Dom){
				var el = document.getElementById(id); 
				if (!el){
					return null;
				}
				return el;
			}else{
				return YAHOO.util.Dom.get(id);
			}
		}
	};
})();

(function(){

	/**
	 * Класс по работе со страницей браузера
	 * @class Brick.Page
	 * @static
	 */
	Brick.Page = {};

	var notPages = [];

	/**
	 * Перегрузить страницу в браузере
	 * 
	 * @method reload
	 * @static
	 * @param {String} url (optional) URL открываемой страницы 
	 */
	Brick.Page.reload = function(url){
		if (url){
			window.location.href = url;
			return;
		}
		
		var cpage = window.location.pathname;
		for (var i=0;i<notPages.length;i++){
			var npage = notPages[i];
			if (npage.length <= cpage.length &&
				cpage.substring(0, npage.length) == npage){
				
				window.location.href = "/";
				return;
			}
		}
		window.location.reload(false);
	};
	
	/**
	 * Добавить адрес страницы, которая не может быть перегружена.
	 * Если будет запрос на перезагрузку страницы в браузере, и текущий 
	 * адрес страницы будет в списке NotOverloadPage, то будет открыта
	 * главная страница. 
	 */
	Brick.Page.addNotOverloadPage = function(pageAdress){
		notPages[notPages.length] = pageAdress;
	};
	
})();

/**
 * Переменные окружения платформы 
 * 
 * @class Brick.env
 * @static
 */
Brick.env = Brick.env || {
	
	/**
	 * Версия ядра
	 * @property version
	 * @type String
	 */
	version: '0',
	
	/**
	 * Идентификатор языка сайта, 'ru' - русский, 'en' - английский и т.п.
	 * @property language
	 * @type String
	 */
	language: 'ru',
	
	/**
	 * Имя хоста (не используется, оставлено для совместимости с предыдущими версиями модулей)
	 * @property host
	 * @type String
	 */
	host: document.location.hostname
};

/**
 * Информация сторонних JS библиотек
 * @class Brick.env.lib
 * @static
 */
Brick.env.lib = {
	
	/**
	 * Версия YAHOO! User Interface Library
	 * @method yui
	 * @type String
	 */
	yui: '2.8.1r1'
};

/**
 * Группа пользователей
 * @class Brick.USERGROUP
 * @static
 */
Brick.USERGROUP = {
	/**
	 * Группа пользователей "Гости"
	 * @property GUEST
	 * @type Integer
	 * @default 1
	 */
	GUEST: 1,
	/**
	 * Группа пользователей "Авторизованные"
	 * @property USER
	 * @type Integer
	 * @default 2
	 */
	USER: 2,
	/**
	 * Группа пользователей "Администраторы"
	 * @property ADMIN
	 * @type Integer
	 * @default 3
	 */
	ADMIN: 3		
};

/**
 * Информация о текущем пользователе
 * @class Brick.env.user
 * @static
 */
Brick.env.user = {
	/**
	 * Идентификатор пользователя
	 * @property id
	 * @type Integer
	 */
	id: 0,
	
	/**
	 * Учетная запись (логин)
	 * @property name
	 * @type String
	 */
	name: 'guest',
	
	// Имя
	firstname: '',
	
	// Фамилия
	lastname: '',
	
	/**
	 * Идентификатор сессии
	 * @property session
	 * @type String
	 */
	session: '',
	
	/**
	 * Входит в группы:
	 *      <dl>
	 *      <dt>1</dt> <dd>Гость</dd>
	 *      <dt>2</dt> <dd>Авторизован</dd>
	 *      <dt>3</dt> <dd>Администратор</dd>
	 *      </dl>
	 * @property group
	 * @type Array
	 * @default 2
	 */
	group: ['1'],
	
	/**
	 * Вернуть True, если пользователь является администратором
	 * @method isAdmin
	 * @static
	 * @return {Boolean}
	 */
	isAdmin: function(){
		var g = Brick.env.user.group;
		for (var i=0;i<g.length;i++){
			if (g[i] == 3){ return true; }
		}
		return false; 
	},

	/**
	 * Вернуть True, если пользователь является модератором
	 * @method isModerator
	 * @static
	 * @return {Boolean}
	 */
	isModerator: function(){ 
		alert('error in Brick.env.user.isModerator()'); 
	},
	
	/**
	 * Вернуть True, если пользователь авторизовался
	 * @method isRegister
	 * @static
	 * @return {Boolean}
	 */
	isRegister: function(){ 
		var g = Brick.env.user.group;
		for (var i=0;i<g.length;i++){
			if (g[i] > 1){ return true; }
		}
		return false; 
	},
	
	isRegistred: function(){ return Brick.env.user.isRegister(); }
};


Brick.namespace('util');

////////////////////////// CSS Style Manager //////////////////////////
/**
 * Менеджер CSS стилей
 * @class CSS
 * @namespace Brick.util
 * @static
 */
(function(){
	var CSS = {};
	CSS.disableCSSComponent = false;
	
	/**
	 * Добавить CSS стиль на текущую страницу в браузере
	 * 
	 * @method update
	 * @static
	 * @param {String} t Текст CSS
	 */
	CSS.update = function(t){
		if (typeof t == 'undefined' || CSS.disableCSSComponent){
			return;
		}
		var style = document.createElement('style');
		style['type'] = 'text/css';
		
		if (style.styleSheet){ // IE
			style.styleSheet.cssText = t;
		}else{
			var tt1 = document.createTextNode(t);
	    style.appendChild(tt1);
		}
		
		var hh1 = document.getElementsByTagName('head')[0];
		hh1.appendChild(style);
	};
	
	Brick.util.CSS = CSS;
})();

////////////////////////// Template Manager //////////////////////////
(function(){

	/**
	 * Менеджер шаблонов
	 * @class Template
	 * @namespace Brick.util
	 * @static
	 */
	var Template = {};
	
	/**
	 * Заменить в тексте шаблона идентификаторы фраз языка на 
	 * значения текущего языка.
	 * 
	 * @method fillLanguage
	 * @static
	 * @param {String} t Текст шаблона
	 */
	Template.fillLanguage = function(t){
		if (typeof t == 'undefined'){
			return;
		}
		
		var lang = Brick.env.language;
		var exp = new RegExp("(\{\#[a-zA-Z0-9_\.\-]+\})", "g"), s, arr, key, phrase, i;
		for (var name in t){
			s = t[name];
			arr = s.match(exp);
			if (YAHOO.lang.isArray(arr)){
				for (i=0;i<arr.length;i++){
					key = arr[i].replace(/[\{#\}]/g, '');
					phrase = Brick.util.Language.getc(key);
					if (!YAHOO.lang.isNull(phrase)){
						s = s.replace(arr[i], phrase);
					}
				}
			}
			t[name] = s;
		}
	};
	
	/**
	 * Заменить в тексте шаблона идентификаторы переменных на значения
	 * 
	 * @method setProperty
	 * @static
	 * @param {String} t Текст шаблона
	 * @param {String} name Имя переменной
	 * @param {String} value Значение
	 */
	Template.setProperty = function(t, name, value){
		var exp = new RegExp("\{v\#"+name+"\}", "g");
		return t.replace(exp, value);
	};

	/**
	 * Заменить в тексте шаблона идентификаторы переменных на значения. 
	 * Имя переменных и их значения взять из ассоциативного массива
	 * 
	 * @method setPropertyArray
	 * @static
	 * @param {String} t Текст шаблона
	 * @param {[String, String]} dict Ассоциативный массив
	 */
	Template.setPropertyArray = function(t, dict){
		for (var n in dict){
			t = Brick.util.Template.setProperty(t, n, dict[n]);
		}
		return t;
	};
	
	Brick.util.Template = Template;
})();

////////////////////////// Template Id Manager //////////////////////////
(function(){
	
	/**
	 * Коллекция уникальных идентификаторов Dom элементов, которые будут созданы из шаблона.<br>
	 * В тексте шаблона ищет конструкции формата <strong>{i#<i>name</i>}</strong>, где 
	 * <i>name</i> - имя идентификатора, и заменяет их на уникальное значение. <br>
	 * Необходимость данного менеджера заключается в том, чтобы создаваемые элементы Dom
	 * из шаблона, имели уникальные идентификаторы.
	 * <p>
	 * Например: 
	 * <pre class="brush: js">
	 * var t = { 
	 * &nbsp;&nbsp;panel: "&lt;div id='{i#myid}'&gt;Hello world!&lt;/div&gt;"
	 * }; 
	 * var tID = new Brick.util.TIdManager(t);
	 * 
	 * document.body.innerHTML = t['panel'];
	 * 
	 * // Получить Dom элемент по именнованому идентификатору myid  
	 * var div = YAHOO.util.Dom.get(tID['panel']['myid']);
	 * </pre>
	 * </p>
	 * 
	 * @class TIdManager
	 * @namespace Brick.util
	 * @constructor
	 * @param {[String, String]} t Ассоциативный массив коллекции шаблонов JS компонента
	 */
	var TIdManager = function(t){
		if (typeof t == 'undefined'){
			return;
		}
		
		this['_global'] = {};
		
		var s, arr, key, genid, i;
		
		// global id setting
		var exp = new RegExp("(\{gi\#[a-z0-9_\-]+\})", "gi");

		var uniq = {};
		for (var name in t){
			s = t[name];
			arr = s.match(exp);
			if (YAHOO.lang.isArray(arr)){
				for (i=0;i<arr.length;i++){
					if (!uniq[arr[i]])
						uniq[arr[i]] = 'bkgtid_'+counter++;
					
					s = s.replace(new RegExp(arr[i], "gi"), uniq[arr[i]]);
					
					key = arr[i].replace(/\{gi#([a-zA-Z0-9_\-]+)\}/, '$1');
					this['_global'][key] = uniq[arr[i]];
				}
			}
			t[name] = s;
		}
	
		exp = new RegExp("(\{i\#[a-z0-9_\-]+\})", "gi");
		for (var name in t){
			s = t[name];
			arr = s.match(exp);
			if (YAHOO.lang.isArray(arr)){
				this[name] = {};
				for (i=0;i<arr.length;i++){
					key = arr[i].replace(/\{i#([a-zA-Z0-9_\-]+)\}/, '$1');
					if (typeof this[name][key] == 'undefined'){
						genid = 'bktid_'+name.substring(0,1)+key.substring(0,1)+'_'+counter++;
						this[name][key] = genid;
						s = s.replace(new RegExp(arr[i], "gi"), genid);
					}
				}
			}
			t[name] = s;
		}		
	};

	var counter = 0;
	
	Brick.util.TIdManager = TIdManager;
	
})();

////////////////////////// Language Manager ////////////////////////// 
(function(){
	
	/**
	 * Менеджер локализации
	 * 
	 * @class Language
	 * @namespace Brick.util
	 * @static
	 */
	var Language = {};
	
	var _dict = {};
	
	Language.getData = function(){
		return _dict[Brick.env.language];
	};
	
	Language.add = function(lang, o){
		if (typeof _dict[lang] == 'undefined')
			_dict[lang] = {};
		clone(o, _dict[lang]);
	};
	
	Language.get = function(lang, key){
		var l = _dict[lang], k = key.split('.'), i;
		if (typeof l == 'undefined'){
			return [];
		}
		for (i=0;i<k.length;i++){
			l = l[k[i]];
			if (typeof l == 'undefined'){
				return [];
			}
		}
		
		return l;
	};
	
	Language.geta = function(arr){
		var l = _dict[Brick.env.language];
		if (typeof l == 'undefined'){
			return [];
		}
		
		for (var i=0;i<arr.length;i++){
			l = l[arr[i]];
			if (typeof l == 'undefined'){
				return [];
			}
		}
		return l;
	}
	
	/**
	 * Получить объект фраз текущего языка
	 * 
	 * @method getc
	 * @static
	 * @param {String} key Идентификатор (namespace путь) фразы, например: "mod.mymodule.hello"
	 * @return {Object}
	 */
	Language.getc = function(key){
		return this.get(Brick.env.language, key);
	};
	
	Language.dump = function(lang){
		alert(YAHOO.lang.dump(_dict[lang]));
	};
	
	var clone = function(from, to){
		for (var el in from){
			if (YAHOO.lang.hasOwnProperty(from, el)){
				if (YAHOO.lang.isObject(from[el])){
					if (typeof to[el] == 'undefined')
						to[el] = {};
					clone(from[el], to[el]);
				}else{
					to[el] = from[el];
				}
			}
		}
	};
	
	Brick.util.Language = Language;
	
})();

////////////////////////// JS Loader ////////////////////////// 
(function(){
	
	var module = function(o){
		this.yahoo = [];
		this.ext = [];
		this.mod = [];
		this.isLoad = false;
		this.event = null;
		this.init(o);
	};
	module.prototype = {
		init: function(o){
			if (typeof o.yahoo != 'undefined'){ this.yahoo = o.yahoo; }
			if (typeof o.ext != 'undefined'){ this.ext = o.ext; }
			if (typeof o.mod != 'undefined'){ this.mod = o.mod; }
			this.event = { onSuccess: o.onSuccess, onFailure: o.onFailure, executed: false};
		}
	};
	
	YAHOO.util.YUILoader.prototype._url = function(path, type) {
        var u = this.base || "", f=this.filter;
        u = u + path;
        
        if (this.gzip && type == 'js'){
        	u = this.gzipBase + u;
        }
        return this._filter(u);;
    };
	
	/**
	 * Загрузчик JS компонентов. <br>
	 * Brick.Loader основан на загрузчкие YAHOO.util.YUILoader и позволяет
	 * динамически подгружать js и css файлы.
	 * 
	 * <p>
	 * Пример: 
	 * <pre class="brush: js">
	 * Brick.Loader.add({
	 * &nbsp;&nbsp;yahoo: ['tabview'],
	 * &nbsp;&nbsp;mod:[
	 * &nbsp;&nbsp;&nbsp;&nbsp;{name: 'sys', files: ['data.js']},
	 * &nbsp;&nbsp;&nbsp;&nbsp;{name: 'feedback', files: ['cp_message.js', 'cp_config.js']}
	 * &nbsp;&nbsp;],
	 * &nbsp;&nbsp;onSuccess: function() {
	 * &nbsp;&nbsp;&nbsp;&nbsp;alert('Load complete!');
	 * &nbsp;&nbsp;}
	 * });
	 * </pre>
	 * Здесь загрузчику будет сформирован запрос подгрузить компоненты:
	 * <ul>
	 * <li>JS компонент tabview фреймворка YAHOO! User Interface Library, 
	 * местоположение файла /js/yui/[версия yui]/tabview/tabview.js </li>
	 * <li>JS компонент data фреймоврка Abricos! User Interface Library,
	 * модуля Sys, местоположение файла /modules/sys/js/data.js</li>
	 * <li>JS компонент cp_message фреймоврка Abricos! User Interface Library,
	 * модуля Feedback, местоположение файла /modules/feedback/js/cp_message.js</li>
	 * <li>JS компонент cp_config фреймоврка Abricos! User Interface Library,
	 * модуля Feedback, местоположение файла /modules/feedback/js/cp_config.js</li>
	 * </p>
	 * По окончанию загрузки, выполнится событие onSuccess, которое
	 * отобразит сообщение <i>Load complete!</i>
	 * @class Loader
	 * @namespace Brick
	 * @static
	 */
	var loader = function(){
		this._isProccess = false;
		this._countModule = 0;
		this._modules = [];
		this._reqYUI = {};
		
		var __self = this;
		this._yuiLoader = new YAHOO.util.YUILoader({ 
			base: "/js/yui/"+Brick.env.lib.yui+"/",
	    	gzip: true, gzipBase: "/gzip.php?file=",
			filter: "MIN", 
			ignore: ['containercore'],
			onSuccess: function() { __self._event(false); },
			onFailure: function (err){
				__self._event(true); alert ('Ошибка загрузки модуля: ' + YAHOO.lang.dump(err) );
			}
		});
	};
	
	loader.prototype = {
		
		/**
		 * Запросить загрузку JS/CSS файлов
		 * 
		 * @method add
		 * @static
		 * @param {Object} param
		 */
		add: function(param){
			var m = new module(param);
			this._addModule(m);
			if (!this._isProccess){
				this._start();
			}
		},
		addRange: function(o){
			var m, i;
			for (i=0;i<o.length;i++){
				m = new module(o[i]);
				this._addModule(m);
			}
			if (!this._isProccess){ this._start(); }
		},
		_addModule: function(m){
			this._modules[this._modules.length] = m;
		},
		_event: function(error){
			var __self = this;
			this._isProccess = false;
			// Если в процессе загрузки модулей были добавлены еще модули,
			// то события предыдущих модулей остаются в ожидании и производится запуск
			// загрузки оставшихся
			if (this._modules.length != this._countModule){
				this._start();
				return;
			}
			
			/*
			// есть ли битые файлы?
			var ldCk = Brick._ldCk;
			for (var n in ldCk){
				for (var nn in ldCk[n]){
					if (!ldCk[n][nn]['ok']){
						ldCk[n][nn]['n']++;
						if (ldCk[n][nn]['n'] < 10){ // на всякий случай, хотя врядли он будет
							this.add({mod:[{name: n, files: [nn]}]});
						}
					}
				}
			}
			
			if (this._modules.length != this._countModule){
				this._start();
				return;
			}
			/**/
			
			// Установить флаг загрузки. Необходим для предотвращения запуска загрузки 
			// добавляемых модулей в процессе выполнения событий загруженных модулей
			this._isProccess = true;
			
			// выполнение событий по принципу fifo (последнии модули приоритетнее) 
			var i, m, cnt = this._modules.length;
			for(i=cnt-1;i>=0;i--){
				m = this._modules[i];
				if (m.event.executed){
					break;
				}
				m.event.executed = true;
				var f = error ? m.event.onFailure : m.event.onSuccess;

				//try{
					if (typeof f == 'function'){
						f();
					}
				//}catch(e){ alert(YAHOO.lang.dump(e)); }
			}
			this._isProccess = false;
			
			// Во время выполнения событий были добавлены еще модули на загрузку.
			if (this._modules.length != this._countModule){
				this._start();
			}
		},
		_start: function(){
			this._isProccess = true;
			this._countModule = this._modules.length;
			
			var i, m, j, k, r, ylib = [], elib = [], mlib = [];
			
			for (i=0;i<this._modules.length;i++){
				m = this._modules[i];
				if (!m.isLoad){
					m.isLoad = true;
					// Brick Module
					for (j=0;j<m.mod.length;j++){ mlib[mlib.length] = m.mod[j]; }
					// Ext
					for (j=0;j<m.ext.length;j++){ elib[elib.length] = m.ext[j]; }
					// YAHOO
					for (j=0;j<m.yahoo.length;j++){
						r = m.yahoo[j];
						if (typeof this._reqYUI[r] == 'undefined'){
							this._reqYUI[r] = true;
							ylib[ylib.length] = r; 
						}
					}
				}
			}
			var loader = this._yuiLoader;
			if (ylib.length > 0){
				for (i=0;i<ylib.length;i++){loader.calculate({require: ylib[i]});}
			}
			if (elib.length > 0){
				var l = [];
				var nm, fp, type;
				for (i=0;i<elib.length;i++){
					nm = elib[i].name;
					l[l.length] = nm;
					loader.addModule({name: nm, type: elib[i].type, fullpath: elib[i].fullpath});
				}				
				loader.require(l);
			}
			if (mlib.length > 0){
				var mm, mb, mv, minfo, rq=[];
				var count = mlib.length;
				for (var ii=0;ii<count;ii++){
					if (mlib[ii]){
						mm = mlib[ii].name;
						minfo = Brick.Modules[mm];
						
						if (minfo){
							for (j=0;j<mlib[ii].files.length;j++){
								mb = mlib[ii].files[j];
								mv = "";
								for (k=0;k<minfo.length;k++){
									if (minfo[k]['f'] == mb){ mv = minfo[k]['k']; }
								}
								if (mv == ""){
									
								}else{
									var ldCk = Brick._ldCk[mm] = Brick._ldCk[mm] || {};
									ldCk = ldCk[mb] = ldCk[mb] || {'ok': false, 'n': 0};
									
									var samm = mm.split("/"),
										src = "";
									if (samm.length == 2){
										
										var nHost = samm[0],
											nPort = 80,
											nModName = samm[1];
										
										aHost = nHost.split(':');
										if (aHost.length == 2){
											nHost = aHost[0];
											if (aHost[1]*1 != 0){
												nPort = aHost[1]*1 ;
											}
										}
										src = "/app/gzip/"+nHost
											+"/"+nPort
											+"/"+nModName
											+"/"+mv
											+"/"+mb;
									}else{
										src = "/gzip.php?type=mod&module="+mm
											+"&version="+mv
											+"&tt="+Brick.env.ttname
											+"&n="+ldCk['n']
											+"&lang="+Brick.env.language
											+"&file="+mb;
									}

									var reqid='n'+ldCk['n']+mm+mb;
									
									if (!Brick._ldReqId[reqid]){
										Brick._ldReqId[reqid] = true;
										
										rq[rq.length]=reqid;
										
										loader.addModule({
											name: reqid, 
											type: "js", 
											fullpath: src
										});
									
									}
								}
							}
						}
					}
				}
				loader.require(rq);
			}
			loader.insert();
		}
	};
	// TODO: связь прервалась, а браузер закешировал битый файл. 
	// осталось только запросить с новым урлом этот js
	Brick._ldCk = {};
	Brick._ldReqId = {};
	
	Brick.Loader = {
		mods: [],
		add: function(o){
			this.mods[this.mods.length] = o;
		} 
	};
	

	var onReadyExecute = false;
	var readyFunc = [];
	var oldList = [];
	if (typeof window.bReady != 'undefined'){
		// oldList = window.bReady.list;
	}
	
	window.bReady = function(){
		return {
			on: function(f){
				if (typeof f != 'function'){
					alert('window.bReady.on(f): f must be function');
					return;
				}
				if (onReadyExecute){
					//try{ 
						f(); 
					//}catch(e){}
				}else{
					readyFunc[readyFunc.length] = { func: f, executed: false };
				}
			}
		};
	}();
	
	for (var i=0;i<oldList.length;i++){
		window.bReady.on(oldList[i]);
	}
	
	var onReady = function(){
		for (var i=0;i<readyFunc.length;i++){
			if (!readyFunc.executed){
				readyFunc[i].executed = true;
				//try{
					readyFunc[i].func();
				//}catch(e){}
			}
		}
		onReadyExecute = true;
	};
	Brick.Loader.add({ onSuccess: onReady });

	YAHOO.util.Event.onDOMReady(function(){
		var old = Brick.Loader;
		Brick.Loader = new loader();
		Brick.Loader.addRange(old.mods);
	});
})();

(function(){
	
	var querycount = 0; 
	var uniqurl = function(){
		querycount++;
		return (querycount++) + (new Date().getTime());
	};

	var readScript = Brick.readScript;

	var sendPost = function(module, brick, cfg ){
		cfg = cfg || {};
		cfg['json'] = cfg['json'] || {};

		var post = "json="+encodeURIComponent(YAHOO.lang.JSON.stringify(cfg['json']));
		YAHOO.util.Connect.asyncRequest("POST", 
			'/ajax/' + module + '/' + brick +'/'+ uniqurl()+'/', {
				success: function(o) {
					readScript(o.responseText);
					if (typeof cfg.success == 'function'){
						cfg.success(o);
					}
				}, 
				failure: function(o){ 
					// alert("CONNECTION FAILED!"); 
				}
			}, 
			post
		);
	};
	
	/**
	 * Менеджер AJAX запросов
	 * 
	 * @class Connection
	 * @namespace Brick.util
	 * @static
	 */
	Brick.util.Connection = {};
	
	/**
	 * Отправить AJAX запрос кирпичу определенного модуля
	 * 
	 * @method sendCommand
	 * @static
	 * @param {String} module Имя модуля
	 * @param {String} brick Имя кирпича
	 * @param {Object} cfg Параметры запроса, в т.ч. и POST данные.
	 * Если cfg['hidden'] == True, то запрос будет происходить в фоновом режиме, 
	 * иначе будет показана панель "ожидания процесса"   
	 */
	Brick.util.Connection.sendCommand = function(module, brick, cfg){
		if (typeof YAHOO.util.Connect == 'undefined' || typeof YAHOO.lang.JSON == 'undefined'){
			Brick.Loader.add({
			    yahoo: ['connection', 'json'],
			    onSuccess: function() {
					sendPost(module, brick, cfg);
				},
				onFailure: function(){
				}
			});
		}else{
			sendPost(module, brick, cfg);
		}
	};
})();

// типизированный AJAX
(function(){
	
	var querycount = 0; 
	var uniqurl = function(){
		querycount++;
		return (querycount++) + (new Date().getTime());
	};
	
	var complete = function(module, cfg, o, failure){
		if (!YAHOO.lang.isFunction(cfg['event'])){
			return;
		}
		cfg['type'] = cfg['type'] || 'json';  
		failure = failure || false;

		var data;
		try{
			if (cfg['type'] == 'json'){
				var json = YAHOO.lang.JSON.parse(o.responseText);
				data = json.data || null; 
			}else{
				o.jsonParseError = true;
			}
		}catch(e){
			data = null;
			o.jsonParseError = true;
		}
		o.responseJSON = o.data = data;
		cfg['event'](o);
	};

	var sendPost = function(module, cfg){
		cfg = cfg || {};

		var post = "data="+encodeURIComponent(YAHOO.lang.JSON.stringify(cfg['data'] || {}));
		YAHOO.util.Connect.asyncRequest("POST", 
			'/tajax/' + module + '/' + uniqurl()+'/', {
				success: function(o){complete(module, cfg, o, false);}, 
				failure: function(o){complete(module, cfg, o, true);}
			}, 
			post
		);
	};
	
	/**
	 * Отправить типизированный запрос серверу. 
	 * Принцип работы: клиент формирует запрос с параметрами определенному модулю, 
	 * отправляет его, при этом помечает его номером сессии. Ответ полученный от сервера
	 * передает в функцию предварительно указанную в параметрах.
	 * 
	 * Структура объекта cfg:
	 * cfg.data {Object|null} данные
	 * cfg.event {Function|null} событие обработчик
	 * 
	 * @namespace Brick
	 * @method sendCommand
	 * @static
	 * @param {String} module Имя модуля
	 * @param {Object} cfg Параметры запроса
	 */
	Brick.ajax = function(module, cfg){
		if (typeof YAHOO.util.Connect == 'undefined' || typeof YAHOO.lang.JSON == 'undefined'){
			Brick.Loader.add({
			    yahoo: ['connection', 'json'],
			    onSuccess: function() {sendPost(module, cfg);},
				onFailure: function(o){complete(module, cfg, o, true);}
			});
		}else{
			sendPost(module, cfg);
		}
	};
	
})();


Brick.byteToString = function(byte){
	var ret = byte;
	var px = "";
	if (byte < 1024){
		ret = byte;
		px = "б";
	}else if (byte < 1024*1024){
		ret = Math.round((byte/1024)*100)/100;
		px = 'кб';
	}else{
		ret = Math.round((byte/1024/1024)*100)/100;
		px = 'мб';
	}
	return ret+' '+px;
};


Brick.dateExt = function(){
	var z = function(num){
		if (num < 10){
			return '0'+num;
		}
		return num;
	};
	
	return {
		convert: function(udate, type, hideTime){
			var LNG = Brick.util.Language.getc('mod.sys.date')

			var mp = LNG['monthp'], 
				ds = LNG['dayst'];

			
			if (!udate || udate == null){ return ""; }
			if (typeof udate['getTime'] == 'function'){
				udate = udate.getTime()/1000;
			}
			if (udate*1 == 0){
				return "";
			}
			hideTime = hideTime || false;
			var msec = udate*1000;
			var cd = new Date(msec);
			
			var day = z(cd.getDate());
			var mon = z(cd.getMonth()+1);// +1 т.к. нумерация идет с 0
			var mons= mp[cd.getMonth()+1];
			var min = z(cd.getMinutes());
			var hour = z(cd.getHours());
			
			if (type == 1){
				var s = day+'.'+mon+'.'+cd.getFullYear();
				if (!hideTime){
					s += ', '+hour+':'+(min);
				}
				return s;
			}else if (type == 2){// Добавлена возможность отображения даты в виде дд.мм.гггг
				return day+'.'+mon+'.'+cd.getFullYear();
			}else if (type == 3){
				return day+' '+mp[cd.getMonth()+1]+' '+cd.getFullYear();
			}else if (type == 4){
				return hour+':'+(min);
			}else{
				var ld = new Date(), s;
				ld = new Date(ld.getFullYear(), ld.getMonth(), ld.getDate());
	
				var v = (Math.round(ld.getTime()/1000) - udate)/60/60/24;
				if (v > 0 && v < 1){
					s = ds[1];
				}else if (v < 0 && v >-2){
					s = ds[2];
				}else{
					s = day+' '+mp[cd.getMonth()+1]+' '+cd.getFullYear();
				}
				var tm = hour+':'+(min);
				if (!hideTime){
					s += ', ' + tm; 
				}
				return s;
			}
		},
		unixToArray: function(udate){
			var msec = udate*1000;
			var cd = new Date(msec);
			return {
				'day': cd.getDate(),
				'month': cd.getMonth(),
				'year': cd.getFullYear(),
				'min': cd.getMinutes()+1,
				'hour': cd.getHours()
			};
		}
	};
}();
