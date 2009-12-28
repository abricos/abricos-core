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
		name: 'comment',
		titleid: "comment.cp.title",
		icon: "/modules/comment/js/images/cp_icon.gif",
		css: ".icon-comment	{ background-position: -32px -39px; }",
		initialize: function(container){
			wWait.show();
			Brick.Loader.add({
				mod:[{name: 'comment', files: ['cp_man.js']}],
		    onSuccess: function() {
					wWait.hide();
					Brick.Comment.Admin.CP.initialize(container);
			  }
			});
		}
	});

})();