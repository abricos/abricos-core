var Component = new Brick.Component();
Component.requires = {
    yui: ['io', 'json'],
    mod: [
        {name: '{C#MODNAME}', files: ['appLib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        SLICE = Array.prototype.slice;

    NS.AppCore = Y.Base.create('appCore', Y.Base, [
        NS.CronCore,
        NS.Navigator,
        NS.APIRequests,
        NS.Language
    ], {
        initializer: function(){
            this.publish('appResponses');

            var component = this.get('component'),
                ns = component.namespace;

            ns.app = this;

            this._appTasks = [];

            this.addAppTask(this._apiInfoLoad);

            var ROLES = this.constructor.ROLES;
            if (ROLES && !ns.roles){
                ns.roles = new Brick.AppRoles(component.moduleName, ROLES);

                this.addAppTask(function(callback){
                    ns.roles.load(callback);
                });
            }
        },
        addAppTask: function(fn){
            this._appTasks[this._appTasks.length] = fn;
        },
        runAppTasks: function(callback, context){
            callback = callback || function(){
                };
            context = context || this;

            if (this._appTasks.length === 0){
                return callback.call(context, this);
            }

            var appTasks = this._appTasks,
                task = appTasks.shift();

            if (!Y.Lang.isFunction(task)){
                throw {
                    msg: 'Task is not function in App'
                };
            }

            var instance = this;
            task.call(this, function(){
                if (appTasks.length > 0){
                    return instance.runAppTasks(callback, context);
                }
                callback.call(context, this);
            });
        },
        _apiInfoLoad: function(callback){
            var module = this.get('component').moduleName,
                url = '/api/' + module + '/';

            Y.io(url, {
                headers: {
                    'X-CSRF-Token': Brick.env.user.session
                },
                method: 'GET',
                timeout: 30000,
                on: {
                    complete: function(txId, response){
                        this._apiOnInfoLoad(response);
                        callback.call(this);
                    }
                },
                context: this
            });
        },
        _apiOnInfoLoad: function(response){
            if (response.status !== 200){
                return;
            }
            var json;
            try {
                json = Y.JSON.parse(response.responseText);
            } catch (e) {
                // TODO: fire callback with JSON error
            }

            this.set('apiVersion', json.version);
            var structures = new NS.AppStructure(json);
            this.set('appStructure', structures);
        },
        apiRequestSend: function(){
            var args = SLICE.call(arguments),
                name = args.shift();

            if (!this.apiRequestAdded(name)){
                return;
            }

            var info = args.shift(),
                params = [];

            for (var i = 0; i < info.args.length; i++){
                params[params.length] = args.shift();
            }

            var callback = args.shift() || function(){
                    },
                context = args.shift() || this;

            var cacheResult;
            if (Y.Lang.isFunction(info.cache)){
                cacheResult = info.cache.apply(this, params);
            }
            if (!cacheResult && info.attribute){
                cacheResult = this.get(name);
            }

            if (cacheResult){
                return callback.call(context, null, {
                    name: cacheResult
                });
            }

            var module = this.get('component').moduleName,
                version = this.get('apiVersion'),
                url = '/api/' + module + '/' + version + '/' + name + '/';

            if (Y.Lang.isFunction(info.argsHandle)){
                params = info.argsHandle.apply(this, params);
            }

            for (var i = 0, name; i < info.args.length; i++){
                name = info.args[i];
                if (info.method === 'GET'){
                    url += encodeURIComponent(params[i]) + '/';
                }
            }

            Y.io(url, {
                headers: {
                    'X-CSRF-Token': Brick.env.user.session
                },
                method: info.method,
                timeout: 30000,
                on: {
                    complete: function(txId, response){
                        this.onAPIRequestSend({
                            name: name,
                            params: params,
                            request: info,
                            response: response,
                            callback: callback,
                            context: context
                        });
                    }
                },
                context: this
            });
        },
        onAPIRequestSend: function(options){
            var response = options.response,
                status = response.status,
                statusText = response.statusText,
                code = response.getResponseHeader('X-Extended-Code') | 0;

            if (status !== 200){
                var err = {
                    err: status,
                    code: code,
                    msg: statusText
                };
                return options.callback.call(options.context, err, null);
            }

            var name = options.name,
                info = options.request,
                json = {},
                ret = {};

            if (response.responseText !== ''){
                try {
                    json = Y.JSON.parse(response.responseText);
                } catch (e) {
                    // TODO: fire callback with JSON error
                }
            }

            if (info.type && info.typeClass){
                json = Y.merge(json || {}, {
                    appInstance: this,
                });

                var typeClass;
                switch (info.type) {
                    case 'response':
                        typeClass = this.get(info.typeClass) || NS.AppResponse;
                        ret[name] = new typeClass(json);
                        break;
                    case 'model':
                        typeClass = this.get(info.typeClass) || NS.AppModel;
                        ret[name] = new typeClass(json);
                        break;
                    case 'modelList':
                        typeClass = this.get(info.typeClass) || NS.AppModelList;
                        ret[name] = new typeClass({
                            appInstance: this,
                            items: json.list || []
                        });
                        break;
                }
            } else {
                ret[name] = json;
                if (Y.Lang.isFunction(info.response)){
                    ret[name] = info.response.call(this, data[name]);
                }
            }

            if (info.attribute){
                this.set(name, ret[name]);
            }

            var callback;
            if (ret[name] && Y.Lang.isFunction(info.onResponse)){
                callback = info.onResponse.call(this, ret[name], json);
            }
            if (Y.Lang.isFunction(callback)){
                // TODO: release
            }

            options.callback.call(options.context, null, ret);
        }
    }, {
        ATTRS: {
            component: {value: null},
            appStructure: {},
        }
    });

    NS.createApp = function(component, px, sx, extensions){
        extensions = extensions || [];

        var moduleName = component.moduleName,
            ns = Brick.mod[moduleName],
            appName = moduleName + 'App';

        sx.ATTRS = Y.merge(sx.ATTRS || {}, {
            component: {value: component},
        });

        ns.App = Y.Base.create(appName, NS.AppCore, extensions, px, sx);
        ns.App.initialize = function(callback, context){
            context = context || null;
            if (ns.app){
                return callback.call(context, null, app);
            }
            ns.app = new ns.App();
            ns.app.apiRequestsBind();
            ns.app.runAppTasks(callback, context);
        };
        return ns.App;
    };

    NS.getApp = function(module){
        return Brick.mod[module] && Brick.mod[module].app ?
            Brick.mod[module].app : null;
    };

    NS.initializeApp = function(module, callback, context, result){
        callback = callback || function(){
            };
        context = context || null;

        if (Y.Lang.isArray(module)){
            result = result || [];
            if (module.length === 0){
                return callback.call(context, null, result);
            }
            var moduleName = module.pop();
            NS.initializeApp(moduleName, function(err, app){
                result[moduleName] = {
                    err: err,
                    app: app
                };

                NS.initializeApp(module, callback, context, result);
            }, context, result);
            return;
        }

        var app = NS.getApp(module);
        if (app){
            return callback.call(context, null, app);
        }

        Brick.use(module, 'lib', function(err, ns){
            if (err){
                return callback.call(context, err, null);
            }

            if (!ns.App){
                err = {
                    code: 404,
                    msg: 'App class not defined in `' + module + '`'
                };
                return callback.call(context, err, null);
            }

            if (Y.Lang.isFunction(ns.App.initialize)){
                ns.App.initialize(function(){
                    return callback.call(context, null, ns.app);
                });
            } else {
                ns.initApp({
                    initCallback: function(err, appInstance){
                        return callback.call(context, err, appInstance);
                    }
                });
            }
        });
    };
};
