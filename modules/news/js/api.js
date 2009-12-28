/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
(function(){

	var wWait = Brick.widget.WindowWait;
	var DATA;
	
	Brick.namespace('mod.news.api');

	var loadlib = function(callback){
		wWait.show();
		Brick.Loader.add({
			mod:[
			     {name: 'news', files: ['editor.js']},
			     {name: 'sys', files: ['data.js']}
			    ],
	    onSuccess: function() {
				wWait.hide();
				if (!Brick.objectExists('Brick.mod.news.data')){
					Brick.mod.news.data = new Brick.util.data.byid.DataSet('news');
				}
				DATA = Brick.mod.news.data;
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
	
	
	var Bmna = Brick.mod.news.api;
	var isLoadLib = false;
	
	Bmna.edit = function(newsid){
		var __self = this;
		if (!isLoadLib){
			isLoadLib = true;
			loadlib(function(){ Bmna.edit(newsid) });
			return;
		}
		var table = DATA.get('news', true);
		var rows = table.getRows({id: newsid});
		loaddata({'news': table}, function(){
			if (newsid == 0){
				var nrows = rows.clone();
				nrows.add(table.newRow());
				rows = nrows;
			}
			Bmna.activeEditor = new Brick.mod.news.Editor(rows);
		});		
	};
	Bmna.create = function(){ Bmna.edit(0); };

})();