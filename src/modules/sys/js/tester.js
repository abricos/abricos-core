var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['panel.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,

        COMPONENT = this,

        SYS = Brick.mod.sys;

/*
    var _TestDialog = function(){
    };
    _TestDialog.NAME = '_testDialog';
    _TestDialog.prototype = {

    };
    NS._TestDialog = _TestDialog;
    /**/

    NS.TestPanel = Y.Base.create('testPanel', SYS.Panel, [], {
        initializer: function(){
            // console.log(this);
        },
        /*
        onClick: function(e){
console.log('testPanel click');
            console.log(e);
        }
        /**/
    }, {
        ATTRS: {
            component: {
                value: COMPONENT
            },
            templateBlockName: {
                value: 'testpanel,list,item'
            },
            width: {
                value: 400
            }
        }
    });


    /*

     var CatalogEditorDialog = function(cfg){
     this.manCfg = L.merge({
     'refreshAfterClose': false
     }, cfg || {});

     CatalogEditorDialog.superclass.constructor.call(this, {
     'resize': true,
     fixedcenter: true,
     'width': '800px',
     'height': '500px'
     });
     };
     YAHOO.extend(CatalogEditorDialog, Brick.widget.Dialog, {
     initTemplate: function(){
     return buildTemplate(this, 'editordialog').replace('editordialog');
     },
     onLoad: function(){
     var __self = this, cfg = this.manCfg;
     this.viewWidget = new NS.CatalogEditorWdget(this._TM.getEl('editordialog.widget'), {
     'catid': cfg['catid'],
     'onCancelClick': function(){
     Brick.console('oncancel');
     __self.close();
     },
     'onSaveCallback': function(){
     __self.close();
     if (cfg['refreshAfterClose']){
     Brick.Page.reload();
     }
     }
     });
     }
     });
     NS.CatalogEditorDialog = CatalogEditorDialog;
     /**/
};