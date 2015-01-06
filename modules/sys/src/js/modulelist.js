/*
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 */

var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this;

    NS.ModuleListWidget = Y.Base.create('moduleListWidget', NS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance, options){
            this.reloadModuleList();
        },
        reloadModuleList: function(){
            this.set('waiting', true);

            this.get('appInstance').moduleList(function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('moduleList', result.moduleList);
                }
                this.renderModuleList();
            }, this);
        },
        renderModuleList: function(){
            var moduleList = this.get('moduleList');
            if (!moduleList){
                return;
            }
            var tp = this.template, lst = "";

            moduleList.each(function(group){
                var attrs = group.toJSON();

                lst += tp.replace('row', [
                    {
                        installdate: Brick.dateExt.convert(attrs.installdate),
                        updatedate: Brick.dateExt.convert(attrs.updatedate)
                    },
                    attrs
                ]);
            });

            tp.gel('list').innerHTML = tp.replace('list', {
                'rows': lst
            });
        }
    }, {
        ATTRS: {
            component: {
                value: COMPONENT
            },
            templateBlockName: {
                value: 'widget,list,row'
            },
            moduleList: {
                value: null
            }
        }
    });
};

