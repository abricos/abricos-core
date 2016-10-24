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

    NS.Application.build(COMPONENT, {}, {
        initializer: function(){
            this.initCallbackFire();
        }
    }, [], {
        REQS: {
            coreConfig: {
                attribute: true,
                response: function(d){
                    return new NS.CoreConfig(d);
                }
            },
            coreConfigSave: {
                args: ['coreConfig']
            },
            moduleList: {
                attribute: true,
                response: function(d){
                    return new NS.ModuleList({
                        items: d.list
                    })
                }
            }
        },
        URLS: {
            ws: "#app={C#MODNAMEURI}/wspace/ws/",
            config: {
                view: function(){
                    return this.getURL('ws') + 'coreconfig/CoreConfigWidget/'
                }
            },
            module: {
                list: function(){
                    return this.getURL('ws') + 'modulelist/ModuleListWidget/'
                }
            }
        }
    });
};