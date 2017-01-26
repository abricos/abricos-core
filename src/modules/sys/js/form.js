var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['widget.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        UI = Y.Widget.UI_SRC,
        BOUNDING_BOX = 'boundingBox';

    var Form = function(){
    };
    Form.ATTRS = {
        boundingBox: {
            setter: Y.one
        },
        model: {
            value: null,
            setter: function(val){
                if (val && Y.Lang.isFunction(val.toJSON)){
                    var attrs = val.toJSON();
                    for (var n in attrs){
                        val.after(n + 'Change', this._onModelFieldChange, this);
                    }
                    this._updateUIFromModel(val);
                }

                return val;
            }
        },
        updateUIFromModel: {
            value: true
        },
        formFocusFiled: {
            value: null
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
        _onModelFieldChange: function(e){
            if (e.src !== 'UI'){
                this.updateUIFromModel();
            }
        },
        destructor: function(){
            var model = this.get('model');
            if (model && Y.Lang.isFunction(model.toJSON)){
                var attrs = model.toJSON();
                for (var n in attrs){
                    model.detach(n + 'Change', this._onModelFieldChange);
                }
            }
        },
        _syncUIForm: function(){
            this.updateUIFromModel();
        },
        eachFieldNode: function(func){
            if (!Y.Lang.isFunction(func)){
                return;
            }
            var eFunc = function(node){
                var name = node.get('name');
                if (name === ""){
                    return;
                }
                func(name, node);
            };
            var boundingBox = this.get(BOUNDING_BOX);
            boundingBox.all('.form-control').each(eFunc, this);
            boundingBox.all('[data-form]').each(eFunc, this);
        },
        updateUIFromModel: function(){
            var model = this.get('model');
            if (model){
                this._updateUIFromModel(model);
            }
        },
        _updateUIFromModel: function(model){
            if (this._disableAttrChangeEventBugFix
                || !this.get('updateUIFromModel')){
                return;
            }
            var focusField = this.get('formFocusField'),
                focusFieldNode;

            var data = model.toJSON(model.isAppModel);

            this.eachFieldNode(function(name, node){
                if (!(name in data) || node.get('type') === 'hidden'){
                    return;
                }
                var value = data[name];
                if (Form.isCheckable(node)){
                    node.set('checked', value ? 'checked' : '');
                } else {
                    node.set('value', value);
                }
                if (Y.Lang.isString(focusField) && name === focusField){
                    focusFieldNode = node;
                }
            });

            if (focusFieldNode && !this._isFocusFieldNode){
                this._isFocusFieldNode = true;
                setTimeout(function(){
                    try {
                        focusFieldNode.focus();
                    } catch (e) {
                    }
                }, 100);
            }

            this.onUpdateUIFromModel(model);
        },
        onUpdateUIFromModel: function(model){
        },
        updateModelFromUI: function(){
            var model = this.get('model');
            if (!model){
                return;
            }
            this._disableAttrChangeEventBugFix = true;

            this.eachFieldNode(function(name, node){
                var value = node.get('value');

                if (Form.isCheckable(node)){
                    value = node.get('checked') ? 1 : 0;
                }

                if (model.attrAdded(name)){
                    // TODO: silent not working
                    model.set(name, value, {silent: true});
                }
            });

            this.onUpdateModelFromUI(model);
            this._disableAttrChangeEventBugFix = false;
        },
        onUpdateModelFromUI: function(){
        },
        getNodeByFieldName: function(name){
            var boundingBox = this.get(BOUNDING_BOX),
                findNode = null;

            this.eachFieldNode(function(fName, node){
                if (fName === name){
                    findNode = node;
                }
            });

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
            this.publish('resetForm', {
                defaultFn: this._defResetFormAction
            });
            this.publish('submitForm', {
                defaultFn: this._defSubmitFormAction
            });
        },
        _onResetFormAction: function(e){
            this.fire('resetForm');
        },
        _onSubmitFormAction: function(e){
            e.halt();

            this.updateModelFromUI();

            if (Y.Lang.isFunction(this.onSubmitFormAction)){
                this.onSubmitFormAction();
            }
            this.fire('submitForm');
        },
        _defResetFormAction: function(e){
        },
        _defSubmitFormAction: function(e){
        }
    };
    NS.FormAction = FormAction;
};