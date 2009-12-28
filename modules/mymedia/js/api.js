/*
@version $Id: api.js 55 2009-09-20 11:57:32Z roosit $
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { yahoo: ['dom'] };
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace;
	
	/**
	 * API модуля 
	 * 
	 * @class API
	 * @extends Brick.Component.API
	 * @static
	 */
	var API = NS.API;
	
	API.runApplication = function(){
		API.fn('album', function(){
			new NS.MyAlbumListPanel();
			API.dsRequest();
		});
	};
	
	API.showUploadPanel = function(albumid, callback){
		API.fn('upload', function(){
			new NS.UploadFilesPanel(albumid, callback);
		});
	};
	
	API.showAlbumPanel = function(albumid){
		API.fn('album', function(){
			new NS.AlbumPanel(albumid);
			API.dsRequest();
		});
	};
	
	API.showViewerPanel = function(albumid, fileid){
		API.fn('viewer', function(){
			new NS.FileViewerPanel(albumid, fileid);
			API.dsRequest();
		});
	};
	
	/**
	 * Запросить DataSet произвести обновление данных.
	 * 
	 * @method dsRequest
	 */
	API.dsRequest = function(){
		if (!Brick.objectExists('Brick.mod.mymedia.data')){
			return;
		}
		Brick.mod.mymedia.data.request(true);
	};
};
