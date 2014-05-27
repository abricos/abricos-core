/*!
 * BootstrapModal Module for Abricos Platform
 * http://abricos.org
 *
 * Copyright 2014 Alexander Kuzmin <roosit@abricos.org>
 * Released under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
    yui: ['panel'],
    mod: [
        {name: 'sys', files: ['widget.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        L = Y.Lang,

        SYS = Brick.mod.sys,

        BOUNDING_BOX = 'boundingBox',
        CONTENT_BOX = 'contentBox',

        BINDUI = 'bindUI',
        RENDERUI = "renderUI",

        getClassName = Y.ClassNameManager.getClassName;

    var BootstrapModal = function(){
    };
    BootstrapModal.SECTION_CLASS_NAMES = {
        header: 'modal-header',
        body: 'modal-body',
        footer: 'modal-footer'
    };
    BootstrapModal.TEMPLATES = {
        closeButton: '<button type="button" class="close" data-click="panel-close">&times;</button>',
        header: '<div class="modal-header"></div>',
        body: '<div class="modal-body"></div>',
        footer: '<div class="modal-footer"></div>'
    };
    BootstrapModal.prototype = {

        initializer: function(){
            this._bootsNode = this.get(CONTENT_BOX);

            this._uiSetStdModOrigin = this._uiSetStdMod;
            this._uiSetStdMod = this._uiSetStdModBootstrapModal;

            Y.after(this._renderUIBootstrapModal, this, RENDERUI);

            this.after('visibleChange', this._afterVisibleChange);
        },
        _renderUIBootstrapModal: function(){
            var cbox = this.get(CONTENT_BOX);
            cbox.replaceClass(getClassName('panel-content'), 'modal-content');

            var bbox = this.get(BOUNDING_BOX);
            bbox.setStyle('position', 'absolute');

            this.set('zIndex', 10000);

            /*
             var modal = this.get('modal');
             if (modal){
             this.set('zIndex', 10000);
             }
             /**/
        },
        _getStdModTemplate: function(section){
            return Y.Node.create(BootstrapModal.TEMPLATES[section], this._stdModNode.get('ownerDocument'));
        },
        _findStdModSection: function(section){
            return this.get(CONTENT_BOX).one("> ." + BootstrapModal.SECTION_CLASS_NAMES[section]);
        },
        _uiSetStdModBootstrapModal: function(section, content, where){
            this._uiSetStdModOrigin(section, content, where);
            if (section === 'header'){
                var node = this.getStdModNode(section);
                if (node){
                    var btnNode = Y.Node.create(BootstrapModal.TEMPLATES.closeButton);
                    node.appendChild(btnNode);
                }
            }
        },
        _afterVisibleChange: function(event){
            this.destroy();
        }
    };
    NS.BootstrapModal = BootstrapModal;

    var PanelTemplate = function(){
    };
    PanelTemplate.NAME = 'template';
    PanelTemplate.SECTION_CLASS_NAMES = {
        header: 'hd',
        body: 'bd',
        footer: 'ft'
    };
    PanelTemplate.prototype = {
        initializer: function(){

            if (!this.template){
                Y.error('PanelTemplate must be set Template class');
                return;
            }

            var tName = this.template.cfg.defTName;
            var node = Y.Node.create(this.template.replace(tName));

            this._overClassesPanelTemplate = [];

            for (var n in NS.PanelTemplate.SECTION_CLASS_NAMES){
                this._setSectionPanelTemplate(node, n);
            }

            Y.after(this._renderUIPanelTemplate, this, RENDERUI);

        },
        _setSectionPanelTemplate: function(node, section){
            if (!L.isValue(node)){
                return null;
            }

            var className = NS.PanelTemplate.SECTION_CLASS_NAMES[section];

            var nodeSection = node.one('.' + className);
            if (!nodeSection){
                return null;
            }

            var cla = this._overClassesPanelTemplate[section] = [];

            var a = nodeSection.getAttribute('class').split(' '), na = [];
            for (var i = 0; i < a.length; i++){
                if (a[i] !== className){
                    cla[cla.length] = a[i];
                }
            }

            var html = nodeSection.getHTML();

            this.set(section + 'Content', html);

            return html;
        },
        _renderUIPanelTemplate: function(){
            for (var section in NS.PanelTemplate.SECTION_CLASS_NAMES){
                var cla = this._overClassesPanelTemplate[section];
                var node = this[section + 'Node'];
                if (node && cla.length > 0){
                    node.addClass(cla.join(' '));
                }
            }
        }
    };
    NS.PanelTemplate = PanelTemplate;

    NS.Panel = Y.Base.create('panel', Y.Widget, [
        NS.Language,
        NS.Template,
        NS.PanelTemplate,
        NS.WidgetClick,

        Y.WidgetPosition,
        Y.WidgetStdMod,

        Y.WidgetAutohide,
        Y.WidgetButtons,
        Y.WidgetModality,
        Y.WidgetPositionAlign,
        Y.WidgetPositionConstrain,
        Y.WidgetStack,
        NS.BootstrapModal
    ], {
        initializer: function(){
            Y.after(this._bindUIPanel, this, BINDUI);
        },
        _bindUIPanel: function(){
            this.after('click', this._clickPanel);
        },
        _clickPanel: function(e){
            if (e.dataClick === 'panel-close'){
                e.halt();
                this.hide();
            }
        }

    }, {
        ATTRS: {
            centered: {
                value: true
            },
            render: {
                value: true
            }
        }
    });

    NS.Dialog = Y.Base.create('dialog', Y.Widget, [
        NS.Language,
        NS.Template,
        NS.PanelTemplate,
        NS.WidgetClick,

        Y.WidgetPosition,
        Y.WidgetStdMod,

        Y.WidgetAutohide,
        Y.WidgetButtons,
        Y.WidgetModality,
        Y.WidgetPositionAlign,
        Y.WidgetPositionConstrain,
        Y.WidgetStack,
        NS.BootstrapModal
    ], {
        initializer: function(){
            Y.after(this._bindUIPanel, this, BINDUI);
        },
        _bindUIPanel: function(){
            this.after('click', this._clickPanel);
        },
        _clickPanel: function(e){
            if (e.dataClick === 'panel-close'){
                e.halt();
                this.hide();
            }
        }
    }, {
        ATTRS: {
            centered: {
                value: true
            },
            modal: {
                value: true
            },
            render: {
                value: true
            }
        }
    });
};