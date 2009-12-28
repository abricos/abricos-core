/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
(function(){

	var wWait = Brick.widget.WindowWait;
	var DATA;
	
	Brick.namespace('mod.feedback.api');

	var loadlib = function(callback){
		wWait.show();
		Brick.Loader.add({
			mod:[
			     {name: 'feedback', files: ['form.js']}
			    ],
	    onSuccess: function() {
				wWait.hide();
				callback();
		  }
		});
	};
	
	var isloadlib = false;
	var Bmfa = Brick.mod.feedback.api;
	Bmfa.show = function(param){
		if (!isloadlib){
			isloadlib = true;
			var ret;
			loadlib(function(){ ret = Bmfa.show(param); });
			return ret;
		}
		return new Brick.mod.feedback.user.Form(param);
	};
	
	Bmfa.insert = function(containerid, param){
		if (!isloadlib){
			isloadlib = true;
			var ret;
			loadlib(function(){ ret = Bmfa.insert(containerid, param); });
			return ret;
		}
		return new Brick.mod.feedback.user.Panel(containerid, param);
	};
	
})();