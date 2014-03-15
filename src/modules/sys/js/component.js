/**
 @module sys
 @submodule component
 */

var Component = new Brick.Component();
Component.requires = {
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI;

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
         * @type Abricos.TemplateManager
         */
        template: null,

        initializer: function(){
            var component = this.get('component');

            if (!component){
                Y.error('Component must be set in attribute of Template class');
                return;
            }

            var tBlockNames = this.get('templateBlockName');

            this.template = new Abricos.TemplateManager(component.key, tBlockNames);
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