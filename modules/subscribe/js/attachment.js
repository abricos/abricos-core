/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
(function(){
	Brick.namespace('Subscribe.widget');

	var T, J, TId;

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var BC = Brick.util.Connection;

	var elClear = Brick.elClear;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
    onSuccess: function() {
			
			T = Brick.util.Template['subscribe']['attachment'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);

			moduleInitialize();
			delete moduleInitialize;
	  }
	});
	
var moduleInitialize = function(){
	
	var whilelog = false;
	var openFileManager = function(callback){
		if (!Brick.objectExists('Brick.mod.filemanager')){
			if (whilelog){ alert('OPS!'); return; }
			wWait.show();
			whilelog = true;
			Brick.Loader.add({
				mod:[{name: 'filemanager', files: ['filemanager.js']}],
		    onSuccess: function(){ openFileManager(callback); }
			});
		}else{ wWait.hide(); Brick.mod.filemanager.show(callback); }
	};

	
	var panel = function(id, clickFileCallBack){
		this.init(id, clickFileCallBack);
	};
	panel.prototype = {
		init: function(id, clickFileCallBack){
		
			this.clickFileCallBack = clickFileCallBack;
			this.data = [];
		
			var div = Dom.get(id);
			div.innerHTML = T['panel'];
			
			var __self = this;
			E.on(div, 'click', function(e){
				var el = E.getTarget(e);
				if (__self.onClick(el)){ E.stopEvent(e); }
			});
		},
		onClick: function(el){
			if (el.id == TId['panel']['addfile']){
				this.openFileManager();
				return true;
			}else{

				var ar = el.id.split('-');
				if (ar.length != 2){
					return false;
				}
				
				var prefix = ar[0];
				var numid = ar[1];
				
				switch(prefix){
				case TId['row']['remove']:
					this.removeFile(numid)
					return true;
				case TId['row']['add']:
					if (typeof this.clickFileCallBack == 'function'){
						var file = this.getFile(numid);

						var html = "<!--attach:"+file['fid']+"-->";
						var link = Brick.env.host+"/filemanager/file.html?i="+file['fid'];
						
						if (file['fimg']>0){
							html += "<img src='"+link+"' />";
						}else{
							html += "<a href='"+link+"'>"+file['fnm']+"</a>";
						}
						html += "<!--attachend:"+file['fid']+"-->";
						
						this.clickFileCallBack(html);
					}
					return true;
				}
			}
			return false;
		},
		openFileManager: function(){
			var __self = this;
			openFileManager(function(data){
				// var linker = new Brick.mod.filemanager.Linker(data.file);
				__self.appendFile(data.file)
			});
		},
		appendFile: function(file){
			var f = {
				fid: file['id'],
				fnm: file['name'],
				fsz: file['size'],
				fimg: (file['image'] ? 1 : 0)
			};
			var find = false;
			for (var i=0;i<this.data.length;i++){
				var di = this.data[i];
				if (di['fid'] == f['fid']){
					find = true;
				}
			}
			if (!find){
				this.data[this.data.length] = f;
			}
			this.render();
		},
		
		getFile: function(fileid){
			for (var i=0;i<this.data.length;i++){
				var di = this.data[i];
				if (di['fid'] == fileid){
					return di;
				}
			}
		},
		removeFile: function(fileid){
			var nd = [];
			for (var i=0;i<this.data.length;i++){
				var di = this.data[i];
				if (di['fid'] != fileid){
					nd[nd.length] = di;
				}
			}
			this.data = nd;
			this.render();
		},
		update: function(d){
			this.data = d;
			this.render();
		},
		render: function(){
			var lst="", i, di;
			for (i=0;i<this.data.length;i++){
				di=this.data[i];

				s = T['row'];
				s = tSetVar(s, 'id', di['fid']);
				s = tSetVar(s, 'nm', di['fnm']);
				s = tSetVar(s, 'sz', di['fsz']);
				lst += s;
			}
			
			lst = tSetVar(T['table'], 'rows', lst);

			var div = Dom.get(TId['panel']['table']);
			elClear(div);
			div.innerHTML = lst;
		}
	};
	
	
	Brick.Subscribe.widget.Attachment = panel;
	
};
})();