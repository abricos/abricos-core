/*!
 * Module for Abricos Platform (http://abricos.org)
 * Copyright 2008-2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
    yui: ['model', 'model-list']
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI;

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


};