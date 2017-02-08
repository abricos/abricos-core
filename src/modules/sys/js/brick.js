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

        languages: ['ru'],

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
    timeout: 15000,
    combine: true,
    root: '',
    base: '',
    comboBase: "/gzip.php?base=vendor/alloyui&v=" + Brick.env.lib.aui + "&file=",
    comboSep: ',',
    groups: {
        yui2: {
            combine: true,
            root: '',
            base: '',
            comboBase: "/gzip.php?base=vendor/yui2in3&v=" + Brick.env.lib.aui + "&file=",
            comboSep: ',',
            patterns: {
                'yui2-': {
                    configFn: function(me){
                        if (/-skin|reset|fonts|grids|base/.test(me.name)){
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

Brick.namespace = function(){
    var a = arguments, o = null, i, j, d;
    for (i = 0; i < a.length; i = i + 1){
        d = a[i].split(".");
        o = Brick;
        for (j = (d[0] == "Brick") ? 1 : 0; j < d.length; j = j + 1){
            o[d[j]] = o[d[j]] || {};
            o = o[d[j]];
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
    var d = path.split(".");
    var o = Brick;
    for (var j = (d[0] == "Brick") ? 1 : 0; j < d.length; j++){
        if (typeof o[d[j]] == 'undefined'){
            return null;
        }
        o = o[d[j]];
    }
    return o;
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
    if (!Brick.Modules[moduleName]){
        return false;
    }
    var enmods = Brick.env.enmod || [];
    if (enmods.length > 0){
        var find = false;
        for (var i = 0; i < enmods.length; i++){
            if (enmods[i] == moduleName){
                find = true;
            }
        }
        if (!find){
            return false;
        }
    }
    var m = Brick.Modules[moduleName];
    for (var i = 0; i < m.length; i++){
        if (m[i]['f'] == (componentName + '.js')){
            return true;
        }
    }
    return false;
};

Brick.namespace('util');

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
        if (!cp){
            return false;
        }
        return cp.isRegistered;
    };


    var RegEngine = function(moduleName, componentName, component){
        this.init(moduleName, componentName, component);
    };
    RegEngine.prototype = {
        init: function(mName, cName, component){
            this.id = mName + ':' + cName;
            this.mName = mName;
            this.cName = cName;
            this.component = component;
            this.isReg = false;
        },
        buildId: function(mName, cName){
            return mName + ':' + cName;
        },
        isLoadDep: function(){
            var rq = this.component.requires;
            var mods = rq.mod || [];
            for (var i = 0; i < mods.length; i++){
                var mod = mods[i];
                var files = mod.files || [];
                for (var ii = 0; ii < files.length; ii++){
                    if (typeof files[ii] != 'string'){
                        continue;
                    }
                    var ccName = files[ii].replace(/\.js$/, '');
                    if (!Brick.componentExists(mod.name, ccName)){
                        // Brick.console('ops: '+this.mName+':'+this.cName+'=>'+mod.name+':'+ ccName);
                    } else if (!Brick.componentRegistered(mod.name, ccName)){
                        // Brick.console('Нехватает: '+this.mName+':'+this.cName+'=>'+mod.name+':'+ ccName);
                        return false;
                    }
                }
            }
            return true;
        },
        register: function(){
            if (this.isReg){
                return;
            }
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
     * @deprecated
     */
    Abricos.TemplateManager.prototype.getEl = function(idKey){
        return this.gel(idKey);
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
            alert('Error: The component is already registered!\nModuleName=' + moduleName + '\nComponentName=' + componentName);
            return;
        }
        Brick._ldCk[moduleName][componentName + '.js']['ok'] = true;

        component.key = new Abricos.Key(['mod', moduleName, componentName]);

        component.isRegistered = false;

        components[moduleName][componentName] = component;
        component.moduleName = moduleName;
        component.name = componentName;

        component._counter = counter++;

        var initCSS = false;
        component.buildTemplate = function(w, ts, override){
            // TODO:  Brick.util.CSS.disableCSSComponent - release for IE
            var key = new Abricos.Key(['mod', moduleName, componentName]);

            if (!initCSS){
                Abricos.CSS.apply(key);
                initCSS = true;
            }
            w._TM = new Abricos.TemplateManager(key, ts);
            w._TId = w._TM.idMap;
            w._T = w._TM.data;
            return w._TM;
        };

        // TODO: support older versions
        component.template = {
            build: function(ts){
                var key = new Abricos.Key(['mod', moduleName, componentName]);
                return new Abricos.TemplateManager(key, ts);
            }
        };
        component.language = Abricos.Language.get(['mod', moduleName], {
                isData: true
            }) || {};
        component.language.get = function(phraseId, mName){
            mName = mName || moduleName;
            return Abricos.Language.get('mod.' + mName + '.' + phraseId);
        };

        component.requires = component.requires || {};
        var loadinfo = component.requires;

        waiter[waiter.length] = new RegEngine(moduleName, componentName, component);

        loadinfo.onSuccess = function(){
            // проверить, все ли вложенные компоненты прогружены
            var isReg = false;
            do {
                isReg = false;
                for (var i = waiter.length - 1; i >= 0; i--){
                    var r = waiter[i];
                    if (!r.isReg){ // еще не загружался
                        if (r.isLoadDep()){ // зависимости все загружены
                            r.register();
                            isReg = true;
                        }
                    }
                }

            } while (isReg);
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
        this.entryPoint = function(){
        };

        /**
         * Выполняется после того, как компонент загружен и инициализирован. <br>
         * Особой надобности в этом методе нет, создан для удобства. Если слишком
         * большой файл и необходимо выполнить ряд функций в конце инициализации всех
         * классов, то удобнее этот ряд функций разместить в начале файла в этом методе.
         *
         * @method onLoad
         */
        this.onLoad = function(){
        };

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
        for (var i = 0; i < ids.length; i++){
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
                Brick.Loader.add({mod: [{name: this.moduleName, files: [this.componentName + '.js']}]});
                fireElements[this.id] = this;
            } else {
                this.fire();
            }
        },
        fire: function(){
            delete fireElements[this.id];
            if (Y.Lang.isString(this.method)){
                var ffn = Brick.mod[this.moduleName]['API'][this.method];
                if (!Y.Lang.isFunction(ffn)){
                    return;
                }
                ffn(this.param);
            } else if (Y.Lang.isFunction(this.method)){
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
        callback = callback || function(){
            };
        if (!Brick.componentExists(mName, cName)){
            var err = {
                code: 404,
                msg: 'Component `' + cName + '` not found in `'
                + mName + '`'
            };
            return callback.apply(context, [err, null]);
        }
        Brick.ff(mName, cName, function(){
            var ns = Brick.mod[mName];
            return callback.apply(context, [null, ns]);
        });
    };

    Brick.app = function(mName, callback, context){
        callback = callback || function(){
            };
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
        for (var i = 2; i < args.length; i++){
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

        this._setRoles = function(){
            var user = Brick.AppRoles.user;
            for (var nRole in mRoles){
                this[nRole] = user ? user.isRoleEnable(mName, mRoles[nRole]) : false;
            }
        };

        this.load = function(callback, context){
            if (Brick.AppRoles._loadProcess){
                var instance = this;
                return setTimeout(function(){
                    instance.load(callback, context);
                }, 100);
            }

            if (Brick.AppRoles.user){
                this._setRoles();
                if (Y.Lang.isFunction(callback)){
                    callback.call(context, this);
                }
                return;
            }

            Brick.AppRoles._loadProcess = true;

            Brick.appFunc('user', 'userCurrent', function(err, res){
                Brick.AppRoles.user = res.userCurrent;
                this._setRoles();

                Brick.AppRoles._loadProcess = false;

                if (Y.Lang.isFunction(callback)){
                    callback.call(context, this);
                }
            }, this);
        }
    };

    Brick.AppRoles.user = null;
    Brick.AppRoles._loadProcess = false;

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
        for (var i = 0; i < notPages.length; i++){
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

(function(){

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
     * @deprecated
     * @static
     */
    Brick.util.Connection = {};

    /**
     * Отправить AJAX запрос кирпичу определенного модуля
     *
     * @method sendCommand
     * @static
     * @deprecated
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
     * @method ajax
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
                var callback = cfg['event'] || function(){
                    };
                callback(res);
            });
        });
    };

})();

Brick.dateExt = function(){
    var z = function(num){
        if (num < 10){
            return '0' + num;
        }
        return num;
    };

    return {
        convert: function(udate, type, hideTime){
            var LNG = Abricos.Language;

            if (!udate){
                return "";
            }
            if (typeof udate['getTime'] === 'function'){
                udate = udate.getTime() / 1000;
            }
            udate = udate | 0;
            if (udate === 0){
                return "";
            }
            hideTime = hideTime || false;

            var msec = udate * 1000,
                cd = new Date(msec),
                day = z(cd.getDate()),
                mon = z(cd.getMonth() + 1), // +1 т.к. нумерация идет с 0
                min = z(cd.getMinutes()),
                hour = z(cd.getHours()),
                sMonth = LNG.get('mod.sys.brick.date.monthp.' + (cd.getMonth() + 1));

            if (type == 1){
                var s = day + '.' + mon + '.' + cd.getFullYear();
                if (!hideTime){
                    s += ', ' + hour + ':' + (min);
                }
                return s;
            } else if (type == 2){// Добавлена возможность отображения даты в виде дд.мм.гггг
                return day + '.' + mon + '.' + cd.getFullYear();
            } else if (type == 3){
                return day + ' ' + sMonth + ' ' + cd.getFullYear();
            } else if (type == 4){
                return hour + ':' + (min);
            } else {
                var ld = new Date(), s;
                ld = new Date(ld.getFullYear(), ld.getMonth(), ld.getDate());

                var v = (Math.round(ld.getTime() / 1000) - udate) / 60 / 60 / 24;
                if (v > 0 && v < 1){
                    s = LNG.get('mod.sys.brick.date.dayst.1');
                } else if (v < 0 && v > -2){
                    s = LNG.get('mod.sys.brick.date.dayst.2');
                } else {
                    s = day + ' ' + sMonth + ' ' + cd.getFullYear();
                }
                var tm = hour + ':' + (min);
                if (!hideTime){
                    s += ', ' + tm;
                }
                return s;
            }
        },
        unixToArray: function(udate){
            var msec = udate * 1000;
            var cd = new Date(msec);
            return {
                'day': cd.getDate(),
                'month': cd.getMonth(),
                'year': cd.getFullYear(),
                'min': cd.getMinutes() + 1,
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
            if (typeof o.yahoo != 'undefined'){
                this.yahoo = o.yahoo;
            }
            if (typeof o.yui != 'undefined'){
                this.yui = o.yui;
            }
            if (typeof o.ext != 'undefined'){
                this.ext = o.ext;
            }
            if (typeof o.mod != 'undefined'){
                this.mod = o.mod;
            }
            this.event = {onSuccess: o.onSuccess, onFailure: o.onFailure, executed: false};
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
            for (i = 0; i < o.length; i++){
                m = new Module(o[i]);
                this._addModule(m);
            }
            if (!this._isProccess){
                this._start();
            }
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
            for (i = cnt - 1; i >= 0; i--){
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

            for (i = 0; i < this._modules.length; i++){
                m = this._modules[i];
                if (m.isLoad){
                    continue;
                }
                m.isLoad = true;

                // Brick Module
                for (j = 0; j < m.mod.length; j++){
                    mlib[mlib.length] = m.mod[j];
                }
                // Ext
                for (j = 0; j < m.ext.length; j++){
                    elib[elib.length] = m.ext[j];
                }
                // YUI2
                for (j = 0; j < m.yahoo.length; j++){
                    r = 'yui2-' + m.yahoo[j];
                    if (typeof this._reqYUI[r] == 'undefined'){
                        this._reqYUI[r] = true;
                        ylib[ylib.length] = r;
                    }
                }
                // YUI3
                for (j = 0; j < m.yui.length; j++){
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
                    for (i = 0; i < elib.length; i++){
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

                    for (var ii = 0; ii < mlib.length; ii++){
                        if (!mlib[ii]){
                            continue;
                        }

                        mm = mlib[ii].name;
                        minfo = Brick.Modules[mm];

                        if (!minfo){
                            continue;
                        }

                        for (j = 0; j < mlib[ii].files.length; j++){
                            mb = mlib[ii].files[j];
                            mv = "";
                            for (k = 0; k < minfo.length; k++){
                                if (minfo[k]['f'] == mb){
                                    mv = minfo[k]['k'];
                                }
                            }
                            if (mv == ""){
                                continue;
                            }

                            var ldCk = Brick._ldCk[mm] = Brick._ldCk[mm] || {};
                            ldCk = ldCk[mb] = ldCk[mb] || {'ok': false, 'n': 0};

                            var samm = mm.split("/"), src = "";

                            if (samm.length == 2){
                                var nHost = samm[0], nPort = 80, nModName = samm[1];
                                aHost = nHost.split(':');
                                if (aHost.length == 2){
                                    nHost = aHost[0];
                                    if (aHost[1] * 1 != 0){
                                        nPort = aHost[1] * 1;
                                    }
                                }
                                src = "/app/gzip/" + nHost + "/" + nPort + "/" + nModName + "/" + mv + "/" + mb;
                            } else {
                                src = "/gzip.php?type=mod&module=" + mm
                                    + "&version=" + mv
                                    + "&tt=" + Brick.env.ttname
                                    + "&n=" + ldCk['n']
                                    + "&locale=" + Abricos.config.locale
                                    + "&file=" + mb;
                            }

                            var reqid = 'n' + ldCk['n'] + mm + mb;

                            if (Brick._ldReqId[reqid]){
                                continue;
                            }
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

                YUI({'modules': ldMod}).use(requires, function(Y){
                    __self._event(false);
                });
            };

            if (ylib.length == 0){
                loadOverLib();
            } else {
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

// TODO: support older versions
(function(){
    Brick.util.Language = {
        add: function(locale, phrases){
            if (locale === 'ru'){
                locale = 'ru-RU';
            } else if (locale === 'en'){
                locale = 'en-EN';
            }
            var key, data;
            for (var n in phrases){
                key = n;
                data = phrases[n];
                break;
            }
            if (!key){
                return;
            }
            Abricos.Language.add(key, locale, data);
        },
        getc: function(phraseId){
            return Abricos.Language.get(phraseId, {
                isData: true
            });
        }
    };
})();