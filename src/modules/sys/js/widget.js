/*!
 * Abricos Platform (http://abricos.org)
 * Copyright 2008-2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

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

            var state = this._clickState;
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

};