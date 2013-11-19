/*
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Y = YUI();

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
	host: document.location.hostname,
	
	enmod: [],
	
	ttname: ''
};

/**
 * Информация сторонних JS библиотек
 * @class Brick.env.lib
 * @static
 */
Brick.env.lib = {
	
	/**
	 * Версия YAHOO! User Interface Library
	 * @property yui
	 * @type String
	 */
	yui: '3.13.0'
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
	session: ''
};



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

Brick.console = function(obj){
	var console = window.console;
	if (!console){ return; }
	if (typeof console['log'] != 'function'){ return; }
	console.log(obj);
};

/**
 * Проверить, существует ли компонент модуля в наличие на сервере. 
 * Осуществляет поиск в Brick.Modules
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

Brick.namespace('util');


//////////////////////////CSS Style Manager //////////////////////////
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

//////////////////////////Language Manager ////////////////////////// 
(function(){
	var clone = function(from, to){
		for (var el in from){
			if (Y.Lang.isObject(from[el]) || Y.Lang.isArray(from[el])){
				if (typeof to[el] == 'undefined')
					to[el] = {};
				clone(from[el], to[el]);
			}else{
				to[el] = from[el];
			}
		}
	};

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
	
	Brick.util.Language = Language;
	
})();


//////////////////////////JS Loader ////////////////////////// 
(function(){
	
	// изначально лоадер работает как сборщик информации
	Brick.Loader = {
		mods: [],
		add: function(o){
			this.mods[this.mods.length] = o;
		} 
	};

	// основной загрузчик включается в работу после инициализации YUI3
	var Loader = function(){
		this.init();
	};
	Loader.prototype = {
		init: function(){
			this._modules = [];
		},
		add: function(){
			
		}
	};
	
	var cfgLoader = {
        combine: true,
        comboBase: "/gzip.php?base=/js/yui/"+Brick.env.lib.yui+"&file=",
        comboSep: ',',
        root: "",
	    groups: {
	        yui2: {
	            combine: true,
	            base: '/js/yui/2in3/',
	            comboBase: '/gzip.php?file=',
	            root: '/js/yui/2in3/',
	            patterns:  {
	                'yui2-': {
	                    configFn: function(me) {
	                        if(/-skin|reset|fonts|grids|base/.test(me.name)) {
	                            me.type = 'css';
	                            me.path = me.path.replace(/\.js/, '.css');
	                            me.path = me.path.replace(/\/yui2-skin/, '/assets/skins/sam/yui2-skin');
	                        }
	                    }
	                }
	            }
	        }
	    }
	};
	

	YUI(cfgLoader).use('node', 'yui2-dom', function (Y) {
		
	});
	
})();
