/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
(function(){

	if (!Brick.objectExists('Brick.User.CP.Manager')){ return; }
	if (!Brick.env.user.isAdmin()){ return; }

	return;
	
	var wWait = Brick.widget.WindowWait;
	
	var module = {
		name: 'catalog',
		titleid: "catalog.title",
		initialize: function(container){
			wWait.show();
			Brick.Loader.add({
				mod:[{name: 'catalog', files: ['cp_config.js']}],
		    onSuccess: function() {
					wWait.hide();
					Brick.Catalog.CPPage.initialize(container);
			  }
			});
		}
	};

	Brick.User.CP.Manager.register(module);

})();