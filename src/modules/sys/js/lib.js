/*!
 * Copyright 2008-2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
    yui: ['model', 'model-list'],
    mod: [
        {name: '{C#MODNAME}', files: ['application.js']}
    ]
};
Component.entryPoint = function(NS){

    var COMPONENT = this;

    NS.CoreConfig = Y.Base.create('coreConfig', Y.Model, [], {}, {
        ATTRS: {
            site_name: {value: ''},
            site_title: {value: ''},
            admin_mail: {value: ''},
            style: {value: 'default'},
            styles: {value: ['default']},
            meta_title: {value: ''},
            meta_keys: {value: ''},
            meta_desc: {value: ''}
        }
    });

    NS.Module = Y.Base.create('module', Y.Model, [], {}, {
        ATTRS: {
            title: {value: ''},
            name: {value: ''},
            takelink: {value: ''},
            version: {value: ''},
            installdate: {value: 0},
            updatedate: {value: 0},
            roles: {value: []}
        }
    });

    NS.ModuleList = Y.Base.create('moduleList', Y.ModelList, [], {
        model: NS.Module
    });

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

    NS.Application.build(COMPONENT, {
        coreConfig: {
            cache: 'coreConfig',
            response: function(d){
                return new NS.CoreConfig(d);
            }
        },
        moduleList: {
            cache: 'moduleList',
            response: function(d){
                return new NS.ModuleList({
                    items: d.list
                })
            }
        }
    }, {
        initializer: function(){
            this.initCallbackFire();
        },
        coreConfigSave: function(model, callback, context){
            this.ajaxa({
                'do': 'coreConfigSave',
                'coreConfig': model.toJSON()
            }, callback, context);
        }
    });
};