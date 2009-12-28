/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){

	Brick.namespace('mod.filemanager');

	var Dom, E,	L, W,	T, TId;
	
	var uniqurl = Brick.uniqurl;
	var dateExt = Brick.dateExt;
	var wWait = Brick.widget.WindowWait;
	var byteToString = Brick.byteToString;
	var elClear = Brick.elClear;
	
	var tSetVar = Brick.util.Template.setProperty;
	var tSetVarA = Brick.util.Template.setPropertyArray;

	Brick.Loader.add({
		yahoo: ['animation','container','dragdrop','treeview','imagecropper'],
		mod:[{name: 'sys', files: ['form.js','data.js']}],
		ext: [
	    {
	    	name: "treeview-folder-css",
	    	fullpath: "/js/yui/"+Brick.env.lib.yui+"/treeview/assets/css/folders/tree.css",
	    	type: "css"
	    }
		],
    onSuccess: function() {
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;
			W = YAHOO.widget;

			T = Brick.util.Template['filemanager']['filemanager'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			
			Brick.util.CSS.update(Brick.util.CSS['filemanager']['filemanager']);

			if (!Brick.objectExists('Brick.mod.filemanager.data')){
				Brick.mod.filemanager.data = new Brick.util.data.byid.DataSet('filemanager');
			}
			DATA = Brick.mod.filemanager.data;
			
			moduleInitialize();
			delete moduleInitialize;
	  }
	});
	
var moduleInitialize = function(){
(function(){

	var File = function(d){this.init(d);};
	File.prototype = {
		init: function(d){
			this.type = 'file';
			this.id = d['fh'];
			this.privateid = d['id'];
			this.name = d['fn'];
			this.size = d['fs'];
			this.date = d['d'];
			this.folderid = d['fdid'];
			this.extension = d['ext'];
			this.attribute = d['a'];
			this.image = null;
			if (d['w']>0 && d['h']>0){ this.image = { width: d['w'], height: d['h'] }; }
		}
	}

	var Folder = function(d){this.init(d);};
	Folder.prototype = {
		init: function(d){
			this.id = d['id'];
			this.pid = d['pid'];
			this.name = d['fn'];
			this.phrase = d['ph'];
			this.type = 'folder';
		}
	}

	var ROOT_FOLDER = new Folder({"id":"0","pid":"-1","fn":"root","ph":"My files"}); 

	var FolderNode = function(oData, oParent, expanded) { 
		FolderNode.superclass.constructor.call(this,oData, oParent, expanded); 
	};
	YAHOO.extend(FolderNode, YAHOO.widget.TextNode, {	});
	
	var FolderPanel = function(onSelectItem){ this.init(onSelectItem); };
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
				this.render();
			}
		},
		onDSComplete: function(type, args){if (args[0].check(['folders'])){ this.render(); } },
		destroy: function(){ DATA.onComplete.unsubscribe(this.onDSComplete); },
		onClick: function(el){ return false; },
		render: function(){
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
					__self.renderNode(node, new Folder(di))
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
			if (L.isNull(row)){ return '//'+ROOT_FOLDER.phrase}
			return this.fullPath(row.cell['pid'])+"/"+row.cell['ph'];
		}
	};

	var CreateFolderPanel = function(callback){
		this.callback = callback;
		CreateFolderPanel.superclass.constructor.call(this, T['createfolderpanel']);
	};
	YAHOO.extend(CreateFolderPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['createfolderpanel'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		onClick: function(el){
			var tp = TId['createfolderpanel'];
			switch(el.id){
			case tp['bcreate']: this.close(); this.callback(this.elv('name')); return true;
			case tp['bcancel']: this.close(); return true;
			}
			return false;
		}
	});

	var FolderEditPanel = function(callback){
		this.callback = callback;
		FolderEditPanel.superclass.constructor.call(this, T['editfolderpanel']);
	};
	YAHOO.extend(FolderEditPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['editfolderpanel'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		onClick: function(el){
			var tp = TId['editfolderpanel'];
			switch(el.id){
			case tp['bsave']: this.close(); this.callback(this.elv('name')); return true;
			case tp['bcancel']: this.close(); return true;
			}
			return false;
		}
	});

	var FolderRemoveMsg = function(row, callback){
		this.row = row;
		this.callback = callback;
		FolderRemoveMsg.superclass.constructor.call(this, T['folderremovemsg']);
	};
	YAHOO.extend(FolderRemoveMsg, Brick.widget.Panel, {
		initTemplate: function(t){ return tSetVar(t, 'info', this.row.cell['ph']); },
		onClick: function(el){
			var tp = TId['folderremovemsg'];
			switch(el.id){
			case tp['bremove']: this.close(); this.callback(); return true;
			case tp['bcancel']: this.close(); return true;
			}
			return false;
		}
	});
	
	var Browser = function(callback){
		this.callback = callback;
		Browser.superclass.constructor.call(this, T['panel']);
	};
	YAHOO.extend(Browser, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['panel'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setel: function(el, value){ Brick.util.Form.setValue(el, value); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		onLoad: function(){
			var __self = this;
			this.uploadWindow = null;
			this.screenshot = new Screenshot(this, this.el('screenshot'));
			this.folders = new FolderPanel(function(item){ __self.onSelectItem_foldersPanel(item)});
			this.files = new FilesPanel(this.el('files'), '0', function(item){ __self.onSelectItem_filesPanel(item)});
			DATA.request();
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
					var lnk = new Linker(item);
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
				this.folders.setFolderId(item.id)
			}else{
				if (this.callback){
					var linker = new Linker(item);
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
	Brick.mod.filemanager.Browser = Browser;

	var Screenshot = function(owner, container){ this.init(owner, container); };
	Screenshot.prototype = {
		selectItem: function(){
			if (!this.owner.callback){ return; }
			var item = this.file;
			var linker = new Linker(item);
			
			var width = this.elv('width')*1;
			var height = this.elv('height')*1;
			if (width == 0 || height == 0){ return; }
			var title = this.elv('title');
			
			var smallLinker = new Linker(item);
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
	}
	
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
		onDSComplete: function(type, args){if (args[0].check(['files', 'folders'])){ this.render(); } },
		destroy: function(){ DATA.onComplete.unsubscribe(this.onDSComplete); },
		setFolderId: function(folderid){
			if (this.folderid == folderid){ return; }
			this.folderid = folderid;
			this.rows = DATA.get('files').getRows({'folderid': folderid});
			if (DATA.isFill(this.tables)){ this.render(); }
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
			if (isParent){ item = new Folder({'id':pparentFolderId, 'pid':(row ? row.cell['pid'] : '-1')}) }
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
			if (this.onSelect){this.onSelect(item)};
		},
		itemEdit: function(itemid, isFolder){
			if (!isFolder){
				var row = this.rows.getById(itemid);
				new ImageEditor(new File(row.cell));
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
		render: function(){
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
				var t = T['filesrow'];
				var img = T['imagefile'];;
				if (!L.isNull(file.image)){
					var linker = new Linker(file);
					linker.setSize(16,16);
					img = linker.getHTML();
				}
				lstFiles += tSetVarA(t, {
					'id': di['id'], 'img': img, 'fn': di['fn'],
					'fs': byteToString(di['fs']), 'dl': dateExt.convert(di['d'], 1)
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
		FileRemoveMsg.superclass.constructor.call(this, T['fileremovemsg']);
	}
	YAHOO.extend(FileRemoveMsg, Brick.widget.Panel, {
		initTemplate: function(t){ return tSetVar(t, 'info', this.row.cell['fn']); },
		onClick: function(el){
			var tp = TId['fileremovemsg'];
			switch(el.id){
			case tp['bremove']: this.close(); this.callback(); return true;
			case tp['bcancel']: this.close(); return true;
			}
			return false;
		}
	});

	var Uploader = function(doc){this.init(doc)};
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


	var ImageEditor = function(file, callback){
		this.sourcefile = file;
		this.callback = callback;
		ImageEditor.superclass.constructor.call(this, T['editor']);
	}
	YAHOO.extend(ImageEditor, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['editor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setel: function(el, value){ Brick.util.Form.setValue(el, value); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		onLoad: function(){
			this.imageid = "image_"+this.sourcefile.id;
			this.selectedTools = '';
			this.tables = null;
			this.session = Math.round(((new Date()).getTime())/1000);
			this.setFile(this.sourcefile);
		},
		setFile: function(file){
			this.file = file;
			var lnk = new Linker(file);
			lnk.setId(this.imageid);
			this.el('image').innerHTML = lnk.getHTML();
		},
		getRowsParam: function(){
			return {'filehash': this.sourcefile.id, 'session': this.session};
		}, 
		selectTools: function(tools){
			if (tools == ''){
				this.el('tgrpsel').style.display = '';
				this.el('tgrpact').style.display = 'none';
			}else{
				this.el('tgrpsel').style.display = 'none';
				this.el('tgrpact').style.display = '';
			}
			this.selectedTools = tools;
			switch(tools){
			case 'size': this.selectToolsSize(); break;
			case 'crop': this.selectToolsCrop(); break;
			}
		},
		selectToolsSize: function(){
			this.toolsSize = new YAHOO.util.Resize(this.imageid, {
        handles: 'all', knobHandles: true, proxy: true, ghost: true, status: true, draggable: true
			});
		}, 
		selectToolsCrop: function(){
			this.toolsCrop = new YAHOO.widget.ImageCropper(this.imageid, {
        initialXY: [0, 0], keyTick: 100, shiftKeyTick: 100
			});
		},
		applyToolsChanges: function(){
			var tools = this.selectedTools;
			if (L.isNull(this.tables)){
				this.tables = {'editor': DATA.get('editor', true) }
				DATA.onComplete.subscribe(this.onDSComplete, this, true);
			}
			var img = Dom.get(this.imageid);
			var table = this.tables['editor'];
			var rows = table.getRows(this.getRowsParam());
			var row = table.newRow();
			row.update({ 'fh': this.sourcefile.id, 'tools': tools });
			switch(tools){
			case 'size':
				row.update({
					'w': img.style.width.replace('px', ''),
					'h': img.style.height.replace('px', '')
				});
				break;
			case 'crop':
			 var coords = this.toolsCrop.getCropCoords();
				row.update({
					'w': coords.width, 'h': coords.height,
					't': coords.top, 'l': coords.left
				});
				break;
			}
			rows.add(row);
			table.applyChanges();
			DATA.request();
		},
		onDSComplete: function(type, args){
			if (args[0].checkWithParam('editor', this.getRowsParam())){ 
				this.el('bsave').disabled = '';
				var table = this.tables['editor'];
				var rows = table.getRows(this.getRowsParam());
				var row = rows.getByIndex(0);
				var d = row.cell;
				d['fh'] = d['fhdst']; d['tl'] = ''; d['fn'] = '';
				var file = new File(d);
				this.destroyTools();
				this.setFile(file);
			} 
		},
		save: function(){
			if (L.isNull(this.tables)){ 
				this.close();
				return; 
			}
			var f = this.sourcefile;
			var table = DATA.get('files');
			var rows = table.getRows({'folderid': this.sourcefile.folderid});
			var row = rows.find({'fh': f.id});
			row.update({
				'act': 'editor',
				'copy': this.elv('iscopy'),
				'session': this.session
			});
			table.applyChanges();
			DATA.request();
			this.close();
		},
		onClose: function(){
			if (!L.isNull(this.tables)){ DATA.onComplete.unsubscribe(this.onDSComplete); }
		},
		cancelToolsChanges: function(){
			var tools = this.selectedTools;
			this.destroyTools();
			switch(tools){
			case 'size':
				var img = Dom.get(this.imageid);
				img.style.width = this.file.image.width+"px";
				img.style.height = this.file.image.height+"px";
				break;
			}
		},
		destroyTools: function(){
			switch(this.selectedTools){
			case 'crop': this.toolsCrop.destroy(); break;
			case 'size': this.toolsSize.destroy(); break;
			}
			this.selectTools('');
		},
		onClick: function(el){
			var tp = TId['editor'];
			switch(el.id){
			case tp['btapply']: this.applyToolsChanges(); return true;
			case tp['btcancel']: this.cancelToolsChanges(); return true;
			case tp['btsize']: this.selectTools('size'); return true;
			case tp['btcrop']: this.selectTools('crop'); return true;
			case tp['bsave']: this.save(); return true;
			case tp['bcancel']: this.close(); return true;
			}
			return false;
		} 
	});
	
	var Linker = function(file){this.init(file)};
	Linker.prototype = {
		init: function(file){
			this.file = null;
			this.imgsize = null;
			this.objid = null;
			this.file = file;
			this.imgsize = { w: 0, h: 0 };
		},
		setSize: function(width, height){
			this.imgsize = { w: width, h: height };
		},
		setId: function(id){
			this.objid = id;
		},
		getObject: function(){
			var o;
			if (!L.isNull(this.file.image)){
				o = document.createElement('img');
				o.src = this.getSrc();
				o.alt = this.file.name;
			}else{
				o = document.createElement('a');
				o.href = this.getSrc();
				o.innerHTML = this.file.name;
			}
			o.title = this.file.name;
			if (!L.isNull(this.objid)){
				o.id = this.objid;
			}
			return o;
		},
		_getSrc: function(id, name, w, h){
			var ps='', p=[];
			if (w*1 > 0){ p[p.length] = 'w_'+w; }
			if (h*1 > 0){ p[p.length] = 'h_'+h; }
			if (p.length>0){
				ps = '/'+p.join('-');
			}
			return '/filemanager/i/'+id+ps+'/'+name;
		},
		getSrc: function(){
			var f = this.file;
			
			return this._getSrc(f.id, f.name, this.imgsize.w, this.imgsize.h);
		},
		getHTML: function(){
			var f = this.file;
			if (!L.isNull(f.image)){
				var w=0, h=0, width = f.image.width, height = f.image.height, isz = this.imgsize;
				if (!L.isNull(isz)){
					if (isz.w>0){w = isz.w; width=isz.w;}
					if (isz.h>0){h = isz.h; height=isz.h}
				}
				var src = this._getSrc(f.id, f.name, w, h);
				var html = tSetVarA(T['imagehtml'], {
					'src': src,
					'width': width+'px',
					'height': height+'px',
					'title': f.name,
					'alt': f.name,
					'id': !L.isNull(this.objid) ? ("id='"+this.objid+"'") : ''
				});
				return html;
			}
			
			var div = document.createElement('div');
			div.appendChild(this.getObject());
			return div.innerHTML;
		}
	};
	
	Brick.mod.filemanager.Linker = Linker;

})();
};
})();