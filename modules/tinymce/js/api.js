/*
@version $Id: api.js 132 2009-11-02 09:05:07Z roosit $
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module TinyMCE
 * @namespace Brick.mod.tinymce
 */

var TINYMCE_VERSION = '3.2.7'; 

var Component = new Brick.Component();
Component.requires = {
	ext: [{
		name: 'tinymce',
		fullpath: '/modules/tinymce/lib/'+TINYMCE_VERSION+'/tiny_mce_gzip.js',
		type: 'js'
	}]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace,
		API = NS.API;

	/**
	 * API модуля TinyMCE
	 * @class API
	 * @static
	 */
	
	/**
	 * Загрузить редактор TinyMCE, по окончанию загрузки выполнить callback.
	 * 
	 * @method loadTinyMCE
	 * @static
	 * @param {Function} callback Функция, которая будет выполнена по окончанию 
	 * загрузки редактора TinyMCE.
	 */
	API.loadTinyMCE = function(callback){
		
		var loadComplete = function(){
			NS.Loader.loadEvent.unsubscribe(loadComplete);
			callback();
		};
		NS.Loader.loadEvent.subscribe(loadComplete);
		NS.Loader.start();
	};
	
	/**
	 * Создать текстовый редактор <a href="Brick.widget.Editor.html">Brick.widget.Editor</a>.
	 * 
	 * @method initEditor
	 * @static
	 * @param {Object} obj Объект параметров: 
	 * obj.element - идентификатор HTML элемента TEXTAREA,
	 * obj.onSuccess - обработчик события окончания загрузки визуального редактора, в параметрах 
	 * передается объект экземпляра класса <a href="Brick.widget.Editor.html">Brick.widget.Editor</a>.
	 */
	API.initEditor = function(obj){
		obj = obj || {};
		Brick.Component.API.fireFunction('tinymce', 'v_editor', function(){
			var Editor = Brick.widget.Editor;
			var editor = new Editor(obj.element, {
				'mode': Editor.MODE_VISUAL,
				'veName': 'tinymce'
			});
			
			if (L.isFunction(obj.onSuccess)){
				obj.onSuccess(editor);
			}
		});
	};

(function(){
	/**
	 * Загрузчик редактора TinyMCE.
	 * @class Loader
	 * @static
	 */
	var Loader = {};
	var _isloadlib = false;
	
	/**
	 * Начать загрузку текстового редактора TinyMCE.
	 * 
	 * @method start
	 * @static
	 */
	Loader.start = function(){
		if (_isloadlib){
			Loader.loadEvent.fire();
			return;
		}
		tinyMCE_GZ.init({
			baseURL: '/modules/tinymce/lib/'+TINYMCE_VERSION,
			themes : 'advanced',
			plugins : 'safari,pagebreak,style,layer,table,save,advhr,advimage,advlink,'+
				'emotions,iespell,insertdatetime,preview,media,searchreplace,print,'+
				'contextmenu,paste,directionality,fullscreen,noneditable,visualchars,'+
				'nonbreaking,xhtmlxtras',
			languages : 'en,ru', 
			disk_cache : true, 
			version: TINYMCE_VERSION
		}, 
		function() {
			_isloadlib = true;
			Loader.loadEvent.fire();
		});
	};
	/**
	 * Событие окончания загрузки редактора TinyMCE.
	 * 
	 * @event loadEvent
	 * @static
	 */
	Loader.loadEvent = new YAHOO.util.CustomEvent('loadEvent');
	
	NS.Loader = Loader;
	
})();	
	
};
