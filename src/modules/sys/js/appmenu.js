/*!
 * Copyright 2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
    yui: ['tree', 'tree-labelable'],
    mod: [
        {name: 'sys', files: ['widget.js']}
    ]

};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,

        COMPONENT = this;

    var AppMenuNode = function(tree, config){
        this._serializable = this._serializable.concat('label');

        if ('label' in config) {
            this.label = config.label;
        }
    };

    NS.AppMenu = Y.Base.create('appMenu', Y.Tree, [
    //    Y.Tree.Labelable
    ], {

    }, {
        ATTRS: {
            component: {
                value: null
            }
        }
    });

    /*

    NS.AppMenuItem = Y.Base.create('appMenuItem', Y.Model, [], {}, {
        ATTRS: {
            title: {
                value: ''
            },
            url: {
                value: ''
            }
        }
    });

    NS.AppMenu = Y.Base.create('appMenu', Y.ModelList, [], {
        model: NS.AppMenuItem
    }, {
        ATTRS: {
            component: {
                value: null
            }
        }
    });
    /**/

    NS.AppMenuWidget = Y.Base.create('appMenuWidget', Y.Widget, [
        NS.Language,
        NS.Template
    ], {
        initializer: function(){

            Y.after(this._syncUIAppMenuWidget, this, 'syncUI');
        },
        _syncUIAppMenuWidget: function(){
            // var moduleName = this.get('moduleName') || 'undefined';


        }
    }, {
        ATTRS: {
            /*
            moduleName: {
                value: ''
            },
            /**/
            component: {
                value: COMPONENT
            },
            templateBlockName: {
                value: 'widget,list,row'
            },
            appMenu: {
                value: null
            }
        }
    });

};