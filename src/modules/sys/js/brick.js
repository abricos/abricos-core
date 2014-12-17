/*
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * Ядро Abricos
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
	yui: '3.18.0',
    aui: '3.0.0'
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

YUI.GlobalConfig = {
// filter: 'raw',
	timeout: 15000,
    combine: false,
    base: "/gzip.php?base=vendor/alloyui&v="+Brick.env.lib.aui+"&file=",
    comboSep: ',',
    groups: {
    	/*
    	aui: {
    	    combine: false,
    	    base: "/gzip.php?base=js/alloy-ui&file=",
            patterns:  {
                'aui-': { }
            }
    	},
    	/**/
    	gallery: {
    	    combine: false,
    	    base: "/gzip.php?base=vendor/yui3gallery&file=",
            patterns:  {
                'gallery-': { }
            }
    	},
        yui2: {
            combine: false,
            base: "/gzip.php?base=vendor/yui2in3&file=",
            comboBase: '/gzip.php?file=',
            root: '/vendor/yui2in3/',
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
var Y = Brick.YUI = YUI();

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
	return !Y.Lang.isNull(obj);
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
	for (var j=(d[0] == "Brick")?1:0; j<d.length; j++) {
		if (typeof o[d[j]] == 'undefined'){ return null; }
		o=o[d[j]];
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


(function(){



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
					if (typeof files[ii] != 'string'){ continue; }
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

        component.key = new Abricos.Key(['mod', moduleName, componentName]);

		component.isRegistered = false;

		components[moduleName][componentName] = component;
		component.moduleName = moduleName;
		component.name = componentName;

		component.template = new Brick.Template(component);
		component._counter = counter++;

		component.language = Brick.util.Language.geta(['mod', moduleName]) || {};
		component.language.get = function(path, mName){
			var d=path.split("."), o=component.language;
			if (mName){
				o = Brick.util.Language.geta(['mod', mName]) || {};
			}
			for (var j=0; j<d.length; j++) {
				if (typeof o[d[j]] == 'undefined'){ return path; }
				if (typeof o[d[j]] == 'string'){ return o[d[j]]; }
				o=o[d[j]];
			}
			return o;
		};

		var initCSS = false;
		component.buildTemplate = function(w, ts, override){
            // TODO:  Brick.util.CSS.disableCSSComponent - release for IE
			if (!initCSS){
                var key = new Abricos.Key(['mod', moduleName, componentName]);
                Abricos.CSS.apply(key);

				initCSS = true;
			}
			w._TM = component.template.build(ts, override);
			w._T = w._TM.data; w._TId = w._TM.idManager;
			return w._TM;
		};

		component.requires = component.requires || {};
		var loadinfo = component.requires;

		waiter[waiter.length] = new RegEngine(moduleName, componentName, component);

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
		this.config = Y.merge({
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
			if (Y.Lang.isString(this.method)){
				var ffn = Brick.mod[this.moduleName]['API'][this.method];
				if (!Y.Lang.isFunction(ffn)){ return; }
				ffn(this.param);
			}else if (Y.Lang.isFunction(this.method)){
				this.method(this.param);
			}
			if (Y.Lang.isFunction(this.func)){
				this.func();
			}
		}
	};

    /**
     * @deprecated
     */
	Brick.f = Brick.Component.API.fire;
    /**
     * @deprecated
     */
	Brick.ff = Brick.Component.API.fireFunction;

    Brick.use = function(mName, cName, callback, context){
        callback = callback || function(){};
        if (!Brick.componentExists(mName, cName)){
            var err = {
                code: 404,
                msg: 'Component of Module not found'
            };
            return callback.apply(context, [err, null]);
        }
        Brick.ff(mName, cName, function(){
            var ns = Brick.mod[mName];
            return callback.apply(context, [null, ns]);
        });
    };

    Brick.app = function(mName, callback, context){
        callback = callback || function(){};
        Brick.use(mName, 'lib', function(err, NS){
            if (err){
                return callback.apply(context, [err, null]);
            }
            if (!Y.Lang.isFunction(NS.initApp)){
                err = {
                    code: 500,
                    msg: 'App of Module not found'
                };
                return callback.apply(context, [err, null]);
            }
            NS.initApp(function(err, appInstance){
                if (err){
                    return callback.apply(context, [err, null]);
                }
                return callback.apply(context, [null, appInstance]);
            });
        });
    };

    Brick.appFunc = function(mName, funcName){
        var args = Array.prototype.slice.call(arguments),
            nargs = [];
        for (var i=2;i<args.length;i++){
            nargs[nargs.length] = args[i];
        }
        Brick.app(mName, function(err, appInstance){
            if (err){
                throw err;
            }
            var func = appInstance[funcName];
            if (!Y.Lang.isFunction(func)){
                throw {
                    code: 510,
                    msg: 'Function in App of Module not found'
                };
            }
            func.apply(appInstance, nargs);
        });
    };

    Brick.AppRoles = function(mName, mRoles){

        Brick.AppRoles.instances[mName] = this;

        this._isLoadRoles = false;

        this._setRoles = function(user){
            for (var nRole in mRoles){
                this[nRole] = user ? user.isRoleEnable(mName, mRoles[nRole]) : false;
            }
        };

        this.load = function(callback, context){
            Brick.appFunc('user', 'userCurrent', function(err, res){
                this._isLoadRoles = true;

                this._setRoles(res.userCurrent);

                if (Y.Lang.isFunction(callback)){
                    callback.call(context, this);
                }
            }, this);
        }
    };

    Brick.AppRoles.instances = {};

    /**
     * @deprecated
     * @param modName
     * @param action
     * @returns {boolean}
     */
    Brick.AppRoles.check = function(mName, action){
        var NSUser = Brick.mod.user;
        if (!NSUser || !NSUser.appInstance || !NSUser.appInstance._cacheUserCurrent){
            return false;
        }
        return NSUser.appInstance._cacheUserCurrent.isRoleEnable(mName, action);
    };

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

		var mName = component.moduleName,
			cName = component.name,
			BT = Brick.util.Template;
		if (BT[mName] && BT[mName][cName]){
			this.source = BT[mName][cName];
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
		build: function(names, override){
			names = names || '';
			return new Brick.Template.Manager(this, '', names, override);
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
	Brick.Template.Manager = function(owner, id, names, override){
		names = names || '';

		/**
		 * Основатель
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

		var L = YAHOO.lang;

		var _clone = function(t){

			var ct = {};
			if (names != ''){
				var arr = names.split(',');
				for (var i=0;i<arr.length;i++){
					var name = L.trim(arr[i]);
					if (t[name]){
						ct[name] = t[name];
					}
				}
			}else{
				for (var name in t){
					ct[name] = t[name];
				};
			}

			// перегрузка
			if (L.isObject(override)){

				var tos = override.template.source;
				for (var name in ct){
					if (tos[name]){
						ct[name] = tos[name];
					}
				}
			}

			return ct;
		};

		var source = _clone(owner.source);

		// заполнить фразы языка
		Brick.util.Template.fillLanguage(source, this.owner.component, override);

		/**
		 * Хеш элементов шаблона.
		 *
		 * @property data
		 * @type Object
		 */
		this.data = source;

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
	Template.fillLanguage = function(t, component, override){
		if (typeof t == 'undefined'){
			return;
		}
		var key, phrase, L = YAHOO.lang;

		var getPhrase = function(lngKey){
			// перегрузка языковых фраз
			if (L.isObject(component) && L.isObject(override)){
				var cName = component.name,
					mName = component.moduleName,
					coName = override.name,
					moName = override.moduleName;

				var tmpLngKey = lngKey.replace(
						'mod.'+mName+'.'+cName+'.',
						'mod.'+moName+'.'+coName+'.'
					);
				var ret = Brick.util.Language.getc(tmpLngKey);
				if (L.isString(ret)){
					return ret;
				}
			}
			return Brick.util.Language.getc(lngKey);
		};

		// полная замена {#...}
		var exp = new RegExp("(\{\#[a-zA-Z0-9_\.\-]+\})", "g");
		for (var name in t){
			var s = t[name], arr = s.match(exp);

			if (!L.isArray(arr)){ continue; }

			for (var i=0;i<arr.length;i++){
				key = arr[i].replace(/[\{#\}]/g, '');
				phrase = getPhrase(key);
				if (L.isValue(phrase)){
					s = s.replace(arr[i], phrase);
				}
			}

			t[name] = s;
		}

		if (!L.isObject(component)){
			return;
		}

		var cName = component.name,
			mName = component.moduleName;

		// короткая замена {##...}
		var exp = new RegExp("(\{\##[a-zA-Z0-9_\.\-]+\})", "g");
		for (var name in t){
			var s = t[name], arr = s.match(exp);

			if (!L.isArray(arr)){ continue; }

			for (var i=0;i<arr.length;i++){
				key = arr[i].replace(/[\{##\}]/g, '');
				if (key == ''){ continue; }

				key = 'mod.'+mName+'.'+cName+'.'+key;
				phrase = getPhrase(key);
				if (L.isValue(phrase)){
					s = s.replace(arr[i], phrase);
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

//типизированный AJAX
(function(){

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
     * @deprecated
	 */
	Brick.ajax = function(module, cfg){
        cfg = cfg || {};
        Brick.use('sys', 'lib', function(err, NS){

            var App = Y.Base.create('app', Y.Base, [
                NS.AJAX
            ], {}, {
                ATTRS: {
                    moduleName: {
                        value: module
                    }
                }
            });

            new App({moduleName: module}).ajax(cfg['data'] || {}, function(err, res){
                var callback = cfg['event'] || function(){};
                callback(res);
            });
        });
	};

})();

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

//////////////////////////JS Loader ////////////////////////// 
(function(){

	// изначально лоадер работает как сборщик информации
	Brick.Loader = {
		mods: [],
		add: function(o){
			this.mods[this.mods.length] = o;
		}
	};

	var Module = function(o){
		this.yahoo = [];	// YUI2
		this.yui = [];		// YUI3
		this.ext = [];
		this.mod = [];
		this.isLoad = false;
		this.event = null;
		this.init(o);
	};
	Module.prototype = {
		init: function(o){
			o = o || {};
			if (typeof o.yahoo != 'undefined'){ this.yahoo = o.yahoo; }
			if (typeof o.yui != 'undefined'){ this.yui = o.yui; }
			if (typeof o.ext != 'undefined'){ this.ext = o.ext; }
			if (typeof o.mod != 'undefined'){ this.mod = o.mod; }
			this.event = { onSuccess: o.onSuccess, onFailure: o.onFailure, executed: false};
		}
	};

	var _isLoadYUI2 = false;

	// основной загрузчик включается в работу после инициализации YUI3
	var Loader = function(){
		this.init();
	};
	Loader.prototype = {
		init: function(){
			this._isProccess = false;
			this._countModule = 0;
			this._modules = [];
			this._reqYUI = {};
			this._cacheReqMod = {};
		},
		add: function(param){
			var m = new Module(param);
			this._addModule(m);
			if (!this._isProccess){
				this._start();
			}
		},
		addRange: function(o){
			var m, i;
			for (i=0;i<o.length;i++){
				m = new Module(o[i]);
				this._addModule(m);
			}
			if (!this._isProccess){ this._start(); }
		},
		_addModule: function(m){
			this._modules[this._modules.length] = m;
		},
		_event: function(error){

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

				if (typeof f == 'function'){
					f();
				}
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

			var i, m, j, k, r, elib = [], mlib = [];

			// var ylib = _isLoadYUI2 ? [] : ['yui2-dom', 'yui2-event'];
			var ylib = [];
			_isLoadYUI2 = true;

			for (i=0;i<this._modules.length;i++){
				m = this._modules[i];
				if (m.isLoad){ continue; }
				m.isLoad = true;

				// Brick Module
				for (j=0;j<m.mod.length;j++){ mlib[mlib.length] = m.mod[j]; }
				// Ext
				for (j=0;j<m.ext.length;j++){ elib[elib.length] = m.ext[j]; }
				// YUI2
				for (j=0;j<m.yahoo.length;j++){
					r = 'yui2-'+m.yahoo[j];
					if (typeof this._reqYUI[r] == 'undefined'){
						this._reqYUI[r] = true;
						ylib[ylib.length] = r;
					}
				}
				// YUI3
				for (j=0;j<m.yui.length;j++){
					r = m.yui[j];

					if (typeof this._reqYUI[r] == 'undefined'){
						this._reqYUI[r] = true;
						ylib[ylib.length] = r;
					}
				}
			}

			var __self = this;
			var loadOverLib = function(){
				var requires = [], ldMod = {};

				if (elib.length > 0){
					for (i=0;i<elib.length;i++){
						var nm = elib[i].name;
						requires[requires.length] = nm;
						ldMod[nm] = {
							'name': nm,
							'type': elib[i].type,
							'fullpath': elib[i].fullpath
						};
					}
				}

				if (mlib.length > 0){
					var mm, mb, mv, minfo;

					for (var ii=0;ii<mlib.length;ii++){
						if (!mlib[ii]){ continue; }

						mm = mlib[ii].name;
						minfo = Brick.Modules[mm];

						if (!minfo){ continue; }

						for (j=0;j<mlib[ii].files.length;j++){
							mb = mlib[ii].files[j];
							mv = "";
							for (k=0;k<minfo.length;k++){
								if (minfo[k]['f'] == mb){ mv = minfo[k]['k']; }
							}
							if (mv == ""){ continue; }

							var ldCk = Brick._ldCk[mm] = Brick._ldCk[mm] || {};
							ldCk = ldCk[mb] = ldCk[mb] || {'ok': false, 'n': 0};

							var samm = mm.split("/"), src = "";

							if (samm.length == 2){
								var nHost = samm[0], nPort = 80, nModName = samm[1];
								aHost = nHost.split(':');
								if (aHost.length == 2){
									nHost = aHost[0];
									if (aHost[1]*1 != 0){
										nPort = aHost[1]*1 ;
									}
								}
								src = "/app/gzip/"+nHost+"/"+nPort+"/"+nModName+"/"+mv+"/"+mb;
							}else{
								src = "/gzip.php?type=mod&module="+mm
									+"&version="+mv
									+"&tt="+Brick.env.ttname
									+"&n="+ldCk['n']
									+"&lang="+Brick.env.language
									+"&file="+mb;
							}

							var reqid='n'+ldCk['n']+mm+mb;

							if (Brick._ldReqId[reqid]){ continue; }
							Brick._ldReqId[reqid] = true;

							requires[requires.length] = reqid;

							ldMod[reqid] = {
								name: reqid,
								type: "js",
								fullpath: src
							};
						}
					}
				}

				YUI({'modules': ldMod}).use(requires, function (Y) {
					__self._event(false);
				});
			};

			if (ylib.length == 0){
				loadOverLib();
			}else{
				Brick.YUI.use(ylib, function(Y){
					Brick.YUI = Y;
					YAHOO = Y.YUI2;
					loadOverLib();
				});
			}

		}
	};
	Brick._ldCk = {};
	Brick._ldReqId = {};

	var old = Brick.Loader;
	Brick.Loader = new Loader();
	Brick.Loader.addRange(old.mods);
})();
