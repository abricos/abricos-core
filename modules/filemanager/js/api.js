/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
(function(){

	var wWait = Brick.widget.WindowWait;
	Brick.namespace('mod.filemanager');

	Brick.mod.filemanager.currentBrowser = null;
	
	Brick.mod.filemanager.show = function(callback){
		if (Brick.objectExists('Brick.mod.filemanager.Browser')){
			Brick.mod.filemanager.currentBrowser = new Brick.mod.filemanager.Browser(callback);
		}else{
			wWait.show();
			whilelog = true;
			Brick.Loader.add({
				mod:[{name: 'filemanager', files: ['filemanager.js']}],
		    onSuccess: function(){
					wWait.hide();
					Brick.mod.filemanager.currentBrowser = new Brick.mod.filemanager.Browser(callback);
				}
			});
		}
	};
	
})();