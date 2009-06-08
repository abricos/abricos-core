/**
* @version $Id: cp_product.js 735 2009-04-03 10:32:05Z AKuzmin $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
(function(){
	Brick.namespace('mod.sys');

	var T, J, TId;

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		W = YAHOO.widget,
		J = YAHOO.lang.JSON;

	var BC = Brick.util.Connection;
	
	var dateExt = Brick.dateExt;
	var elClear = Brick.elClear;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
		yahoo: ['json', 'tabview'],
		mod:[
		     {name: 'sys', files: ['data.js', 'cp_template.js', 'cp_config.js']}
		    ],
    onSuccess: function() {

			T = Brick.util.Template['sys']['cp_manager'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);

			moduleInitialize();
			delete moduleInitialize;
	  }
	});
	
var moduleInitialize = function(){

(function(){
	
	Brick.mod.sys.cppage = function(){
		return {
			initialize: function(container){
				container.innerHTML = T['panel'];
				
				var tabView = new YAHOO.widget.TabView(TId['panel']['id']);
				this.tabView = tabView;
				
				this.template = {
					'manager': new Brick.mod.sys.template.Manager(Dom.get(TId['panel']['tabtemplate']))
				};
				
				this.config = {
					'manager': new Brick.mod.sys.config.Manager(Dom.get(TId['panel']['tabconfig']))
				}

				var __self = this;
				E.on(container, 'click', function(e){
					if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
				});
				
				var ds = Brick.mod.sys.data;
				ds.request();
			},
			onClick: function(el){
				if (this.template.manager.onClick(el)){return true;}
				if (this.config.manager.onClick(el)){return true;}
				return false;
			}
		}
	}();

})();
};
})();