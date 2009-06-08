/**
* @version $Id: cp.js 790 2009-05-08 06:48:30Z AKuzmin $
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
		titleid: "user.profile.cp.title",
		icon: "/modules/user/js/images/cp_icon.gif",
		initialize: function(div){
			wWait.show();
			Brick.Loader.add({
				mod:[{name: 'user', files: ['cp_man_profile.js']}],
		    onSuccess: function() {
					wWait.hide();
					Brick.User.Profile.Manager.initialize(div);
			  }
			});
		}
	});
	
	if (!Brick.env.user.isAdmin()){ return; }
	
	Brick.User.CP.Manager.register({
		name: 'user-users',
		titleid: "user.users.cp.title",
		icon: "/modules/user/js/images/cp_icon.gif",
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

})();