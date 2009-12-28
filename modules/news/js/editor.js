/*
* @version $Id$
* @copyright Copyright (C) 2008 Abricos All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module News
 * @namespace Brick.mod.news
 */

var Component = new Brick.Component();
Component.requires = {
	yahoo: ["tabview"],
	mod:[
	     {name: 'sys', files: ['editor.js','container.js','data.js','form.js']}
	     // {name: 'filemanager', files: ['api.js']}
    ]
};
Component.entryPoint = function(){
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var __selfCT = this;
	
	var NS = this.namespace, 
		TM = this.template.build(), 
		T = TM.data,
		TId = TM.idManager;
	
	var API = NS.API;
	
	if (!Brick.objectExists('Brick.mod.news.data')){
		Brick.mod.news.data = new Brick.util.data.byid.DataSet('news');
	}
	var DATA = Brick.mod.news.data;
	
	Brick.util.CSS.update(T['css']);

	var EditorPanel = function(newsId){
		this.newsId = newsId*1 || 0;
		
		EditorPanel.superclass.constructor.call(this, {
			modal: true,
			fixedcenter: true
		});
	};
	YAHOO.extend(EditorPanel, Brick.widget.Panel, {
		onClose: function(){ this._editor.destroy(); },
		el: function(name){ return Dom.get(TId['editor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			return T['editor'];
		},
		onLoad: function(){
			
			var tabView = new YAHOO.widget.TabView(TId['editor']['tabpage']);
			
			this.actionDisable(TM.getElId('editor.bcancel'));

			var Editor = Brick.widget.Editor;

			this.editorIntro = new Editor(TId['editor']['bodyint'], {
				width: '550px', height: '150px', 'mode': Editor.MODE_VISUAL
			});

			this.editorBody = new Editor(TId['editor']['bodyman'], {
				width: '750px', height: '250px', 'mode': Editor.MODE_VISUAL
			});
			
			// менеджер файлов
			if (Brick.componentExists('filemanager', 'api')){
				this.el('fm').style.display = '';
				this.el('fmwarn').style.display = 'none';
			}
			
			if (this.newsId > 0){
				this.initTables();
				if (DATA.isFill(this.tables)){
					this.renderElements();
				}
				DATA.onComplete.subscribe(this.dsComplete, this, true);
			}else{
				this.renderElements();
			}
		},
		
		dsComplete: function(type, args){
			if (args[0].checkWithParam('news', {id: this.newsId})){ this.renderElements(); }
		},

		initTables: function(){
			this.tables = { 'news': DATA.get('news', true) };
			this.rows = this.tables['news'].getRows({id: this.newsId});
		},
		
		renderElements: function(){
			
	 		var bsave = this.el('bsave');
	 		var bdraft = this.el('bdraft');
	 		var bpub = this.el('bpub');
	 		if (this.newsId == 0){
	 			bsave.style.display = 'none';
	 		}else{
		 		var row = this.rows.getByIndex(0);
		 		var news = row.cell;

				this.editorIntro.setContent(news['intro']);
				this.editorBody.setContent(news['body']);

	 			if (news['dp'] > 0){ bpub.style.display = 'none'; }
	 			
 				bdraft.style.display = 'none';
 		 		this.setelv('title', news['tl']);
 		 		this.setelv('srcname', news['srcnm']);
 		 		this.setelv('srclink', news['srclnk']);
 		 		this.setImage(news['img']);
	 		}
	 		this.actionEnable();
		},

		onClose: function(){
			this.editorIntro.destroy();
			this.editorBody.destroy();
			
			if (this.newsId > 0){
				DATA.onComplete.unsubscribe(this.dsComplete);
			}
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
			img.src = imageid ? '/filemanager/i/'+imageid+'/news.gif' : '';
		},
		openImage: function(){
			var __self = this;
			
			Brick.Component.API.fire('filemanager', 'api', 'showFileBrowserPanel', function(result){
				__self.setImage(result.file.id);
        	});
		},
		draft: function(){
	 		this.save('draft');
		},
		publish: function(){
	 		this.save('publish');
		},
		save: function(act){
			act = act || "";
			
			this.initTables();

			var tableNews = DATA.get('news');
	 		var row = this.newsId > 0 ? this.rows.getByIndex(0) : tableNews.newRow();
	 		row.update({
	 			'tl': this.elv('title'),
	 			'intro': this.editorIntro.getContent(),
	 			'body': this.editorBody.getContent(),
	 			'srcnm': this.elv('srcname'),
	 			'srclnk': this.elv('srclink'),
	 			'img': this.imageid
	 		});
	 		if (act == "publish"){
		 		row.update({'dp': ((new Date()).getTime()/1000)});
	 		}else if (act == "draft"){
		 		row.update({'dp': 0});
	 		}
	 		if (row.isNew()){
	 			this.rows.add(row);
	 		}
	 		if (!row.isNew() && !row.isUpdate()){
				this.close();
				return; 
	 		}
	 		tableNews.applyChanges();
			var tableNewsList = DATA.get('newslist');
	 		if (!L.isNull(tableNewsList)){
	 			tableNewsList.clear();
	 			DATA.get('newscount').clear();
	 		}
			API.dsRequest();
			this.close();
		}
	});
	
	Brick.mod.news.EditorPanel = EditorPanel;
	
	
};
