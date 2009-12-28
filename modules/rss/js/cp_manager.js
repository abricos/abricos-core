/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
(function(){
	Brick.namespace('mod.rss');

	var T, J, TId;

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		W = YAHOO.widget,
		J = YAHOO.lang.JSON;

	var dateExt = Brick.dateExt;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
		yahoo: ['tabview'],
		mod:[
		     {name: 'sys', files: ['data.js']},
		     {name: 'rss', files: ['cp_config.js','cp_chanel.js']}
		    ],
    onSuccess: function() {

			T = Brick.util.Template['rss']['cp_manager'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);

			moduleInitialize();
			delete moduleInitialize;
	  }
	});
	
var moduleInitialize = function(){

(function(){
	
	Brick.mod.rss.cp = function(){
		return {
			initialize: function(container){
				container.innerHTML = T['panel'];
				
				var tabView = new YAHOO.widget.TabView(TId['panel']['id']);
				this.tabView = tabView;
				
				this.config = new Brick.mod.rss.Config(Dom.get(TId['panel']['config']));
				this.chanel = new Brick.mod.rss.Chanel(Dom.get(TId['panel']['chanel']));

				var __self = this;
				E.on(container, 'click', function(e){
					if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
				});
				Brick.mod.rss.data.request();
			},
			onClick: function(el){
				if (this.config.onClick(el)){return true;}
				if (this.chanel.onClick(el)){return true;}
				return false;
			}
		}
	}();

})();
};
})();