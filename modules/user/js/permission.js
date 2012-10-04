/*
@version $Id$
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
		L = YAHOO.lang,
		NS = this.namespace;

	if (!NS.data){
		NS.data = new Brick.util.data.byid.DataSet('user');
	}
	var DATA = NS.data;
	
	Brick.Permission = Brick.Permission || {};
(function(){
	
	var permData = null;
	
	var P = Brick.Permission;
	
	P.load = function(callback){
		var fd = P.FD;
		
		if (!L.isNull(permData)){
			if (L.isFunction(callback)){
				callback();
				return;
			}
		};
		
		if (fd){
			
			permData = {};
			
			for (var i=0;i<fd.length;i++){
				var di = fd[i];
				permData[di['nm']] = di['roles'];
			}
			
			if (L.isFunction(callback)){
				callback();
			}
		}else{
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
		}
	};
	
	P.check = function(module, action){
		if (L.isNull(permData)){
			return -1;
		};
		
		var roles = permData[module];
		if (!roles){
			return -1;
		}
		
		if (!roles[action]){
			return -1;
		}
		
		return roles[action] * 1;
	};

})();	

};
