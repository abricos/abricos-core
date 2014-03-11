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
    Y.extend(Structure, Y.Base, {
        toJSON: function(){
            var attrs = this.getAttrs();

            delete attrs.destroyed;
            delete attrs.initialized;

            return attrs;
        }
        /*,
        each: function(callback, thisObj){
            var attrs = this.toJSON();

            Y.Object.each(attrs, function(v, n){
                callback.call(thisObj, v, n);
            }, this);

            return this;
        }/**/
    });
    NS.Structure = Structure;

};