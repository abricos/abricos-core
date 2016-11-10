/*!
 * Abricos Platform (http://abricos.org)
 * Copyright 2008-2015 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['widget.js', 'io.js', 'appModel.js']},
        {name: 'widget', files: ['notice.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        L = Y.Lang,

        UID = Brick.env.user.id | 0,

        WAITING = 'waiting',
        BOUNDING_BOX = 'boundingBox',

        SLICE = Array.prototype.slice;

    var ADDED = 'added';

    var Navigator = function(){
        this._initNavigator();
    };
    /**
     * Example:
     * user.view(532,avatar) => return {
     *      key: 'user.view',
     *      args: ['532', 'avatar']
     * }
     *
     * uprofile:user.view(532,avatar) => return {
     *      module: 'uprofile',
     *      key: 'user.view',
     *      args: ['532', 'avatar']
     * }
     * @param sURL
     */
    Navigator.parseURL = function(sURL){
        var a = sURL.split(':'),
            module = '';

        if (a.length === 2){
            module = a[0];
            sURL = a[1];
        }

        a = sURL.split('.');

        var key = [],
            args = [],
            ex,
            rex = /(.*)\((.*)\)/i;

        for (var i = 0, si; i < a.length; i++){
            si = a[i];
            if (i === (a.length - 1) && rex.test(si)){
                ex = rex.exec(si);
                si = ex[1];
                args = ex[2].split(",");
            }
            key[key.length] = si;
        }
        return {
            module: module,
            key: key.join('.'),
            args: args
        };
    };

    /**
     * Example: unparseURL('user.view', 523, 'avatar') => 'user.view(523,avatar)'
     * @param key
     * @param args...
     */
    Navigator.unparseURL = function(key){
        var args = SLICE.call(arguments).slice(1);
        if (args.length > 0){
            return key + '(' + args.join(',') + ')'
        }
        return key;
    };

    Navigator.getURL = function(sURL, sources){
        if (!sURL || !sources){
            return;
        }
        if (!Y.Lang.isArray(sources)){
            sources = [sources];
        }
        var p = NS.Navigator.parseURL(sURL),
            url = null;

        if (p.module && Brick.mod[p.module] && Brick.mod[p.module].appInstance){
            var source = Brick.mod[p.module].appInstance;
            if (!Y.Lang.isFunction(source.getURL)){
                return null;
            }
            url = source.getURL.apply(source, [p.key].concat(p.args));
            if (url && url !== ''){
                return url;
            }
            return null;
        }

        for (var i = 0, source; i < sources.length; i++){
            source = sources[i];
            url = source.getURL.apply(source, [p.key].concat(p.args));
            if (url && url !== ''){
                return url;
            }
        }
        return null;
    };

    Navigator.fillNode = function(el, sources){
        el = Y.one(el);
        if (!el || !sources){
            return;
        }
        if (!Y.Lang.isArray(sources)){
            sources = [sources];
        }
        var sURL, url;
        el.all('[data-url]').each(function(node){
            sURL = node.getData('url');
            if ((url = NS.Navigator.getURL(sURL, sources))){
                node.set('href', url);
            }
        }, this);
    };

    /**
     * Example: Navigator.go('user.view(234,avatar)', [...]);
     * @param sURL
     * @param sources
     */
    Navigator.go = function(sURL, sources){
        var url = Navigator.getURL(sURL, sources);
        if (!url){
            return;
        }
        window.location.href = url;
    };

    Navigator.prototype = {
        _initNavigator: function(){
            this._urlsState = new Y.State();

            var ctor = this.constructor,
                c = ctor;

            while (c){
                this.addURLs(c.URLS);
                c = c.superclass ? c.superclass.constructor : null;
            }
        },
        getURL: function(name){
            var args = SLICE.call(arguments).slice(1);
            if (!this.URLAdded(name)){
                return '';
            }
            var config = this._urlsState.data[name];
            if (Y.Lang.isFunction(config.value)){
                return config.value.apply(this, args);
            }
            return config.value;

        },
        URLAdded: function(name){
            return !!(this._urlsState.get(name, ADDED));
        },
        addURL: function(name, url){
            var state = this._urlsState;
            if (this.URLAdded(name)){
                return;
            }
            var config = {
                value: url
            };
            config[ADDED] = true;
            state.data[name] = config;
        },
        addURLs: function(urls){
            if (!urls){
                return;
            }

            var parse = function(objs){
                if (Y.Lang.isString(objs) || Y.Lang.isFunction(objs)){
                    return objs;
                }
                var a = [], name, ta, obj, i;
                for (name in objs){
                    if (!objs.hasOwnProperty(name)){
                        continue;
                    }
                    obj = objs[name];
                    ta = parse(obj);
                    if (Y.Lang.isArray(ta)){
                        for (i = 0; i < ta.length; i++){
                            a[a.length] = {
                                key: name + '.' + ta[i].key,
                                val: ta[i].val
                            };
                        }
                    } else {
                        a[a.length] = {key: name, val: ta};
                    }
                }
                return a;
            };

            var a = parse(urls), i;
            for (i = 0; i < a.length; i++){
                this.addURL(a[i].key, a[i].val);
            }
        },
        defineURLSources: function(sources){
            if (!sources){
                sources = this;
            }
            if (!Y.Lang.isArray(sources)){
                sources = [sources];
            }
            var ret = [], find = false;
            for (var i = 0, si; i < sources.length; i++){
                si = sources[i];
                if (!Y.Lang.isFunction(si.getURL)){
                    continue;
                }
                if ((si === this && !find) || si !== this){
                    ret[ret.length] = si;
                }
                if (si === this){
                    find = true;
                }
            }
            if (!find){
                ret[ret.length] = this;
            }
            return ret;
        },
        go: function(){
            var url = this.getURL.apply(this, arguments);

            if (!url){
                return;
            }
            window.location.href = url;
        }
    };
    NS.Navigator = Navigator;

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

    var CronCore = function(options){
        var cronsOptions = options && options.CRONS ? options.CRONS : null;
        this._initCron(cronsOptions);
    };
    CronCore._uniqueId = 1;
    CronCore._list = [];
    CronCore._runTimer = new Date();
    CronCore.each = function(fn, context){
        var list = CronCore._list;
        for (var i = 0; i < list.length; i++){
            if (fn.call(context || list[i], list[i], i)){
                break;
            }
        }
    };
    CronCore._initialize = function(){
        if (CronCore._initialized){
            return;
        }
        CronCore._initialized = true;
        Y.one(document.body).on('mousemove', function(){
            var ctime = (new Date()).getTime(),
                ltime = this._runTimer.getTime();

            if ((ctime - ltime) / 1000 < 60){
                return;
            }
            this._runTimer = new Date();
            this.run();
        }, this);
    };
    CronCore.register = function(cron){
        this._initialize();

        var list = CronCore._list;
        list[list.length] = cron;
        return cron;
    };
    CronCore.remove = function(cron){
        var list = CronCore._list;
        CronCore.each(function(iCron, i){
            if (cron === iCron){
                list.slice(i, 1);
                return true;
            }
        }, this);
    };
    CronCore.ATTRS = {
        cronsId: {
            readOnly: true,
            getter: function(){
                return this._cronsId;
            }
        }
    };
    CronCore.run = function(){
        this.each(function(cron){
            cron.runCrons();
        }, this);
    };
    CronCore.prototype = {
        _initCron: function(cronsOptions){
            this._cronsState = new Y.State();
            this._cronsId = NS.CronCore._uniqueId++;

            var ctor = this.constructor,
                c = ctor;

            while (c){
                this.addCrons(c.CRONS);
                c = c.superclass ? c.superclass.constructor : null;
            }

            if (cronsOptions){
                this.addCrons(cronsOptions);
            }
            NS.CronCore.register(this);
        },
        destructor: function(){
            CronCore.remove(this);
        },
        addCron: function(name, config){
            var state = this._cronsState;
            if (state.get(name, ADDED)){
                return;
            }

            config = Y.merge({
                name: name,
                interval: 0,
                event: null,
            }, config || {});

            config[ADDED] = true;
            config.lastRunTime = new Date();
            config.instance = this;

            state.data[name] = config;
        },
        addCrons: function(crons){
            if (!crons){
                return;
            }
            crons = Y.AttributeCore.protectAttrs(crons);
            var name;
            for (name in crons){
                if (!crons.hasOwnProperty(name)){
                    continue;
                }
                this.addCron(name, crons[name]);
            }
        },
        runCrons: function(){
            var crons = this._cronsState.data,
                name, cron,
                ctime = (new Date()).getTime();

            for (name in crons){
                if (!crons.hasOwnProperty(name)){
                    continue;
                }
                cron = crons[name];

                if (cron.interval > 0
                    && ((ctime - cron.lastRunTime.getTime()) / 1000 > cron.interval)){
                    cron.lastRunTime = new Date();

                    if (Y.Lang.isFunction(cron.event)){
                        try {
                            cron.event.call(cron.instance, cron);
                        } catch (e) {
                        }
                    }
                }
            }
        }
    };
    NS.CronCore = CronCore;


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
                info = state.data[name];

            var funcArgs = SLICE.call(arguments),
                funcArg,
                defArgsOffset = 1;

            var aArgs = [],
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
                    return complete.call(this);
                }, this);
            };

            rCallbackFire.call(this, rCallbacks);
        },
        onAJAXError: function(err){
            Brick.mod.widget.notice.show(err.msg);
        },

        /**
         * @deprecated
         */
        ajaxa: function(rData, callback, context){
            this._request.apply(this, arguments);
        }
    }, {
        ATTRS: {
            initCallback: {
                value: null
            },
            component: {
                value: null
            },
            moduleName: {
                value: null
            },
            isLoadAppStructure: {
                value: false
            }
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

        var moduleName = component.moduleName;
        var ns = Brick.mod[moduleName];

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
            component: {
                value: component
            },
            moduleName: {
                value: moduleName
            }
        });

        var appName = moduleName + 'App';
        ns.App = Y.Base.create(appName, NS.Application, extensions, px, sx);

        ns.appInstance = null;
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

            /* // TODO: load roles
             if (ns.roles && Y.Lang.isFunction(ns.roles.load)){
             ns.roles.load(function(){
             new ns.App(options);
             });
             } else {
             new ns.App(options);
             }
             /**/
            new ns.App(options);
        };
    };

    var AppWorkspacePage = function(p){
        p = Y.merge({
            module: '',
            component: '',
            widget: '',
            args: []
        }, p || {});

        this.init(p);
    };
    AppWorkspacePage.prototype = {
        init: function(p){
            this.module = p.module;
            this.component = p.component;
            this.widget = p.widget;
            this.args = p.args;
        },
        getId: function(){
            if (this.component === '' || this.widget === ''){
                return '';
            } else {
                return [this.module, this.component, this.widget].join(':')
                    + ':' + this.args.join(':');
            }
        },
        isEmpty: function(){
            return this.getId() === '';
        }
    };
    NS.AppWorkspacePage = AppWorkspacePage;

    var AppWorkspace = function(){
    };
    AppWorkspace.NAME = 'appWorkspace';
    AppWorkspace.ATTRS = {
        workspaceWidget: {},
        defaultPage: {},
        AppWorkspacePage: {
            value: NS.AppWorkspacePage
        }
    };
    AppWorkspace.prototype = {
        onInitAppWidget: function(err, appInstance, options){
            var args = options.arguments[0];

            this.onInitAppWorkspace(err, appInstance, options);
            this.showWorkspacePage(args.workspacePage);
        },
        onInitAppWorkspace: function(err, appInstance, options){
        },
        defineDefaultPage: function(callback, context){
            callback.call(context || this, null, this.get('defaultPage'));
        },
        showWorkspacePage: function(page){
            var AppWorkspacePage = this.get('AppWorkspacePage');
            page = new AppWorkspacePage(page);

            if (page.isEmpty()){
                if (this.get('defineDefaultPage')){
                    this.defineDefaultPage(function(err, defPage){
                        this._showWorkspacePage(defPage);
                    }, this);
                } else {
                    this._showWorkspacePage(this.get('defaultPage'));
                }
                return;
            } else {
                this._showWorkspacePage(page);
            }
        },
        onShowWorkspacePage: function(page, widget){
        },
        _showWorkspacePage: function(page){
            var AppWorkspacePage = this.get('AppWorkspacePage');

            page = new AppWorkspacePage(page);

            var curWidget = this.get('workspaceWidget'),
                curPage = curWidget ? curWidget.get('workspacePage') : new AppWorkspacePage();

            if (curPage.getId() === page.getId()){
                return;
            }

            curWidget ? curWidget.destroy() : null;

            if (page.isEmpty()){
                this.set('workspaceWidget', null);
                return;
            }

            var module = page.module !== '' ? page.module : this.get('component').moduleName;

            this.set(WAITING, true);
            Brick.use(module, page.component, function(err, ns){
                if (err){
                    return;
                }
                this.set(WAITING, false);

                var wName = page.widget,
                    widgetClass = ns[wName];

                if (!widgetClass){
                    return;
                }

                var bBox = this.get(BOUNDING_BOX);

                var elBoard = bBox.one('.app-workspace-page');
                if (!elBoard){
                    return;
                }

                var elDiv = Y.Node.create('<div></div>');
                elBoard.appendChild(elDiv);

                var args = {};
                if (L.isFunction(widgetClass.parseURLParam)){
                    args = widgetClass.parseURLParam(page.args);
                }

                var widget = new widgetClass(
                    this.onFillWidgetOptions(Y.mix({
                        boundingBox: elDiv,
                        workspacePage: page
                    }, args))
                );

                this.set('workspaceWidget', widget);
                this.onShowWorkspacePage(page, widget);
            }, this);
        },
        onFillWidgetOptions: function(options){
            return options;
        },
    };
    AppWorkspace.build = function(moduleName, wsWidget){
        return function(config){
            return new wsWidget(config);
        };
    };
    NS.AppWorkspace = AppWorkspace;

    NS.AppWidget = Y.Base.create('appWidget', Y.Widget, [
        NS.Language,
        NS.Template,
        NS.WidgetClick,
        NS.WidgetWaiting,
        NS.TriggerWidgetExt
    ], {
        // patch: not added yui3 class
        _renderBoxClassNames: function(){
        },
        initializer: function(){
            this.publish('initAppWidget');

            this._appWidgetArguments = Y.Array(arguments);

            Y.after(this._syncUIAppWidget, this, 'syncUI');
        },
        _syncUIAppWidget: function(){
            if (!this.get('useExistingWidget')){
                var args = this._appWidgetArguments,
                    tData = {};

                if (Y.Lang.isFunction(this.buildTData)){
                    tData = this.buildTData.apply(this, args);
                }

                var bBox = this.get(BOUNDING_BOX),
                    defTName = this.template.cfg.defTName;

                bBox.setHTML(this.template.replace(defTName, tData));
            }

            this.set(WAITING, true);

            var appInstance = this.get('appInstance');
            if (appInstance){
                this._initAppWidget(null, appInstance);
            } else {
                var appNS = this.get('appNamespace') || this.get('component').namespace,
                    instance = this;

                if (Y.Lang.isFunction(appNS.initApp)){
                    appNS.initApp({
                        initCallback: function(err, appInstance){
                            instance._initAppWidget(err, appInstance);
                        }
                    });
                } else {
                    this._initAppWidget({msg: 'App not found'}, null);
                }
            }
        },
        _initAppWidget: function(err, appInstance){
            this.set('appInstance', appInstance);

            this.set(WAITING, false);

            this._appURLUpdate();
            this._appSourceUpdate();
            this._appTriggerUpdate();

            var args = {arguments: this._appWidgetArguments};
            this.onInitAppWidget.apply(this, [err, appInstance, args]);
            this.fire('initAppWidget', err, appInstance, args);
        },
        onInitAppWidget: function(){
        },
        _appSourceUpdate: function(){
            this.appSourceUpdate();
        },
        getValueByPath: function(path){
            var a = path.split(':'),
                obj = a[0] === 'this' ? this : Brick.mod[a[0]];

            if (!Y.Lang.isObject(obj) || !a[1]){
                return;
            }

            var aPath = a[1].split('.');

            for (var i = 0, item; i < aPath.length; i++){
                item = aPath[i];

                if (!Y.Lang.isObject(obj)){
                    return;
                }

                if (obj.hasOwnProperty(item)){
                    obj = obj[item];
                } else if (Y.Lang.isFunction(obj.attrAdded)
                    && obj.attrAdded(item)){
                    obj = obj.get(item);
                } else {
                    return;
                }
            }
            return obj;
        },
        appSourceUpdate: function(){
            var bbox = this.get(BOUNDING_BOX),
                path, obj;

            bbox.all('[data-src]').each(function(node){
                path = (node.getData('src') || '').replace(/\s+/g, '');
                obj = this.getValueByPath(path);

                if (!Y.Lang.isString(obj) && !Y.Lang.isNumber(obj)){
                    return;
                }

                switch (node.get('tagName')) {
                    case 'INPUT':
                        node.set('value', obj);
                        break;
                    case 'IMG':
                        node.set('src', obj);
                        break;
                    default:
                        node.setHTML(obj);
                        break;
                }
            }, this);

            bbox.all('[data-href]').each(function(node){
                if (node.get('tagName') !== 'A'){
                    return;
                }
                path = (node.getData('href') || '').replace(/\s+/g, '');
                obj = this.getValueByPath(path);

                if (!Y.Lang.isString(obj)){
                    return;
                }

                node.set('href', obj);
            }, this);
        },
        _appTriggerUpdate: function(){
            this.appTriggerUpdate();
        },
        appTriggerUpdate: function(){
            var bbox = this.get(BOUNDING_BOX),
                name, a, action, obj, code, flag;

            bbox.all('[data-trigger]').each(function(node){
                name = (node.getData('trigger') || '').replace(/\s+/g, '');
                a = name.split(':');
                obj = a[0] === 'this' ? this : Brick.mod[a[0]];

                if (!Y.Lang.isObject(obj)){
                    return;
                }

                if (a[1]){
                    var path = a[1].split('.');

                    for (var i = 0, item; i < path.length; i++){
                        item = path[i];

                        if (obj.hasOwnProperty(item)){
                            obj = obj[item];
                        } else if (Y.Lang.isFunction(obj.attrAdded)
                            && obj.attrAdded(item)){
                            obj = obj.get(item);
                        } else {
                            return;
                        }

                        if (!Y.Lang.isObject(obj)){
                            return;
                        }
                    }
                }

                code = (node.getData('code') || '').replace(/\s+/g, '');
                if (obj.hasOwnProperty(code) || Y.Lang.isFunction(obj[code])){
                    flag = !!(Y.Lang.isFunction(obj[code]) ? obj[code]() : obj[code]);
                } else if (Y.Lang.isFunction(obj.attrAdded)
                    && obj.attrAdded(code)){
                    flag = !!obj.get(code);
                } else {
                    return;
                }

                action = (node.getData('action') || '').replace(/\s+/g, '');
                action = action === '' ? 'show' : action;

                if (action === 'hide'){
                    flag = !flag;
                }

                flag ? this.triggerShow(name, code) : this.triggerHide(name, code);
            }, this);
        },
        appURLUpdate: function(){
            this._appURLUpdate();
        },
        _appURLUpdate: function(){
            var app = this.get('appInstance');
            if (!app){
                return;
            }
            var sources = app.defineURLSources(this),
                el = this.get('boundingBox');

            NS.Navigator.fillNode(el, sources);
        },
        go: function(){
            var app = this.get('appInstance');
            if (!app){
                return;
            }
            var sources = app.defineURLSources(this),
                url = NS.Navigator.unparseURL.apply(null, arguments);

            NS.Navigator.go(url, sources);
        }
    }, {
        ATTRS: {
            component: {},
            render: {value: true},
            appInstance: {},
            appNamespace: {},
            useExistingWidget: {value: false},
            workspacePage: {}
        }
    });

};