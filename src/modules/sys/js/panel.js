/*!
 * BootstrapPanel Module for Abricos Platform
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

        SYS = Brick.mod.sys,

        BOUNDING_BOX = 'boundingBox',
        CONTENT_BOX = 'contentBox',

        BINDUI = 'bindUI',
        RENDERUI = "renderUI",

        getClassName = Y.ClassNameManager.getClassName;

    var BootstrapPanel = function(){
    };
    BootstrapPanel.SECTION_CLASS_NAMES = {
        header: 'modal-header',
        body: 'modal-body',
        footer: 'modal-footer'
    };
    BootstrapPanel.TEMPLATES = {
        closeButton: '<button type="button" class="close" data-click="panel-close">&times;</button>',
        header: '<div class="modal-header"></div>',
        body: '<div class="modal-body"></div>',
        footer: '<div class="modal-footer"></div>'
    };
    BootstrapPanel.prototype = {

        initializer: function(){
            this._bootsNode = this.get(CONTENT_BOX);

            this._uiSetStdModOrigin = this._uiSetStdMod;
            this._uiSetStdMod = this._uiSetStdModBootstrap;

            Y.after(this._renderUIBootstrap, this, RENDERUI);

            this.after('visibleChange', this._afterVisibleChange);
            this.after('widgetClick', this._widgetClickBootstrapPanel);
        },
        _widgetClickBootstrapPanel: function(e){
            console.log();
            if (e.clickData === 'panelClose'){
                this.hide();
            }
        },
        _renderUIBootstrap: function(){
            var cbox = this.get(CONTENT_BOX);
            cbox.replaceClass(getClassName('panel-content'), 'modal-content');

            var bbox = this.get(BOUNDING_BOX);
            bbox.setStyle('position', 'absolute');

            var modal = this.get('modal');
            if (modal){
                this.set('zIndex', 10000);
            }
        },
        _getStdModTemplate: function(section){
            return Y.Node.create(BootstrapPanel.TEMPLATES[section], this._stdModNode.get('ownerDocument'));
        },
        _findStdModSection: function(section){
            return this.get(CONTENT_BOX).one("> ." + BootstrapPanel.SECTION_CLASS_NAMES[section]);
        },
        _uiSetStdModBootstrap: function(section, content, where){
            this._uiSetStdModOrigin(section, content, where);
            if (section === 'header'){
                var node = this.getStdModNode(section);
                if (node){
                    var btnNode = Y.Node.create(BootstrapPanel.TEMPLATES.closeButton);
                    node.appendChild(btnNode);
                }
            }
        },
        _afterVisibleChange: function(event){
            this.destroy();
        }
    };
    NS.BootstrapPanel = BootstrapPanel;

    var PanelTemplate = function(){
    };
    PanelTemplate.NAME = 'template';
    PanelTemplate.prototype = {
        initializer: function(){

            if (!this.template){
                Y.error('PanelTemplate must be set Template class');
                return;
            }

            var tName = this.template.cfg.defTName;

            var node = Y.Node.create(this.template.replace(tName));

            var nodeHeader = node.one('.hd');
            if (nodeHeader){
                this.set('headerContent', nodeHeader.getHTML());
            }

            var nodeBody = node.one('.bd');
            if (nodeBody){
                this.set('bodyContent', nodeBody.getHTML());
            }

            var nodeFooter = node.one('.ft');
            if (nodeFooter){
                this.set('footerContent', nodeFooter.getHTML());
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
        NS.BootstrapPanel
    ], {
        initializer: function(){
            Y.after(this._bindUIPanel, this, BINDUI);
        },
        _bindUIPanel: function(){
            this.after('afterWidgetClick', this._afterWidgetClickPanel);
        },
        _afterWidgetClickPanel: function(e){
            if (e.dataClick === 'panel-close'){
                e.halt();
                this.hide();
            }
        }

    });
};