/*!
 * Copyright 2008-2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
    yui: ['base'],
    mod: [
        {name: 'sys', files: ['application.js', 'widget.js', 'form.js']},
        {name: 'widget', files: ['notice.js']},
        {name: '{C#MODNAME}', files: ['model.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,

        COMPONENT = this,

        WAITING = 'waiting',
        BOUNDING_BOX = 'boundingBox',

        SYS = Brick.mod.sys;

    NS.URL = {
        ws: "#app={C#MODNAMEURI}/wspace/ws/",
        config: {
            view: function(){
                return NS.URL.ws + 'coreconfig/CoreConfigWidget/'
            }
        },
        module: {
            list: function(){
                return NS.URL.ws + 'modulelist/ModuleListWidget/'
            }
        }
    };
    NS.AppWidget = Y.Base.create('appWidget', Y.Widget, [
        SYS.Language,
        SYS.Template,
        SYS.WidgetClick,
        SYS.WidgetWaiting
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
            NS.initApp({
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


    var AppBase = function(){
    };
    AppBase.ATTRS = {
        initCallback: {
            value: function(){
            }
        }
    };
    AppBase.prototype = {
        initializer: function(){
            this.get('initCallback')(null, this);

            this._cacheCoreConfig = null;
        },
        onAJAXError: function(err){
            Brick.mod.widget.notice.show(err.msg);
        },
        _treatAJAXResult: function(data){
            data = data || {};
            var ret = {};

            if (data.coreConfig){
                var coreConfig = new NS.CoreConfig(data.coreConfig);
                this._cacheCoreConfig = coreConfig;
                ret.coreConfig = coreConfig;
            }

            if (data.moduleList){
                var moduleList = new NS.ModuleList({
                    items: data.moduleList.list
                });
                this._cacheModuleList = moduleList;
                ret.moduleList = moduleList;
            }

            return ret;
        },
        _defaultAJAXCallback: function(err, res, details){
            var tRes = this._treatAJAXResult(res ? res.data : null);

            details.callback.apply(details.context, [err, tRes]);
        },
        coreConfig: function(callback, context){
            if (this._cacheCoreConfig){
                return callback.apply(context, [null, {
                    coreConfig: this._cacheCoreConfig
                }]);
            }
            this.ajax({
                'do': 'coreConfig'
            }, this._defaultAJAXCallback, {
                arguments: {callback: callback, context: context}
            });
        },
        coreConfigSave: function(model, callback, context){
            this.ajax({
                'do': 'coreConfigSave',
                'coreConfig': model.toJSON()
            }, this._defaultAJAXCallback, {
                arguments: {callback: callback, context: context}
            });
        },
        moduleList: function(callback, context){
            if (this._cacheModuleList){
                return callback.apply(context, [null, {
                    moduleList: this._cacheModuleList
                }]);
            }
            this.ajax({
                'do': 'moduleList'
            }, this._defaultAJAXCallback, {
                arguments: {callback: callback, context: context}
            });
        }
    };
    NS.AppBase = AppBase;

    NS.App = Y.Base.create('sysApp', Y.Base, [
        SYS.AJAX,
        SYS.Language,
        NS.AppBase
    ], {
        initializer: function(){
            NS.appInstance = this;
        }
    }, {
        ATTRS: {
            component: {
                value: COMPONENT
            },
            initCallback: {
                value: null
            },
            moduleName: {
                value: '{C#MODNAME}'
            }
        }
    });

    NS.appInstance = null;
    NS.initApp = function(options){
        if (Y.Lang.isFunction(options)){
            options = {
                initCallback: options
            }
        }
        options = Y.merge({
            initCallback: function(){
            }
        }, options || {});

        if (NS.appInstance){
            return options.initCallback(null, NS.appInstance);
        }
        new NS.App(options);
    };

};