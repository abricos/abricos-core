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
		name: 'blog',
		titleid: "blog.admin.cp.title",
		icon: "/modules/blog/js/images/cp_icon.gif",
		css: '.icon-blog	{ background-position: -48px -61px; }',
		initialize: function(div){
			wWait.show();
			Brick.Loader.add({
				mod:[{name: 'blog', files: ['cp_man.js']}],
		    onSuccess: function() {
				
					wWait.hide();
					Brick.Blog.Admin.CP.initialize(div);
			  }
			});
		}
	});

})();