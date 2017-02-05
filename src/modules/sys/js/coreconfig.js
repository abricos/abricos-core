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
                    this.renderCoreConfig(result.coreConfig);
                }
            }, this);
        },
        renderCoreConfig: function(model){
            if (!model){
                return;
            }

            var tp = this.template, lst = "",
                styles = model.get('styles');

            for (var i = 0; i < styles.length; i++){
                var style = styles[i];
                lst += tp.replace('option', {id: style, v: style});
            }
            Y.Node.one(tp.gel('styles')).setHTML(tp.replace('select', {
                'name': 'style',
                'rows': lst
            }));
            this.set('model', model);
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
                value: 'widget,select,option'
            }
        }
    });
};

