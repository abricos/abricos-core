var Component = new Brick.Component();
Component.requires = {
    yui: ['base', 'widget'],
    mod: [
        {name: 'sys', files: ['component.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        L = Y.Lang,
        BINDUI = 'bindUI',
        SYNCUI = 'syncUI',

        UI = Y.Widget.UI_SRC,

        BOUNDING_BOX = 'boundingBox';

    var WidgetClick = function(options){
        var CLICKS = options && options.CLICKS ? options.CLICKS : null;
        this._initClicks(CLICKS);
    };
    WidgetClick.prototype = {
        initializer: function(){
            Y.after(this._bindUIWidgetClick, this, BINDUI);
        },
        _bindUIWidgetClick: function(){
            var boundingBox = this.get(BOUNDING_BOX);
            boundingBox.on({
                click: Y.bind(this._onWidgetClick, this)
            });

            this.publish({
                click: this._defWidgetClick
            });
        },
        _defWidgetClick: function(){
        },
        _onWidgetClick: function(e){
            if (!e || !e.target){
                return;
            }

            e.dataClick = e.target.getData('click');

            if (!e.dataClick){
                var elPrev = e.target.ancestor('[data-click]');
                if (elPrev){
                    e.dataClick = elPrev.getData('click');
                    e.defineTarget = elPrev;
                }
            } else {
                e.defineTarget = e.target;
            }

            var state = this._clickState,
                a;

            if (e.dataClick && (a = e.dataClick.split(':')).length === 2){
                if (a[0] === 'this' && Y.Lang.isFunction(this[a[1]])){
                    this[a[1]].apply(this, arguments);
                    e.halt();
                    return;
                }
            }

            if (e.dataClick && !!state.get(e.dataClick, 'added')){
                var click = state.data[e.dataClick],
                    event = click.event,
                    context = click.context;

                if (Y.Lang.isString(event)){
                    event = this[event];
                }
                if (L.isFunction(event)){
                    event.apply(context || this, arguments);
                    e.halt();
                    return;
                }
            }

            if (L.isFunction(this.onClick)
                && this.onClick.apply(this, arguments)){

                e.halt();
                return;
            }

            if (!this.fire('click', {dataClick: e.dataClick})){
                e.halt();
            }
        },
        _initClicks: function(options){
            this._clickState = new Y.State();

            var ctor = this.constructor,
                c = ctor,
                clicks = {};

            while (c){
                clicks = Y.merge(clicks, c.CLICKS);
                c = c.superclass ? c.superclass.constructor : null;
            }

            if (options){
                clicks = Y.merge(clicks, options);
            }

            if (!clicks){
                return;
            }
            var nClicks = {}, a, name, i;
            for (name in clicks){
                a = name.split(',');
                for (i = 0; i < a.length; i++){
                    a[i] = Y.Lang.trim(a[i]);
                    if (a[i].length === 0){
                        continue;
                    }
                    nClicks[a[i]] = Y.Lang.isString(clicks[name]) ? clicks[name] : Y.merge(clicks[name]);
                }
            }
            clicks = nClicks;
            for (name in clicks){
                if (Y.Lang.isString(clicks[name])){
                    clicks[name] = {
                        event: clicks[name]
                    };
                }
            }

            clicks = Y.AttributeCore.protectAttrs(clicks);

            var state = this._clickState,
                added, config;

            for (name in clicks){
                if (!clicks.hasOwnProperty(name)){
                    continue;
                }
                added = state.get(name, 'added');
                if (added){
                    continue;
                }
                config = clicks[name];
                config.added = true;
                if (!config.event){
                    config.event = name;
                }
                if (!config.context){
                    config.context = this;
                }
                state.data[name] = config;
            }
        }
    };
    NS.WidgetClick = WidgetClick;

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

    var EditorStatus = function(){
    };
    EditorStatus.ATTRS = {
        isEdit: {
            value: true
        }
    };
    EditorStatus.prototype = {
        initializer: function(){
            Y.after(this._syncUIEditorStatus, this, SYNCUI);
            Y.after(this._bindUIEditorStatus, this, BINDUI);
        },
        _syncUIEditorStatus: function(){
            this._uiSetEditorStatus(this.get('isEdit'));
        },
        _bindUIEditorStatus: function(){
            this.after('isEditChange', this._afterEditorStatusChange);
        },
        _afterEditorStatusChange: function(e){
            if (e.src != UI){
                this._uiSetEditorStatus(e.newVal);
            }
        },
        _uiSetEditorStatus: function(val){
            var boundingBox = this.get(BOUNDING_BOX);
            boundingBox.all('[data-isedit]').each(function(node){
                var flag = node.getData('isedit');
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
    NS.WidgetEditorStatus = EditorStatus;

    var ContainerWidgetExt = function(){
    };
    ContainerWidgetExt.ATTRS = {};
    ContainerWidgetExt.prototype = {
        initializer: function(){
            this._containerWidget = [];
        },
        destructor: function(){
            this.cleanWidgets();
        },
        eachWidget: function(fn, context){
            var list = this._containerWidget;
            for (var i = 0, wi; i < list.length; i++){
                wi = list[i];
                fn.call(context || this, wi.widget, wi.name, i);
            }
        },
        addWidget: function(name, widget){
            var curWidget = this.getWidget(name);
            if (curWidget){
                throw new Exception('Widget is exist');
            }
            var list = this._containerWidget;
            list[list.length] = {
                name: name,
                widget: widget
            };
            return widget;
        },
        getWidget: function(name){
            var find = null;
            this.eachWidget(function(w, n){
                if (name === n){
                    find = w;
                }
            });
            return find;
        },
        removeWidget: function(name){
            var list = this._containerWidget,
                nList = [];

            for (var i = 0, wi, isRemove; i < list.length; i++){
                wi = list[i];

                isRemove = false;
                if (Y.Lang.isFunction(name)){
                    isRemove = name.call(this, wi.name, wi.widget);
                } else {
                    isRemove = name === wi.name;
                }
                if (isRemove){
                    wi.widget.destroy();
                } else {
                    nList[nList.length] = wi;
                }
            }

            this._containerWidget = nList;
        },
        cleanWidgets: function(){
            this.eachWidget(function(widget){
                widget.destroy();
            }, this);
            this._containerWidget = [];
        }
    };
    NS.ContainerWidgetExt = ContainerWidgetExt;

    var TriggerWidgetExt = function(){
    };
    TriggerWidgetExt._split = function(s){
        s = s || [];

        if (Y.Lang.isString(s)){
            s = s.replace(/\s+/g, '').split(',');
        }
        return s;
    };
    TriggerWidgetExt._indexOf = function(arr, str){
        var find = false;
        for (var i = 0; i < arr.length; i++){
            if (arr[i] === str){
                find = true;
                break;
            }
        }
        return find;
    };
    TriggerWidgetExt._action = function(bbox, action, names, codes, exactMatch){
        names = TriggerWidgetExt._split(names);
        codes = TriggerWidgetExt._split(codes);

        var name, code, i, find, and = true;

        bbox.all('[data-trigger]').each(function(node){
            name = node.getData('trigger');
            if (!TriggerWidgetExt._indexOf(names, name)){
                return;
            }
            if (codes.length > 0 || exactMatch){
                code = (node.getData('code') || '').replace(/\s+/g, '');

                and = true;

                if (code.indexOf('&') > -1){
                    code = code.split('&');
                } else if (code.indexOf('|') > -1){
                    code = code.split('|');
                    and = false;
                } else {
                    code = [code];
                }

                if (and){
                    for (i = 0; i < code.length; i++){
                        if (!TriggerWidgetExt._indexOf(codes, code[i])){
                            return;
                        }
                    }
                } else {
                    find = false;
                    for (i = 0; i < code.length; i++){
                        if (TriggerWidgetExt._indexOf(codes, code[i])){
                            find = true;
                            break;
                        }
                    }
                    if (!find){
                        return;
                    }
                }
            }
            if (action === 'hide'){
                node.addClass('hide');
            } else if (action === 'show'){
                node.removeClass('hide');
            }
        }, this);
    };
    TriggerWidgetExt.prototype = {
        triggerHide: function(names, codes, toggleCodes){
            var bbox = this.get(BOUNDING_BOX);
            TriggerWidgetExt._action(bbox, 'hide', names, codes);
            TriggerWidgetExt._action(bbox, 'show', names, toggleCodes, true);
        },
        triggerShow: function(names, codes, toggleCodes){
            var bbox = this.get(BOUNDING_BOX);
            TriggerWidgetExt._action(bbox, 'show', names, codes);
            TriggerWidgetExt._action(bbox, 'hide', names, toggleCodes, true);
        },
    };
    NS.TriggerWidgetExt = TriggerWidgetExt;
};