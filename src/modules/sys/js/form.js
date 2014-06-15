/*!
 * Abricos Platform (http://abricos.org)
 * Copyright 2008-2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['widget.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        RENDERUI = 'renderUI',
        BINDUI = 'bindUI',
        SYNCUI = 'syncUI',

        UI = Y.Widget.UI_SRC,

        BOUNDING_BOX = 'boundingBox';

    var Form = function(){
    };
    Form.ATTRS = {
        boundingBox: {
            setter: Y.one
        },
        fieldsClass: {
            value: NS.Structure
        },
        fields: {
            value: {},
            setter: function(val){
                var fieldsClass = this.get('fieldsClass');
                return new fieldsClass(val);
            }
        }
    };
    Form.NAME = 'form';
    Form.isCheckable = function(node){
        var nodeType = node.get('type').toLowerCase();
        return (nodeType === 'checkbox' || nodeType === 'radio')
    };
    Form.prototype = {
        initializer: function(){
            Y.after(this._syncUIForm, this, 'syncUI');
        },
        _syncUIForm: function(){
            this._syncUIFromFieldsForm();
            this._bindFieldsUIForm();
        },
        _syncUIFromFieldsForm: function(){
            var boundingBox = this.get(BOUNDING_BOX),
                fields = this.get('fields');

            boundingBox.all('.form-control').each(function(fieldNode){
                var name = fieldNode.get('name');

                if (fields.attrAdded(name)){
                    fieldNode.set('value', fields.get(name));
                }
            }, this);
        },
        _syncFieldsFromUIForm: function(){
            this._filedsEventDisabled = true;

            var boundingBox = this.get(BOUNDING_BOX),
                fields = this.get('fields');

            var setField = function(node){
                var name = node.get('name'),
                    value = node.get('value');

                if (Form.isCheckable(node)){
                    value = node.get('checked') ? 1 : 0;
                }

                if (fields.attrAdded(name)){
                    fields.set(name, value);
                }
            };

            boundingBox.all('.form-control').each(setField, this);
            boundingBox.all('[data-form]').each(setField, this);

            this._filedsEventDisabled = false;
        },
        _bindFieldsUIForm: function(){
            var instance = this,
                fields = this.get('fields'),
                attrs = fields.getAttrs();

            Y.Object.each(attrs, function(v, n){
                fields.after(n + 'Change', instance._afterFieldChange, instance);
            }, instance);
        },
        _afterFieldChange: function(e){
            if (!this._filedsEventDisabled){
                this._syncUIFromFieldsForm();
            }
        },
        getNodeByFieldName: function(name){
            var boundingBox = this.get(BOUNDING_BOX),
                findNode = null;

            boundingBox.all('.form-control').each(function(node){
                if (node.get('name') === name){
                    findNode = node;
                }
            }, this);

            return findNode;
        }
    };
    NS.Form = Form;

    var FormAction = function(){
    };
    FormAction.prototype = {
        initializer: function(){
            Y.after(this._syncUIFormAction, this, 'syncUI');
        },
        _syncUIFormAction: function(){
            var boundingBox = this.get(BOUNDING_BOX);
            boundingBox.on({
                reset: Y.bind(this._onResetFormAction, this),
                submit: Y.bind(this._onSubmitFormAction, this)
            });

            this.publish({
                resetForm: this._defResetFormAction,
                submitForm: this._defSubmitFormAction
            });
        },
        _onResetFormAction: function(e){
            this.fire('resetForm');
        },
        _onSubmitFormAction: function(e){
            e.halt();

            this._syncFieldsFromUIForm();
            var res = this.fire('submitForm');
            if (!res){
                e.halt();
            }
        },
        _defResetFormAction: function(e){
        },
        _defSubmitFormAction: function(e){
        }
    };
    NS.FormAction = FormAction;


};