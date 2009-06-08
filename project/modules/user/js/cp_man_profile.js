/**
* @version $Id: cp_man_profile.js 697 2009-02-27 13:41:48Z AKuzmin $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('User.Profile');

	var Dom, E,	L, C, T, J, TId;

	var uniqurl = Brick.uniqurl;
	var elClear = Brick.elClear;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
		yahoo: ['json','tabview'],
		mod:[{name: 'sys', files: ['form.js']}],
    onSuccess: function() {
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;
			C = YAHOO.util.Connect;
			J = YAHOO.lang.JSON;
			
			T = Brick.util.Template['user']['cp_man_profile'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			
			Brick.util.CSS.update(T['css']);
	  }
	});
	
/* * * * * * * * * * * * Profile * * * * * * * * * * */
(function(){
	
	var man = function(container){
		this.init(container);
	};
	
	man.prototype = {
		init: function(container){
			container.innerHTML = T['panel'];
			
			var tabView = new YAHOO.widget.TabView(TId['_global']['panel']);
			this.tabView = tabView;

			var tabPerson = Dom.get(TId['panel']['person'])
			tabPerson.innerHTML = T['person'];
			
			var tabContact = Dom.get(TId['panel']['contact'])
			tabContact.innerHTML = T['contact'];

			var tabContact = Dom.get(TId['panel']['login'])
			tabContact.innerHTML = T['login'];

			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
		},
		onClick: function(el){
			return false;
		}
	}
	
	Brick.User.Profile.Manager = function(){
		return {
			initialize: function(container){
				Brick.User.Profile.Manager = new man(container);
			}
		}
	}();
	
})();
})();