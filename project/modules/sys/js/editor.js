/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
(function(){

	Brick.namespace('widget.editor');

	var Dom = YAHOO.util.Dom, 
		E = YAHOO.util.Event,	
		L = YAHOO.lang,
		wWait = Brick.widget.WindowWait;

	Brick.Loader.add({
		mod:[{name: 'filemanager', files: ['api.js']}],
    onSuccess: function() { }
	});
	
	var Bwe = Brick.widget.editor;
	
(function(){
	
	Bwe.tinymce = {
		'ButtonGroup': {
			'page': "bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,formatselect,bullist,numlist,|,link,unlink,anchor,image,|,forecolor,backcolor,|,brickfm,|,brickhtml,code",
			'comment': "bold,italic,underline,strikethrough,|,bullist,numlist,|,link,unlink,image,code"
		},
		'Config': {
			mode : "exact", 
			theme : "advanced", language: "ru", debug: false, 
			plugins : "paste",
			paste_auto_cleanup_on_paste: true,
			cleanup: true,
			theme_advanced_buttons1 : "",
			theme_advanced_buttons2 : "", theme_advanced_buttons3 : "", theme_advanced_buttons4 : "",
      paste_auto_cleanup_on_paste : true,
			theme_advanced_toolbar_location : "top",
			theme_advanced_toolbar_align : "left",
			theme_advanced_resizing : true,
			theme_advanced_resize_horizontal : false,
			convert_urls : false
		} 
	};
	
	var BrickButton = [];
	BrickButton['brickfm'] = {
		setup: function(ed){
			ed.addButton('brickfm', {
				title : 'File Manager',
					image : '/modules/filemanager/js/images/icon.gif',
					onclick : function() {
						Brick.mod.filemanager.show(function(data){
							ed.selection.setContent(data.html);
						});
					}
			});
		}
	};
	
	var textareaid = '1';
	
	var Textarea = function(el, config){ this.init(el, config); };
	Textarea.prototype = {
		init: function(el, config){
		
			var _cfg = L.merge({
				'width': '400px', 'height': '200px', 'buttonsgroup': 'comment', 'buttons': '',
				'value': '', 'mode': 'visual' // or 'html'
			}, config || {});
			_cfg['base'] = L.merge(Bwe.tinymce.Config, _cfg['base'] || {});
		
			var container = L.isString(el) ? Dom.get(el) : el;
			var _textareaid = 'bkwe_ta_'+(textareaid++);
			container.innerHTML = "<textarea id='"+_textareaid+"'></textarea>";

			var _ta = Dom.get(_textareaid);
			_ta.style['width'] = _cfg['width'];
			_ta.style['height'] = _cfg['height'];
			_ta.value = _cfg.value;
			
			var _tinyConfig = _cfg['base'];
			_tinyConfig['width'] = _cfg['width'];
			_tinyConfig['height'] = _cfg['height'];
			
			var buttons = Bwe.tinymce.ButtonGroup[_cfg['buttonsgroup']] || _cfg['buttons'];
			var setups = [];
			var abtns = buttons.split(','), i;
			for (i=0;i<abtns.length;i++){
				var obj = BrickButton[abtns[i]];
				if (obj){
					setups[setups.length] = obj['setup']; 
				}
			}
			_tinyConfig['theme_advanced_buttons1'] = buttons;
			_tinyConfig['setup'] = function(ed){
				for (var i=0;i<setups.length;i++){
					var f = setups[i];
					if (typeof f == 'function'){ f(ed); }
				}
			}
			
			/**
			 * Текущий режим отображения редактора 
			 */
			var _mode = _cfg['mode'];
			var _isLoadTiny = function(){ return typeof tinyMCE != 'undefined'; };
			
			var _initTinyMCE = function(){
				tinyMCE.init(_tinyConfig);
				tinyMCE.execCommand('mceAddControl', true, _textareaid);
			};
			
			this.setMode = function(mode){
				_mode = mode == 'visual' ? 'visual' : 'html';
				if (_mode == 'visual'){
					if (!_isLoadTiny()){
						Brick.Loader.add({
							ext: [{name: "tinymce"}],
					    onSuccess: function() {
								_initTinyMCE();
							}
						});
					}else{ _initTinyMCE(); }
				}else{
					tinyMCE.execCommand( 'mceRemoveControl', true, _textareaid);
				}
			};
			
			this.destroy = function(){
				if (_mode == 'visual'){
					tinyMCE.execCommand( 'mceRemoveControl', true, _textareaid);
				}
			};
			
			this.insertValue = function(text){ 
				if (_mode == 'html'){
					var editor = _ta;
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
			};
			
			this.getValue = function(){
				var text = "";
				if (_mode == 'visual'){
					text = tinyMCE.get(_textareaid).getContent();
					_ta.value = text;
				}
				return _ta.value;
			};
			
			this.setMode(_mode);
		}
	};
	
	Brick.widget.editor.TinyMCE = Textarea;
})();
})();