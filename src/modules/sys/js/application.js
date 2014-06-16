/*!
 * Abricos Platform (http://abricos.org)
 * Copyright 2008-2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
    yui: ['base'],
    mod: [
        {
            name: '{C#MODNAME}',
            files: [
                'structure.js',
                'component.js',
                'io.js'
            ]
        }
    ]
};
Component.entryPoint = function(NS){

};