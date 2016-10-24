var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['application.js']}
    ]
};
Component.entryPoint = function(NS){
    var Y = Brick.YUI,
        COMPONENT = this;

    var TabViewPageBase = function(){
    };
    TabViewPageBase.prototype = {
        destructor: function(){
            this.get('paneNode').remove();
            this.get('headerNode').remove();
        },
        _renderTitle: function(val){
            var title = val || this.get('title'),
                headerTitleNode = this.get('headerTitleNode');
            if (!headerTitleNode){
                return;
            }
            headerTitleNode.setHTML(title);
        }
    };
    TabViewPageBase.ATTRS = {
        id: {
            writeOnce: true,
        },
        index: {},
        owner: {value: null},
        headerNode: {value: null},
        headerTitleNode: {value: null},
        paneNode: {value: null},
        srcNode: {value: null},
        name: {
            getter: function(val){
                return Y.Lang.isString(val) && val !== "" ? val : "tab" + this.get('id');
            },
        },
        title: {
            getter: function(val){
                return Y.Lang.isString(val) && val !== "" ? val : this.get('name');
            },
            setter: function(val){
                this._renderTitle(val);
                return val;
            }
        },
        content: {
            value: "",
            setter: function(val){
                if (!Y.Lang.isString(val)){
                    val = "";
                }
                var node = this.get('srcNode');
                if (node){
                    node.setHTML(val);
                }
                return val;
            },
            getter: function(val){
                var node = this.get('srcNode');
                if (node){
                    return node.getHTML();
                }
                return val;
            }
        },
    };
    NS.TabViewPageBase = TabViewPageBase;

    NS.TabViewPage = Y.Base.create('TabViewPage', Y.Base, [
        NS.TabViewPageBase
    ], {}, {});

    NS.TabViewWidget = Y.Base.create('TabViewWidget', NS.AppWidget, [], {
        initializer: function(){
            this._list = [];
            this._idCounter = 1;
        },
        destructor: function(){
            this.each(function(tab){
                tab.destroy();
            }, this);
            this._list = [];
        },
        size: function(){
            return this._list.length;
        },
        addTab: function(options){
            options = Y.merge({
                name: "",
                title: "",
                content: "",
                TabViewPage: NS.TabViewPage
            }, options || {});

            var tp = this.template,
                list = this._list,
                id = this._idCounter,
                headerHTML = tp.replace('header', {id: id}),
                paneHTML = tp.replace('pane', {id: id}),
                TabViewPage = options.TabViewPage,
                contentHTML = options.content;

            this._idCounter++;

            delete options.content;
            delete options.TabViewPage;

            tp.one('headerList').appendChild(headerHTML);
            tp.one('paneList').appendChild(paneHTML);

            options.owner = this;
            options.id = id;
            options.headerNode = tp.one('header.id-' + id);
            options.headerTitleNode = tp.one('header.title-' + id);
            options.paneNode = tp.one('pane.id-' + id);
            options.srcNode = tp.one('pane.content-' + id);

            var tab = new TabViewPage(options);
            tab._renderTitle();

            if (contentHTML !== ""){
                tab.set('content', contentHTML);
            }

            list[list.length] = tab;

            if (list.length === 1){
                this.selectTab(0);
            }
            this._reindex();
            return tab;
        },
        each: function(fn, context){
            var list = this._list;
            for (var i = 0; i < list.length; i++){
                fn.call(context || this, list[i], i);
            }
        },
        _reindex: function(){
            this.each(function(tab, index){
                tab.set('index', index);
            }, this);
        },
        item: function(i){
            return this._list[i];
        },
        itemById: function(id){
            id = id | 0;
            var ret = null;
            this.each(function(item){
                if (item.get('id') === id){
                    ret = item;
                }
            }, this);
            return ret;
        },
        getTabs: function(){
            return this._list;
        },
        selectTab: function(index){
            index = index | 0;
            var ret = null;
            this.each(function(item, i){
                if (index === i){
                    item.get('paneNode').addClass('active');
                    item.get('headerNode').addClass('active');
                    ret = item;
                } else {
                    item.get('paneNode').removeClass('active');
                    item.get('headerNode').removeClass('active');
                }
            }, this);
            return ret;
        },
        selectTabById: function(id){
            var item = this.itemById(id);
            return !item ? null : this.selectTab(item.get('index'));
        },
        removeTab: function(index){
            index = index | 0;
            var list = [];
            this.each(function(item, i){
                if (index === i){
                    item.destroy();
                } else {
                    list[list.length] = item;
                }
            }, this);
            this._list = list;
            this._reindex();

            this.selectTab(0);
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget,header,pane'},
            TabViewPage: {value: NS.TabViewPage}
        },
        CLICKS: {
            selectTab: {
                event: function(e){
                    var id = e.defineTarget.getData('id') | 0;
                    this.selectTabById(id);
                }
            }
        },
    });

};