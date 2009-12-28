/*
* @version $Id: filemanager.js 189 2009-11-25 15:24:22Z roosit $
* @copyright Copyright (C) 2008 Abricos All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module FileManager
 * @namespace Brick.mod.filemanager
 */

var Component = new Brick.Component();
Component.requires = {
	yahoo: ['animation','dragdrop','imagecropper'],
	mod:[
	     {name: 'sys', files: ['container.js','data.js']},
	     {name: 'filemanager', files: ['api.js', 'lib.js']}
	]
};
Component.entryPoint = function(){
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		W = YAHOO.widget;

	var tSetVar = Brick.util.Template.setProperty;
	var tSetVarA = Brick.util.Template.setPropertyArray;
	
	var __selfCT = this;
	
	var NS = this.namespace,
		TMG = this.template;
	
	var TM = TMG.build(),
		T = TM.data,
		TId = TM.idManager;

	if (!Brick.objectExists('Brick.mod.filemanager.data')){
		Brick.mod.filemanager.data = new Brick.util.data.byid.DataSet('filemanager');
	}
	var DATA = Brick.mod.filemanager.data;

(function(){
	
	var File = NS.File;
	
	var ImageEditorPanel = function(file, callback){
		this.sourcefile = file;
		this.callback = callback;
		ImageEditorPanel.superclass.constructor.call(this, {
			modal: true,
			fixedcenter: true
		});
	};
	YAHOO.extend(ImageEditorPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['editor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setel: function(el, value){ Brick.util.Form.setValue(el, value); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			return T['editor'];
		},
		onLoad: function(){
			this.imageid = "image_"+this.sourcefile.id;
			this.selectedTools = '';
			this.tables = null;
			this.session = Math.round(((new Date()).getTime())/1000);
			this.setFile(this.sourcefile);
		},
		setFile: function(file){
			this.file = file;
			var lnk = new NS.Linker(file);
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
				handles: 'all', 
				knobHandles: true, 
				proxy: true, 
				ghost: true, status: true, draggable: true
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
				this.tables = {'editor': DATA.get('editor', true) };
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

	NS.ImageEditorPanel = ImageEditorPanel;
})();

};

