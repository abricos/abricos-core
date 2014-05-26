/*!
 * Abricos Platform (http://abricos.org)
 * Copyright 2008-2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
    yui: ['widget'],
    mod: [
        {name: 'sys', files: ['component.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        L = Y.Lang,
        RENDERUI = 'renderUI',
        BINDUI = 'bindUI',
        SYNCUI = 'syncUI',

        UI = Y.Widget.UI_SRC,

        BOUNDING_BOX = 'boundingBox';

    var WidgetClick = function(){
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
                beforeWidgetClick: this._defBeforeWidgetClick,
                afterWidgetClick: this._defAfterWidgetClick
            });
        },
        _defBeforeWidgetClick: function(){
        },
        _defAfterWidgetClick: function(){
        },
        _onWidgetClick: function(e){
            if (!e || !e.target){
                return;
            }

            e.dataClick = e.target.getData('click');

            if (!this.fire('beforeWidgetClick', {dataClick: e.dataClick})){
                e.halt();
                return;
            }

            if (L.isFunction(this.onClick)
                && this.onClick.apply(this, arguments)){

                e.halt();
                return;
            }

            if (!this.fire('afterWidgetClick', {dataClick: e.dataClick})){
                e.halt();
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

};