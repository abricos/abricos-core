var Component = new Brick.Component({
    buildTemplate: false
});
Component.requires = {
    mod: [
        {name: 'filemanager', files: ['lib.js']},
        {name: 'sys', files: ['application.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys,

        MODE_CODE = 'code',
        MODE_VISUAL = 'visual',

        TOOLBAR_FULL = 'full',
        TOOLBAR_STANDART = 'average',
        TOOLBAR_MINIMAL = 'minimal';

    function insert_text_cursor(area, _text){
        if ((area.selectionStart) || (area.selectionStart == '0')){
            var p_start = area.selectionStart;
            var p_end = area.selectionEnd;
            area.value = area.value.substring(0, p_start) + _text + area.value.substring(p_end, area.value.length);
        }
        if (document.selection){
            area.focus();
            sel = document.selection.createRange();
            sel.text = _text;
        }
    }

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
                        mode: this.get('mode'),
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
            this._onModeChange();
        },
        _onModeChange: function(e){
            var mode = e ? e.newVal : this.get('mode'),
                isCode = mode === NS.Editor.MODE_CODE;

            this.template.toggleView(isCode, 'btnVisualMode,btnFileManager');
        },
        openFileManager: function(){
            var nodeText = this.template.one('text');

            Brick.Component.API.fire('filemanager', 'api', 'showFileBrowserPanel', function(result){
                insert_text_cursor(nodeText.getDOMNode(), result['html']);
            });
        },
        insertValue: function(value){
            if (this.get('mode') === NS.Editor.MODE_CODE){
                var nodeText = this.template.one('text');
                insert_text_cursor(nodeText.getDOMNode(), value);
            } else {
                this.visualEditor.insertValue(value);
            }
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget'},
            content: {
                value: '',
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
                    return this.visualEditor ? this.visualEditor.get('mode') : val;
                },
                setter: function(val){
                    if (!this.visualEditor){
                        return val;
                    }
                    this.visualEditor.set('mode', val);
                    return val;
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
            },
            openFileManager: 'openFileManager'
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
        initContext: {},
        mode: {}
    };
    Y.extend(VisualEditor, Y.Base, {});
    NS.VisualEditor = VisualEditor;
};
