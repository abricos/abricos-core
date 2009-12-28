/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
(function(){
	Brick.namespace('mod.feedback');

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
		yahoo: ['tabview'],
		mod:[
		     {name: 'sys', files: ['data.js']},
		     {name: 'feedback', files: ['cp_message.js', 'cp_config.js']}
		    ],
    onSuccess: function() {

			T = Brick.util.Template['feedback']['cp_manager'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);

			moduleInitialize();
			delete moduleInitialize;
	  }
	});
	
var moduleInitialize = function(){

(function(){
	
	Brick.mod.feedback.cp = function(){
		return {
			initialize: function(container){
				container.innerHTML = T['panel'];
				
				var tabView = new YAHOO.widget.TabView(TId['panel']['id']);
				this.tabView = tabView;
				
				this.messages = new Brick.mod.feedback.admin.MessageList(Dom.get(TId['panel']['messages']));
				this.config = new Brick.mod.feedback.admin.Config(Dom.get(TId['panel']['config']));

				var __self = this;
				E.on(container, 'click', function(e){
					if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
				});
				
				var ds = Brick.mod.feedback.data;
				ds.request();
			},
			onClick: function(el){
				if (this.messages.onClick(el)){return true;}
				if (this.config.onClick(el)){return true;}
				return false;
			}
		}
	}();

})();
};
})();