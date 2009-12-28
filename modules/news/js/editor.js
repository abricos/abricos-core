/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){

	Brick.namespace('mod.news');

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		T, TId;
	
	var dateExt = Brick.dateExt;
	var wWait = Brick.widget.WindowWait;
	var elClear = Brick.elClear;
	var tSetVar = Brick.util.Template.setProperty;
	
	var DATA;
	
	Brick.Loader.add({
		mod:[
		     {name: 'sys', files: ['editor.js','container.js','data.js','form.js']},
		     {name: 'filemanager', files: ['api.js']}
		    ],
    onSuccess: function() {
			if (!Brick.objectExists('Brick.mod.news.data')){
				Brick.mod.news.data = new Brick.util.data.byid.DataSet('news');
			}
			DATA = Brick.mod.news.data;
			
			T = Brick.util.Template['news']['editor'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			
			moduleInitialize();
			delete moduleInitialize;
			
			Brick.util.CSS.update(T['css']);
			delete T['css'];
	  }
	});

var moduleInitialize = function(){
	
/* * * * * * * * * * * * * * Editor * * * * * * * * * * * */	
(function(){
	var Editor = function(rows){
		this.rows = rows;
		Editor.superclass.constructor.call(this, T['editor']);
	};
	YAHOO.extend(Editor, Brick.widget.Panel, {
		onClose: function(){ this._editor.destroy(); },
		el: function(name){ return Dom.get(TId['editor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		onLoad: function(){
	 		var row = this.rows.getByIndex(0);
	 		var news = row.cell;
	 		
	 		var bsave = this.el('bsave');
	 		var bdraft = this.el('bdraft');
	 		var bpub = this.el('bpub');
	 		if (row.isNew()){
	 			bsave.style.display = 'none';
	 		}else{
	 			if (news['dp'] > 0){ bpub.style.display = 'none'; }
 				bdraft.style.display = 'none';
	 		}

			this._editorIntro = new Brick.widget.editor.TinyMCE(TId['editor']['bodyint'],{
				'value': news['intro'],
				width: '550px', height: '100px', buttonsgroup: 'page' 
			});

			this._editorMan = new Brick.widget.editor.TinyMCE(TId['editor']['bodyman'],{
				'value': news['body'],
				width: '550px', height: '250px', buttonsgroup: 'page' 
			});
			
	 		this.setelv('title', news['tl']);
	 		this.setelv('srcname', news['srcnm']);
	 		this.setelv('srclink', news['srclnk']);
	 		this.setImage(news['img']);
		},
		onClose: function(){
			this._editorIntro.destroy();
			this._editorMan.destroy();
		},
		onClick: function(el){
			var tp = TId['editor']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bsave']: this.save(); return true;
			case tp['bpub']: this.publish(); return true;
			case tp['bdraft']: this.draft(); return true;
			case tp['bimgsel']: this.openImage(); return true;
			case tp['bimgdel']: this.setImage(''); return true;
			}
		},
		setImage: function(imageid){
			this.imageid = imageid;
			var img = this.el('image');
			img.src = imageid ? '/filemanager/file.html?i='+imageid : '';
		},
		openImage: function(){
			var __self = this;
			Brick.mod.filemanager.show(function(data){
				__self.setImage(data.file.id);
			});
		},
		draft: function(){
	 		this.rows.getByIndex(0).update({'dp': 0});
	 		this.save();
		},
		publish: function(){
	 		this.rows.getByIndex(0).update({'dp': ((new Date()).getTime()/1000)});
	 		this.save();
		},
		save: function(){
			var tableNews = DATA.get('news');
	 		var row = this.rows.getByIndex(0);
	 		row.update({
	 			'tl': this.elv('title'),
	 			'intro': this._editorIntro.getValue(),
	 			'body': this._editorMan.getValue(),
	 			'srcnm': this.elv('srcname'),
	 			'srclnk': this.elv('srclink'),
	 			'img': this.imageid
	 		});
	 		if (row.isNew()){
	 			tableNews.getRows().add(row);
	 		}
	 		if (!row.isNew() && !row.isUpdate()){
				this.close();
				return; 
	 		}
	 		tableNews.applyChanges();
			var tableNewsList = DATA.get('newslist');
	 		if (tableNewsList){
	 			var rows = tableNewsList.getLastUpdateRows();
	 			rows.clear();
	 		}
			DATA.get('news').applyChanges();
			DATA.request();
			this.close();
		}
	});
	
	Brick.mod.news.Editor = Editor;
	
})();
};
})();
