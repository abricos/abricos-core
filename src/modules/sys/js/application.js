var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['io.js', 'app.js']}
    ]
};
Component.entryPoint = function(NS){

    /* * * * * * * DEPRECATED * * * * * * */

    var Y = Brick.YUI,
        L = Y.Lang,

        UID = Brick.env.user.id | 0,

        ADDED = 'added',

        SLICE = Array.prototype.slice;

    var AppsCore = function(options){
        var appsOptions = options && options.APPS ? options.APPS : null;
        this._initApps(appsOptions);
    };
    AppsCore.prototype = {
        _initApps: function(appsOptions){
            this._appsState = new Y.State();

            var ctor = this.constructor,
                c = ctor;

            while (c){
                this.addApps(c.APPS);
                c = c.superclass ? c.superclass.constructor : null;
            }

            if (appsOptions){
                this.addApps(appsOptions);
            }
        },
        appAdded: function(name){
            return !!(this._appsState.get(name, ADDED));
        },
        addApp: function(name, config){
            var state = this._appsState;
            if (state.get(name, ADDED)){
                return;
            }

            config = Y.merge({
                name: name,
                instance: null
            }, config || {});

            config[ADDED] = true;
            state.data[name] = config;
        },
        addApps: function(apps){
            if (!apps){
                return;
            }
            apps = Y.AttributeCore.protectAttrs(apps);
            var name;
            for (name in apps){
                if (!apps.hasOwnProperty(name)){
                    continue;
                }
                this.addApp(name, apps[name]);
            }
        },
        getApp: function(name){
            var state = this._appsState,
                item = state.data[name];

            return item ? item.instance : null;
        },
        initializeApps: function(callback, context){
            var data = this._appsState.data,
                arr = [];

            var initApp = function(stack){
                if (stack.length === 0){
                    return callback.call(context || this);
                }
                var app = stack.pop();

                Brick.use(app.name, 'lib', function(err, ns){
                    if (err){
                        app.error = err;
                        return initApp(stack);
                    }
                    app.namespace = ns;
                    ns.initApp({
                        initCallback: function(err, appInstance){
                            if (err){
                                app.error = err;
                                return initApp(stack);
                            }
                            app.instance = appInstance;
                            initApp(stack);
                        }
                    });
                });
            };

            for (var name in data){
                if (!data.hasOwnProperty(name)){
                    continue;
                }
                var app = data[name];
                if (app.instance){
                    continue;
                }
                arr[arr.length] = app;
            }

            initApp(arr);
        }
    };
    NS.AppsCore = AppsCore;

    var RequestCore = function(options){
        var reqsOptions = options && options.REQS ? options.REQS : null;
        this._initRequests(reqsOptions);
    };
    RequestCore.prototype = {
        _initRequests: function(reqsOptions){
            this._reqsState = new Y.State();

            var ctor = this.constructor,
                c = ctor;

            while (c){
                this.addRequests(c.REQS);
                c = c.superclass ? c.superclass.constructor : null;
            }

            if (reqsOptions){
                this.addRequests(reqsOptions);
            }
        },
        requestAdded: function(name){
            return !!(this._reqsState.get(name, ADDED));
        },
        addRequest: function(name, config){
            var state = this._reqsState;
            if (state.get(name, ADDED)){
                return;
            }

            config = Y.merge({
                args: [],
                argsHandle: null,
                attribute: false,
                type: null,
                typeClass: null,
                attach: null,
                requestDataHandle: null,
                response: null,
                onResponse: null,
                cache: null
            }, config || {});

            if (Y.Lang.isString(config.type)){
                var a = config.type.split(':');
                config.type = a[0];
                switch (config.type) {
                    case 'model':
                    case 'modelList':
                    case 'response':
                        if (!config.typeClass){
                            config.typeClass = a[1];
                        }
                        if (!this.attrAdded(name) && config.attribute){
                            this.addAttr(name, {});
                        }
                        break;
                }
            }
            if (!config.type || !config.typeClass){
                config.type = config.typeClass = null;
            }

            config[ADDED] = true;
            state.data[name] = config;
        },
        addRequests: function(reqs){
            if (!reqs){
                return;
            }
            reqs = Y.AttributeCore.protectAttrs(reqs);
            var name;
            for (name in reqs){
                if (!reqs.hasOwnProperty(name)){
                    continue;
                }
                this.addRequest(name, reqs[name]);
            }
        }
    };
    NS.RequestCore = RequestCore;

    /**
     * @deprecated
     */
    NS.Application = Y.Base.create('application', Y.Base, [
        NS.AppsCore,
        NS.Navigator,
        NS.RequestCore,
        NS.CronCore,
        NS.AJAX,
        NS.Language
    ], {
        initializer: function(){
            this.publish('appResponses');

            var ns = this.get('component');
            ns.namespace.appInstance = this;
        },
        initCallbackFire: function(){
            var initCallback = this.get('initCallback');
            this.initializeApps(function(){
                if (L.isFunction(initCallback)){
                    initCallback(null, this);
                }
            }, this);
        },
        _request: function(name){
            if (!this.requestAdded(name)){
                return;
            }

            var state = this._reqsState,
                info = state.data[name],

                funcArgs = SLICE.call(arguments),
                funcArg,
                defArgsOffset = 1,

                aArgs = [],
                args = info.args,
                rData = {
                    'do': name
                };

            if (Y.Lang.isArray(args)){
                defArgsOffset = args.length + 1;
                if (Y.Lang.isFunction(info.argsHandle)){
                    args = info.argsHandle.apply(this, args);
                }
                for (var i = 0; i < args.length; i++){
                    funcArg = funcArgs[i + 1];
                    aArgs[aArgs.length] = funcArg;
                    if (funcArg && Y.Lang.isFunction(funcArg.toJSON)){
                        funcArg = funcArg.toJSON();
                    }
                    rData[args[i]] = funcArg;
                }
            }

            if (Y.Lang.isFunction(info.requestDataHandle)){
                rData = info.requestDataHandle.call(this, rData);
                aArgs = [];
                for (var i = 0; i < args.length; i++){
                    aArgs[i] = rData[args[i]];
                }
            }

            var callback, context;
            if (funcArgs[defArgsOffset]){
                callback = funcArgs[defArgsOffset];
            }
            if (funcArgs[defArgsOffset + 1]){
                context = funcArgs[defArgsOffset + 1];
            }

            var cacheResult;
            if (Y.Lang.isFunction(info.cache)){
                cacheResult = info.cache.apply(this, aArgs);
            }
            if (!cacheResult && info.attribute){
                cacheResult = this.get(name);
            }

            if (cacheResult){
                var ret = {};
                ret[name] = cacheResult;

                // TODO: develop - if attach not in cache
                if (info.attach){
                    var req = info.attach;
                    if (Y.Lang.isString(req)){
                        req = req.split(',');
                    }
                    for (var i = 0; i < req.length; i++){
                        var actr = req[i];
                        if (this.requestAdded(actr) && state.get('actr', 'attribute')){
                            ret[actr] = this.get(actr);
                        }
                    }
                }

                return callback.apply(context, [null, ret]);
            }

            if (info.attach){
                var req = info.attach;
                if (Y.Lang.isString(req)){
                    req = req.split(',');
                }
                rData = [rData]
                for (var i = 0, reqi, rinfo; i < req.length; i++){
                    reqi = req[i];
                    rinfo = state.data[reqi];
                    if (!rinfo){
                        continue;
                    }
                    if (rinfo.attribute && this.get(reqi)){
                        continue;
                    }
                    rData[rData.length] = {
                        'do': reqi
                    };
                }
            }

            this._appRequest(rData, callback, context);
        },
        _appRequest: function(rData, callback, context){
            if (this.get('isLoadAppStructure') && !this.get('appStructure')){
                if (!Y.Lang.isArray(rData)){
                    rData = [rData];
                }
                rData.splice(0, 0, {do: 'appStructure'});
            }
            this.ajax(rData, this._onAppResponses, {
                arguments: {callback: callback, context: context}
            });
        },
        _onAppResponse: function(name, data, res){
            if (!this.requestAdded(name)){
                return;
            }
            var info = this._reqsState.data[name];

            if (info.type && info.typeClass){
                var di = data[name] || {}, typeClass;

                switch (info.type) {
                    case 'response':
                        typeClass = this.get(info.typeClass) || NS.AppResponse;
                        di = Y.merge(di || {}, {
                            appInstance: this,
                        });
                        res[name] = new typeClass(di);
                        break;
                    case 'model':
                        typeClass = this.get(info.typeClass) || NS.AppModel;
                        di = Y.merge(di || {}, {
                            appInstance: this,
                        });
                        res[name] = new typeClass(di);
                        break;
                    case 'modelList':
                        typeClass = this.get(info.typeClass) || NS.AppModelList;
                        res[name] = new typeClass({
                            appInstance: this,
                            items: di.list || []
                        });
                        break;
                }
            } else {
                res[name] = data[name];
                if (Y.Lang.isFunction(info.response)){
                    res[name] = info.response.call(this, data[name]);
                }
            }
            if (info.attribute){
                this.set(name, res[name]);
            }
            var callback;
            if (res[name] && Y.Lang.isFunction(info.onResponse)){
                callback = info.onResponse.call(this, res[name], data[name]);
            }
            return callback;
        },
        _onAppResponses: function(err, res, details){
            res = res || {};

            if (res.userid !== UID){
                window.location.reload(false);
                return;
            }

            var tRes = {},
                rData = res.data || {};

            if (!Y.Lang.isArray(rData)){
                rData = [rData];
            }

            var rCallbacks = [], i, data, name, cb;

            for (i = 0; i < rData.length; i++){
                data = rData[i];
                for (name in data){
                    cb = this._onAppResponse(name, data, tRes);
                    if (Y.Lang.isFunction(cb)){
                        rCallbacks[rCallbacks.length] = cb;
                    }
                }
            }

            var complete = function(){
                this.fire('appResponses', {
                    error: err,
                    responses: rData,
                    result: tRes
                });

                if (Y.Lang.isFunction(details.callback)){
                    details.callback.apply(details.context, [err, tRes]);
                }
            };

            var rCallbackFire = function(cbList){
                if (cbList.length === 0){
                    return complete.call(this);
                }
                cbList.pop().call(this, function(err, result){
                    // TODO: implode errors
                    if (!err){
                        tRes = Y.merge(tRes, result || {});
                    }
                    return rCallbackFire.call(this, cbList);
                }, this);
            };

            rCallbackFire.call(this, rCallbacks);
        },
        onAJAXError: function(err){
            Brick.mod.widget.notice.show(err.msg);
        },
    }, {
        ATTRS: {
            initCallback: {value: null},
            component: {value: null},
            moduleName: {value: ''},
            isLoadAppStructure: {value: false},
            isAPI: {value: false}
        }
    });

    NS.Application.build = function(component, ajaxes, px, extensions, sx){
        extensions = extensions || [];
        sx = sx || {};

        sx.REQS = Y.merge({
            appStructure: {
                attribute: true,
                response: function(d){
                    return new NS.AppStructure(d);
                }
            }
        }, sx.REQS || {});

        ajaxes = sx.REQS = Y.merge(ajaxes, sx.REQS || {});

        var moduleName = component.moduleName,
            ns = Brick.mod[moduleName],
            appName = moduleName + 'App';

        for (var n in ajaxes){
            (function(){
                var act = n;
                px[act] = function(){
                    var args = SLICE.call(arguments);
                    args.splice(0, 0, act);
                    this._request.apply(this, args);
                };
            })();
        }

        sx.ATTRS = Y.merge(sx.ATTRS || {}, {
            component: {value: component},
            moduleName: {value: moduleName}
        });

        ns.App = Y.Base.create(appName, NS.Application, extensions, px, sx);
        ns.initApp = function(options){
            if (Y.Lang.isFunction(options)){
                options = {
                    initCallback: options
                }
            }
            options = Y.merge({
                initCallback: function(){
                }
            }, options || {});
            if (ns.appInstance){
                return options.initCallback(null, ns.appInstance);
            }

            new ns.App(options);
        };
        ns.appInstance = null;
    };

};