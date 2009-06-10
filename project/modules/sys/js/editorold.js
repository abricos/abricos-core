/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){

	if (typeof Brick.util.Editor != 'undefined'){ return; }
	
	Brick.namespace('util.Editor');
	
	var uniqurl = Brick.uniqurl;
	var dateExt = Brick.dateExt;
	var readScript = Brick.readScript;
	var wWait = Brick.widget.WindowWait;
	var elClear = Brick.elClear;
	
	var Dom, E,	L, W,	C;
	var T, TId;

	function initialize(){
		Dom = YAHOO.util.Dom;
		E = YAHOO.util.Event;
		L = YAHOO.lang;
		W = YAHOO.widget;
		C = YAHOO.util.Connect;
	}
	
	Brick.Loader.add({
    onSuccess: function() {
		
			T = Brick.util.Template['sys']['editorold'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
		
			initialize();
	  }
	});
	
(function(){
	
	var cloneParam = function(from, to, params){
		var i, act = false;
		for (i=0;i<params.length;i++){
			if (from[params[i]]){
				to.setAttribute(params[i], from[params[i]]);
				act = true;
			}
		}
		return act;
	};

	var cloneStyle = function(from, to, params){
		var i, act = false, p;
		for (i=0;i<params.length;i++){
			p = params[i];
			if (from.style[params[i]]){
				if (p == 'float'){
					var nm = YAHOO.env.ua.ie ? 'styleFloat' : 'cssFloat';
					to.style[nm] = from.style[nm];
				}else{
					to.style[params[i]] = from.style[params[i]];
				}
				act = true;
			}
		}
		return act;
	};
	
	var encode = function(s) {
		return s ? ('' + s).replace(/[<>&\"]/g, function (c, b) {
		  switch (c) {
		  	case '&':
		  		return '&amp;';
		  	case '"':
		  		return '&quot;';
		  	case '<':
		  		return '&lt;';
		  	case '>':
		  		return '&gt;';
		  }
			return c;
		}) : s;
	};
	
	var closeTag = function(s){
		return s.replace(/<([^>]+)>/g, '<$1 \/>');
	};
	
	var getOuterHTML = function(e) {
		e = Dom.get(e);
		if (!e) return null;
		if (YAHOO.env.ua.ie)
			return e.outerHTML;

		var d = document.createElement("div");
		d.appendChild(e.cloneNode(true));

		return d.innerHTML;
	};
	
	var defFormat = {
		tag: [
		 		 'p','span',
			   'img','a',
			   'h1','h2','h3','h4','h5',
			   'strong','b','em',
			   'table',
			   'ul','li','ol',
			   'sup'
			  ],
		options: {
			'a':[''],
			'img': ['src','title','alt','width','height']
		},
		style: {
			'a':['href','title','name'],
			'img': ['margin', 'float'],
			'span': ['textDecoration', 'backgroundColor', 'font-weight'],
			'p': ['textAlign']
		}
	};
	
	var defEnTags =			
		[
		 'p','span',
	   'img','a',
	   'h1','h2','h3','h4','h5',
	   'strong','b','em',
	   'table',
	   'ul','li','ol',
	   'sup'
	  ];

	var htmlclean = function(entags){this.init(entags);}
	htmlclean.prototype = {
		tags: null,
		entags: null,
		text: null,
		links: null,
		init: function(entags){
			if (!L){
				initialize();
			}
			var et = [], etobj=[];
			et = typeof entags != 'undefined' ? entags : defEnTags;
			for (var i=0;i<et.length;i++){ etobj[et[i]] = true; }
			this.entags = et;
			this.tags = etobj;
		},
		cleanHTML: function(s){
			var begin, end;
			this.text = '';
			this.links = [];
			for (var i=0;i<5;i++){
				this.text = '';
				this.links = [];
				begin = s.length;
				s = this.cleanHTMLMain(s);
				end = s.length;
				if (begin == end){break;}
			}
			return s;
		},
		cleanHTMLMain: function(s){
			s = s.replace(/<!--([\s\S]*?)-->/g, "");  
			s = s.replace(/<style>[\s\S]*?<\/style>/g, "");  
			s = s.replace(/<(meta|link)[^>]+>/g, ""); 
			
			s = s.replace(/\&lt;!--([\s\S]*?)--\&gt;/g, "");  // Word comments /**/
			
			s = this.clean(s);
			return s;
		},
		clean: function(html){
			html = L.trim(html);
			if (html.length == 0){return '';}
			
			var o = document.createElement('div');
			o.innerHTML = html;

			var len = o.childNodes.length, i, str='', el, tag='', nel, conti, newhtml, s;
			for (i=0;i<o.childNodes.length;i++){
				el = o.childNodes[i];
				if (el.nodeValue){
					str += encode(el.nodeValue);
					this.text += el.nodeValue + ' ';
				}else if(el.tagName){
					tag = el.tagName.toLowerCase();

					if (tag == 'table'){
						str += this.cleanTable(el);
					}else if (tag == 'br'){
						str += '<br />'
					}else if (tag == 'img'){
						nel = document.createElement(tag);
						cloneParam(el, nel, ['src','title','alt','width','height']);
						cloneStyle(el, nel, ['margin', 'float']);
						str += closeTag(getOuterHTML(nel));;
					}else if (this.tags[tag] && typeof el.innerHTML != 'undefined'){
						
						nel = document.createElement(tag);
						newhtml = this.clean(el.innerHTML);
						nel.innerHTML = newhtml;

						conti = false;
						if (tag == 'a'){
							cloneParam(el, nel, ['href','title','name']);
							this.links[this.links.length] = nel.href;
						}else if (tag == 'span'){
							conti = !cloneStyle(el, nel, ['textDecoration', 'backgroundColor']);
						}else if (tag == 'p'){
							cloneStyle(el, nel, ['textAlign']);
						}
						if (conti){
							str += nel.innerHTML;
						}else{
							str += getOuterHTML(nel);
						}
					}else if(!this.tags[tag] && tag == 'p'){
						s = this.clean(el.innerHTML);
						if (s.length > 0){
							str += s+'<br />';
						}
					}else if (el.childNodes && el.innerHTML){
						str += this.clean(el.innerHTML);
					}
				}
			}
			return str;
		},
		cleanTable: function (table){
			var tbl = document.createElement('table'), i;
			for (i=0;i<table.childNodes.length;i++){
				this.cleanElement(table.childNodes[i], tbl);
			}
			
			cloneParam(table, tbl, ['border']);
			
			var o = document.createElement('div');
			o.appendChild(tbl);
			
			return o.innerHTML;
		},
		cleanElement: function(fromEl, container){
			if (typeof fromEl['tagName'] == 'undefined'){
				return;
			}
			
			var el = document.createElement(fromEl.tagName), i;
			
			if (el.tagName == 'TD'){
				cloneParam(fromEl, el, ['rowspan','width','height','valign']);
				cloneStyle(fromEl, el, ['width','height','padding']);
				el.innerHTML = this.clean(fromEl.innerHTML);
				
			}else{
				for (i=0;i<fromEl.childNodes.length;i++){
					this.cleanElement(fromEl.childNodes[i], el);
				}
			}
			container.appendChild(el);
		}
	}
	
	Brick.util.Editor.HTMLClean = htmlclean;
	
	Brick.util.Editor.EnableTags = {
		Comment: [
							 'span','img',
							 'a',
					     'strong','b','em',
					     'ul','li','ol',
					     'sup'
					    ]
	};
	
})();


/* * * * * * * * * * * * * * * Базовый редактор * * * * * * * * * * * * */
(function(){
	
	var whilelog = false;
	var openFileManager = function(callback){
		if (typeof Brick.FM == 'undefined'){
			if (whilelog){ alert('OPS!'); return; }
			wWait.show();
			whilelog = true;
			Brick.Loader.add({
				mod:[{name: 'filemanager', files: ['filemanager.js']}],
		    onSuccess: function(){ openFileManager(callback); }
			});
		}else{ wWait.hide(); Brick.FM.Browser.open(callback); }
	};
	
	Brick.namespace('Brick.util.Editor.Tinymce.Button');
	var BUE = Brick.util.Editor;
	
	BUE.Tinymce.Button['brickfm'] = {
		'setup': function(ed){
			ed.addButton('brickfm', {
				title : 'File Manager',
					image : '/modules/filemanager/js/images/folder.png',
					onclick : function() {
						openFileManager(function(file){
							var linker = new Brick.FM.Linker(file);
							ed.selection.setContent(linker.getHTML());
						});
					}
			});
		}
	}
	
	BUE.Tinymce.ButtontGroup = {
		page: "bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,formatselect,bullist,numlist,|,link,unlink,anchor,image,cleanup,code,|,forecolor,backcolor,|,brickfm",
		comment: "bold,italic,underline,strikethrough,|,bullist,numlist,|,link,unlink,image,code"
	}

	var defTinyMceConfig = {
		mode : "exact", theme : "advanced", language: "ru", debug: false, plugins : "", cleanup: true,
		theme_advanced_buttons1 : "",
		theme_advanced_buttons2 : "", theme_advanced_buttons3 : "", theme_advanced_buttons4 : "",
		theme_advanced_toolbar_location : "top",
		theme_advanced_toolbar_align : "left",
		theme_advanced_resizing : true,
		theme_advanced_resize_horizontal : false,
		convert_urls : false
	};
	
	var Simple = function(id, config){
		config = YAHOO.lang.merge( {
			'width': '400px',
			'height': '200px',
			'base': defTinyMceConfig,
			'buttonsgroup': 'comment',
			'value': '',
			'useTinyMCE': true
		}, config || {});
		
		this.useTinyMCE = true;
		this.container = null;
		this.textarea = null;
		this._isTinyMCEInit = false;
		this.isHtmlMode = false;
		
		this.init(id, config);
	}
	Simple.prototype = {
		init: function(id, config){
		
			this.useTinyMCE = config['useTinyMCE'];
			this.isHtmlMode = !this.useTinyMCE; 

			var tcfg = config['base'];
			tcfg['width'] = config['width'];
			tcfg['height'] = config['height'];

			var div = Dom.get(id);
			div.innerHTML = T['simple'];
			this.container = div;

			this.textarea = Dom.get(TId['simple']['taid']);
			this.textarea.style['width'] = tcfg['width'];
			this.textarea.style['height'] = tcfg['height'];
			this.textarea.value = config['value'];

			if (!this.useTinyMCE){ return; }

			var buttons = BUE.Tinymce.ButtontGroup[config['buttonsgroup']];
			
			var setups = [];
			var abtns = buttons.split(','), i;
			for (i=0;i<abtns.length;i++){
				var obj = BUE.Tinymce.Button[abtns['i']];
				if (obj){
					setups[setups.length] = obj['setup'];
				}
			}
			
			tcfg['theme_advanced_buttons1'] = buttons;
			
			tcfg['setup'] = function(ed){
				for (var i=0;i<setups.length;i++){
					var f = setups[i]; 
					if (typeof f == 'function'){ f(ed); }
				}
			}
			
			this._tinymceConfig = tcfg;
			this.tinyMCE_initialize();
		}, 
		tinyMCE_initialize: function(){
			if (typeof tinyMCE == 'undefined'){
				var __self = this;
				if (this._tinyLoad){ return; }
				this._tinyLoad = false;
				
				Brick.Loader.add({
					ext: [{name: "tinymce"}],
			    onSuccess: function() {
						__self.tinyMCE_initialize();
					}
				});
				return ;
			}
			tinyMCE.init(this._tinymceConfig);
			tinyMCE.execCommand( 'mceAddControl', true, TId['simple']['taid']);
			this._isTinyMCEInit = true;
		},
		destroy: function(){
			if (this.useTinyMCE){
				tinyMCE.execCommand( 'mceRemoveControl', true, TId['simple']['taid']);
			}
		},
		insertValue: function(text){ 
			if (this.isHtmlMode){
				var editor = this.textarea;
				if (document.selection) { // ie
					editor.focus();  
					sel = document.selection.createRange();  
					sel.text = text;  
				} else if (editor.selectionStart || editor.selectionStart == '0') { // firefox, opera  
					var startPos = editor.selectionStart;  
					var endPos = editor.selectionEnd;  
					editor.value = editor.value.substring(0, startPos) + text + editor.value.substring(endPos, editor.value.length);  
				} else { // over  
					editor.value += text;  
				}  
			}else{
				tinyMCE.execCommand('mceInsertContent', false, text);
			}
		}, 
		getValue: function(){
			var text = "";
			if (this.useTinyMCE){
				text = tinyMCE.get(TId['simple']['taid']).getContent();
				this.textarea.value = text;
			}
			return this.textarea.value;
		}
	}
	
	Brick.util.Editor.Simple = Simple;
	
})();
/**/

/* * * * * * * * * * * * * * * TinyMCE Конфигуратор * * * * * * * * * * * * */
(function(){
	
	var whilelog = false;
	var openFileManager = function(callback){
		if (typeof Brick.FM == 'undefined'){
			if (whilelog){ alert('OPS!'); return; }
			wWait.show();
			whilelog = true;
			Brick.Loader.add({
				mod:[{name: 'filemanager', files: ['filemanager.js']}],
		    onSuccess: function(){
					openFileManager(callback);
				}
			});
		}else{
			wWait.hide();
			Brick.FM.Browser.open(callback);
		}
	};

	
	Brick.util.Editor.TinyMCE = function(){
		
		var multi = {
			mode : "exact",
			theme : "advanced",
			language: "ru",
			debug: false,
			plugins : "safari,pagebreak,style,layer,table,save,advhr,advimage,advlink,emotions,iespell,insertdatetime,preview,media,searchreplace,print,contextmenu,paste,directionality,fullscreen,visualchars,nonbreaking",
			theme_advanced_buttons1 : "bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,formatselect,bullist,numlist,|,link,unlink,anchor,image,cleanup,code,|,forecolor,backcolor,|,brickfm",
			theme_advanced_buttons2 : "",
			theme_advanced_buttons3 : "",
			theme_advanced_buttons4 : "",
			theme_advanced_toolbar_location : "external",
			theme_advanced_toolbar_align : "left",
			theme_advanced_resizing : true,
			theme_advanced_resize_horizontal : false,
			convert_urls : false,
			setup : function(ed) {
				// Add a custom button
				ed.addButton('brickfm', {
				title : 'File Manager',
					image : '/modules/filemanager/js/images/folder.png',
					onclick : function() {
						openFileManager(function(file){
							var linker = new Brick.FM.Linker(file);
							ed.selection.setContent(linker.getHTML());
						});
					}
				});
			}
		};

		var comment = {
				mode : "exact",
				theme : "advanced",
				language: "ru",
				debug: false,
				plugins : "",
				cleanup: true,
				width: '600',
				theme_advanced_buttons1 : "bold,italic,underline,strikethrough,|,bullist,numlist,|,link,unlink,image,code",
				theme_advanced_buttons2 : "",
				theme_advanced_buttons3 : "",
				theme_advanced_buttons4 : "",
				theme_advanced_toolbar_location : "top",
				theme_advanced_toolbar_align : "left",
				theme_advanced_resizing : true,
				theme_advanced_resize_horizontal : false,
				convert_urls : false
			};

		var page = {
			mode : "exact",
			theme : "advanced",
			language: "ru",
			debug: false,
			plugins : "",
			cleanup: true,
			width: '600px',
			height: '300px',
			theme_advanced_buttons1 : "bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,formatselect,bullist,numlist,|,link,unlink,anchor,image,cleanup,code,|,forecolor,backcolor,|,brickfm",
			theme_advanced_buttons2 : "",
			theme_advanced_buttons3 : "",
			theme_advanced_buttons4 : "",
			theme_advanced_toolbar_location : "top",
			theme_advanced_toolbar_align : "left",
			theme_advanced_resizing : true,
			theme_advanced_resize_horizontal : false,
			convert_urls : false,
			setup : function(ed) {
				// Add a custom button
				ed.addButton('brickfm', {
					title : 'File Manager',
						image : '/modules/filemanager/js/images/folder.png',
						onclick : function() {
							openFileManager(function(file){
								var linker = new Brick.FM.Linker(file);
								ed.selection.setContent(linker.getHTML());
							});
						}
				});
			}
		};

		
		var clone = function(o){
			var ret = {}, s;
			for (s in o)
				ret[s] = o[s];
			return ret;
		};
		
		return {
			get: function(name){
				switch(name){
				case 'multi':
					return clone(multi);
					break;
				case 'comment':
					return clone(comment);
					break;
				case 'page':
					return clone(page);
					break;
				}
				return {};
			}
		} 
	}();
	
	
})();
	
})();