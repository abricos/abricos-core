/*
* @version $Id: filemanager.js 189 2009-11-25 15:24:22Z roosit $
* @copyright Copyright (C) 2008 Abricos All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
var Component = new Brick.Component();
Component.requires = {};
Component.entryPoint = function(){
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var NS = this.namespace;
	
	var tSetVar = Brick.util.Template.setProperty;
	var tSetVarA = Brick.util.Template.setPropertyArray;
	
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
	};
	NS.File = File;

	var Folder = function(d){this.init(d);};
	Folder.prototype = {
		init: function(d){
			this.id = d['id'];
			this.pid = d['pid'];
			this.name = d['fn'];
			this.phrase = d['ph'];
			this.type = 'folder';
		}
	};
	NS.Folder = Folder;

	
	var Linker = function(file){
		this.init(file);
	};
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
					if (isz.h>0){h = isz.h; height=isz.h;}
				}
				var src = this._getSrc(f.id, f.name, w, h);
				var t = "<img {v#id} src='{v#src}' title='{v#title}' alt='{v#alt}' width='{v#width}' height='{v#height}' />";
				var html = tSetVarA(t, {
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
	
	NS.Linker = Linker;
	
})();

};

