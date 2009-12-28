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

	Brick.User.CP.Manager.register({
		name: 'subscribe',
		titleid: "subscribe.admin.cp.title",
		icon: "/modules/subscribe/js/images/cp_icon.gif",
		initialize: function(container){
			wWait.show();
			Brick.Loader.add({
				mod:[{name: 'subscribe', files: ['cp_man.js']}],
		    onSuccess: function() {
					wWait.hide();
					Brick.Subscribe.Admin.CP.initialize(container);
			  }
			});
		}
	});

})();