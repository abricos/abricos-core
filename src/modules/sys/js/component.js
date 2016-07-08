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
        _parseElName: function(elName){
            if (!elName || !Y.Lang.isString(elName)){
                return [];
            }
            var a = elName.split(',');
            return a;
        },
        one: function(elName){
            var a = this._parseElName(elName),
                ret = [], node, nodeId, aa;

            for (var i = 0; i < a.length; i++){
                aa = a[i].split('-');
                if (aa.length === 2){
                    nodeId = this.gelid(aa[0]);
                    if (nodeId){
                        nodeId = '#' + nodeId + '-' + aa[1];
                        node = Y.one(nodeId);
                    }
                } else {
                    node = Y.one(this.gel(a[i]));
                }

                if (node){
                    node.tpName = a[i];
                    ret[ret.length] = node;
                }
            }

            return a.length === 1 ? ret[0] : ret;
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
        getHTML: function(elName){
            var vals = this._invoke(elName, 'getHTML'),
                elNames = this._parseElName(elName),
                ret = {};

            for (var i = 0, val, name; i < elNames.length; i++){
                name = elNames[i];
                val = vals[name] || {};
                ret[name] = val.result;
            }
            if (elNames.length === 1){
                return ret[elNames[0]];
            }
            return ret;
        },
        setValue: function(elName, value){
            if (Y.Lang.isObject(elName)){
                for (var n in elName){
                    this.setValue(n, elName[n]);
                }
                return;
            }

            var node = this.one(elName);
            if (!node){
                return;
            }
            if (node.get('tagName') === 'INPUT'
                && node.get('type') === 'checkbox'){

                node.set('checked', !!value);
            } else {
                node.set('value', value);
            }
        },
        getValue: function(elName){
            var vals = this._invoke(elName, 'get', 'value'),
                elNames = this._parseElName(elName),
                ret = {};

            for (var i = 0, val, name; i < elNames.length; i++){
                name = elNames[i];
                val = vals[name] || {};
                ret[name] = val.result;
            }
            if (elNames.length === 1){
                return ret[elNames[0]];
            }
            return ret;
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
            var nodes = this.one(elName);
            if (!nodes){
                return;
            }
            if (!Y.Lang.isArray(nodes)){
                nodes = [nodes];
            }
            var ret = {};
            for (var i = 0, node, result; i < nodes.length; i++){
                node = nodes[i];
                if (method === 'get' && a === 'value'
                    && node.get('tagName') === 'INPUT'
                    && node.get('type') === 'checkbox'){

                    result = node.get('checked');
                } else {
                    result = node[method](a, b, c, d, e, f);
                }
                ret[node.tpName] = {
                    node: node,
                    result: result
                };
            }
            return ret;
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
        },
        each: function(elName, fn, context){
            var nodes = this.one(elName);
            if (!nodes){
                return;
            }
            if (!Y.Lang.isArray(nodes)){
                nodes = [nodes];
            }
            for (var i = 0; i < nodes.length; i++){
                fn.call(context || this, nodes[i]);
            }
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