var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['application.js']}
    ]
};
Component.entryPoint = function(NS){
    var Y = Brick.YUI,
        COMPONENT = this;

    NS.TabViewPage = Y.Base.create('TabViewPage', Y.Base, [], {}, {
        ATTRS: {
            owner: {value: null},
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
            },
            content: {
                value: "",
                setter: function(val){
                    if (!Y.Lang.isString(val)){
                        val = "";
                    }
                    var node = this.get('node');
                    if (node){
                        node.setHTML(val);
                    }
                    return val;
                },
                getter: function(val){
                    var node = this.get('node');
                    if (node){
                        return node.getHTML();
                    }
                    return val;
                }
            },
            node: {value: null}
        }
    });

    NS.TabViewWidget = Y.Base.create('TabViewWidget', NS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            this._list = [];
        },
        destructor: function(){
        },
        size: function(){
            return this._list.length;
        },
        addTab: function(options){
            options = Y.merge({
                name: "",
                title: "",
                content: ""
            }, options || {});

            var tp = this.template,
                list = this._list,
                index = list.length,
                headerHTML = tp.getHTML('headerList'),
                tab = new NS.TabViewPage(options);

            headerHTML += tp.replace('header', {
                index: index,
                title: tab.get("title")
            });
            tp.setHTML('headerList', headerHTML);

            var paneHTML = tp.replace('pane', {index: index});

            tp.one('paneList').appendChild(paneHTML);

            var nodePane = tp.one('pane.index-' + index);

            tab.set('index', index);
            tab.set('owner', this);
            tab.set('node', nodePane);
            tab.set('content', options.content);

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
            
            var tp = this.template;

            this.each(function(tab, i){
                tp.toggleClass('header.index-' + i, 'active', index === i);
                tp.toggleClass('pane.index-' + i, 'active', index === i);
            }, this);
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget,header,pane'},
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