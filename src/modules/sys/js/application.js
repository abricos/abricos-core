/*!
 * Abricos Platform (http://abricos.org)
 * Copyright 2008-2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
    yui: ['base'],
    mod: [
        {name: '{C#MODNAME}', files: ['component.js', 'widget.js', 'io.js']},
        {name: 'widget', files: ['notice.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,

        WAITING = 'waiting',
        BOUNDING_BOX = 'boundingBox',

        SLICE = Array.prototype.slice;

    NS.Application = Y.Base.create('application', Y.Base, [
        NS.AJAX,
        NS.Language
    ], {
        initializer: function(){
            var ns = this.get('component');
            ns.namespace.appInstance = this;

            this._appCache = {};
        },
        initCallbackFire: function(){
            var initCallback = this.get('initCallback');
            if (Y.Lang.isFunction(initCallback)){
                initCallback(null, this);
            }
        },
        onAJAXError: function(err){
            Brick.mod.widget.notice.show(err.msg);
        },
        ajaxParseResponse: function(data, res){
        },
        _defaultAJAXCallback: function(err, res, details){
            res = res || {};

            var tRes = {},
                data = res.data || {};

            for (var n in data){
                var fName = n + 'ParseResponse';

                if (Y.Lang.isFunction(this[fName])){
                    this[fName](data, tRes);
                }
            }

            this.ajaxParseResponse(data, tRes);

            if (Y.Lang.isFunction(details.callback)){
                details.callback.apply(details.context, [err, tRes]);
            }
        },
        ajaxa: function(rData, callback, context){
            this.ajax(rData, this._defaultAJAXCallback, {
                arguments: {callback: callback, context: context}
            });
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
            }
        }
    });

    NS.Application.build = function(component, ajaxes, px, extensions){
        extensions = extensions || [];

        var moduleName = component.moduleName;
        var ns = Brick.mod[moduleName];

        for (var n in ajaxes){
            (function(){
                var act = n,
                    info = ajaxes[act];

                if (Y.Lang.isFunction(info.response)){

                    px[act + 'ParseResponse'] = function(data, res){
                        res[act] = info.response(data[act]);

                        if (info.cache){
                            this._appCache[info.cache] = res[act];
                        }
                    };
                }

                px[act] = function(){
                    var funcArgs = SLICE.call(arguments),
                        funcArg,
                        defArgsOffset = 0;

                    var rData = {
                        'do': act
                    };

                    if (Y.Lang.isArray(info.args)){
                        defArgsOffset = info.args.length;
                        for (var i = 0; i < defArgsOffset; i++){
                            funcArg = funcArgs[i];
                            if (Y.Lang.isFunction(funcArg.toJSON)){
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

                    if (info.cache && this._appCache[info.cache]){
                        var ret = {};
                        ret[act] = this._appCache[info.cache];
                        return callback.apply(context, [null, ret]);
                    }
                    this.ajaxa(rData, callback, context);
                };
            })();
        }


        var appName = moduleName + 'App';
        ns.App = Y.Base.create(appName, NS.Application, extensions, px, {
            ATTRS: {
                component: {
                    value: component
                },
                moduleName: {
                    value: moduleName
                }
            }
        });

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

    NS.AppWidget = Y.Base.create('appWidget', Y.Widget, [
        NS.Language,
        NS.Template,
        NS.WidgetClick,
        NS.WidgetWaiting
    ], {
        initializer: function(){
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

            var instance = this;
            this.get('component').namespace.initApp({
                initCallback: function(err, appInstance){
                    instance._initAppWidget(err, appInstance);
                }
            });
        },
        _initAppWidget: function(err, appInstance){
            this.set('appInstance', appInstance);
            this.set(WAITING, false);
            var args = this._appWidgetArguments
            this.onInitAppWidget.apply(this, [err, appInstance, {
                arguments: args
            }]);
        },
        onInitAppWidget: function(){
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
                values: null
            },
            useExistingWidget: {
                value: false
            }
        }
    });

};