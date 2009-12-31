/*
@version $Id: cp.js 180 2009-11-18 07:18:48Z roosit $
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Sys
 */

var Component = new Brick.Component();
Component.requires = {
	mod:[{name: 'sys', files: ['data.js']}]
};
Component.entryPoint = function(){
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	if (!Brick.objectExists('Brick.mod.sys.data')){
		Brick.mod.sys.data = new Brick.util.data.byid.DataSet('sys');
	}
	var DATA = Brick.mod.sys.data;
	
(function(){
	
	var permData = null;
	
	var P = {};
	
	P.load = function(callback){
		
		if (!L.isNull(permData)){
			if (L.isFunction(callback)){
				callback();
				return;
			}
		};
		
		var permTable = DATA.get('permission', true);
		var dsComplete = function(type, args){
			if (!args[0].check(['permission'])){
				return;
			}
			DATA.onComplete.unsubscribe(dsComplete);

			permData = {};
			permTable.getRows().foreach(function(row){
				var di = row.cell;
				permData[di['nm']] = di['roles'];
			});
			
			
			if (L.isFunction(callback)){
				callback();
			}
		};
		
		DATA.onComplete.subscribe(dsComplete);
		DATA.request(true);
	};
	
	P.check = function(module, action){
		if (L.isNull(permData)){
			return -1;
		};
		
		var roles = permData[module];
		
		if (!roles[action]){
			return -1;
		}
		
		return roles[action] * 1;
	};
	
	Brick.Permission = P;
})();	

};
