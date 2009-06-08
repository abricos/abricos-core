/**
* @version $Id: js_data.php 776 2009-04-29 10:21:54Z AKuzmin $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){

	var wWait = Brick.widget.WindowWait;
	var DATA;
	
	Brick.namespace('mod.user.admin.api');

	var loadlib = function(callback){
		wWait.show();
		Brick.Loader.add({
			mod:[
			     {name: 'sys', files: ['data.js']},
			     {name: 'user', files: ['admin.js']}
			    ],
	    onSuccess: function() {
				wWait.hide();
				if (!Brick.objectExists('Brick.mod.user.data')){
					Brick.mod.user.data = new Brick.util.data.byid.DataSet('user');
				}
				DATA = Brick.mod.user.data;
				callback();
		  }
		});
	};
	
	var loaddata = function(tables, callback){
		if (!DATA.isFill(tables)){
			var ondsupdate = function(){
				DATA.onComplete.unsubscribe(ondsupdate);
				callback();
			};
			DATA.onComplete.subscribe(ondsupdate);
			DATA.request();
			return;
		}
		callback();
	};
	
	var isLoadLib = false;
	
	/**
	 * Редактор пользователя
	 */
	Brick.mod.user.admin.api.edit = function(userid){
		if (!isLoadLib){
			isLoadLib = true;
			loadlib(function(){ Brick.mod.user.admin.api.edit(userid) });
			return;
		}
		
		var tables = {'user': DATA.get('user', true)};
		var rows = tables['user'].getRows({id: userid});
		loaddata(tables, function(){
			Brick.mod.user.admin.api.activeEditor = new Brick.mod.user.admin.Editor(rows);
		});		
	};
	
})();
