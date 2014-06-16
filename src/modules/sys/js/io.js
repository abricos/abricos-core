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
    var Y = Brick.YUI,
        LNG = new Abricos.ComponentLanguage(this);


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
        },
        errorTemplate: {
            value: '{v#title}: {v#msg}'
        }
    };
    AJAX.prototype = {
        initializer: function(){
            this.publish('AJAXError', {
                defaultFn: this.onAJAXError
            });
        },
        onAJAXError: function(){
        },
        getAJAXURL: function(){
            var moduleName = this.get('moduleName') || 'undefined';

            return '/tajax/' + moduleName + '/' + uniqueURL() + '/';
        },
        ajax: function(data, callback, options){
            options || (options = {})

            options.arguments = options.arguments || {};

            if (!options.arguments['action'] && data && data['do']){
                options.arguments['action'] = data['do'];
            }

            var url = this.getAJAXURL(),
                headers = Y.merge(AJAX.HTTP_HEADERS, options.header),
                csrfToken = options.csrfToken || AJAX.CSRF_TOKEN;

            if (csrfToken){
                headers['X-CSRF-Token'] = csrfToken;
            }

            this._sendAJAXIORequest({
                callback: callback,
                arguments: options.arguments,
                context: options.context || this,
                entity: 'data=' + Y.JSON.stringify(data),
                headers: headers,
                method: 'POST',
                timeout: options.timeout || AJAX.HTTP_TIMEOUT,
                url: url
            });
        },
        _sendAJAXIORequest: function(config){
            return Y.io(config.url, {
                arguments: {
                    callback: config.callback,
                    context: config.context,
                    arguments: config.arguments,
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
        _parseIOResponse: function(res){
            return Y.JSON.parse(res.responseText);
        },
        _onAJAXIOEnd: function(txId, details){
        },
        _treatAJAXError: function(err, details){
            if (!err){
                return;
            }

            var msg = LNG.get('ajax.error.' + err.code);
            if (msg === '' && this.language && details.action){
                msg = this.language.get('ajax.' + details.action + 'error.' + err.code);
            }
            if (msg && msg !== ''){
                if (this.language){
                    var errTitle = this.language.get('ajax.' + details.action + '.error.title'),
                        errTemplate = this.get('errorTemplate');

                    if (errTitle !== ''){
                        msg = errTemplate.replace("{v#msg}", msg);
                        msg = msg.replace('{v#title}', errTitle);
                    }
                }
                err.msg = msg;
            }

            this.fire('AJAXError', err, details);
        },
        _onAJAXIOFailure: function(txId, res, details){
            var callback = details.callback,
                context = details.context,
                err = {
                    code: res.status,
                    msg: res.statusText,
                    request: res
                };

            this._treatAJAXError(err, details.arguments);
            if (callback){
                callback.apply(context, [err, null, details.arguments]);
            }
        },
        _onAJAXIOSuccess: function(txId, res, details){
            var callback = details.callback,
                context = details.context,
                request = new NS.AJAXRequest({
                    request: res
                });

            var err = null, data = request.data || {};
            if (res && data && data.err > 0){
                err = {code: data.err, msg: ''};
            }

            this._treatAJAXError(err, details.arguments);

            if (callback){
                callback.apply(context, [err, request, details.arguments]);
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

        request: null,

        data: {},

        _init: function(config){
            config || (config || {});

            this.request = config.request;

            var o = Y.JSON.parse(this.request.responseText);
            if (o && o.data){
                this.data = o.data;
            }
        }
    };
    NS.AJAXRequest = AJAXRequest;
};