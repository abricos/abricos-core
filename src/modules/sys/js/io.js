/*!
 * Abricos Platform (http://abricos.org)
 * Copyright 2008-2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
    yui: ['io', 'json']
};
Component.entryPoint = function(NS){
    var Y = Brick.YUI;

    var queryCounter = 0;
    var uniqueURL = function(){
        return (queryCounter++) + (new Date().getTime());
    };

    var AJAX = function(){
    };
    AJAX.HTTP_TIMEOUT = 30000;
    AJAX.CSRF_TOKEN = YUI.Env.CSRF_TOKEN;
    AJAX.HTTP_HEADERS = {
        // 'Accept': 'application/json',
        // 'Content-Type': 'application/json'
    };
    AJAX.ATTRS = {
        moduleName: {
            value: ''
        }
    };
    AJAX.prototype = {
        getAJAXURL: function(){
            var moduleName = this.get('moduleName') || 'undefined';

            return '/tajax/' + moduleName + '/' + uniqueURL() + '/';
        },
        ajax: function(data, callback, options){
            options || (options = {})

            var url = this.getAJAXURL(),
                method = 'POST',
                headers = Y.merge(AJAX.HTTP_HEADERS, options.header),
                timeout = options.timeout || AJAX.HTTP_TIMEOUT,
                csrfToken = options.csrfToken || AJAX.CSRF_TOKEN,
                context = options.context || this,
                entity = 'data=' + Y.JSON.stringify(data);

            if (csrfToken){
                headers['X-CSRF-Token'] = csrfToken;
            }

            this._sendAJAXIORequest({
                callback: callback,
                context: context,
                entity: entity,
                headers: headers,
                method: method,
                timeout: timeout,
                url: url
            });
        },
        _sendAJAXIORequest: function(config){
            return Y.io(config.url, {
                arguments: {
                    context: config.context,
                    callback: config.callback,
                    url: config.url
                },

                context: config.context,
                data: config.entity,
                headers: config.headers,
                method: config.method,
                timeout: config.timeout,

                on: {
                    start: this._onAJAXIOStart,
                    failure: this._onAJAXIOFailure,
                    success: this._onAJAXIOSuccess,
                    end: this._onAJAXIOEnd
                }
            });
        },
        _onAJAXIOEnd: function(txId, details){
        },
        _onAJAXIOFailure: function(txId, res, details){
            var callback = details.callback,
                context = details.context,
                err = {
                    code: res.status,
                    msg: res.statusText
                },
                request = new NS.AJAXRequest({
                    request: res
                });

            if (callback){

                if (context){
                    callback.apply(context, [err, request]);
                } else {
                    callback(err, request);
                }
            }
        },
        _onAJAXIOSuccess: function(txId, res, details){
            var callback = details.callback,
                context = details.context,
                request = new NS.AJAXRequest({
                    request: res
                });

            if (callback){
                if (context){
                    callback.apply(context, [null, request]);
                } else {
                    callback(null, request);
                }
            }
        },
        _onAJAXIOStart: function(txId, details){
        }
    };
    NS.AJAX = AJAX;

    var AJAXRequest = function(config){
        this._init(config);
    };
    AJAXRequest.prototype = {
        _init: function(config){
            config || (config || {});
            this.request = config.request;
        }
    };
    NS.AJAXRequest = AJAXRequest;
};