/**
* @version $Id: cp.js 734 2009-04-03 06:55:17Z AKuzmin $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
(function(){

	if (!Brick.objectExists('Brick.User.CP.Manager')){ return; }
	if (!Brick.env.user.isAdmin()){ return; }

	var wWait = Brick.widget.WindowWait;
	
	var module = {
		name: 'sys',
		titleid: "sys.title",
		initialize: function(container){
			wWait.show();
			Brick.Loader.add({
				mod:[{name: 'sys', files: ['cp_manager.js']}],
		    onSuccess: function() {
					wWait.hide();
					Brick.mod.sys.cppage.initialize(container);
			  }
			});
		}
	};
	/*
	module['child'] = [{
		name: 'catalog',
		titleid: "catalog.title",
		initialize: function(container){
			wWait.show();
			Brick.Loader.add({
				mod:[{name: 'catalog', files: ['cp_config.js']}],
		    onSuccess: function() {
					wWait.hide();
					var cppage = new Brick.Catalog.CPPage(container, 'cps');
			  }
			});
		}
	}];
	/**/
	Brick.User.CP.Manager.register(module);

})();