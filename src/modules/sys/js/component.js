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
            var a = elName.split(',');
            if (a.length > 1){
                var ret = [];
                for (var i = 0, node; i < a.length; i++){
                    node = Y.one(this.gel(a[i]));
                    if (node){
                        ret[ret.length] = node;
                    }
                }
                return ret;
            }

            return Y.one(this.gel(elName));
        },
        setHTML: function(elName, html){
            if (Y.Lang.isObject(elName)){
                for (var n in elName){
                    this.setHTML(n, elName[n]);
                }
                return;
            }

            var node = this.one(elName);
            if (!node){
                return;
            }
            node.setHTML(html);
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
        toggleView: function(on, elNameShow, elNameHide){
            this._toggleViewMethod(on, elNameShow);
            this._toggleViewMethod(!on, elNameHide);
        },
        visible: function(elName, status){
            this._toggleViewMethod(status, elName);
        },
        _invoke: function(elName, method, a, b, c, d, e, f){
            var node = this.one(elName);
            if (!node){
                return;
            }
            if (!Y.Lang.isArray(node)){
                node = [node];
            }
            for (var i = 0; i < node.length; i++){
                node[i][method](a, b, c, d, e, f);
            }
        },
        addClass: function(elName, className){
            this._invoke(elName, 'addClass', className);
        },
        removeClass: function(elName, className){
            this._invoke(elName, 'removeClass', className);
        },
        replaceClass: function(elName, find, replace, conversely){
            if (conversely){
                this._invoke(elName, 'replaceClass', replace, find);
            } else {
                this._invoke(elName, 'replaceClass', find, replace);
            }
        },
        toggleClass: function(elName, className, isAppend){
            if (isAppend){
                this.addClass(elName, className);
            } else {
                this.removeClass(elName, className);
            }
        },
        append: function(elName, html){
            var node = this.one(elName);
            if (!node){
                return null;
            }
            var el = Y.Node.create(html);
            node.appendChild(el);
            return el;
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