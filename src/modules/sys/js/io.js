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
                entity = 'data=' + Y.JSON.stringify(data);

            if (csrfToken){
                headers['X-CSRF-Token'] = csrfToken;
            }

            this._sendAJAXIORequest({
                // action: 'POST',
                callback: callback,
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
                    // action: config.action,
                    callback: config.callback,
                    url: config.url
                },

                context: this,
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
            var callback = details.callback;
            if (callback){
                callback({
                    code: res.status,
                    msg: res.statusText
                }, res);
            }
        },
        _onAJAXIOSuccess: function(txId, res, details){
            var callback = details.callback;
            if (callback){
                callback(null, res);
            }
        },
        _onAJAXIOStart: function(txId, details){
        }
    };
    NS.AJAX = AJAX;

};