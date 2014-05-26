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

    NS.TestPanel = Y.Base.create('testPanel', SYS.Panel, [], {
        onClick: function(e){
            switch (e.dataClick){
                case 'btest':
                    this.increment();
                    return true;
            }
        },
        increment: function(){
            var elInput = this.template.gel('input');
            elInput.value += elInput.value;
        }
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

};