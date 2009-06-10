/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('util');

	var Dom, E,	L, C, J;

	var uniqurl = Brick.uniqurl;
	var readScript = Brick.readScript;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
		yahoo: ['json'],
    onSuccess: function() {
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;
			C = YAHOO.util.Connect;
			J = YAHOO.lang.JSON;
	  }
	});
	
	function connectFailure(o){ wWait.hide(); alert("CONNECTION FAILED!"); };
	var connectCallback = { success: function(o) { wWait.hide(); readScript(o.responseText); }, failure: connectFailure };
	
/* * * * * * * * * * * * Config Manager * * * * * * * * * * */
(function(){

})();

})();