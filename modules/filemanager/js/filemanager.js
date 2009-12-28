/*
* @version $Id$
* @copyright Copyright (C) 2008 Abricos All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/


/**
 * @module FileManager
 * @namespace Brick.mod.filemanager
 */

var Component = new Brick.Component();
Component.requires = {
	yahoo: ['animation','container','dragdrop','treeview','imagecropper'],
	mod:[
	     {name: 'sys', files: ['form.js','data.js']},
	     {name: 'filemanager', files: ['api.js','lib.js']}
	],
	ext: [{
		name: "treeview-folder-css",
		fullpath: "/js/yui/"+Brick.env.lib.yui+"/treeview/assets/css/folders/tree.css",
		type: "css"
	}]
};
Component.entryPoint = function(){
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		W = YAHOO.widget;

	var tSetVar = Brick.util.Template.setProperty;
	var tSetVarA = Brick.util.Template.setPropertyArray;
	
	var NS = this.namespace,
		TMG = this.template,
		API = NS.API;
	
	var TM = TMG.build(),
		T = TM.data,
		TId = TM.idManager;

	if (!Brick.objectExists('Brick.mod.filemanager.data')){
		Brick.mod.filemanager.data = new Brick.util.data.byid.DataSet('filemanager');
	}
	var DATA = Brick.mod.filemanager.data;
	
	Brick.util.CSS.update(Brick.util.CSS['filemanager']['filemanager']);
	
(function(){
	
	var File = NS.File;
	var Folder = NS.Folder;

	var ROOT_FOLDER = new Folder({"id":"0","pid":"-1","fn":"root","ph":"My files"}); 

	var FolderNode = function(oData, oParent, expanded) { 
		FolderNode.superclass.constructor.call(this,oData, oParent, expanded); 
	};
	YAHOO.extend(FolderNode, YAHOO.widget.TextNode, {	});
	
	var FolderPanel = function(onSelectItem){ 
		this.init(onSelectItem); 
	};
	FolderPanel.prototype = {
		init: function(onSelectItem){
			this.onSelectItem = onSelectItem;
			this.index = {};

			var __self = this;
			this.tv = new W.TreeView(TId['panel']['folders']);
			this.tv.subscribe("clickEvent", function(event) {
				__self.setFolderId(event.node.data.folder.id);
				return true;
			}); 

			this.selectedFolderId = "0";
			var tables = { 'folders': DATA.get('folders', true) };
			this.rows = tables['folders'].getRows();
			DATA.onComplete.subscribe(this.onDSComplete, this, true);
			if (DATA.isFill(tables)){
				this.renderElements();
			}
		},
		onDSComplete: function(type, args){if (args[0].check(['folders'])){ this.renderElements(); } },
		destroy: function(){ DATA.onComplete.unsubscribe(this.onDSComplete); },
		onClick: function(el){ return false; },
		renderElements: function(){
			this.tv.removeChildren(this.tv.getRoot());
			var rootNode = this.tv.getRoot();
			this.index['0'] = rootNode.index;
			this.renderNode(rootNode, ROOT_FOLDER);
			this.tv.render();
		},
		renderNode: function(parentNode, folder){
			var i, nodeval = { 'label': folder.phrase, 'folder': folder};
			if (folder.id == 0){ nodeval.expanded = true;
			}else{ nodeval.editable = true;
			}
			var node = new FolderNode(nodeval, parentNode);
			this.index[folder.id] = node.index;
			
			var __self = this;
			this.rows.foreach(function(row){
				var di = row.cell;
				if (di['pid'] == folder['id']){
					__self.renderNode(node, new Folder(di));
				}
			});
		},
		createFolder: function(){
			var selectedFolderId = this.selectedFolderId;
			new CreateFolderPanel(function(name){
				var table = DATA.get('folders');
				var rows = table.getRows();
				var row = table.newRow();
				row.update({ 'pid': selectedFolderId, 'ph': name });
				rows.add(row);
				table.applyChanges();
				DATA.request();
			});
		},
		setFolderId: function(folderid){
			if (this.selectedFolderId == folderid){ return; }
			this.selectedFolderId = folderid;
			var data;
			if (folderid == '0'){
				data = {'id': '0', 'pid': '-1'};
			}else{
				data = DATA.get('folders').getRows().getById(folderid).cell;
			}
			var index = this.index[data['id']];
			var node = this.tv.getNodeByIndex(index);
			if (!L.isNull(node)){
				node.expand();
				node.focus();
			}
			this.onSelectItem(new Folder(data));
		},
		fullPath: function(folderid){
			var row = this.rows.getById(folderid);
			if (L.isNull(row)){ return '//'+ROOT_FOLDER.phrase; }
			return this.fullPath(row.cell['pid'])+"/"+row.cell['ph'];
		}
	};

	var CreateFolderPanel = function(callback){
		this.callback = callback;
		CreateFolderPanel.superclass.constructor.call(this, {
			modal: true,
			fixedcenter: true
		});
	};
	YAHOO.extend(CreateFolderPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['createfolderpanel'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		initTemplate: function(){
			return T['createfolderpanel'];
		},
		onClick: function(el){
			var tp = TId['createfolderpanel'];
			switch(el.id){
			case tp['bcreate']: 
				this.callback(this.elv('name')); 
				this.close();
				return true;
			case tp['bcancel']: 
				this.close(); 
				return true;
			}
			return false;
		}
	});

	var FolderEditPanel = function(row, callback){
		this.row = row;
		this.callback = callback;
		FolderEditPanel.superclass.constructor.call(this, {
			modal: true,
			fixedcenter: true
		});
	};
	YAHOO.extend(FolderEditPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['editfolderpanel'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			return T['editfolderpanel'];
		},
		onLoad: function(){
			this.setelv('name', this.row.cell['ph']);
		},
		onClick: function(el){
			var tp = TId['editfolderpanel'];
			switch(el.id){
			case tp['bsave']: 
				this.callback(this.elv('name')); 
				this.close(); 
				return true;
			case tp['bcancel']: this.close(); return true;
			}
			return false;
		}
	});

	var FolderRemoveMsg = function(row, callback){
		this.row = row;
		this.callback = callback;
		FolderRemoveMsg.superclass.constructor.call(this, {
			modal: true,
			fixedcenter: true
		});
	};
	YAHOO.extend(FolderRemoveMsg, Brick.widget.Panel, {
		initTemplate: function(){
			var t = T['folderremovemsg'];
			return tSetVar(t, 'info', this.row.cell['ph']); 
		},
		onClick: function(el){
			var tp = TId['folderremovemsg'];
			switch(el.id){
			case tp['bremove']: this.close(); this.callback(); return true;
			case tp['bcancel']: this.close(); return true;
			}
			return false;
		}
	});
	
	var BrowserPanel = function(callback){
		this.callback = callback;
		BrowserPanel.superclass.constructor.call(this, {
			modal: true,
			fixedcenter: true
		});
	};
	YAHOO.extend(BrowserPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['panel'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setel: function(el, value){ Brick.util.Form.setValue(el, value); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			return T['panel'];
		},
		onLoad: function(){
			var __self = this;
			this.uploadWindow = null;
			this.screenshot = new Screenshot(this, this.el('screenshot'));
			this.folders = new FolderPanel(function(item){ __self.onSelectItem_foldersPanel(item);});
			this.files = new FilesPanel(this.el('files'), '0', function(item){ __self.onSelectItem_filesPanel(item);});
		},
		onSelectItem_foldersPanel: function(item){
			this.files.setFolderId(item.id);
			this.refreshPath();
		},
		refreshPath: function(){
			this.setelv('path', this.folders.fullPath(this.folders.selectedFolderId));
		},
		onSelectItem_filesPanel: function(item){
			var fname = '', fsrc = '';
			if (!L.isNull(item)){
				if (item.type == 'file'){
					fname = item.name;
					var lnk = new NS.Linker(item);
					fsrc = lnk.getHTML();
				}else{
					fname = item.phrase;
				}
			}
			this.setelv('filesrc', fsrc);
			this.el('bselect').disabled = L.isNull(item) ? "disabled" : "";
			this.screenshot.setImage(item);
			this.refreshPath();
		},
		onClick: function(el){
			var tp = TId['panel']; 
			switch(el.id){
			case tp['bnewfolder']: this.folders.createFolder(); return true;
			case tp['bupload']: this.showUpload(); return true;
			case tp['bcancel']: this.close(); return true;
			case tp['bselect']: this.selectItem(); return true;
			}
			if (this.screenshot.onClick(el)){return true;}
			if (this.files.onClick(el)){return true;}
			return false;
		},
		onClose: function(){
			this.files.destroy();
			this.folders.destroy();
		},
		showUpload: function(){
			if (!L.isNull(this.uploadWindow) && !this.uploadWindow.closed){
				this.uploadWindow.focus();
			}else{
				var folderid = this.folders.selectedFolderId;
				this.uploadWindow = window.open(
					'/filemanager/upload.html?folderid='+folderid, 'upload'+folderid,	
					'statusbar=no,menubar=no,toolbar=no,scrollbars=yes,resizable=yes'	+ 
					',width=480,height=480'); 
			}
		},
		setUploader: function(doc){ new Uploader(doc); },
		uploadOK: function(folderid){ this.files.refresh(); },
		selectItem: function(){
			if (L.isNull(this.files.selectedItem)){ return; }
			var item = this.files.selectedItem;
			if (item.type == 'folder'){
				this.files.setFolderId(item.id);
				this.folders.setFolderId(item.id);
			}else{
				if (this.callback){
					var linker = new NS.Linker(item);
					this.callback({
						'html': this.elv('filesrc'),
						'file': item,
						'src': linker.getSrc()
					});
					this.close();
				}
			}
		}
	});
	NS.BrowserPanel = BrowserPanel;

	var Screenshot = function(owner, container){ 
		this.init(owner, container); 
	};
	Screenshot.prototype = {
		selectItem: function(){
			if (!this.owner.callback){ return; }
			var item = this.file;
			var linker = new NS.Linker(item);
			
			var width = this.elv('width')*1;
			var height = this.elv('height')*1;
			if (width == 0 || height == 0){ return; }
			var title = this.elv('title');
			
			var smallLinker = new NS.Linker(item);
			smallLinker.setSize(width, height);
			
			var html = tSetVarA(this.elv('code'), {
				'isrc': linker.getSrc(),
				'sisrc': smallLinker.getSrc(),
				'siw': width, 'sih': height,
				'sialt': title, 'sitl': title
			});
			
			this.owner.callback({
				'html': html,
				'file': item,
				'src': linker.getSrc()
			});
			this.owner.close();
		},
		el: function(name){ return Dom.get(TId['screenshot'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setel: function(el, value){ Brick.util.Form.setValue(el, value); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		init: function(owner, container){
			
			this.owner = owner;
			container.innerHTML = T['screenshot'];
			this.setImage(null);
			this.setelv('code', T['screenshottemplate']);
		},
		setImage: function(file){
			if (L.isNull(file) || file.type != 'file' || L.isNull(file.image)){
				file = null;
			}
			this.file = file;
				
			var elBSelect = this.el('bselect');
			var elImgTitle = this.el('title');
			var elImgWidth = this.el('width');
			var elImgHeight = this.el('height');
			var elImgCode = this.el('code');
			
			this.disabled([elBSelect, elImgTitle, elImgWidth, elImgHeight, elImgCode], L.isNull(file));
			if (L.isNull(file)){
				// this.clearValue([elImgTitle]);
			}else{
				// this.setel(elImgWidth, file.image.width);
				// this.setel(elImgHeight, file.image.height);
			}
		},
		disabled: function(els, disabled){
			for (var i=0;i<els.length;i++){ els[i].disabled = disabled ? 'disabled' : ''; }
		},
		clearValue: function(els){
			for (var i=0;i<els.length;i++){ this.setel(els[i], ''); }
		},
		onClick: function(el){
			if (L.isNull(this.file)){return false;}
			var tp = TId['screenshot']; 
			switch(el.id){
			case tp['bselect']: this.selectItem(); return true;
			}
			return false;
		}
	};
	
	var FilesPanel = function(container, folderid, onSelect){
		folderid = folderid || '0';
		this.onSelect = onSelect;
		this.init(container, folderid);
	};
	FilesPanel.prototype = {
		init: function(container, folderid){
			this.folderid = -1;
			this.selectedItem = null;
			this.isinit = true;
			
			this.tables = { 
				'files': DATA.get('files', true),
				'folders': DATA.get('folders', true)
			};
			DATA.onComplete.subscribe(this.onDSComplete, this, true);
			this.setFolderId(folderid);
		},
		onDSComplete: function(type, args){if (args[0].check(['files', 'folders'])){ this.renderElements(); } },
		destroy: function(){ DATA.onComplete.unsubscribe(this.onDSComplete); },
		setFolderId: function(folderid){
			if (this.folderid == folderid){ return; }
			this.folderid = folderid;
			this.rows = DATA.get('files').getRows({'folderid': folderid});
			if (DATA.isFill(this.tables)){ this.renderElements(); }
			if (this.isinit){
				this.isinit = false;
			}else{
				DATA.request();
			}
		},
		refresh: function(){
			this.rows.clear();
			DATA.get('files').applyChanges();
			DATA.request();
		},
		onClick: function(el){
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch (prefix){
			case TId['filesrow']['edit']+'-': this.itemEdit(numid, false); break;
			case TId['filesrow']['remove']+'-': this.itemRemove(numid, false); break;
			case TId['filesrowfd']['edit']+'-': this.itemEdit(numid, true); break;
			case TId['filesrowfd']['remove']+'-': this.itemRemove(numid, true); break;
			}
			var fel = el;

			var _checkId = function(curel, id){
				var lprefix, lnumid;
				for (var i=0;i<3;i++){
					lprefix = curel.id.replace(/([0-9]+$)/, '');
					lnumid = curel.id.replace(lprefix, "");
					if (lprefix == id){ numid = lnumid; return true; }
					curel = curel.parentNode;
				}
				return false;
			};
			
			if (_checkId(el, TId['filesrowparent']['id']+'-')){ this.selectItem(numid, true, true); return true; }
			if (_checkId(el, TId['filesrowfd']['id']+'-')){ this.selectItem(numid, true); return true; }
			if (_checkId(el, TId['filesrow']['id']+'-')){ this.selectItem(numid, false); return true; }
			return false;
		},
		selectItem: function(itemid, isFolder, isParent){
			isParent = isParent || false;
			this.selectedItem = null;
			var item = null;
			
			var pparentFolderId = '0';
			var row;
			if (this.folderid*1 > 0){
				row = DATA.get('folders').getRows().getById(this.folderid);
				pparentFolderId = row.cell['pid'];
			}
			if (isParent){ item = new Folder({'id':pparentFolderId, 'pid':(row ? row.cell['pid'] : '-1')}); }
			var parentfolderid = isFolder && isParent ? itemid : 'none';
			var el = Dom.get(TId['filesrowparent']['id']+'-'+pparentFolderId);
			if (el){ el.className = parentfolderid == itemid ? 'selected' : ''; }

			var fileid = isFolder ? 'none' : itemid;
			this.rows.foreach(function(row){
				var id = row.cell['id'];
				var el = Dom.get(TId['filesrow']['id']+'-'+id);
				if (id == fileid){item = new File(row.cell);}
				el.className = id == fileid ? 'selected' : '';
			});
			
			var folderid = isFolder ? itemid : 'none';
			var parentFolder = this.folderid;
			DATA.get('folders').getRows().foreach(function(row){
				if (row.cell['pid'] != parentFolder){ return; }
				var id = row.cell['id'];
				var el = Dom.get(TId['filesrowfd']['id']+'-'+id);
				if (id == folderid){item = new Folder(row.cell);}
				el.className = id == folderid ? 'selected' : '';
			});
			this.selectedItem = item;
			if (this.onSelect){this.onSelect(item);};
		},
		itemEdit: function(itemid, isFolder){
			if (!isFolder){
				var row = this.rows.getById(itemid);
				API.showImageEditorPanel(row.cell);
			}else{
				var row = DATA.get('folders').getRows().getById(itemid);
				var rows = this.rows;
				new FolderEditPanel(row, function(name){
					var table = DATA.get('folders');
					row.update({ 'ph': name });
					table.applyChanges();
					DATA.request();
				});
			}
		},
		itemRemove: function(itemid, isFolder){
			if (!isFolder){
				var row = this.rows.getById(itemid);
				new FileRemoveMsg(row, function(){
					row.remove();
					DATA.get('files').applyChanges();
					DATA.request();
				});
			}else{
				var row = DATA.get('folders').getRows().getById(itemid);
				new FolderRemoveMsg(row, function(){
					var table = DATA.get('folders');
					row.remove();
					table.applyChanges();
					DATA.request();
				});
			}
		},
		renderElements: function(){
			var lstFolders = "";
			var rowsFD = DATA.get('folders').getRows();
			var folderid = this.folderid;
			if (folderid > 0){
				var row = rowsFD.getById(folderid);
				lstFolders += tSetVarA(T['filesrowparent'], {
					'id': row.cell['pid']
				});
			}
			rowsFD.foreach(function(row){
				var di = row.cell;
				if (folderid != di['pid']){ return; }
				lstFolders += tSetVarA(T['filesrowfd'], {
					'id': di['id'], 'fn': di['ph']  
				});
			});
			
			var lstFiles = "";
			this.rows.foreach(function(row){
				var di = row.cell;
				var file = new File(di);
				var img = T['imagefile'];;
				if (!L.isNull(file.image)){
					var linker = new NS.Linker(file);
					linker.setSize(16,16);
					img = linker.getHTML();
				}
				lstFiles += TM.replace('filesrow', {
					'id': di['id'], 'img': img, 'fn': di['fn'],
					'fs': Brick.byteToString(di['fs']), 'dl': Brick.dateExt.convert(di['d'], 1)
				}); 
			});
			
			var el = Dom.get(TId['panel']['files']);
			el.innerHTML = tSetVarA(T['files'], { 'files': lstFiles, 'folders': lstFolders });
			this.selectItem(null);
		}
	};

	var FileRemoveMsg = function(row, callback){
		this.row = row;
		this.callback = callback;
		FileRemoveMsg.superclass.constructor.call(this, {
			modal: true, fixedcenter: true
		});
	};
	YAHOO.extend(FileRemoveMsg, Brick.widget.Panel, {
		initTemplate: function(){
			var t = T['fileremovemsg'];
			return tSetVar(t, 'info', this.row.cell['fn']); 
		},
		onClick: function(el){
			var tp = TId['fileremovemsg'];
			switch(el.id){
			case tp['bremove']: this.close(); this.callback(); return true;
			case tp['bcancel']: this.close(); return true;
			}
			return false;
		}
	});

	var Uploader = function(doc){this.init(doc);};
	Uploader.prototype = {
		doc: null,
		init: function(container){
			var doc = this.doc = container.document;

			var form = doc.getElementById('bk-fm-upload-form');
			var btn = doc.getElementById('bk-fm-upload-btn');
			var file = doc.getElementById('bk-fm-upload-file');
			
			E.on(form, 'submit', function(ev){
				if (!file.value){
					alert('Необходимо выбрать файл');
					E.stopEvent(ev);
					container.focus();
					return false;
				}
				return true;
			});
		}
	};

})();
};

