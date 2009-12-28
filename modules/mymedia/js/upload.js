/*
@version $Id: manager.js 156 2009-11-09 08:17:11Z roosit $
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	yahoo: ['dom','element','uploader','tabview'],
    mod:[
         {name: 'sys', files: ['data.js']}
    ]
};
Component.entryPoint = function(){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var __selfCT = this;
	
	var NS = this.namespace, 
		TMG = this.template;
	
	var API = NS.API;

/*
// test

Brick.Component.API.fireFunction('mymedia','api',function(){
    Brick.mod.mymedia.API.showUploadPanel(1)
})
*/
(function(){
	
	var StandartUploadWidget = function(container, albumid){
		this.albumid = albumid;
		
		this.init(container);
	};
	StandartUploadWidget.prototype = {
		init: function(container){
			
		}
	};
	
	NS.StandartUploadWidget = StandartUploadWidget;
	
})();

(function(){
	
	var SWFUploadWidget = function(container, albumid){
		this.albumid = albumid;
		this.init(container);
	};
	SWFUploadWidget.prototype = {
		flagUploadFile: false,
		_files: null,
		_uploader: null,
		init: function(container){
			var TM = TMG.build('swfupload,swftable,swfrow,swfpgs,swfrowerror,swfrowok'),
				T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T['swfupload'];
			this._initMultiUploader();
		},
		_initMultiUploader: function(){
			var T = this._T, TId = this._TId;
			
			var uiLayer = Dom.getRegion(TId['swfupload']['bselect']);
			var overlay = Dom.get(TId['swfupload']['uploader']);
			Dom.setStyle(overlay, 'width', uiLayer.right-uiLayer.left + "px");
			Dom.setStyle(overlay, 'height', uiLayer.bottom-uiLayer.top + "px");
			
			YAHOO.widget.Uploader.SWFURL = "/js/yui/"+Brick.env.lib.yui+"/uploader/assets/uploader.swf";
			
			var uploader = new YAHOO.widget.Uploader( TId['swfupload']['uploader'] );
			this._uploader = uploader;

			var __self = this;
			uploader.addListener('contentReady', function handleContentReady () {
				uploader.setAllowLogging(true);
				uploader.setAllowMultipleFiles(true);
				var ff = new Array({description:"Images", extensions:"*.jpg;*.png;*.gif"},
				                   {description:"Videos", extensions:"*.avi;*.mov;*.mpg"});
				uploader.setFileFilters(ff);
			});
			uploader.addListener('fileSelect', function(event){
				if('fileList' in event && event.fileList != null) {
					__self._renderTable(event.fileList);
				}
			});
			uploader.addListener('uploadProgress', function (event) {
				__self._renderProgress(event);
			});
			uploader.addListener('uploadComplete', function (event) {
				// __self._uploadComplete(event);
			});
			uploader.addListener('uploadCompleteData', function(event){
				__self._uploadComplete(event);
				// Brick.console(event);
			});
		
			this._renderTable();
		},
		onClick: function(el){
			if (el.id == this._TId['swfupload']['bupload']){
				this.upload();
			}
			return false;
		},
		upload: function() {
			if (L.isNull(this._files)){ return; }
			this._uploader.setSimUploadLimit(1);
			var url = "/mymedia/upload/"+this.albumid+"/?session="+Brick.env.user.session;
			this._uploader.uploadAll(url, "POST", null, "Filedata");
		},
		_uploadComplete: function(event){
			// Brick.console(event);
			var el = Dom.get(this._TId['swfrow']['id']+'-'+event.id+'-pgs');
			
			var error = (event.data) * 1;
			if (error > 0){
				var lng = Brick.util.Language.getc('mod.mymedia.upload.error');
				el.innerHTML = this._TM.replace('swfrowerror', {
					'err': lng[error] 
				}); 
			}else{
				this.flagUploadFile = true;
				el.innerHTML = this._TM.replace('swfrowok', {}); 
				
			}
			// el.parentNode.removeChild(el);
		},
		_renderProgress: function(event){
			var el = Dom.get(this._TId['swfrow']['id']+'-'+event.id+'-pgs');
			el.innerHTML = this._TM.replace('swfpgs', {
				'width': Math.round(100*(event["bytesLoaded"]/event["bytesTotal"])) 
			}); 
		},
		_renderTable: function(files){
			var TM = this._TM, T = this._T, TId = this._TId;
			
			var lst = "";
			if (files){
				for(var n in files) {
					var di = files[n];
					lst += TM.replace('swfrow', {
						fn: di.name, fs: di.size, id: di.id
					});
				}
			}
			this._files = (lst != "" ? files : null); 
			
			TM.getEl('swfupload.table').innerHTML = TM.replace('swftable', {'rows': lst});
		},
		destroy: function(){
			this._uploader.destroy();	
		}
	};
	NS.SWFUploadWidget = SWFUploadWidget;
})();
	
(function(){
	var TM = TMG.build('panel'),
		T = TM.data,
		TId = TM.idManager;
	
	var UploadFilesPanel = function(albumid, callback){
		this.albumid = albumid;
		this.callback = callback;
		
		UploadFilesPanel.superclass.constructor.call(this, {
			width: "600px", height: "300px",
			modal: true
		});
	};
	
	YAHOO.extend(UploadFilesPanel, Brick.widget.Panel, {
		pages: null,
		initTemplate: function(){
			return T['panel'];
		},
		onLoad: function(){
			// var tabView = new YAHOO.widget.TabView(TId['panel']['id']);
			
			var pages = {};
			// pages['standart'] = new NS.ConfigWidget(Dom.get(TId['panel']['tabconfig']));
			pages['multi'] = new NS.SWFUploadWidget(TM.getEl('panel.swfupload'), this.albumid);
			this.pages = pages;

		},
		onClick: function(el){
			for (var n in this.pages){
				if (this.pages[n].onClick(el)){ return true; }
			}
			return false;
		},
		onClose: function(){
			var mupl = this.pages['multi'];
			mupl.destroy();
			if (!mupl.flagUploadFile){
				return;
			}
			if (L.isFunction(this.callback)){
				this.callback();
			}
		}
	});

	NS.UploadFilesPanel = UploadFilesPanel; 

})();

};
