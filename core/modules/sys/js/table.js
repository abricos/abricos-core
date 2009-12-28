/*
@version $Id$
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
/**
 * @module Sys
 */
(function(){
	
	Brick.namespace('util');

	var Dom, E,	L;

	var uniqurl = Brick.uniqurl;
	var dateExt = Brick.dateExt;
	var readScript = Brick.readScript;
	var elClear = Brick.elClear;
	var wWait = Brick.widget.WindowWait;

	Brick.Loader.add({
    onSuccess: function() {
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;
			W = YAHOO.widget;
	  }
	});
	
	function connectFailure(o){ wWait.hide(); alert("CONNECTION FAILED!"); };
	
	var connectCallback = {
		success: function(o) {
			wWait.hide(); readScript(o.responseText);
		}, failure: connectFailure
	};

/* * * * * * * * * * * * HTML Price * * * * * * * * * * */
(function(){
	
	Brick.util.Table = function(){
		return {
			highLight: function(tableId, selectedClassName, normalClassName){
				var table = Dom.get(tableId);
				if (L.isNull(table)){ return;}
				
				table.onmouseover = table.onmouseout = function(e){
					if (!e) e = window.event;
					var elem = e.target || e.srcElement;
					if (!elem) return;
					while (!elem.tagName || !elem.tagName.match(/td|th|table/i)) elem = elem.parentNode;
						if (elem.parentNode.tagName == 'TR' && elem.parentNode.parentNode.tagName == 'TBODY') {
							var row = elem.parentNode;
							if (row.id) return;
							if (e.type=="mouseover"){
							row.className = row.style.className = selectedClassName;
						}else{
							row.className = row.style.className = normalClassName;
						}
					}
				};
			}
		}
	}();

})();


})();