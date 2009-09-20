/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
(function(){

	if (!Brick.objectExists('Brick.User.CP.Manager')){ return; }

	var wWait = Brick.widget.WindowWait;
	
	if (!Brick.env.user.isRegister()){ return; }
	Brick.User.CP.Manager.register({
		name: 'user-profile',
		titleid: "mod.user.cp.profile.title",
		icon: "/modules/user/css/images/cp_icon.gif",
		initialize: function(container){
			wWait.show();
			Brick.Loader.add({
				mod:[{name: 'user', files: ['cp_man_profile.js']}],
		    onSuccess: function() {
					wWait.hide();
					Brick.mod.user.my.cp.initialize(container);
			  }
			});
		}
	});
	
	if (!Brick.env.user.isAdmin()){ return; }
	
	Brick.User.CP.Manager.register({
		name: 'user-users',
		titleid: "mod.user.cp.users.title",
		icon: "/modules/user/css/images/cp_icon.gif",
		initialize: function(div){
			wWait.show();
			Brick.Loader.add({
				mod:[{name: 'user', files: ['adminapi.js','admin.js']}],
		    onSuccess: function() {
					wWait.hide();
					Brick.mod.user.admin.cp.initialize(div);
			  }
			});
		}
	});

	Brick.User.CP.Manager.register({
		name: 'user-modules',
		titleid: "mod.user.cp.modules.title",
		initialize: function(div){
			wWait.show();
			Brick.Loader.add({
				mod:[{name: 'user', files: ['cp_modules.js']}],
		    onSuccess: function() {
					wWait.hide();
					Brick.mod.user.modules.cp.initialize(div);
			  }
			});
		}
	});

})();