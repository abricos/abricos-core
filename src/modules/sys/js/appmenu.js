/*!
 * Copyright 2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
    yui: ['tree', 'tree-labelable'],
    mod: [
        {name: 'sys', files: ['component.js']}
    ]

};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,

        COMPONENT = this,

        BOUNDING_BOX = 'boundingBox';

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
        this._serializable = this._serializable.concat('url');

        var lng = tree.get('cmpLanguage');

        this.title = 'title' in config ? config.title : '';
        if (this.title === ''){
            this.title = lng.get(_apmiKey.push(this.id, true));
        }

        this.url = 'url' in config ? config.url : '#';
    };
    AppMenuNode.prototype = {
        title: '',
        url: ''
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
            console.log(this);
            var bBox = this.get(BOUNDING_BOX),
                appMenu = this.get('appMenu');

            var tp = this.template;

            bBox.setHTML(tp.replace('menu'));

            console.log(appMenu.nodes);
        }
    }, {
        ATTRS: {
            component: {
                value: COMPONENT
            },
            templateBlockName: {
                value: 'menu'
            },
            appMenu: {
                value: null
            }
        }
    });

};