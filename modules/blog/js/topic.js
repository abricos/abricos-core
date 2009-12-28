/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

Brick.namespace('Blog.Topic');

(function(){
	var T, TId;

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var BW, BC = Brick.util.Connection;

	var dateExt = Brick.dateExt;
	var elClear = Brick.elClear;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
    yahoo: ['dragdrop','autocomplete'],
		mod: 
			[
			 {name: 'sys', files: ['editor.js','container.js']}, 
			 {name: 'blog', files: ['category.js']}
			],
    onSuccess: function() {
			T = Brick.util.Template['blog']['topic'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			
			moduleInitialize();
			delete moduleInitialize;
		}
	});
	
var moduleInitialize = function(){
(function(){
	
	Brick.Blog.Topic.Manager = function(){
		return {
			activeEditor: null,
			tagManager: null,
			load: function(topicid){
				if (topicid == 0){
					this.show();
				}else{
					BC.sendCommand('blog', 'js_topic', {json:{id: topicid}});
				}
			},
			show: function(obj){
				if (!L.isNull(this.activeEditor)){this.activeEditor.destroy();}
				this.activeEditor = new Editor(obj);
			},
			getTagManager: function(){
				if (L.isNull(this.tagManager)){
					this.tagManager = new tags();
				}
				return this.tagManager;
			}
		}
	}();
	
	/* * * * * * * * * * * * * Topic Editor * * * * * * * * * * */
	var Editor = function(obj){
		this.obj = L.merge({
			id:0, tl:'', mtd:'', mtk:'', nm:'', 
			catid:'', catnm:'',catph:'', tags:[], 
			ctid:0, intro:'', body:'',dl:0,de:0,dp:0,dd:0,st:0,
			uid:0,unm:''
		}, obj || {});

		Editor.superclass.constructor.call(this, T['editor'], {width:'780px'}, {'T':T,'TName':'editor','TId':TId});
	};
	YAHOO.extend(Editor, Brick.widget.Panel, {
		init: function(template, userConfig){
			this.validator = null;
			Editor.superclass.init.call(this, template, userConfig);
		},
		setCategory: function(obj){
			this.obj['catid'] = obj['id'];
			this.obj['catph'] = obj['ph'];
			this.obj['catnm'] = obj['nm'];
			this.updateCategory();
		},
		getCategory: function(){ return {id: this.obj['catid'],nm: this.obj['catnm'],ph: this.obj['catph']} },
		el: function(name){ return Dom.get(TId['editor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		updateCategory: function(){ this.setelv('category', this.obj['catph']); },
		initTemplate: function(t){
			var o = this.obj;
			var btns = o['id']>0 ? T['btnsave'] : T['btnpub']+T['btndraft'];
			t = tSetVar(t, 'buttons', btns);
			return t;
		},
		onLoad: function(){
			var o = this.obj;
			
			var oTags = this.el('tags');
			this.tagManager = Brick.Blog.Topic.Manager.getTagManager();
			this.tagManager.setInputElement(TId['editor']['tags'],TId['editor']['tagscont']);
			
			var tags = o['tags'];
			for(var i=0;i<tags.length;i++){
				oTags.value = i==0 ? tags[i]['ph'] : (oTags.value+', '+tags[i]['ph']);
			}
			
			this.updateCategory();
			this.setelv('title', o['tl']);
			
			this._editorIntro = new Brick.widget.editor.TinyMCE(TId['editor']['bodyint'],{
				'value': o['intro'],
				width: '750px', height: '150px', buttonsgroup: 'page' 
			});

			this._editorMan = new Brick.widget.editor.TinyMCE(TId['editor']['bodyman'],{
				'value': o['body'],
				width: '750px', height: '250px', buttonsgroup: 'page' 
			});
			
			this.validator = new Brick.util.Form.Validator({
				elements: {
					'category':{obj: this.el('category'), rules: ["empty"], args:{"field":"Рубрика"}},
					'title':{obj: this.el('title'), rules: ["empty"], args:{"field":"Заголовок"}},
					'tags': {obj: oTags, rules: ["empty"], args:{"field":"Метки"}}
				}
			});
		},
		onClose: function(){
			this._editorIntro.destroy();
			this._editorMan.destroy();
		},
		onClick: function(el){
			var __self = this;
			switch(el.id){
			case TId['editor']['bcategory']:
				Brick.Blog.Category.Manager.select(function(obj){ __self.setCategory(obj); });
				return true;
			case TId['btnpub']['id']: this.save('pub'); return true;
			case TId['btndraft']['id']: this.save('draft'); return true;
			case TId['btnsave']['id']: this.save('save'); return true;
			case TId['editor']['bcancel']: this.close(); return true;
			}
			return false;
		},
		save: function(status){
			var __self = this;
			var o = this.obj;
			o['type'] = 'topic';
			o['act'] = 'save';
			
			if (status == 'pub'){
				o['st'] = 1;
			}else if (status == 'draft'){
				o['st'] = 0;
			}

			var errors = this.validator.check();
			if (errors.length > 0){ return; }
			
			var oTitle = this.el('title');
			var oTags = this.el('tags');

			var sIn = this._editorIntro.getValue();
			var sBd = this._editorMan.getValue();

			
			var s = sIn + ' ' + sBd;

			o['mtd'] = Brick.Blog.Topic.Description.create(s, oTitle.value, oTags.value);
			o['nm'] = Brick.util.Translite.ruen(oTitle.value);
			o['tl'] = oTitle.value;
			o['intro'] = sIn;
			o['body'] = sBd;
			o['tags'] = oTags.value.split(',');
			
			if (Brick.objectExists('Brick.Blog.Admin.CP.Bloglist')){
				o['page'] = Brick.Blog.Admin.CP.Bloglist.currentPage;
			}

			BC.sendCommand('blog', 'js_bloglist', { json: o,
				success: function(){ __self.close(); }
			});

		}
	});
	
	var tags = function(){
		this.ds = null;
		this.init();
	};
	tags.prototype = {
		init: function(){
	    var ds = new YAHOO.util.XHRDataSource('/ajax/query.html?md=blog&bk=js_tags');
	    ds.connMethodPost = true;  
	    ds.responseSchema = {recordDelim: "\n",fieldDelim: "\t"};
	    ds.responseType = YAHOO.util.XHRDataSource.TYPE_TEXT;
	    ds.maxCacheEntries = 60;
	    this.ds = ds;
		},
		setInputElement: function(input, container){
			var oAC = new YAHOO.widget.AutoComplete(input, container, this.ds);
		  oAC.delimChar = [",",";"]; // Enable comma and semi-colon delimiters
		}, 
		removeInputElement: function(){}
	}
	
})();
};

(function(){
	var cleanSpace = function(s){
		s = s.replace(/^\s*|\s*$/g, '');
		var n=-1;
		do{
			n = s.length;
			s = s.replace(/\s\s/g, ' ');
		}while(n != s.length);
		
		return s;
	}
	
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
	}
	Brick.Blog.Topic.Keywords = new keywords();
	
	var search = function(s, f){
		var r = new RegExp(f, 'gi');
		return r.test(s);
	}
	
	var descript = function(){};
	descript.prototype = {
		create: function(s, title, tags){

			// ключевые слова
			var keya = Brick.Blog.Topic.Keywords.createByBlogTags(title+' '+tags).split(' ');

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
	}
	
	Brick.Blog.Topic.Description = new descript();
	
})();

})();
