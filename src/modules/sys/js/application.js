/*!
 * Abricos Platform (http://abricos.org)
 * Copyright 2008-2014 Alexander Kuzmin <roosit@abricos.org>
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
        NS.RequestCore,
        NS.AJAX,
        NS.Language
    ], {
        initializer: function(){
            // this.publish('response');

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

                // this.ajaxParseResponse(data, tRes);
            }

            if (Y.Lang.isFunction(details.callback)){
                details.callback.apply(details.context, [err, tRes]);
            }
        },
        onAJAXError: function(err){
            Brick.mod.widget.notice.show(err.msg);
        },
        // ajaxParseResponse: function(data, res){        },

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
        workspacePageAsync: {
            value: null
        },
        workspaceWidget: {
            value: null
        }
    };
    AppWorkspace.prototype = {
        initializer: function(){
            this.on('initAppWidget', function(e, err, appInstance){
                this._showWorkspacePage();
            });
        },

        _showWorkspacePage: function(){
            var getWSPageAsync = this.get('workspacePageAsync');
            if (Y.Lang.isFunction(getWSPageAsync)){
                this.set(WAITING, true);
                var instance = this;

                getWSPageAsync.call(this, function(err, page){
                    instance.set(WAITING, false);
                    instance.showWorkspacePage(page);
                });
            } else {
                this.showWorkspacePage(this.get('workspacePage'));
            }
        },

        showWorkspacePage: function(page){
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
            var appInstance = this.get('appInstance');
            if (!appInstance){
                return;
            }

            var URL = Brick.mod[appInstance.get('moduleName')]['URL'];
            if (!URL){
                return;
            }

            this.get('boundingBox').all('[data-url]').each(function(node){
                var sURL = node.getData('url');
                if (!sURL){
                    return;
                }
                var arr = sURL.split('.'), s = URL, si, aParam = [],
                    rex = /(.*)\((.*)\)/i;
                for (var i = 0; i < arr.length; i++){
                    si = arr[i];
                    if (i === (arr.length - 1) && rex.test(si)){
                        var ex = rex.exec(si);
                        si = ex[1];
                        aParam = ex[2].split(",");
                    }
                    if (!(s = s[si])){
                        return;
                    }
                }

                s = L.isFunction(s) ? s.apply(null, aParam) : s;
                if (!L.isString(s)){
                    return;
                }
                node.set('href', s);
            }, this);
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