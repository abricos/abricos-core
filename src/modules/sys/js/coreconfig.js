/*
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 */

var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'sys', files: ['form.js']},
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.CoreConfigWidget = Y.Base.create('coreConfigWidget', NS.AppWidget, [
        SYS.Form,
        SYS.FormAction
    ], {
        onInitAppWidget: function(err, appInstance, options){
            this.reloadCoreConfig();
        },
        reloadCoreConfig: function(){
            this.set('waiting', true);

            this.get('appInstance').coreConfig(function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('model', result.coreConfig);
                }
            }, this);
        },
        onSubmitFormAction: function(){
            this.set('waiting', true);

            var model = this.get('model');

            this.get('appInstance').coreConfigSave(model, function(err, result){
                this.set('waiting', false);
            }, this);
        }
    }, {
        ATTRS: {
            component: {
                value: COMPONENT
            },
            templateBlockName: {
                value: 'widget'
            }
        }
    });
};

