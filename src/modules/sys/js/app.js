var Component = new Brick.Component();
Component.requires = {
    yui: ['io', 'json'],
    mod: [
        {name: '{C#MODNAME}', files: ['application.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        L = Y.Lang,

        UID = Brick.env.user.id | 0,

        WAITING = 'waiting',
        BOUNDING_BOX = 'boundingBox',
        ADDED = 'added',

        SLICE = Array.prototype.slice;

    NS.AppCore = Y.Base.create('appCore', Y.Base, [
        NS.RequestCore
    ], {
        initializer: function(){
            this.publish('appResponses');

            var component = this.get('component'),
                ns = component.namespace;

            ns.app = this;

            this._appTasks = [];

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

            var task = this._appTasks.shift();
            if (!Y.Lang.isFunction(task)){
                throw {
                    msg: 'Task is not function in App'
                };
            }

            task.call(this, function(){
                callback.call(context, this);
            });
        }
    }, {
        ATTRS: {
            component: {value: null},
            isLoadAppStructure: {value: false}
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

            ns.App.initialize(function(){
                return callback.call(context, null, ns.app);
            });
        });
    };

    NS.initializeApps = function(modules, callback, context){
        callback = callback || function(){
            };
        context = context || null;

        var module = modules.pop();

    }
};