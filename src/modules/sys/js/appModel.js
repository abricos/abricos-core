/*!
 * Copyright 2008-2014 Alexander Kuzmin <roosit@abricos.org>
 * Licensed under the MIT license
 */

var Component = new Brick.Component();
Component.requires = {
    yui: ['base', 'arraylist']
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI;

    var AppItem = function(){
        AppItem.superclass.constructor.apply(this, arguments);
    };
    NS.AppItem = Y.extend(AppItem, Y.Base, {
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

        initializer: function(config){
            config || (config = {});

            this.idField = config.idField || this.idField;

            var appItem = this.appItem = config.appItem || this.appItem;

            if (typeof appItem === 'string'){
                this.appItem = Y.Object.getValue(Brick.mod, appItem.split('.'))
                if (this.appItem){
                    Y.error('AppItemList: AppItem class not found: ' + appItem);
                }
            }

            this.publish('add', {defaultFN: this._defAddFn});
            this.publish('remove', {defaultFN: this._defRemoveFn});

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
                return this._add(appItem, options);
            }
        },
        _createAppItemInstance: function(data){
            return new (this.appItem)(data);
        },
        _add: function(appItem, options){
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
        remote: function(appItem, options){
            this._remove(appItem, options);
        },
        _remove: function(appItem, options){
            var index, facade;

            options || (options = {});

            if (Lang.isNumber(appItem)){
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
        each: function(callback, context){
            var items = this._items.concat(),
                i, item, len;

            for (i = 0, len = items.length; i < len; i++){
                item = items[i];
                callback.call(context || item, item, i, this);
            }
            return this;
        },
        some: function(callback, context){
            var items = this._items.concat(),
                i, item, len;

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
        toArray: function(){
            return this._items.concat();
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

    NS.AppItem.Field = Y.Base.create('appItem_Field', NS.AppItem, [], {}, {
        ATTRS: {
            name: {value: ''},
            multiLang: {value: false},
            type: {value: 'string'},
            default: {value: ''},
            json: {value: ''}
        }
    });
    NS.AppItem.FieldList = Y.Base.create('appItem_FieldList', NS.AppItemList, [], {
        appItem: NS.AppItem.Field,
        idField: 'name'
    });

    NS.AppItem.Structure = Y.Base.create('appItem_Structure', NS.AppItem, [], {
        fieldList: null,

        initializer: function(config){
            config || (config = {});

            this.fieldList = new NS.AppItem.FieldList({
                items: config.fields
            });
        },
        toJSON: function(){
            var json = NS.AppItem.Structure.superclass.toJSON.apply(this, arguments);
            json.fields = this.fieldList.toJSON();
            return json;
        }
    }, {
        ATTRS: {
            name: {value: ''}
        }
    });

    NS.AppItem.StructureList = Y.Base.create('appItem_StructureList', NS.AppItemList, [], {
        appItem: NS.AppItem.Structure,
        idField: 'name'
    });

    NS.AppStructure = Y.Base.create('appStructure', Y.Base, [], {
        structureList: null,

        initializer: function(config){
            config || (config = {});

            this.structureList = new NS.AppItem.StructureList({
                items: config.structures
            });
        }
    });

    NS.AppModel = Y.Base.create('appModel', NS.AppItem, [], {
        appInstance: null,
        structureName: null,
        structure: null,
        initializer: function(config){
            config || (config = {});
            if (config.appInstance){
                this.appInstance = config.appInstance;
            }
            this.buildAttributes();

            if (this.structure){
                this.structure.fieldList.each(function(field){
                    var fInfo = field.toJSON();
                    if (fInfo.json in config){
                        this.set(fInfo.name, config[fInfo.json]);
                    }
                }, this);
            }
            console.log(this.toJSON());
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
        },
        getField: function(name){
            var attrCfg = this._state.data[name];
            if (!attrCfg){
                return null;
            }
            return attrCfg.field || null;
        },
        _attrFieldSetter: function(val, name){
            var field = this.getField(name);

            return NS.AppModel.convert(val, field);
        },
        _attrFieldGetter: function(val, name){
            var field = this.getField(name);
            return NS.AppModel.convert(val, field);
        }
    }, {
        ATTRS: {}
    });
    NS.AppModel.convert = function(val, field){
        if (!field){
            return val
        }

        switch (field.get('type')) {
            case 'string':
                return Y.Lang.isString(val) ? val : '';
            case 'int':
                return (val | 0);
        }
        return val;
    };

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
        NAME: 'appModelList'
    });

};