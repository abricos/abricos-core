/*
@version $Id: manager.js 156 2009-11-09 08:17:11Z roosit $
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module MyMedia
 * @namespace Brick.mod.mymedia
 */

var Component = new Brick.Component();
Component.requires = {
    mod:[
	    {name: 'sys', files: ['data.js', 'container.js', 'form.js']},
        {name: 'mymedia', files: ['api.js']}
    ]
};
Component.entryPoint = function(){
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var NS = this.namespace,
		TMG = this.template;

	var API = NS.API;
	
	if (!Brick.objectExists('Brick.mod.mymedia.data')){
		Brick.mod.mymedia.data = new Brick.util.data.byid.DataSet('mymedia');
	}
	var DATA = Brick.mod.mymedia.data;

(function(){
	
	var TM = TMG.build('albumeditor'),
		T = TM.data,
		TId = TM.idManager;
	
	var AlbumEditorPanel = function(albumid, callback){

		this.albumid = albumid || 0;
		this.callback = callback;
		
		AlbumEditorPanel.superclass.constructor.call(this, { modal: true });
	};
	YAHOO.extend(AlbumEditorPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['albumeditor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			return T['albumeditor'];
		},
		onLoad: function(){
			if (this.albumid == 0){ return; }
				
			this.tables = {
				'albumeditor': DATA.get('albumeditor', true)
			};
			DATA.get('albumeditor').getRows({albumid: this.albumid});
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){
				this.renderElements();
			}else{
				this.actionDisable(TId['albumeditor']['bcancel']);
				API.dsRequest();
			}
		},
		onDSUpdate: function(type, args){
			if (args[0].checkWithParam('albumeditor', {albumid: this.albumid})){ 
				this.renderElements(); 
			}
		},
		onClose: function(){
			DATA.onComplete.unsubscribe(this.onDSUpdate, this);
		},
		onClick: function(el){
			var tp = TId['albumeditor'];
			switch(el.id){
			case tp['bsave']:
				this.save();
				return true;
			case tp['bcancel']:
				this.closePanel();
				return true;
			}
			return false;
		},
		renderElements: function(){
			this.actionEnable();
			var rows = DATA.get('albumeditor').getRows({albumid: this.albumid});
			var row = rows.getByIndex(0);
			var di = row.cell;
			this.setelv('name', di['nm']);
			this.setelv('desc', di['dsc']);
		},
		save: function(){
			if (this.elv('name').length == 0){
				return;
			}
			var table = DATA.get('albumeditor', true);
			var rows = table.getRows({albumid: this.albumid});
			var row = this.albumid > 0 ? rows.getByIndex(0) : table.newRow();
			if (this.albumid == 0){
				rows.add(row);
			}
			row.update({
				'nm': this.elv('name'),
				'dsc': this.elv('desc')
			});
			table.applyChanges();
			
			this.tables = { 'albumeditor': table };
			if (DATA.isFill(this.tables)){
				this.closePanel();
				return;
			}
			
			if (L.isFunction(this.callback)){
				this.callback();
			}
			API.dsRequest();
			this.closePanel();
		}
	});

	NS.AlbumEditorPanel = AlbumEditorPanel; 
	
})();	
	
(function(){
	
	var MyAlbumListPanel = function(){
		//this._TM = TMG.build('myalbumpanel,menubar');
		this._TM = TMG.build('myalbumpanel');
		this._T = this._TM.data;
		this._TId = this._TM.idManager;
		
		MyAlbumListPanel.superclass.constructor.call(this, {
			width: "640px", height: "480px"
			// ,menubar: this._TId['menubar']['id']
		});
	};
	
	YAHOO.extend(MyAlbumListPanel, Brick.widget.Panel, {
		initTemplate: function(){
		
			// return this._TM.replace('myalbumpanel', { 'menubar': this._T['menubar'] });
			return this._T['myalbumpanel'];
		},
		el: function(name){ return Dom.get(TId['myalbumpanel'][name]); },
		onLoad: function(){
			this.albumListWidget = new NS.AlbumListWidget(this._TM.getEl('myalbumpanel.container'));
		},
		onClick: function(el){
			var TId = this._TId;
			
			switch(el.id){
			case TId['myalbumpanel']['bcreate']:
				var __self = this;
				new NS.AlbumEditorPanel(0, function(){ __self.albumListWidget.refresh(); });
				return true;
			}
			return false;
		}
	});

	NS.MyAlbumListPanel = MyAlbumListPanel; 
})();

(function(){
	var AlbumListWidget = function(container, userid){
		
		this.userid = userid || Brick.env.user.id;
		this.init(container);
	};
	AlbumListWidget.prototype = {
		init: function(container){
			
			var TM = TMG.build('albumlistwidget,albumlisttable,albumlistrow,albumlistrowwait'),
				T = TM.data, TId = TM.idManager;
			
			this._TM = TM; this._T = T; this._TId = TId;
			container.innerHTML = T['albumlistwidget'];
			
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
			
			this.tables = {
				'albumlist': DATA.get('albumlist', true)
			};
			DATA.get('albumlist').getRows({userid: this.userid});
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}else{
				this.renderTableAwait();
			}
		},
		onDSUpdate: function(type, args){
			if (args[0].checkWithParam('albumlist', {userid: this.userid})){ 
				this.render(); 
			}
		},
		destroy: function(){DATA.onComplete.unsubscribe(this.onDSUpdate, this);},
		refresh: function(){
			DATA.get('albumlist').getRows({userid: this.userid}).clear();
			this.renderTableAwait();
		},
		renderTableAwait: function(){
			this._TM.getEl('albumlistwidget.table').innerHTML = this._TM.replace('albumlisttable', {
				'rows': this._T['albumlistrowwait']
			});
		},
		render: function(){
			var TM = this._TM;
			var lst = "";
			DATA.get('albumlist').getRows({userid: this.userid}).foreach(function(row){
				var di = row.cell;
				lst += TM.replace('albumlistrow', {
					'id': di['id'],
					'nm': di['nm'],
	    			'dl': Brick.dateExt.convert(di['dl'])
				});
			});
			TM.getEl('albumlistwidget.table').innerHTML = TM.replace('albumlisttable', {
				'rows': lst
			});
		},
		onClick: function(el){
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			var tp = this._TId['albumlistrow']; 
			switch(prefix){
			case (tp['edit']+'-'):
				var __self = this;
				new NS.AlbumEditorPanel(numid, function(){
					__self.refresh();
				});
				return true;
			case (tp['open']+'-'):
				API.showViewerPanel(numid, 0);
				return true;
			}
			return false;
		}
	};
	
	NS.AlbumListWidget = AlbumListWidget;
})();

(function(){
	
	var AlbumPanel = function(albumid){
		this.albumid = albumid || 0;
		if (albumid < 1){ return; }
		
		var TM = TMG.build('albumpanel'),
			T = TM.data, TId = TM.idManager;
		
		this._TM = TM; this._T = T; this._TId = TId;
		
		AlbumPanel.superclass.constructor.call(this, {
			width: '640px',
			height: '480px'
		});
	};
	YAHOO.extend(AlbumPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(this._TId['albumpanel'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			return this._T['albumpanel'];
		},
		onLoad: function(){
			this.filesWidget = new NS.FilesWidget(
				this._TM.getEl('albumpanel.container'),
				this.albumid
			);
		},
		onClick: function(el){
			var TM = this._TM;
			if (el.id == TM.getElId('albumpanel.bupload')){
				var __self = this;
				API.showUploadPanel(this.albumid, function(){
					__self.filesWidget.refresh();
					API.dsRequest();
				});
				return true;
			}
			return false;
		}
	});
	
	NS.AlbumPanel = AlbumPanel;
})();

(function(){
	
	var FilesWidget = function(container, albumid){
		this.albumid = albumid;
		this.init(container);
	};
	
	FilesWidget.prototype = {
		init: function(container){
			var TM = TMG.build('fileswidget,filestable,filesrowwait,filesrow'),
				T = TM.data, TId = TM.idManager;
			
			this._TM = TM; this._T = T; this._TId = TId;
			container.innerHTML = T['fileswidget'];
			
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
			
			this.tables = {
				'files': DATA.get('files', true)
			};
			DATA.get('files').getRows({albumid: this.albumid});
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}else{
				this.renderTableAwait();
			}
		},
		onDSUpdate: function(type, args){
			if (args[0].checkWithParam('files', {albumid: this.albumid})){ 
				this.render(); 
			}
		},
		destroy: function(){DATA.onComplete.unsubscribe(this.onDSUpdate, this);},
		refresh: function(){
			DATA.get('files').getRows({albumid: this.albumid}).clear();
			this.renderTableAwait();
		},
		renderTableAwait: function(){
			this._TM.getEl('fileswidget.table').innerHTML = this._TM.replace('filestable', {
				'rows': this._T['filesrowwait']
			});
		},
		render: function(){
			var TM = this._TM;
			var lst = "";
			DATA.get('files').getRows({albumid: this.albumid}).foreach(function(row){
				var di = row.cell;
				lst += TM.replace('filesrow', {
					'id': di['id'], 'nm': di['nm'], 'fh': di['fh'],
					'dl': Brick.dateExt.convert(di['dl']),
					'sz': di['sz'],
					'wh': di['iw']+'x'+di['ih']
				});
			});
			TM.getEl('fileswidget.table').innerHTML = TM.replace('filestable', {'rows': lst});
		},
		onClick: function(el){
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			var row = DATA.get('files').getRows({albumid: this.albumid}).getById(numid);
			
			var tp = this._TId['filesrow']; 
			switch(prefix){
			case (tp['remove']+'-'):
				new NS.FileRemovePanel(row.cell['nm'], function(){
					row.remove();
					DATA.get('files').applyChanges();
					API.dsRequest();
				});
				return true;
			case (tp['open']+'-'):
			case (tp['img']+'-'):
				API.showViewerPanel(this.albumid, numid);
				return true;
			}

			
			return false;
		}
	};
	
	NS.FilesWidget = FilesWidget;
	
})();

};