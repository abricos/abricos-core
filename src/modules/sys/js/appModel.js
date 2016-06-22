var Component = new Brick.Component();
Component.requires = {
    yui: ['yui-base', 'model-list'] // TODO: change model-list to arraylist
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        LANGIDS = Brick.env.languages,
        LANGID = Brick.env.language;

    var AppItem = function(){
        AppItem.superclass.constructor.apply(this, arguments);
    };
    NS.AppItem = Y.extend(AppItem, Y.Base, {

        _isAbricosAppItem: true,

        toJSON: function(){
            var attrs = this.getAttrs();

            delete attrs.destroyed;
            delete attrs.initialized;

            return attrs;
        }
    }, {
        NAME: 'appItem',
        ATTRS: {}
    });

    // Taken from YUI.ModelList
    var AppItemList = function(){
        AppItemList.superclass.constructor.apply(this, arguments);
    };
    NS.AppItemList = Y.extend(AppItemList, Y.Base, {

        _isAbricosAppItemList: true,

        appItem: NS.AppItem,

        idField: 'id',

        init: function(config){
            config || (config = {});
            this.idField = config.idField || this.idField;

            var appItem = this.appItem = config.appItem || this.appItem;

            if (typeof appItem === 'string'){
                this.appItem = Y.Object.getValue(Brick.mod, appItem.split('.'))
                if (this.appItem){
                    Y.error('AppItemList: AppItem class not found: ' + appItem);
                }
            }

            NS.AppItemList.superclass.init.apply(this, arguments);
        },

        initializer: function(config){
            config || (config = {});

            this.publish('add', {defaultFn: this._defAddFn});
            this.publish('remove', {defaultFn: this._defRemoveFn});

            this._clear();

            if (config.items){
                this.add(config.items, {silent: true});
            }
        },
        destructor: function(){
            this._clear();
        },
        _clear: function(){
            this._items = [];
            this._idMap = {};
        },
        add: function(appItems, options){
            var isList = appItems._isAbricosAppItemList;

            if (isList || Y.Lang.isArray(appItems)){
                return Y.Array.map(isList ? appItems.toArray() : appItems, function(appItem, index){
                    var appItemOptions = options || {};

                    // When an explicit insertion index is specified, ensure that
                    // the index is increased by one for each subsequent item in the
                    // array.
                    if ('index' in appItemOptions){
                        appItemOptions = Y.merge(appItemOptions, {
                            index: appItemOptions.index + index
                        });
                    }

                    return this._add(appItem, appItemOptions);
                }, this);
            } else {
                return this._add(appItems, options);
            }
        },
        _createAppItemInstance: function(data){
            return new (this.appItem)(data);
        },
        _add: function(appItem, options){
            options = options || {};
            if (!appItem._isAbricosAppItem){
                appItem = this._createAppItemInstance(appItem);
            }
            var id = appItem.get(this.idField);
            if (this._idMap[id]){
                this.fire('error', {
                    error: 'AppItem is already in the list.',
                    appItem: appItem,
                    src: 'add'
                });

                return;
            }

            var facade = Y.merge(options, {
                index: 'index' in options ? options.index : this._findIndex(appItem),
                appItem: appItem
            });

            if (options.silent){
                this._defAddFn(facade);
            } else {
                this.fire('add', facade);
            }

            return appItem;
        },
        _defAddFn: function(e){
            var appItem = e.appItem,
                id = appItem.get(this.idField);

            this._idMap[id] = appItem;
            this._items.splice(e.index, 0, appItem);
        },
        removeById: function(id){
            var appItem = this.getById(id);
            if (!appItem){
                return;
            }
            this.remove(appItem);
        },
        remove: function(appItem, options){
            this._remove(appItem, options);
        },
        _remove: function(appItem, options){
            var index, facade;

            options || (options = {});

            if (Y.Lang.isNumber(appItem)){
                index = appItem;
                appItem = this.item(index);
            } else {
                index = this.indexOf(appItem);
            }

            if (index === -1 || !appItem){
                this.fire('error', {
                    error: 'AppItem is not in the list.',
                    index: index,
                    appItem: appItem,
                    src: 'remove'
                });

                return;
            }

            facade = Y.merge(options, {
                index: index,
                appItem: appItem
            });

            if (options.silent){
                this._defRemoveFn(facade);
            } else {
                this.fire('remove', facade);
            }

            return appItem;
        },
        _defRemoveFn: function(e){
            var appItem = e.appItem,
                id = appItem.get(this.idField);

            delete this._idMap[id];

            this._items.splice(e.index, 1);
        },
        _findIndex: function(appItem){
            var items = this._items,
                max = items.length,
                min = 0,
                item, middle, needle;

            if (!this.comparator || !max){
                return max;
            }

            needle = this.comparator(appItem);

            // Perform an iterative binary search to determine the correct position
            // based on the return value of the `comparator` function.
            while (min < max){
                middle = (min + max) >> 1; // Divide by two and discard remainder.
                item = items[middle];

                if (this._compare(this.comparator(item), needle) < 0){
                    min = middle + 1;
                } else {
                    max = middle;
                }
            }

            return min;
        },
        _compare: function(a, b){
            return a < b ? -1 : (a > b ? 1 : 0);
        },
        getById: function(id){
            return this._idMap[id] || null;
        },
        getBy: function(fieldName, value){
            var find = null;
            this.some(function(item){
                if (item.get(fieldName) === value){
                    find = item;
                    return true;
                }
            }, this);
            return find;
        },
        each: function(callback, context, sortCompareFn){
            var items = this._items.concat(),
                i, item, len;

            if (Y.Lang.isFunction(sortCompareFn)){
                items = items.sort(sortCompareFn);
            }

            for (i = 0, len = items.length; i < len; i++){
                item = items[i];
                callback.call(context || item, item, i, this);
            }
            return this;
        },
        some: function(callback, context, sortCompareFn){
            var items = this._items.concat(),
                i, item, len;

            if (Y.Lang.isFunction(sortCompareFn)){
                items = items.sort(sortCompareFn);
            }

            for (i = 0, len = items.length; i < len; i++){
                item = items[i];
                if (callback.call(context || item, item, i, this)){
                    return true;
                }
            }
            return false;
        },
        map: function(fn, context){
            return Y.Array.map(this._items, fn, context);
        },
        /**
         * @method sort
         * @param {Object} [options] Data to be mixed into the event facade of the `reset` event.
         *  @param {Boolean} [options.silent=false] If `true`, no `reset` event will be fired.
         *  @param {Boolean} [options.descending=false] If `true`, the sort is performed in descending order.
         */
        sort: function(options){
            if (!this.comparator){
                return this;
            }
            var models = this._items.concat();

            models.sort(Y.rbind(this._sort, this, options));

            return this;
        },
        _compare: function(a, b){
            return a < b ? -1 : (a > b ? 1 : 0);
        },
        _sort: function(a, b, options){
            var result = this._compare(this.comparator(a), this.comparator(b));

            // Early return when items are equal in their sort comparison.
            if (result === 0){
                return result;
            }

            // Flips sign when the sort is to be peformed in descending order.
            return options && options.descending ? -result : result;
        },
        toArray: function(attrName, options){
            if (!attrName){
                return this._items.concat();
            }
            options = Y.merge({
                distinct: false
            }, options || {});

            var ret = [],
                distChecker = {},
                value;

            this.each(function(item){
                value = item.get(attrName);
                if (options.distinct){
                    if (distChecker[value]){
                        return;
                    }
                    distChecker[value] = true;
                }
                ret[ret.length] = value;
            }, this);
            return ret;
        },
        toJSON: function(){
            return this.map(function(appItem){
                return appItem.toJSON();
            });
        }
    }, {
        NAME: 'appItemList'
    });
    Y.augment(AppItemList, Y.ArrayList);

    NS.AppStructure = Y.Base.create('appStructure', Y.Base, [], {
        structureList: null,

        initializer: function(config){
            config || (config = {});

            this.structureList = new NS.AppStructure.StructureList({
                items: config.structures
            });
        }
    });

    NS.AppStructure.Field = Y.Base.create('appStructure_Field', NS.AppItem, [], {}, {
        ATTRS: {
            name: {value: ''},
            type: {
                value: 'string',
                setter: function(val){
                    var a = val.split(':');
                    if (a.length === 2){
                        val = a[0];
                        this.set('typeClass', a[1]);
                    } else if (a.length === 3){
                        val = a[0];
                        this.set('typeModule', a[1]);
                        this.set('typeClass', a[2]);
                    }
                    return val;
                }
            },
            typeModule: {value: null},
            typeClass: {value: null},
            default: {value: ''},
            json: {value: ''}
        }
    });

    NS.AppStructure.FieldList = Y.Base.create('appStructure_FieldList', NS.AppItemList, [], {
        appItem: NS.AppStructure.Field,
        idField: 'name'
    });

    NS.AppStructure.Structure = Y.Base.create('appStructure_Structure', NS.AppItem, [], {
        fieldList: null,

        initializer: function(config){
            config || (config = {});

            this.fieldList = new NS.AppStructure.FieldList({
                items: config.fields
            });
        },
        toJSON: function(){
            var json = NS.AppStructure.Structure.superclass.toJSON.apply(this, arguments);
            json.fields = this.fieldList.toJSON();
            return json;
        }
    }, {
        ATTRS: {
            name: {value: ''},
            idField: {
                validator: Y.Lang.isString,
                value: 'id'
            }
        }
    });

    NS.AppStructure.StructureList = Y.Base.create('appStructure_StructureList', NS.AppItemList, [], {
        appItem: NS.AppStructure.Structure,
        idField: 'name'
    });

    var MultiLangValue = function(d){
        this._data = {};
        this.set(d);
    };
    MultiLangValue.prototype = {
        set: function(d){
            if (Y.Lang.isString(d)){
                this._data[LANGID] = d;
            } else {
                for (var n in d){
                    this._data[n] = d[n];
                }
            }
        },
        _get: function(langid){
            var ret = this._data[langid];

            if (Y.Lang.isString(ret) && ret !== ''){
                return ret;
            }
            return null;
        },
        get: function(){
            var ret = this._get(LANGID);

            if (!Y.Lang.isNull(ret)){
                return ret;
            }

            for (var i = 0; i < LANGIDS.length; i++){
                if (LANGIDS[i] === LANGID){
                    continue;
                }
                ret = this._get(LANGIDS[i]);
                if (!Y.Lang.isNull(ret)){
                    return ret;
                }
            }
            return '';
        },
        toJSON: function(){
            return this._data;
        }
    };
    NS.MultiLangValue = MultiLangValue;

    NS.AppModel = Y.Base.create('appModel', NS.AppItem, [], {
        isAppModel: true,
        appInstance: null,
        structureName: null,
        structure: null,
        init: function(config){
            config || (config = {});
            if (config.appInstance){
                this.appInstance = config.appInstance;
            }

            NS.AppModel.superclass.init.apply(this, arguments);
        },
        initializer: function(config){
            config || (config = {});

            this.buildAttributes();

            if (this.structure){
                this.structure.fieldList.each(function(field){
                    var fInfo = field.toJSON();

                    if (fInfo.name in config){
                        this.set(fInfo.name, config[fInfo.name]);
                    } else if (fInfo.json in config){
                        this.set(fInfo.name, config[fInfo.json]);
                    }
                }, this);
            }
        },
        buildAttributes: function(){
            if (!this.structure){
                if (!this.structureName || !this.appInstance){
                    return;
                }
                var appStructure = this.appInstance.get('appStructure');
                if (!appStructure){
                    return;
                }
                this.structure = appStructure.structureList.getById(this.structureName);
                if (!this.structure){
                    return;
                }
            }

            this.structure.fieldList.each(function(field){
                var name = field.get('name');
                if (this.attrAdded(name)){
                    return;
                }
                this.addAttr(name, {
                    field: field,
                    setter: '_attrFieldSetter',
                    getter: '_attrFieldGetter'
                });
            }, this);
            var idField = this.structure.get('idField');
            if (idField !== 'id' && this.attrAdded(idField) && !this.attrAdded('id')){
                this.addAttr('id', {
                    getter: function(){
                        return this.get(idField);
                    }
                });
            }
        },
        getField: function(name){
            var attrCfg = this._state.data[name];
            return attrCfg ? (attrCfg.field || null) : null;
        },
        _convertFieldVal: function(val, name, act){
            var attrCfg = this._state.data[name],
                field = this.getField(name);

            if (!field){
                return val
            }

            var type = field.get('type');
            if (type === 'multiLang'){
                if ((act === 'get' && !val)
                    || (act === 'set' && !attrCfg.value)){

                    return new NS.MultiLangValue(val);
                }
                return val;
            } else if (type === 'model' || type === 'modelList' || type === 'list'){ // TODO: deprecated list
                var app = this.appInstance,
                    typeModule = field.get('typeModule');

                if (typeModule){
                    app = this.appInstance.getApp(typeModule);

                    if (!app){
                        throw {msg: 'Type Module not found in AppStructure'};
                    }
                }

                var className = field.get('typeClass'),
                    typeClass = app.get(className) || Brick.mod[app.get('moduleName')][className];

                if (!typeClass){
                    throw {msg: 'Type Class not found in AppStructure'};
                }

                if ((act === 'get' && !val)
                    || (act === 'set' && !attrCfg.value)){

                    switch (type) {
                        case 'list':
                        case 'modelList':
                            return new typeClass({
                                appInstance: app,
                                items: val ? val.list : []
                            });
                        case 'model':
                            return new typeClass(Y.merge({
                                appInstance: app
                            }, val || {}));
                    }
                }
                return val;
            }

            switch (type) {
                case 'string':
                    return Y.Lang.isString(val) ? val : '';
                case 'bool':
                    if (val === 'false'){
                        val = false;
                    } else if (val === 'true'){
                        val = true;
                    } else {
                        return !!val;
                    }
                case 'int':
                    return (val | 0);
                case 'date':
                    if (act === 'set' || (!val && act === 'get')){
                        val = !val ? null : new Date(val * 1000);
                    }
                    return val;
                case 'double':
                    return parseFloat(val || 0);
            }
            return val;
        },
        _attrFieldSetter: function(val, name){
            return this._convertFieldVal(val, name, 'set');
        },
        _attrFieldGetter: function(val, name){
            return this._convertFieldVal(val, name, 'get');
        },
        toJSON: function(toString){
            if (!toString){
                return NS.AppModel.superclass.toJSON.apply(this);
            }

            var ret = {}, val, name, type;

            this.structure.fieldList.each(function(field){
                name = field.get('name');
                if (!this.attrAdded(name)){
                    return;
                }
                val = this.get(name);
                type = field.get('type');
                if (type === 'date'){
                    ret[name] = val ? val.getTime() / 1000 : null;
                } else if (type === 'multiLang' || type === 'model' || type === 'modelList' || type === 'list'){
                    ret[name] = val ? val.toJSON() : null;
                } else {
                    ret[name] = val;
                }
            }, this);

            return ret;
        }
    }, {
        ATTRS: {}
    });
    NS.AppModel.langFieldName = function(name, lang){
        return name + '_' + lang;
    }

    var AppModelList = function(){
        AppModelList.superclass.constructor.apply(this, arguments);
    };
    NS.AppModelList = Y.extend(AppModelList, NS.AppItemList, {
        appInstance: null,
        appItem: NS.AppModel,
        init: function(config){
            config || (config = {});
            if (config.appInstance){
                this.appInstance = config.appInstance;
            }
            AppModelList.superclass.init.apply(this, arguments);
        },
        _createAppItemInstance: function(data){
            data = data || {};
            if (this.appInstance){
                data.appInstance = this.appInstance;
            }
            return new (this.appItem)(data);
        }
    }, {
        NAME: 'appModelList',
        ATTRS: {}
    });

};