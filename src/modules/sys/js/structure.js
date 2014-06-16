/*!
 * Abricos Platform (http://abricos.org)
 * Copyright 2008-2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
    yui: ['attribute']
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI;

    var Structure = function(){
        Structure.superclass.constructor.apply(this, arguments);
    };
    Structure.NAME = 'structure';
    Structure.ATTRS = {
        id: {
            value: 0
        }
    };
    Y.extend(Structure, Y.Base, {
        initializer: function(){

        },
        toJSON: function(){
            var attrs = this.getAttrs();

            delete attrs.destroyed;
            delete attrs.initialized;

            return attrs;
        }
    });
    NS.Structure = Structure;

    var StructureList = function(){
        StructureList.superclass.constructor.apply(this, arguments);
    };
    StructureList.NAME = 'structureList';
    StructureList.ATTRS = {
        structureClass: {
            value: NS.Structure
        },
        lists: {
            value: []
        },
        idAttribute: {
            value: 'id'
        }
    };
    Y.extend(StructureList, Y.Base, {
        add: function(item){
            var idAttr = this.get('idAttribute'),
                item = this.find(item.get(idAttr));
            if (item){
                return false;
            }
            var lists = this.get('lists');
            lists[lists.length] = item;

            return true;
        },
        addByData: function(data){

        },
        find: function(value, idAttribute){
            var idAttr = idAttribute ? idAttribute : this.get('idAttribute');
            var lists = this.get('lists');
            for (var i = 0; i < lists.length; i++){
                var item = lists[i];
                if (item.get(idAttr) === id){
                    return item;
                }
            }
            return null;
        }
    });
    NS.StructureList = StructureList;
};