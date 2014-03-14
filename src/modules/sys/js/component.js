/*!
 * Abricos Platform (http://abricos.org)
 * Copyright 2008-2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI;

    var Template = function(){

    };
    Template.ATTRS = {
        component: {
            value: null
        },
        templateNames: {
            value: null
        }
    };
    Template.prototype = {
        initializer: function(){
            var component = this.get('component');

            if (component){
               // this.template = component.buildTemplate();
                this.template = {
                    replace: function(){}
                };
            }
        }
    };
    NS.Template = Template;


    var Language = function(){
    };
    Language.ATTRS = {
        component: {
            value: null
        }
    };
    Language.prototype = {

        /**
         * TODO: doc
         * @property language
         * @type Abricos.ComponentLanguage
         * @default null
         */
        language: null,

        initializer: function(){
            var component = this.get('component');
            if (component){
                this.language = component.language
            }
        }
    };
    NS.Language = Language;
};