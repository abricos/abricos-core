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

    var MenuNode = function(){
    };
    MenuNode.prototype = {
        initializer: function(){
            this.nodeExtensions = this.nodeExtensions.concat(NS.AppMenuNode);
        }
    }

    var _apmiKey = new Abricos.Key('menu.items');

    var AppMenuNode = function(tree, config){
        this._serializable = this._serializable.concat('title');

        var lng = tree.get('cmpLanguage');

        this.title = 'title' in config ? config.title : '';

        if (this.title === ''){
            this.title = lng.get(_apmiKey.push(this.id, true));
        }
    };
    AppMenuNode.prototype = {
        title: ''
    };
    NS.AppMenuNode = AppMenuNode;

    NS.AppMenu = Y.Base.create('appMenu', Y.Tree, [
        MenuNode
    ], {
        initializer: function(){
            var component = this.get('component'),
                cmpLanguage = null;

            if (component){
                cmpLanguage = new Abricos.ComponentLanguage(component);
            }
            this.set('cmpLanguage', cmpLanguage);
        }
    }, {
        ATTRS: {
            component: {
                value: null
            }
        }
    });

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