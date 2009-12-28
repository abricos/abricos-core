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
        {name: 'mymedia', files: ['api.js']},
        {name: 'filemanager', files: ['api.js']}
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
	var css = TMG.build('css').data['css'];
	Brick.util.CSS.update(css);
})();	

(function(){
	var FileViewerPanel = function(albumid, fileid){
		this.albumid = albumid;
		this.fileid = fileid || 0;

		var TM = TMG.build('viewerpanel'),
			T = TM.data, TId = TM.idManager;
		
		this._TM = TM; this._T = T; this._TId = TId;
		
		FileViewerPanel.superclass.constructor.call(this, {
			width: '754px', height: '600px',
			resize: false,
			overflow: false
		});
	};
	
	YAHOO.extend(FileViewerPanel, Brick.widget.Panel, {
		initTemplate: function(){
			return this._T['viewerpanel'];
		},
		onLoad: function(){
			
			this.viewer = new NS.FileViewerWidget(
				this._TM.getEl('viewerpanel.viewer'),
				this.albumid, this.fileid
			);
		},
		onClose: function(){
			this.viewer.destroy();
		},
		onShow: function(){
			this.viewer.onShow();
		}
	});
	
	NS.FileViewerPanel = FileViewerPanel;
	
})();

(function(){
	
	var SCROLL_STEP_X = 50;
	
	var FileViewerWidget = function(container, albumid, fileid){
		this.albumid = albumid;
		this.initFileId = fileid;
		
		this.init(container);
	};
	
	FileViewerWidget.prototype = {
		fileid: -1,
		fileData: null,
		imgView: null,
		_loaded: null,
		_imgid: '',
		init: function(container){
			var TM = TMG.build('viewer,img,table,row,timg,src,tsrc'),
				T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			this._loaded = {};
			this._imgid = Dom.generateId();
			
			container.innerHTML = T['viewer'];
			
			this.tables = {
				'files': DATA.get('files', true),
				'album': DATA.get('album', true)
			};
			DATA.get('files').getRows({albumid: this.albumid});
			DATA.get('album').getRows({albumid: this.albumid});
			
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
			
			var evName = YAHOO.env.ua.gecko ? 'DOMMouseScroll' : 'mousewheel';
			
			E.on(TM.getEl('viewer.ppanel'), evName, function(e){
				var wheelDelta = 0;
				if (e.wheelDelta) {
			        // В IE и Opera при сдвиге колеса на один шаг event.wheelDelta принимает значение 120
			        // Значения сдвига в этих двух браузерах совпадают по знаку.
			        wheelDelta = e.wheelDelta/120;
			    } else if (e.detail) {
			        // В Mozilla, значение wheelDelta отличается по знаку от значения в IE.
			        // Сдвиг колеса на один шаг соответствует значению 3 параметра event.detail          
			        wheelDelta = -e.detail/3;
			    }
				if (wheelDelta > 0){
					__self.scrollPrev();
				}else if (wheelDelta < 0){
					__self.scrollNext();
				}
			});
			
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			this.renderTableAwait();
		},
		onShow: function(){
			if (DATA.isFill(this.tables)){ this.render(); }
		},
		onDSUpdate: function(type, args){
			if (args[0].checkWithParam('files', {albumid: this.albumid})){ 
				this.render(); 
			}
		},
		destroy: function(){
			DATA.onComplete.unsubscribe(this.onDSUpdate, this);
		},
		renderTableAwait: function(){
			var TM = this._TM;
			TM.getEl('viewer.table').innerHTML = TM.replace('table', {'rows': ''});
		},
		refresh: function(){
			DATA.get('files').getRows({albumid: this.albumid}).clear();
			API.dsRequest();
		},
		
		_renderCount: 0,
		render: function(){
			
			var firstRender = this._renderCount == 0;
			
			this.showImage(this.initFileId);
			
			this.renderAlbumInfo();
			
			var TM = this._TM,
				lst = "", __self = this;
			
			var rows = DATA.get('files').getRows({albumid: this.albumid});
			
			if (firstRender){
				this._renderCount = Math.min(12, rows.count());
			}
			var i = 0;
			rows.foreach(function(row){
				if (i >= __self._renderCount){ return; }
				i++;
				lst += __self.renderItem(row.cell);
			});

			TM.getEl('viewer.table').innerHTML = TM.replace('table', {
				'x': this._savedXPos, 'rows': lst
			});
		},
		
		renderItem: function(di){
			return this._TM.replace('row', {
				'timg': this._TM.replace('timg', {
					'id': di['id'], 'nm': di['nm'], 'fh': di['fh']
				}) 
			});
		},
		
		renderNext: function(){
			var rows = DATA.get('files').getRows({albumid: this.albumid});
			var count = rows.count();
			if (count <= this._renderCount){ 
				return false; 
			}
			
			var div = document.createElement('div');
			var TM = this._TM, lst = "";

			var elTR = TM.getEl('table.id').getElementsByTagName('tr')[0];

			var arr = rows.getValues(this._renderCount, 4);

			for (var i=0;i<arr.length;i++){
				this._renderCount++;
				lst += this.renderItem(arr[i]);
			}
			div.innerHTML = TM.replace('table', {'rows': lst});
			var tds = div.getElementsByTagName("td");
			var tels = [];
			for (var i=0;i<tds.length;i++){
				tels[tels.length] = tds[i]; 
			}			

			for (var i=0;i<tels.length;i++){
				var td = tels[i];
				td.parentNode.removeChild(td);
				elTR.appendChild(td);
			}
			
			return true;
		},

		_savedXPos: 0,
		
		scrollNext: function(){
			var el = this._TM.getEl('table.id');
			var r = Dom.getRegion(el);
			var x = r.left;
			var pR = Dom.getRegion(el.parentNode);
			
			var out = function(delta){
				delta = delta || 0;
				
				r = Dom.getRegion(el);
				pR = Dom.getRegion(el.parentNode);
				
				var absX = pR.left - r.left;
				var x1 = r.width - absX - pR.width;
				
				return (x1 - delta < 0);
			};
			
			if (out(30)){ this.renderNext(); }
			if (out()){ return; }
			
			x = x - SCROLL_STEP_X;
			Dom.setX(el, x);
			
			this._savedXPos = x - pR.left; 
		},
		scrollPrev: function(){
			var el = this._TM.getEl('table.id');
			var x = Dom.getX(el);
			
			var pX = Dom.getX(el.parentNode);

			x += SCROLL_STEP_X;

			var absX = pX - x;
			if (absX < 0){ x = pX; }

			Dom.setX(el, x);
			
			this._savedXPos = x - pX; 
		},
		onClick: function(el){
			var TId = this._TId;

			var tp = TId['viewer']; 
			switch(el.id){
			case tp['bprev']: this.scrollPrev(); return true;
			case tp['bnext']: this.scrollNext(); return true;
			case tp['bupload']: 
				var __self = this;
				API.showUploadPanel(this.albumid, function(){
					__self.refresh();
				});
 				return true;
			case (tp['bfremove']):
				this.fileRemove();
				return true;
			case (tp['bfedit']):
				this.fileEdit();
				return true;
			}
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			var tp = TId['timg']; 
			switch(prefix){
			case (tp['bimg']+'-'):
			case (tp['img']+'-'):
				this.showImage(numid);
				return true;
			}
			
			return false;
		},
		
		fileEdit: function(){
			var row = this.fileRow;
			if (!row){ return false; }
			Brick.mod.filemanager.API.showImageEditorPanel(row.cell);
		},
		
		fileRemove: function(){
			var row = this.fileRow;
			if (!row){ return false; }
			new NS.FileRemovePanel(row.cell['nm'], function(){
				row.remove();
				DATA.get('files').applyChanges();
				API.dsRequest();
			});
		},
		
		renderAlbumInfo: function(){
			var row = DATA.get('album').getRows({albumid: this.albumid}).getByIndex(0);

			var di = row.cell;
			
			var TM = this._TM;
			TM.getEl('viewer.man').style.display = '';
			TM.getEl('viewer.albname').innerHTML = di['nm'];
			TM.getEl('viewer.unm').innerHTML = di['unm'];
			TM.getEl('viewer.ftotal').innerHTML = DATA.get('files').getRows({albumid: this.albumid}).count();
			
			if (Brick.env.user.id != di['uid']){ return; }
			TM.getEl('viewer.albman').style.display = '';
			TM.getEl('viewer.fileman').style.display = '';
		},
		
		renderFileInfo: function(di){
			var TM = this._TM;
			TM.getEl('viewer.fn').innerHTML = di['nm'];
			TM.getEl('viewer.imgsize').innerHTML = di['iw']+' x '+di['ih'];
		},
		showImage: function(fileid){
			var rows = DATA.get('files').getRows({albumid: this.albumid});
			var row = fileid == 0 ? rows.getByIndex(0) : rows.getById(fileid);
			if (L.isNull(row)){ return null; }
			fileid = row.id;
			var di = row.cell;
			
			this.renderFileInfo(di);

			var imgid = this._imgid + di['id'],
				curImgView = this.imgView, 
				__self = this;
			
			var TM = this._TM,
				elWrap = TM.getEl('viewer.wrap'),
				elTImg = TM.getEl('viewer.timg');
			
			var src = TM.replace('src', { 'id': di['id'], 'nm': di['nm'], 'fh': di['fh'] }),
				tsrc = TM.replace('tsrc', {'id': di['id'], 'nm': di['nm'], 'fh': di['fh']});
			
			var hideAll = function(){
				var els = elWrap.childNodes;
				for (var i=0;i<els.length;i++){
					var el = els[i]; 
					if (el.src){ el.style.display = 'none'; }
				}
			};
			var setPreload = function(){
				hideAll();
				elTImg.style.display = '';
				elTImg.src = tsrc;
				__self.setImageSize(elTImg, di);
			};

			var imgView = Dom.get(imgid);
			if (L.isNull(imgView)){
				imgView = document.createElement('img');
				this.imgView = imgView; 
				imgView.style.display = 'none';
				imgView.id = imgid;
				imgView.loaded = false;
				imgView.fileid = fileid;
				elWrap.appendChild(imgView);
				setPreload();
				imgView.onload = function(){
					this.loaded = true;
					if (__self.fileid != this.fileid){ return; }
					__self.showImage(this.fileid);
				};
				imgView.src = src;
			}else{
				if (imgView.loaded){
					this.setImageSize(imgView, di);
					hideAll();
					imgView.style.display = '';
				}else{
					setPreload();
				}
			}
			
			this.fileid = fileid;
			this.fileRow = row;
		},
		setImageSize: function(elImg, data){
			if (L.isNull(elImg)){ return; }
			
			var rg = Dom.getRegion(this._TM.getEl('viewer.wrap'));
			var rW = rg.width-8, rH = rg.height-8;
			var W = data['iw']*1, H = data['ih']*1;
			
			var nW = W, nH = H;
			if (rW < W || rH < H){
				if (W > H){
					var k = W/H;
					nW = rW; nH = nW / k;
					if (nH > rH){ nH = rH; nW = nH*k; }
				}else{
					var k = H/W;
					nH = rH; nW = nH / k;
					if (nW > rW){ nW = rW; nH = nW*k; }
				}
			}
			elImg.style.width = nW+'px';
			elImg.style.height = nH+'px';
		}
	};
	
	NS.FileViewerWidget = FileViewerWidget;
	
})();

(function(){
	
	var TM = TMG.build('fileremovepanel'),
		T = TM.data, TId = TM.idManager;
	
	var FileRemovePanel = function(filename, callback){
		this.filename = filename;
		this.callback = callback;
		
		FileRemovePanel.superclass.constructor.call(this, {
			width: '400px', modal: true
		});
	};
	YAHOO.extend(FileRemovePanel, Brick.widget.Panel, {
		initTemplate: function(){
			return TM.replace('fileremovepanel', {
				'nm': this.filename
			});
		},
		onClick: function(el){
			if (el.id == TM.getElId('fileremovepanel.bremove')){
				this.closePanel();
				this.callback();
				return true;
			}else if (el.id == TM.getElId('fileremovepanel.bcancel')){
				this.closePanel();
			}
			return false;
		}
	});
	
	NS.FileRemovePanel = FileRemovePanel;
})();


};