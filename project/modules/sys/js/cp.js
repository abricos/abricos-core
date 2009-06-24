/**
* @version $Id$
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
	Brick.User.CP.Manager.register(module);

})();