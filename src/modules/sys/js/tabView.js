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
        owner: {value: null},
        headerNode: {value: null},
        headerTitleNode: {value: null},
        paneNode: {value: null},
        srcNode: {value: null},
        name: {
            getter: function(val){
                return Y.Lang.isString(val) && val !== "" ? val : "tab" + this.get('index');
            },
        },
        index: {value: 0},
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
                index = list.length,
                headerHTML = tp.replace('header', {index: index}),
                paneHTML = tp.replace('pane', {index: index}),
                TabViewPage = options.TabViewPage,
                contentHTML = options.content;

            delete options.content;
            delete options.TabViewPage;

            tp.one('headerList').appendChild(headerHTML);
            tp.one('paneList').appendChild(paneHTML);

            options.owner = this;
            options.index = index;
            options.headerNode = tp.one('header.index-' + index);
            options.headerTitleNode = tp.one('header.title-' + index);
            options.paneNode = tp.one('pane.index-' + index);
            options.srcNode = tp.one('pane.content-' + index);

            var tab = new TabViewPage(options);
            tab._renderTitle();

            if (contentHTML !== ""){
                tab.set('content', contentHTML);
            }

            list[list.length] = tab;

            if (index === 0){
                this.selectTab(0);
            }
            return tab;
        },
        each: function(fn, context){
            var list = this._list;
            for (var i = 0; i < list.length; i++){
                fn.call(context || this, list[i], i);
            }
        },
        item: function(i){
            return this._list[i];
        },
        getTabs: function(){
            return this._list;
        },
        selectTab: function(index){
            index = index | 0;
            this.each(function(tab, i){
                if (index === i){
                    tab.get('paneNode').addClass('active');
                    tab.get('headerNode').addClass('active');
                } else {
                    tab.get('paneNode').removeClass('active');
                    tab.get('headerNode').removeClass('active');
                }
                // tab.get('paneNode').toggleClass('active', index === i);
                // tab.get('headerNode').toggleClass('active', index === i);
            }, this);
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
                    var id = e.defineTarget.getData('index') | 0;
                    this.selectTab(id);
                }
            }
        },
    });

};