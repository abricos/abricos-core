var Component = new Brick.Component({
    buildTemplate: false
});
Component.requires = {
    mod: [
        {name: 'filemanager', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys,
        FM = Brick.mod.filemanager;

    var MODE_CODE = 'code',
        MODE_VISUAL = 'visual',

        TOOLBAR_FULL = 'full',
        TOOLBAR_STANDART = 'average',
        TOOLBAR_MINIMAL = 'minimal';

    NS.Editor = Y.Base.create('editorWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            var srcNode = this.get('srcNode');
            if (!srcNode){
                return;
            }
            var tp = this.template,
                nodeText = tp.one('text'),
                rows = srcNode.getData('rows') | 0;

            if (rows === 0){
                rows = this.get('rows');
            }

            nodeText.set('rows', rows);
            nodeText.set('value', this.get('content'));

            this.set('waiting', true);

            Brick.use(NS.Editor.CURRENT_VISUAL_EDITOR, 'visualEditor', function(err, ns){
                if (err){
                    this._onLoadVisualEditor(null);
                } else {
                    new ns.VisualEditor({
                        srcNode: tp.gel('text'),
                        toolbar: this.get('toolbar'),
                        initCallback: this._onLoadVisualEditor,
                        initContext: this
                    });
                }
            }, this);

            this.on('modeChange', this._onModeChange, this);
        },
        destructor: function(){
            if (this.visualEditor){
                this.visualEditor.destroy();
            }
        },
        _onLoadVisualEditor: function(visualEditor){
            this.set('waiting', false);
            if (!visualEditor){
                return;
            }
            this.visualEditor = visualEditor;
            visualEditor.on('modeChange', this._onModeChange, this);
        },
        _onModeChange: function(e){
            var mode = e ? e.newVal : this.get('mode');

            this.template.toggleView(mode === NS.Editor.MODE_CODE, 'btnVisualMode');
        },
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            content: {
                value: MODE_VISUAL,
                getter: function(val){
                    if (!this.visualEditor){
                        return val;
                    }
                    return this.visualEditor.get('content');
                },
                setter: function(val){
                    if (!this.visualEditor){
                        return val;
                    }
                    this.visualEditor.set('content', val);
                }
            },
            mode: {
                value: MODE_VISUAL,
                getter: function(val){
                    if (!this.visualEditor){
                        return val;
                    }
                    return this.visualEditor.get('mode');
                },
                setter: function(val){
                    if (!this.visualEditor){
                        return val;
                    }
                    this.visualEditor.set('mode', val);
                }
            },
            toolbar: {value: TOOLBAR_MINIMAL},
            rows: {value: 5}
        },
        CLICKS: {
            setVisualMode: {
                event: function(){
                    this.set('mode', MODE_VISUAL);
                }
            }
        }
    });

    NS.Editor.CURRENT_VISUAL_EDITOR = 'tinymce';

    NS.Editor.MODE_CODE = MODE_CODE;
    NS.Editor.MODE_VISUAL = MODE_VISUAL;

    NS.Editor.TOOLBAR_FULL = TOOLBAR_FULL;
    NS.Editor.TOOLBAR_STANDART = TOOLBAR_STANDART;
    NS.Editor.TOOLBAR_MINIMAL = TOOLBAR_MINIMAL;

    NS.Editor._editors = {};


    var VisualEditor = function(){
        VisualEditor.superclass.constructor.apply(this, arguments);
    }
    VisualEditor.ATTRS = {
        srcNode: {},
        content: {value: ''},
        toolbar: {value: TOOLBAR_MINIMAL},
        initCallback: {validator: Y.Lang.isFunction},
        initContext: {}
    };
    Y.extend(VisualEditor, Y.Base, {});
    NS.VisualEditor = VisualEditor;
};
