/*!
 * Abricos Platform (http://abricos.org)
 * Copyright 2008-2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
    yui: ['widget']
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
    Form.prototype = {
        initializer: function(){
            Y.after(this._bindUIForm, this, 'bindUI');
        },
        _bindUIForm: function(){
            this._syncUIFromFieldsForm();
            this._bindFieldsUIForm();
        },
        _bindFieldsUIForm: function(){
            var instance = this,
                fields = this.get('fields'),
                attrs = fields.getAttrs();

            Y.Object.each(attrs, function(v, n){
                fields.after(n + 'Change', instance._syncFieldUIForm, instance);
            }, instance);
        },
        _syncFieldUIForm: function(e){
            this._syncUIFromFieldsForm();
        },
        _syncFieldsFromUIForm: function(){
            var boundingBox = this.get(BOUNDING_BOX),
                fields = this.get('fields');

            boundingBox.all('.form-control').each(function(fieldNode){
                var name = fieldNode.get('name'),
                    value = fieldNode.get('value');

                if (fields.attrAdded(name)){
                    fields.set(name, value);
                }
            }, this);
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
            Y.after(this._bindUIFormAction, this, 'bindUI');
        },
        _bindUIFormAction: function(){
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

    var WAITING = 'waiting';

    var Waiting = function(){
    };
    Waiting.ATTRS = {
        waiting: {
            value: false
        }
    };
    Waiting.WAITING_CLASS_NAME = Y.Widget.getClassName(WAITING);
    Waiting.prototype = {
        initializer: function(){
            Y.after(this._syncUIWaiting, this, SYNCUI);
            Y.after(this._bindUIWaiting, this, BINDUI);
        },
        _syncUIWaiting: function(){
            this._uiSetWaiting(this.get('waiting'));
        },
        _bindUIWaiting: function(){
            this.after('waitingChange', this._afterWaitingChange);
        },
        _afterWaitingChange: function(e){
            if (e.src != UI){
                this._uiSetWaiting(e.newVal);
            }
        },
        _uiSetWaiting: function(val){
            var boundingBox = this.get(BOUNDING_BOX);
            boundingBox.all('[data-wait]').each(function(node){
                var flag = node.getData('wait');
                switch (flag) {
                    case 'show':
                        node.setStyle('display', val ? '' : 'none');
                        break;
                    case 'hide':
                        node.setStyle('display', val ? 'none' : '');
                        break;
                    case 'disable':
                        node.set('disabled', val);
                        break;
                    case 'enable':
                        node.set('disabled', !val);
                        break;
                }
            }, this);
        }
    };
    NS.WidgetWaiting = Waiting;

};