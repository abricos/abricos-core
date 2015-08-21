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

        WAITING = 'waiting',
        BOUNDING_BOX = 'boundingBox',

        SLICE = Array.prototype.slice;

    var ADDED = 'added';

    var Navigator = function(){
        this._initNavigator();
    };
    /**
     * Example: user.view(532,avatar) => return {
     *      key: 'user.view',
     *      args: ['532', 'avatar']
     * }
     * @param sURL
     */
    Navigator.parseURL = function(sURL){
        var a = sURL.split('.'),
            key = [],
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
        getURL: function(name, config){
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
            }

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


    var RequestCore = function(){
        this._initRequests();
    };
    RequestCore.prototype = {
        _initRequests: function(){
            this._reqsState = new Y.State();

            var ctor = this.constructor,
                c = ctor;

            while (c){
                this.addRequests(c.REQS);
                c = c.superclass ? c.superclass.constructor : null;
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
                attribute: false,
                type: null,
                typeClass: null,
                attach: null,
                response: false
            }, config || {});

            if (Y.Lang.isString(config.type)){
                var a = config.type.split(':');
                config.type = a[0];
                switch (config.type) {
                    case 'modelList':
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

    NS.Application = Y.Base.create('application', Y.Base, [
        NS.Navigator,
        NS.RequestCore,
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
            if (L.isFunction(initCallback)){
                initCallback(null, this);
            }
        },
        request: function(name){
            if (!this.requestAdded(name)){
                return;
            }

            var state = this._reqsState,
                info = state.data[name];

            var funcArgs = SLICE.call(arguments),
                funcArg,
                defArgsOffset = 1;

            var rData = {
                'do': name
            };

            if (Y.Lang.isArray(info.args)){
                defArgsOffset = info.args.length + 1;
                for (var i = 0; i < info.args.length; i++){
                    funcArg = funcArgs[i + 1];
                    if (funcArg && Y.Lang.isFunction(funcArg.toJSON)){
                        funcArg = funcArg.toJSON();
                    }
                    rData[info.args[i]] = funcArg;
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
            if (info.attribute){
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
                for (var i = 0; i < req.length; i++){
                    rData[rData.length] = {
                        'do': req[i]
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
                switch (info.type) {
                    case 'modelList':
                        var typeClass = this.get(info.typeClass) || NS.AppModelList;

                        res[name] = new typeClass({
                            appInstance: this,
                            items: data[name].list || []
                        });
                        break;
                }
            } else {
                res[name] = Y.Lang.isFunction(info.response) ? info.response.call(this, data[name]) : data[name];
            }
            if (info.attribute){
                this.set(name, res[name]);
            }
        },
        _onAppResponses: function(err, res, details){
            res = res || {};

            var tRes = {},
                rData = res.data || {};

            if (!Y.Lang.isArray(rData)){
                rData = [rData];
            }

            for (var i = 0; i < rData.length; i++){
                var data = rData[i];
                for (var name in data){
                    this._onAppResponse(name, data, tRes);
                }
            }

            if (Y.Lang.isFunction(details.callback)){
                details.callback.apply(details.context, [err, tRes]);
            }

            this.fire('appResponses', {
                error: err,
                responses: rData,
                result: tRes
            });
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
        },
        REQS: {
            appStructure: {
                attribute: true,
                response: function(d){
                    return new NS.AppStructure(d);
                }
            }
        }
    });

    NS.Application.build = function(component, ajaxes, px, extensions, sx){
        extensions = extensions || [];
        sx = sx || {};
        ajaxes = sx.REQS = Y.merge(ajaxes, sx.REQS || {});

        var moduleName = component.moduleName;
        var ns = Brick.mod[moduleName];

        for (var n in ajaxes){
            (function(){
                var act = n;
                px[act] = function(){
                    var args = SLICE.call(arguments);
                    args.splice(0, 0, act);
                    this.request.apply(this, args);
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
            new ns.App(options);
        };
    };

    var AppWorkspace = function(){
    };
    AppWorkspace.NAME = 'appWorkspace';
    AppWorkspace.ATTRS = {
        workspacePage: {
            value: null
        },
        workspaceWidget: {
            value: null
        }
    };
    AppWorkspace.prototype = {
        onInitAppWidget: function(err, appInstance){
            this.showWorkspacePage();
        },

        showWorkspacePage: function(page){
            if (!page && !this._isFirstShowWSPage){
                page = this.get('workspacePage');
                this._isFirstShowWSPage = true;
            }
            if (!page || !page.component || !page.widget){
                return;
            }
            this.set('workspacePage', page);
            this.set(WAITING, true);

            Brick.use(this.get('component').moduleName, page.component, function(err, ns){
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

                var currentWidget = this.get('workspaceWidget');
                if (currentWidget){
                    currentWidget.destroy();
                }
                var elDiv = Y.Node.create('<div></div>');
                elBoard.appendChild(elDiv);

                var args = {};
                if (L.isFunction(ns[wName].parseURLParam)){
                    args = ns[wName].parseURLParam(page.args);
                }

                currentWidget = new widgetClass(
                    Y.mix({'boundingBox': elDiv}, args)
                );

                this.set('workspaceWidget', currentWidget)
            }, this);
        }
    };
    AppWorkspace.list = {};
    AppWorkspace.build = function(moduleName, wsWidget, wsConfig){
        wsConfig = Y.merge({
            workspacePage: {}
        }, wsConfig || {});

        var cache = AppWorkspace.list[moduleName] = AppWorkspace.list[moduleName] || [],
            wsName = wsWidget.NAME;

        var initAppFunc = function(config, callback){
            if (!L.isFunction(callback)){
                callback = function(){
                };
            }
            var w = cache[wsName];
            if (w){
                w.showWorkspacePage(config.workspacePage);
                // TODO: событие на установку страницы
                callback(null, w);
            } else {
                if (!config.boundingBox){
                    config.boundingBox = config.getBoundingBox();
                }
                config.workspacePage = Y.merge(wsConfig.workspacePage, config.workspacePage || {});

                cache[wsName] = w = new wsWidget(config);
                callback(null, w);
            }
        };
        return initAppFunc;
    };
    NS.AppWorkspace = AppWorkspace;

    NS.AppWidget = Y.Base.create('appWidget', Y.Widget, [
        NS.Language,
        NS.Template,
        NS.WidgetClick,
        NS.WidgetWaiting
    ], {
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
                var appNamespace = this.get('appNamespace');
                if (!appNamespace){
                    appNamespace = this.get('component').namespace;
                }

                var instance = this;
                appNamespace.initApp({
                    initCallback: function(err, appInstance){
                        instance._initAppWidget(err, appInstance);
                    }
                });
            }
        },
        _initAppWidget: function(err, appInstance){
            this.set('appInstance', appInstance);

            this.set(WAITING, false);

            this._appURLUpdate();

            var args = this._appWidgetArguments
            this.onInitAppWidget.apply(this, [err, appInstance, {
                arguments: args
            }]);
            this.fire('initAppWidget', err, appInstance, {
                arguments: args
            });
        },
        onInitAppWidget: function(){
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
            component: {
                value: null
            },
            render: {
                value: true
            },
            appInstance: {
                value: null
            },
            appNamespace: {
                value: null
            },
            useExistingWidget: {
                value: false
            }
        }
    });

};