/*!
 * Copyright 2008-2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['application.js', 'model.js']}
    ]
};
Component.entryPoint = function(NS){

    var COMPONENT = this;

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