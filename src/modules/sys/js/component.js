/**
 @module sys
 @submodule component
 */

var Component = new Brick.Component();
Component.requires = {};
Component.entryPoint = function(NS){

    var Y = Brick.YUI;

    var TemplateManagerExt = function(){
        TemplateManagerExt.superclass.constructor.apply(this, arguments);
    };

    NS.TemplateManagerExt = Y.extend(TemplateManagerExt, Abricos.TemplateManager, {
        one: function(elName){
            return Y.one(this.gel(elName));
        },
        hide: function(elName){
            this.addClass(elName, 'hide');
        },
        show: function(elName){
            this.removeClass(elName, 'hide');
        },
        _toggleViewMethod: function(on, elName){
            this[on ? 'show' : 'hide'](elName);
        },
        toggleView: function(on, elName1, elName2){
            this._toggleViewMethod(on, elName1);
            this._toggleViewMethod(!on, elName2);
        },
        addClass: function(elName, className){
            var node = this.one(elName);
            if (!node){
                return;
            }
            node.addClass(className);
        },
        removeClass: function(elName, className){
            var node = this.one(elName);
            if (!node){
                return;
            }
            node.removeClass(className);
        }
    }, {
        NAME: 'templateManagerExt'
    });

    /**
     * Template extension, which can be used to manage template.
     * @class Template
     * @param {Object} config User configuration object
     */
    var Template = function(config){
    };

    /**
     * Static property used to define the default attribute
     * configuration introduced by Template.
     *
     * @property ATTRS
     * @static
     * @type Object
     */
    Template.ATTRS = {
        /**
         * @attribute component
         * @type Brick.Component
         * @description TODO. Wanna help? Please send a Pull Request.
         */
        component: {
            value: null
        },

        /**
         * @attribute templateBlockName
         * @type String
         * @default ""
         * @description TODO. Wanna help? Please send a Pull Request.
         */
        templateBlockName: {
            value: null
        }
    };
    Template.prototype = {

        /**
         * TODO. Wanna help? Please send a Pull Request.
         *
         * @property template
         * @type Brick.mod.sys.TemplateManagerExt
         */
        template: null,

        initializer: function(){
            var component = this.get('component');

            if (!component){
                Y.error('Component must be set in attribute of Template class');
                return;
            }

            var tBlockNames = this.get('templateBlockName');

            this.template = new NS.TemplateManagerExt(component.key, tBlockNames);
        },

        gel: function(elKey){
            var el = this.template.gel(elKey);
            return el ? Y.one(el) : null;
        }
    };
    NS.Template = Template;

    /**
     * Language extension, which can be used to manage localization.
     * @class Language
     * @param {Object} config User configuration object
     */
    var Language = function(){
    };

    /**
     * Static property used to define the default attribute
     * configuration introduced by Template.
     *
     * @property ATTRS
     * @static
     * @type Object
     */
    Language.ATTRS = {

        /**
         * @attribute component
         * @type Brick.Component
         * @description TODO. Wanna help? Please send a Pull Request.
         */
        component: {
            value: null
        }
    };
    Language.prototype = {

        /**
         * TODO. Wanna help? Please send a Pull Request.
         * @property language
         * @type Abricos.ComponentLanguage
         * @default null
         */
        language: null,

        initializer: function(){
            var component = this.get('component');

            if (!component){
                Y.error('Component must be set in attribute of Language class');
                return;
            }
            this.language = new Abricos.ComponentLanguage(component);
        }
    };
    NS.Language = Language;
};