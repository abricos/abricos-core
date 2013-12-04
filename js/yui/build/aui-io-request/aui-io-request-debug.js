YUI.add('aui-io-request', function (A, NAME) {

/**
 * The IORequest Utility - Provides response data normalization for XML, JSON,
 * JavaScript and cache option.
 *
 * @module aui-io
 * @submodule aui-io-request
 */

var L = A.Lang,
    isBoolean = L.isBoolean,
    isFunction = L.isFunction,
    isString = L.isString,

    defaults = A.namespace('config.io'),

    getDefault = function(attr) {
        return function() {
            return defaults[attr];
        };
    },

    ACTIVE = 'active',
    ARGUMENTS = 'arguments',
    AUTO_LOAD = 'autoLoad',
    CACHE = 'cache',
    CFG = 'cfg',
    COMPLETE = 'complete',
    CONTENT_TYPE = 'content-type',
    CONTEXT = 'context',
    DATA = 'data',
    DATA_TYPE = 'dataType',
    EMPTY_STRING = '',
    END = 'end',
    FAILURE = 'failure',
    FORM = 'form',
    GET = 'get',
    HEADERS = 'headers',
    IO_REQUEST = 'IORequest',
    JSON = 'json',
    METHOD = 'method',
    RESPONSE_DATA = 'responseData',
    START = 'start',
    SUCCESS = 'success',
    SYNC = 'sync',
    TIMEOUT = 'timeout',
    TRANSACTION = 'transaction',
    URI = 'uri',
    XDR = 'xdr',
    XML = 'xml',

    PARSE_ERROR = 'Parser error: IO dataType is not correctly parsing',

    ACCEPTS = {
        all: '*/*',
        html: 'text/html',
        json: 'application/json, text/javascript',
        text: 'text/plain',
        xml: 'application/xml, text/xml'
    };

/**
 * A base class for IORequest, providing:
 *
 * - Response data normalization for XML, JSON, JavaScript
 * - Cache options
 *
 * Check the [live demo](http://alloyui.com/examples/io/).
 *
 * @class A.IORequest
 * @extends Plugin.Base
 * @param {Object} config Object literal specifying widget configuration
 *     properties.
 * @uses io
 * @constructor
 * @include http://alloyui.com/examples/io/basic.js
 */
var IORequest = A.Component.create({
    /**
     * Static property provides a string to identify the class.
     *
     * @property NAME
     * @type String
     * @static
     */
    NAME: IO_REQUEST,

    /**
     * Static property used to define the default attribute
     * configuration for the IORequest.
     *
     * @property ATTRS
     * @type Object
     * @static
     */
    ATTRS: {

        /**
         * If `true` invoke the [start](A.IORequest.html#method_start) method
         * automatically, initializing the IO transaction.
         *
         * @attribute autoLoad
         * @default true
         * @type Boolean
         */
        autoLoad: {
            value: true,
            validator: isBoolean
        },

        /**
         * If `false` the current timestamp will be appended to the
         * url, avoiding the url to be cached.
         *
         * @attribute cache
         * @default true
         * @type Boolean
         */
        cache: {
            value: true,
            validator: isBoolean
        },

        /**
         * The type of the request (i.e., could be xml, json, javascript, text).
         *
         * @attribute dataType
         * @default null
         * @type String
         */
        dataType: {
            setter: function(v) {
                return (v || EMPTY_STRING).toLowerCase();
            },
            value: null,
            validator: isString
        },

        /**
         * This is a normalized attribute for the response data. It's useful to
         * retrieve the correct type for the
         * [dataType](A.IORequest.html#attr_dataType) (i.e., in json requests
         * the `responseData`) is a JSONObject.
         *
         * @attribute responseData
         * @default null
         * @type String | JSONObject | XMLDocument
         */
        responseData: {
            setter: function(v) {
                return this._setResponseData(v);
            },
            value: null
        },

        /**
         * URI to be requested using AJAX.
         *
         * @attribute uri
         * @default null
         * @type String
         */
        uri: {
            setter: function(v) {
                return this._parseURL(v);
            },
            value: null,
            validator: isString
        },

        // User readOnly variables

        /**
         * Whether the transaction is active or not.
         *
         * @attribute active
         * @default false
         * @type Boolean
         */
        active: {
            value: false,
            validator: isBoolean
        },

        /**
         * Object containing all the [IO Configuration Attributes](A.io.html).
         * This Object is passed to the `A.io` internally.
         *
         * @attribute cfg
         * @default Object containing all the [IO Configuration
         *     Attributes](A.io.html).
         * @readOnly
         * @type String
         */
        cfg: {
            getter: function() {
                var instance = this;

                // keep the current cfg object always synchronized with the
                // mapped public attributes when the user call .start() it
                // always retrieve the last set values for each mapped attr
                return {
                    arguments: instance.get(ARGUMENTS),
                    context: instance.get(CONTEXT),
                    data: instance.getFormattedData(),
                    form: instance.get(FORM),
                    headers: instance.get(HEADERS),
                    method: instance.get(METHOD),
                    on: {
                        complete: A.bind(instance.fire, instance, COMPLETE),
                        end: A.bind(instance._end, instance),
                        failure: A.bind(instance.fire, instance, FAILURE),
                        start: A.bind(instance.fire, instance, START),
                        success: A.bind(instance._success, instance)
                    },
                    sync: instance.get(SYNC),
                    timeout: instance.get(TIMEOUT),
                    xdr: instance.get(XDR)
                };
            },
            readOnly: true
        },

        /**
         * Stores the IO Object of the current transaction.
         *
         * @attribute transaction
         * @default null
         * @type Object
         */
        transaction: {
            value: null
        },

        // Configuration Object mapping
        // To take advantages of the Attribute listeners of A.Base
        // See: http://developer.yahoo.com/yui/3/io/

        /**
         * See [IO
         * Configuration](http://developer.yahoo.com/yui/3/io/#configuration).
         *
         * @attribute arguments
         * @default Value mapped on YUI.AUI.defaults.io.
         * @type Object
         */
        arguments: {
            valueFn: getDefault(ARGUMENTS)
        },

        /**
         * See [IO
         * Configuration](http://developer.yahoo.com/yui/3/io/#configuration).
         *
         * @attribute context
         * @default Value mapped on YUI.AUI.defaults.io.
         * @type Object
         */
        context: {
            valueFn: getDefault(CONTEXT)
        },

        /**
         * See [IO
         * Configuration](http://developer.yahoo.com/yui/3/io/#configuration).
         *
         * @attribute data
         * @default Value mapped on YUI.AUI.defaults.io.
         * @type Object
         */
        data: {
            valueFn: getDefault(DATA)
        },

        /**
         * See [IO
         * Configuration](http://developer.yahoo.com/yui/3/io/#configuration).
         *
         * @attribute form
         * @default Value mapped on YUI.AUI.defaults.io.
         * @type Object
         */
        form: {
            valueFn: getDefault(FORM)
        },

        /**
         * Set the correct ACCEPT header based on the dataType.
         *
         * @attribute headers
         * @default Object
         * @type Object
         */
        headers: {
            getter: function(value) {
                var header = [];
                var instance = this;
                var dataType = instance.get(DATA_TYPE);

                if (dataType) {
                    header.push(
                        ACCEPTS[dataType]
                    );
                }

                // always add *.* to the accept header
                header.push(
                    ACCEPTS.all
                );

                return A.merge(
                    value, {
                        Accept: header.join(', ')
                    }
                );
            },
            valueFn: getDefault(HEADERS)
        },

        /**
         * See [IO
         * Configuration](http://developer.yahoo.com/yui/3/io/#configuration).
         *
         * @attribute method
         * @default Value mapped on YUI.AUI.defaults.io.
         * @type String
         */
        method: {
            valueFn: getDefault(METHOD)
        },

        /**
         * A selector to be used to query against the response of the
         * request. Only works if the response is XML or HTML.
         *
         * @attribute selector
         * @default null
         * @type String
         */
        selector: {
            value: null
        },

        /**
         * See [IO
         * Configuration](http://developer.yahoo.com/yui/3/io/#configuration).
         *
         * @attribute sync
         * @default Value mapped on YUI.AUI.defaults.io.
         * @type Boolean
         */
        sync: {
            valueFn: getDefault(SYNC)
        },

        /**
         * See [IO
         * Configuration](http://developer.yahoo.com/yui/3/io/#configuration).
         *
         * @attribute timeout
         * @default Value mapped on YUI.AUI.defaults.io.
         * @type Number
         */
        timeout: {
            valueFn: getDefault(TIMEOUT)
        },

        /**
         * See [IO
         * Configuration](http://developer.yahoo.com/yui/3/io/#configuration).
         *
         * @attribute xdr
         * @default Value mapped on YUI.AUI.defaults.io.
         * @type Object
         */
        xdr: {
            valueFn: getDefault(XDR)
        }
    },

    /**
     * Static property used to define which component it extends.
     *
     * @property EXTENDS
     * @type Object
     * @static
     */
    EXTENDS: A.Plugin.Base,

    prototype: {

        /**
         * Construction logic executed during IORequest instantiation.
         * Lifecycle.
         *
         * @method initializer
         * @param config
         * @protected
         */
        init: function(config) {
            var instance = this;

            IORequest.superclass.init.apply(this, arguments);

            instance._autoStart();
        },

        /**
         * Destructor lifecycle implementation for the IORequest class.
         * Purges events attached to the node (and all child nodes).
         *
         * @method destructor
         * @protected
         */
        destructor: function() {
            var instance = this;

            instance.stop();

            instance.set(TRANSACTION, null);
        },

        /**
         * Applies the `YUI.AUI.defaults.io.dataFormatter` if
         * defined and return the formatted data.
         *
         * @method getFormattedData
         * @return {String}
         */
        getFormattedData: function() {
            var instance = this;
            var value = instance.get(DATA);
            var dataFormatter = defaults.dataFormatter;

            if (isFunction(dataFormatter)) {
                value = dataFormatter.call(instance, value);
            }

            return value;
        },

        /**
         * Starts the IO transaction. Used to refresh the content also.
         *
         * @method start
         */
        start: function() {
            var instance = this;

            instance.destructor();

            instance.set(ACTIVE, true);

            var ioObj = instance._yuiIOObj;

            if (!ioObj) {
                ioObj = new A.IO();

                instance._yuiIOObj = ioObj;
            }

            var transaction = ioObj.send(
                instance.get(URI),
                instance.get(CFG)
            );

            instance.set(TRANSACTION, transaction);
        },

        /**
         * Stops the IO transaction.
         *
         * @method stop
         */
        stop: function() {
            var instance = this;
            var transaction = instance.get(TRANSACTION);

            if (transaction) {
                transaction.abort();
            }
        },

        /**
         * Invoke the `start` method (autoLoad attribute).
         *
         * @method _autoStart
         * @protected
         */
        _autoStart: function() {
            var instance = this;

            if (instance.get(AUTO_LOAD)) {
                instance.start();
            }
        },

        /**
         * Parse the [uri](A.IORequest.html#attr_uri) to add a
         * timestamp if [cache](A.IORequest.html#attr_cache) is
         * `true`. Also applies the `YUI.AUI.defaults.io.uriFormatter`.
         *
         * @method _parseURL
         * @param {String} url
         * @protected
         * @return {String}
         */
        _parseURL: function(url) {
            var instance = this;
            var cache = instance.get(CACHE);
            var method = instance.get(METHOD);

            // reusing logic to add a timestamp on the url from jQuery 1.3.2
            if ((cache === false) && (method == GET)) {
                var ts = +new Date;
                // try replacing _= if it is there
                var ret = url.replace(/(\?|&)_=.*?(&|$)/, '$1_=' + ts + '$2');
                // if nothing was replaced, add timestamp to the end
                url = ret + ((ret == url) ? (url.match(/\?/) ? '&' : '?') + '_=' + ts : '');
            }

            // formatting the URL with the default uriFormatter after the cache
            // timestamp was added
            var uriFormatter = defaults.uriFormatter;

            if (isFunction(uriFormatter)) {
                url = uriFormatter.apply(instance, [url]);
            }

            return url;
        },

        /**
         * Internal end callback for the IO transaction.
         *
         * @method _end
         * @param {Number} id ID of the IO transaction.
         * @param {Object} args Custom arguments, passed to the event handler.
         *     See [IO](http://developer.yahoo.com/yui/3/io/#configuration).
         * @protected
         */
        _end: function(id, args) {
            var instance = this;

            instance.set(ACTIVE, false);
            instance.set(TRANSACTION, null);

            instance.fire(END, id, args);
        },

        /**
         * Internal success callback for the IO transaction.
         *
         * @method _success
         * @param {Number} id ID of the IO transaction.
         * @param {Object} obj IO transaction Object.
         * @param {Object} args Custom arguments, passed to the event handler.
         *     See [IO](http://developer.yahoo.com/yui/3/io/#configuration).
         * @protected
         */
        _success: function(id, obj, args) {
            var instance = this;

            // update the responseData attribute with the new data from xhr
            instance.set(RESPONSE_DATA, obj);

            instance.fire(SUCCESS, id, obj, args);
        },

        /**
         * Setter for [responseData](A.IORequest.html#attr_responseData).
         *
         * @method _setResponseData
         * @protected
         * @param {Object} xhr XHR Object.
         * @return {Object}
         */
        _setResponseData: function(xhr) {
            var data = null;
            var instance = this;

            if (xhr) {
                var dataType = instance.get(DATA_TYPE);
                var contentType = xhr.getResponseHeader(CONTENT_TYPE) || '';

                // if the dataType or the content-type is XML...
                if ((dataType == XML) ||
                    (!dataType && contentType.indexOf(XML) >= 0)) {

                    // use responseXML
                    data = xhr.responseXML;

                    // check if the XML was parsed correctly
                    if (data.documentElement.tagName == 'parsererror') {
                        throw PARSE_ERROR;
                    }
                }
                else {
                    // otherwise use the responseText
                    data = xhr.responseText;
                }

                // empty string is not a valid JSON, convert it to null
                if (data === EMPTY_STRING) {
                    data = null;
                }

                // trying to parse to JSON if dataType is a valid json
                if (dataType == JSON) {
                    try {
                        data = A.JSON.parse(data);
                    }
                    catch (e) {
                        // throw PARSE_ERROR;
                    }
                }
                else {
                    var selector = instance.get('selector');

                    if (data && selector) {
                        var tempRoot;

                        if (data.documentElement) {
                            tempRoot = A.one(data);
                        }
                        else {
                            tempRoot = A.Node.create(data);
                        }

                        data = tempRoot.all(selector);
                    }
                }
            }

            return data;
        }
    }
});

A.IORequest = IORequest;

/**
 * Alloy IO extension
 *
 * @class A.io
 * @static
 */

/**
 * Static method to invoke the [IORequest](A.IORequest.html).
 * Likewise [IO](A.io.html).
 *
 * @method A.io.request
 * @for A.io
 * @param {String} uri URI to be requested.
 * @param {Object} config Configuration Object for the [IO](A.io.html).
 * @return {IORequest}
 */
A.io.request = function(uri, config) {
    return new A.IORequest(
        A.merge(config, {
            uri: uri
        })
    );
};


}, '2.0.0', {"requires": ["io-base", "json", "plugin", "querystring-stringify", "aui-component"]});
