/*
@version $Id$
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Blog
 * @namespace Brick.mod.blog
 */
 
var Component = new Brick.Component();
Component.requires = {
	mod:[
	     {name: 'sys', files: ['data.js', 'container.js', 'widgets.js']}
	]
};
Component.entryPoint = function(){
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var TMG = this.template, 
		NS = this.namespace,
		API = this.namespace.API;
	
	if (!Brick.objectExists('Brick.mod.blog.data')){
		Brick.mod.blog.data = new Brick.util.data.byid.DataSet('blog');
	}
	var DATA = Brick.mod.blog.data;

(function(){
	
	var ReadBlogPanel = function(){
		ReadBlogPanel.superclass.constructor.call(this, {modal: true});
	};
	YAHOO.extend(ReadBlogPanel, Brick.widget.Panel, {
		initTemplate: function(){
			return T['readblog'];
		},
		onLoad: function(){
			
		},
		onClose: function(){
			
		}
	});
	
	NS.TopicListPanel = TopicListPanel;
	
})();
	
(function(){
	
	var ReadBlogWidget = function(container){
		container = L.isString(container) ? Dom.get(container) : container;
		var TM = TMG.build('panel,table,row,rowwait,rowdel'),
			T = TM.data,
			TId = TM.idManager;
		
		this._TM = TM;
		this._T = T;
		this._TId = TId;
		
		var config = {
			rowlimit: 10,
			tables: {
				'list': 'topiclistbyuser',
				'count': 'topiccountbyuser'
			},
			tm: TM,
			paginators: ['panel.pagtop', 'panel.pagbot'],
			DATA: DATA
		};
		TopicListWidget.superclass.constructor.call(this, container, config);    
	};
	
    YAHOO.extend(TopicListWidget, Brick.widget.TablePage, {
    	initTemplate: function(){
    		return this._T['panel'];
    	},
    	renderTableAwait: function(){
    		this._TM.getEl("panel.table").innerHTML = this._TM.replace('table', {'rows': this._T['rowwait']});
    	},
    	renderTable: function(lst){
    		this._TM.getEl("panel.table").innerHTML = this._TM.replace('table', {'rows': lst}); 
    	}, 
		renderRow: function(di){
			return this._TM.replace(di['dd']>0 ? 'rowdel' : 'row', {
				'unm': di['unm'],
				'dl': Brick.dateExt.convert(di['dl']),
				'de': Brick.dateExt.convert(di['de']),
				'dp': di['dp']>0 ? Brick.dateExt.convert(di['dp']) : this._T['bipub'],
				'cat': di['cat'],
				'lnk': '/blog/'+di['catnm']+'/'+di['id'],
				'tl': di['tl'],
				'id': di['id']
			});
    	},
    	onClick: function(el){
			var tp = this._TId['panel']; 
			switch(el.id){
			case tp['btnadd']: 
				API.showTopicEditorPanel(0); 
				return true;
			case tp['refresh']: this.Bloglist.refresh(); return true;
			case tp['rcshow']: this.recycle('show'); return true;
			case tp['rchide']: this.recycle('hide'); return true;
			case tp['rcclear']: this.recycleClear(); return true;
			}
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (this._TId['row']['edit']+'-'):
				API.showTopicEditorPanel(numid);
				return true;
			case (this._TId['row']['remove']+'-'): this.topicRemove(numid); return true;
			case (this._TId['rowdel']['restore']+'-'): this.topicRestore(numid); return true;
			case (this._TId['bipub']['id']+'-'): this.topicPublish(numid); return true;
			}
			return false;
    	}
    });
	
	NS.TopicListWidget = TopicListWidget;
})();

//////////////////////////////////////////////////////////////
//                      TopicEditorPanel                    //
//////////////////////////////////////////////////////////////
(function(){
	
	/**
	 * Панель "Редактор записи в блоге"
	 * 
	 * @class TopicEditorPanel
	 * @constructor
	 * @param {Integer} Идентификатор записи.
	 */
	var TopicEditorPanel = function(topicId){
		
		/**
		 * Идентификатор записи.
		 * @property topicId
		 * @type Integer
		 */
		this.topicId = topicId;
		
		TopicEditorPanel.superclass.constructor.call(this, {modal: true});
	};
	YAHOO.extend(TopicEditorPanel, Brick.widget.Panel, {
		
		/**
		 * Рубрика блога.
		 * 
		 * @property category
		 * @type Object
		 */
		category: {},
		
		/**
		 * Редактор поля "Анонс"
		 * 
		 * @property editorIntro
		 * @type Brick.widget.Editor
		 */
		editorIntro: null,
		
		/**
		 * Редактор поля "Основная запись"
		 * 
		 * @property editorBody
		 */
		editorBody: null,
		
		/**
		 * Получить элемент по идентификатору базового шаблона
		 * @method el
		 * @param {String} name Имя элемента
		 * @return {HTMLElement | null}
		 */
		el: function(name){ return Dom.get(TId['editor'][name]); },
		
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		
		initTemplate: function(){
			var t = T['editor'];
			var o = this.obj;
			var btns = this.topicId>0 ? T['btnsave'] : T['btnpub']+T['btndraft'];
			t = tSetVar(t, 'buttons', btns);
			return t;
		},
		onLoad: function(){
			this.tagManager = new TagsAutocomplete(TId['editor']['tags'], TId['editor']['tagscont']);
			
			this.validator = new Brick.util.Form.Validator({
				elements: {
					'category':{obj: this.el('category'), rules: ["empty"], args:{"field":"Рубрика"}},
					'title':{obj: this.el('title'), rules: ["empty"], args:{"field":"Заголовок"}},
					'tags': {obj: this.el('tags'), rules: ["empty"], args:{"field":"Метки"}}
				}
			});
			
			var Editor = Brick.widget.Editor;

			this.editorIntro = new Editor(TId['editor']['bodyint'], {
				width: '750px', height: '150px', 'mode': Editor.MODE_VISUAL
			});

			this.editorBody = new Editor(TId['editor']['bodyman'], {
				width: '750px', height: '250px', 'mode': Editor.MODE_VISUAL
			});

			if (this.topicId > 0){
				this.initTables();
				if (DATA.isFill(this.tables)){
					this.renderElements();
				}
				DATA.onComplete.subscribe(this.dsComplete, this, true);
			}else{
				this.renderElements();
			}
		},
		initTables: function(){
			this.tables = { 'topic': DATA.get('topic', true) };
			this.rows = this.tables['topic'].getRows({topicid: this.topicId});
		},
		dsComplete: function(type, args){
			var __self = this;
			if (args[0].checkWithParam('topic', {topicid: this.topicId})){ __self.renderElements(); }
		},
		onClick: function(el){
			var __self = this;
			switch(el.id){
			case TId['editor']['bcategory']:
				API.showCategoryListPanel(function(data){ 
					__self.setCategory(data); 
				});
				return true;
			case TId['btnpub']['id']: this.save('pub'); return true;
			case TId['btndraft']['id']: this.save('draft'); return true;
			case TId['btnsave']['id']: this.save('save'); return true;
			case TId['editor']['bcancel']: this.close(); return true;
			}
			return false;
		},
		setCategory: function(d){
			this.category = d;
			this.setelv('category', this.category['ph'] || ''); 
		},
		renderElements: function(){
			
			var disBtn = function(a){
				for(var i=0;i<a.length;i++){
					var el = Dom.get(TId[a[i]]['id']); 
					if (!L.isNull(el)){ el.disabled = ""; }
				}
			};

			this.el('bcategory').disabled = "";
			this.el('title').disabled = "";
			this.el('tags').disabled = "";
			disBtn(['btnpub', 'btndraft', 'btnsave']);
			
			if (this.topicId > 0){
				var table = this.tables['topic'];
				var row  = this.rows.getByIndex(0);
				var o = row.cell;
				
				this.editorIntro.setContent(o['intro']);
				this.editorBody.setContent(o['body']);
				
				this.setCategory({
					'id': o['catid'],
					'ph': o['catph'],
					'nm': o['catnm']
				});
				
				this.setelv('title', o['tl']);
				
				this.setelv('tags', o['tags']);
				
			}
		},
		onClose: function(){
			this.editorIntro.destroy();
			this.editorBody.destroy();
			
			if (this.topicId > 0){
				DATA.onComplete.unsubscribe(this.dsComplete);
			}
		},
		save: function(status){
			var errors = this.validator.check();
			if (errors.length > 0){ return; }
			
			var oTitle = this.el('title');
			var oTags = this.el('tags');

			var sIn = this.editorIntro.getContent();
			var sBd = this.editorBody.getContent();
			
			var s = sIn + ' ' + sBd;
			
			this.initTables();

			var table = this.tables['topic'];
			var row  = this.topicId > 0 ? this.rows.getByIndex(0) : table.newRow();
			if (status == 'pub'){
				row.update({ 'st': 1 });
			}else if (status == 'draft'){
				row.update({ 'st': 0 });
			}
			
			var cat = this.category;
			row.update({
				// 'mtd': NS.Description.create(s, oTitle.value, oTags.value),
				'nm': Brick.util.Translite.ruen(oTitle.value),
				'tl': oTitle.value,
				'intro': sIn,
				'body': sBd,
				'tags': oTags.value,
				'catid': cat.id,
				'catph': cat.ph,
				'catnm': cat.nm
			});
			
			if (row.isNew()){
				this.rows.add(row);
			}

			var tbl1 = DATA.get('topiclistbyuser');
			var tbl2 = DATA.get('topiccountbyuser');
			
			if (!L.isNull(tbl1)){ tbl1.clear(); }
			if (!L.isNull(tbl2)){ tbl2.clear(); }
			
			table.applyChanges();
			DATA.request();
			this.close();
		}
	});
	
	NS.TopicEditorPanel = TopicEditorPanel;
	
	var TagsAutocomplete = function(input, container){
	    var ds = new YAHOO.util.XHRDataSource('/ajax/query.html?md=blog&bk=js_tags');
	    ds.connMethodPost = true;  
	    ds.responseSchema = {recordDelim: "\n",fieldDelim: "\t"};
	    ds.responseType = YAHOO.util.XHRDataSource.TYPE_TEXT;
	    ds.maxCacheEntries = 60;

		var oAC = new YAHOO.widget.AutoComplete(input, container, ds);
		oAC.delimChar = [",",";"]; // Enable comma and semi-colon delimiters
	};
	
})();

//////////////////////////////////////////////////////////////
//                     CategoryListPanel                    //
//////////////////////////////////////////////////////////////
(function(){

	/**
	 * Панель "Список категорий блога"
	 */
	var CategoryListPanel = function(callback){
		this.callback = callback;
		this.selectedRow = null;
		CategoryListPanel.superclass.constructor.call(this, {modal: true});
	};
	
	YAHOO.extend(CategoryListPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['catlistpanel'][name]); },
		initTemplate: function(){
			return T['catlistpanel'];
		},
		onLoad: function(){
			this.el('table').innerHTML = tSetVar(T['catlisttable'], 'rows', T['catlistrowwait']);

			this.tables = {'categorylist': DATA.get('categorylist', true) };
			if (DATA.isFill(this.tables)){ this.renderElements(); }
			
			DATA.onComplete.subscribe(this.dsComplete, this, true);
		},
		dsComplete: function(type, args){
			if (args[0].checkWithParam('categorylist')){ 
				this.renderElements(); 
			}
		},
		destroy: function(){
			CategoryListPanel.superclass.destroy.call(this);
			DATA.onComplete.unsubscribe(this.dsComplete, this); 
		},
		renderElements: function(){
			var rows = this.tables['categorylist'].getRows();
			var lst = "";
			rows.foreach(function(row){
				var di = row.cell;
				t = T['catlistrow'];
				t = tSetVar(t, 'ph', di['ph']);
				t = tSetVar(t, 'cnt', di['cnt']);
				t = tSetVar(t, 'id', di['id']);
				lst += t;
			});
			this.el('table').innerHTML = tSetVar(T['catlisttable'], 'rows', lst); 
		},
		onClick: function(el){
			var tp = TId['catlistpanel']; 
			switch(el.id){
			case tp['bselect']: this.select();	return true;
			case tp['bcancel']: this.close(); return true;
			case tp['bnew']: 
				API.showCategoryEditorPanel();
				return true;
			}
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			var row = this.tables['categorylist'].getRows().getById(numid);
			if (L.isNull(row)){ return false; }
			
			var di = row.cell;

			var tp = TId['catlistrow']; 
			switch(prefix){
			case tp['td1']+'-':
			case tp['td2']+'-':
			case tp['td3']+'-':
				this.el('category').value = di['ph'];
				this.el('bselect').disabled = "";
				this.selectedRow = di;
				return true;
			case tp['edit']+'-':
				API.showCategoryEditorPanel(row.id);
				return true;
			case tp['del']+'-': 
				this.remove(row); 
				return true;
			}
			return false;
		},
		select: function(){
			if (L.isNull(this.selectedRow)){ return; }
			this.close();
			this.callback(this.selectedRow);
		}
	});
	
	NS.CategoryListPanel = CategoryListPanel;
	
})();

//////////////////////////////////////////////////////////////
//                     CategoryEditorPanel                  //
//////////////////////////////////////////////////////////////
(function(){

	var CategoryEditorPanel = function(categoryId){
		this.categoryId = categoryId || 0;
		CategoryEditorPanel.superclass.constructor.call(this, {modal: true});
	};
	YAHOO.extend(CategoryEditorPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['cateditorpanel'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			return T['cateditorpanel'];
		},
		onLoad: function(){
			var phrase = this.el('phrase');
			this.validator = new Brick.util.Form.Validator({
				elements: {'phrase':{ obj: phrase, rules: ["empty"], args:{"field":"Название"}}}
			});
			if (this.categoryId > 0){
				this.initTables();
				if (DATA.isFill(this.tables)){ 
					this.renderElements(); 
				}else{
					DATA.onComplete.subscribe(this.dsComplete, this, true);
				}
			}else {
				this.renderElements();
			}
		},
		initTables: function(){
			this.tables = {'category': DATA.get('category', true) };
			this.rows = this.tables['category'].getRows({'categoryid': this.categoryId});
		},
		dsComplete: function(type, args){
			if (args[0].checkWithParam('category', {categoryid: this.categoryId})){ this.renderElements(); }
		},
		destroy: function(){
			DATA.onComplete.unsubscribe(this.dsComplete, this);
			CategoryEditorPanel.superclass.destory.call(this);
		},
		renderElements: function(){
			if (this.categoryId > 0){
				var row = this.rows.getByIndex(0);
				this.setelv('phrase', row.cell['ph']);
				this.setelv('name', row.cell['nm']);
			}
			this.el('bsave').disabled = "";
		},
		onClick: function(el){
			var tp = TId['cateditorpanel'];
			switch(el.id){
			case tp['bsave']: this.save(); return true;
			case tp['bcancel']: this.close(); return true;
			case tp['name']: this._updateCatName(); return false;
			}
			return false;
		},
		_updateCatName: function(){
			var txtname = this.el('name');
			if (txtname.value.length == 0){
				var txtphrase = this.el('phrase');
				txtname.value = Brick.util.Translite.ruen(txtphrase.value);
			}
		},
		save: function(){
			this._updateCatName();
			if (this.validator.check() > 0){ return; }
			
			this.initTables();
			var table = this.tables['category'];
			var row  = this.categoryId > 0 ? this.rows.getByIndex(0) : table.newRow();
			
			row.update({
				'ph': this.elv('phrase'),
				'nm': this.elv('name')
			});
			
			if (row.isNew()){ this.rows.add(row); }
			table.applyChanges();
			
			if (table.isFill()){ return; }
			
			if (!L.isNull(DATA.get('categorylist'))){
				DATA.get('categorylist').clear();
			}
			DATA.request();
			this.close();
		}
	});
	
	NS.CategoryEditorPanel = CategoryEditorPanel;
})();

(function(){
	var cleanSpace = function(s){
		s = s.replace(/^\s*|\s*$/g, '');
		var n=-1;
		do{
			n = s.length;
			s = s.replace(/\s\s/g, ' ');
		}while(n != s.length);
		
		return s;
	};
	
	var keywords = function(){};
	keywords.prototype = {
		create: function(s){

			s = s.replace(/[^a-zA-Z0-9\-\а-\я\А-\Я]/g, " ");
			s = cleanSpace(s);
			s = s.toLowerCase();
			
			var a = s.split(' '), i, w, words = [], find, j;
			for (i=0;i<a.length;i++){
				w = a[i];
				if (w.length > 3){
					find = false;
					for (j=0;j<words.length;j++){
						if (words[j].word == w){
							words[j].count++;
							find = true;
							break;
						}
					}
					if (!find){
						words[words.length] = {word: w, count: 1};
					}
				}
			}
			var ret=[];
			for (i=0;i<words.length;i++){
				ret[ret.length] = words[i].word;
			}
			
			return ret;
		},
		createByBlogTags: function(s){
			var a = this.create(s), i, ret = '', w, len;
			for (i=0;i<a.length;i++){
				len = a[i].length;
				if (len >= 7){
					w = a[i].substring(len-2,0);
				}else{
					w = a[i];
				}
				ret += w+' ';
			}
			return ret;
		}
	};
	NS.Keywords = new keywords();
	
	var search = function(s, f){
		var r = new RegExp(f, 'gi');
		return r.test(s);
	};
	
	var descript = function(){};
	descript.prototype = {
		create: function(s, title, tags){

			// ключевые слова
			var keya = NS.Keywords.createByBlogTags(title+' '+tags).split(' ');

			// предложения страницы 
			s = s.replace(/[^a-zA-Z0-9\-\а-\я\А-\Я\.\,\:]/g, " ");
			s = cleanSpace(s);
			var ws = s.split('.');
			
			// определение значимости предложения
			var wso = [], o, i, j, level, wset='';
			for (i=0;i<ws.length;i++){
				o = { s: ws[i], level: 0 };
				for (j=0;j<keya.length;j++){
					if (search(o.s, keya[j])){
						o.level++;
					}
				}
				wso[wso.length] = o;
			}
			
			// сортировка
			var change = false, sa, sb;
			do{
				change = false;
				for (i=0;i<wso.length-1;i++){
					sa = wso[i];
					sb = wso[i+1];
					if (sa.level < sb.level){
						wso[i] = sb;
						wso[i+1]=sa;
						change = true;
					}
				}
			}while(change);
			
			var maxLength = 200; 
			
			if (wso.length == 0 || wso[0].s.length < maxLength){
				return wso[0].s;
			}else{
				var a = wso[0].s.split(' '), i, ret = '';
				for (i=0;i<a.length;i++){
					if (ret.length + a[i].length > maxLength){
						break;
					}
					ret += a[i] + ' ';
				}
				return ret; 
			}
		}
	};
	
	NS.Description = new descript();
	
})();
	
};


