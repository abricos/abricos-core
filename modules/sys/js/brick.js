/*
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
@version $Id$
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
 * Найти в Dom элементе элементы типа SCRIPT, удалить их, при этом 
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
				s += cleanScript(c);
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
 * Получить уникальный URL добавлением к существующему уникальную сессию.
 * 
 * @method uniqurl
 * @static
 * @param {String} url URL 
 * @return {String} 
 */
Brick.uniqurl = function(url){
	if (typeof Brick.uniqurl.querycount == 'undefined'){
		Brick.uniqurl.querycount = 0;
	}
	Brick.uniqurl.querycount++;
	var d = new Date();
	url += '&uniqurl='+Brick.uniqurl.querycount+d.getTime();
	return url;
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
	if (!console){ 
		return;
	}
	if (typeof console['log'] != 'function'){
		return;
	}
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
		
		components[moduleName][componentName] = component;
		component.moduleName = moduleName;
		component.name = componentName;

		component.template = new Brick.Template(component);
		
		var loadinfo = component.requires || {};
		
		loadinfo.onSuccess = function() {
			
			var namespace = 'mod.'+moduleName;
			var NS = component.namespace = Brick.namespace(namespace);
			if (!Brick.objectExists(namespace+'.API')){
				NS.API = new Brick.Component.API(moduleName);
			}
			component.entryPoint(NS);
			delete component.entryPoint;
			component.onLoad();

			fireChecker(component);
			Brick.Component.registerEvent.fire(component);
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
	
	var fireElements = [];
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
			return this.idManager[arr[0]][arr[1]];
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
		Brick.widget.WindowWait.show();
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
	yui: '2.8.0r4'
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
	 * @default 2
	 */
	GUEST: 2,
	/**
	 * Группа пользователей "Заблокированные"
	 * @property BLOCKED
	 * @type Integer
	 * @default 3
	 */
	BLOCKED: 3,
	/**
	 * Группа пользователей "Авторизованные"
	 * @property USER
	 * @type Integer
	 * @default 4
	 */
	USER: 4,
	/**
	 * Группа пользователей "Модераторы"
	 * @property MODERATOR
	 * @type Integer
	 * @default 5
	 */
	MODERATOR: 5,
	/**
	 * Группа пользователей "Администраторы"
	 * @property ADMIN
	 * @type Integer
	 * @default 6
	 */
	ADMIN: 6		
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
	 * Имя (логин) пользователя
	 * @property name
	 * @type String
	 */
	name: 'guest',
	
	/**
	 * Идентификатор сессии
	 * @property session
	 * @type String
	 */
	session: '',
	
	/**
	 * Идентификатор группы:
	 *      <dl>
	 *      <dt>2</dt> <dd>Гость</dd>
	 *      <dt>3</dt> <dd>Заблокирован</dd>
	 *      <dt>4</dt> <dd>Авторизован</dd>
	 *      <dt>5</dt> <dd>Модератор</dd>
	 *      <dt>6</dt> <dd>Администратор</dd>
	 *      </dl>
	 * @property group
	 * @type Integer
	 * @default 2
	 */
	group: 2,
	
	/**
	 * Вернуть True, если пользователь является администратором
	 * @method isAdmin
	 * @static
	 * @return {Boolean}
	 */
	isAdmin: function(){ return Brick.env.user.group >= 6; },

	/**
	 * Вернуть True, если пользователь является модератором
	 * @method isModerator
	 * @static
	 * @return {Boolean}
	 */
	isModerator: function(){ return Brick.env.user.group >= 5; },
	
	/**
	 * Вернуть True, если пользователь авторизовался
	 * @method isRegister
	 * @static
	 * @return {Boolean}
	 */
	isRegister: function(){ return Brick.env.user.group >= 4; },
	
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
	
	/**
	 * Добавить CSS стиль на текущую страницу в браузере
	 * 
	 * @method update
	 * @static
	 * @param {String} t Текст CSS
	 */
	CSS.update = function(t){
		if (typeof t == 'undefined'){
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
		for (i=0;i<k.length;i++){
			l = l[k[i]];
			if (typeof l == 'undefined'){
				return null;
			}
		}
		
		return l;
	};
	
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
					type = 'js';
					switch(nm){
					case 'accordionview':
						fp = "/gzip.php?file=/js/yui/"+Brick.env.lib.yui+"/accordionview/accordionview-min.js";
						loader.addModule({
							name: "accordionview-css", type: "css", 
							fullpath: "/js/yui/"+Brick.env.lib.yui+"/accordionview/assets/skins/sam/accordionview.css"});
						loader.require("accordionview-css");
						loader.calculate({require: "button"});
						loader.calculate({require: "animation"});
						break;
					default:
						fp = elib[i].fullpath;
						type = elib[i].type;
					}
					l[l.length] = nm;
					loader.addModule({name: nm, type: type, fullpath: fp});
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
								rq[rq.length]=mm+mb;
								loader.addModule({
									name: mm+mb, 
									type: "js", 
									fullpath: "/gzip.php?type=mod&module="+mm+"&version="+mv+"&tt="+Brick.env.ttname+"&file="+mb
								});
							}
						}
					}
				}
				loader.require(rq);
			}
			loader.insert();
		}
	};
	
	Brick.Loader = function(){
		return {
			mods: [],
			add: function(o){
				this.mods[this.mods.length] = o;
			} 
		};
	}();
	

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
		// alert(YAHOO.lang.dump(old.mods));

		Brick.Loader = new loader();
		Brick.Loader.addRange(old.mods);
	});
})();

Brick.namespace('widget');

/**
 * Панель "Ожидание процесса"
 * 
 * @class WindowWait
 * @namespace Brick.widget
 * @static
 */
Brick.widget.WindowWait = function(){
	var win = null;
	return {
		
		/**
		 * Показать панель "Ожидание процесса"
		 * 
		 * @method show
		 * @static
		 */
		show: function(){
			var wWait = new YAHOO.widget.Panel("wait",{ 
				width:"280px", 
				fixedcenter:true, close:false, draggable:false, 
				zindex:1001, modal:true, visible:false
			});
			
			wWait.setHeader("Идет загрузка...");
			wWait.setBody('<center><img src="/images/loading_line.gif" /></center>');
			wWait.render(document.body);
			wWait.show();
			win = wWait;
		},
		
		/**
		 * Скрыть панель "Ожидание процесса"
		 * 
		 * @method hide
		 * @static
		 */
		hide: function(){
			if (YAHOO.lang.isNull(win)){ return; }
			win.destroy();
			win = null;
		}
	};
}();


(function(){
	
	var uniqurl = Brick.uniqurl;
	var wWait = Brick.widget.WindowWait;
	var readScript = Brick.readScript;

	var sendPost = function(module, brick, cfg ){

		cfg = cfg || {};
		cfg['json'] = cfg['json'] || {};
		var hidden = cfg['hidden'] || false;

		var post = "json="+encodeURIComponent(YAHOO.lang.JSON.stringify(cfg['json']));
		if (!hidden){
			wWait.show();
		}
		YAHOO.util.Connect.asyncRequest("POST", 
			uniqurl('/ajax/query.html?md='+module+'&bk='+brick), 
			{
				success: function(o) {
					if (!hidden){wWait.hide();} 
					readScript(o.responseText);
					if (typeof cfg.success == 'function'){
						cfg.success(o);
					}
				}, 
				failure: function(o){ 
					if (!hidden){wWait.hide();} 
					alert("CONNECTION FAILED!"); 
				}
			}, 
			post
		);
	};
	
	/**
	 * Менеджер AJAX запросов платформе Abricos
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
			if (!cfg['hidden']){
				wWait.show();
			}
			Brick.Loader.add({
			    yahoo: ['connection', 'json'],
			    onSuccess: function() {
					wWait.hide();
					sendPost(module, brick, cfg);
				},
				onFailure: function(){
					wWait.hide();
				}
			});
		}else{
			sendPost(module, brick, cfg);
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
	var m = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
	var mp = ['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря'];
	var ds = ['Вчера', 'Сегодня', 'Завтра'];
	
	var z = function(num){
		if (num < 10){
			return '0'+num;
		}
		return num;
	};
	
	return {
		convert: function(udate, type){
			if (udate*1 == 0){
				return "";
			}
			var msec = udate*1000;
			var cd = new Date(msec);
			
			var day = z(cd.getDate());
			var mon = z(cd.getMonth());
			var mons= mp[cd.getMonth()];
			var min = z(cd.getMinutes()+1);
			var hour = z(cd.getHours());
			
			if (type == 1){
				return day+'.'+mon+'.'+cd.getFullYear()+', '+hour+':'+(min);
			}else{
				var ld = new Date(), s;
				ld = new Date(ld.getFullYear(), ld.getMonth(), ld.getDate());
	
				var v = (Math.round(ld.getTime()/1000) - udate)/60/60/24;
				if (v > 0 && v < 1){
					s = ds[0];
				}else if (v < 0 && v >-2){
					s = ds[1];
				}else{
					s = day+' '+mp[cd.getMonth()]+' '+cd.getFullYear();
				}
				var tm = hour +':'+(min);
				return s+', '+tm;
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
