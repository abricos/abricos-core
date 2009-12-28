/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	
	Brick.namespace('mod.feedback.admin');
	Brick.namespace('mod.sys');
	Brick.namespace('mod.user');

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		C = YAHOO.util.Connect,
		T, TId;
	
	var DATA;

	var dateExt = Brick.dateExt;
	var wWait = Brick.widget.WindowWait;
	var elClear = Brick.elClear;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
		mod:[{name: 'sys', files: ['data.js', 'form.js']}],
    onSuccess: function() {
			if (!Brick.objectExists('Brick.mod.feedback.data')){
				Brick.mod.feedback.data = new Brick.util.data.byid.DataSet('feedback');
			}
			DATA = Brick.mod.feedback.data;

			T = Brick.util.Template['feedback']['cp_arhive.js'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			
			moduleInitialize();
			delete moduleInitialize;
	  }
	});

var moduleInitialize = function(){
(function(){
	

})();
};
})();
