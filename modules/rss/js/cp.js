/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
(function(){

	if (!Brick.objectExists('Brick.User.CP.Manager')){ return; }
	if (!Brick.env.user.isModerator()){ return; }

	var wWait = Brick.widget.WindowWait;

	Brick.User.CP.Manager.register({
		name: 'rss',
		titleid: "rss.admin.cp.title",
		// icon: "/modules/news/js/images/cp_icon.gif",
		// css: ".icon-news	{ background-position: -16px -19px; }",
		initialize: function(container){
			wWait.show();
			Brick.Loader.add({
				mod:[{name: 'rss', files: ['cp_manager.js']}],
		    onSuccess: function() {
					wWait.hide();
					Brick.mod.rss.cp.initialize(container);
			  }
			});
		}
	});

})();