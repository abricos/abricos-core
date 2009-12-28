/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('Catalog.Structure');

	var T, J, TId;

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		W = YAHOO.widget,
		J = YAHOO.lang.JSON;

	var BC = Brick.util.Connection;
	var DATA;

	var dateExt = Brick.dateExt;
	var elClear = Brick.elClear;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
		mod:[{name: 'sys', files: ['form.js','data.js']}],
    onSuccess: function() {
			
			DATA = Brick.Catalog.Data;
			
			T = Brick.util.Template['catalog']['catstruct'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);

			moduleInitialize();
			delete moduleInitialize;
	  }
	});
	
var moduleInitialize = function(){
	
(function(){
	
	var manager = function(container, mmPrefix){
		this.init(container, mmPrefix);
	};
	manager.prototype = {
		init: function(container, mmPrefix){
			this.mmPrefix = mmPrefix;
			var __self = this;
			container.innerHTML = T['panel'];
			this.levels = [];
			
			if (!Brick.Catalog.Data[mmPrefix]){
				Brick.Catalog.Data[mmPrefix] = new Brick.util.data.byid.DataSet('catalog', mmPrefix);
			}
			var ds = Brick.Catalog.Data[mmPrefix];
			
			this.tables = {
				'catalogcfg': ds.get('catalogcfg', true),
				'catalog': 		ds.get('catalog', true)
			};
			
			ds.onComplete.subscribe(function(type, args){
				var f = args[0];
				if (f.check(['catalogcfg'])){
					__self.render();
				}
			});
		},
		onClick: function(el){
			if (el.id == TId['panel']['treerender']){
				this.build();
				return true;
			}else if (el.id == TId['panel']['bsave']){
				this.save();
				return true;
			}else{
				for (var i=0;i<this.levels.length;i++){
					if (this.levels[i].onClick(el)){
						return true;
					}
				}
			}
			return false;
		},
		build: function(){
			var rows = this.tables['catalogcfg'].getRows();
			
			var i, di, data = rows.getArray();

			var viscnt = rows.filter({'st': 0}).count();
			
			var count = Dom.get(TId['panel']['levelcount']).value*1;

			if (count > viscnt){
				for (i=0;i<count;i++){
					if (i >= data.length){
						rows.add(new Brick.util.data.byid.Row({
							'lvl': i, 'lvltp': 0,
							'tl':'', 'nm':'', 'dsc':'', 'st': 0
						}));
						data = rows.getArray();
					}
					data[i].update({'st': 0});
				}
			}else if (viscnt > count){
				for (i=count;i<data.length;i++){
					data[i].update({'st': 1});
				}
			}
			this.render();
		},
		render: function(){
			var rows = this.tables['catalogcfg'].getRows();

			rows = rows.filter({'st': '0'});
			var cnt = rows.count();
			Dom.get(TId['panel']['levelcount']).value = cnt;
			var i, div, lst = "", t;
			var nn = [];

			for (i=0;i<10;i++){
				div = Dom.get(TId['cattreerow']['level']+'-'+i);
				if (i < cnt){
					if (div){ 
						div.style.display = '';
					}else{
						nn[nn.length] = i;
						lst += tSetVar(T['cattreerow'], 'lvl', i);
					}
				}else{
					if (div){div.style.display = 'none';} else {break;}
				}
			}
			var container = Dom.get(TId['panel']['levellist']);
			container.innerHTML += lst;
			
			var data = rows.getArray();
			for (i=0;i<nn.length;i++){
				this.levels[this.levels.length] = new catTreeLevel(this, nn[i], data[nn[i]]);
			}
			
			for (i=0;i<cnt;i++){
				this.levels[i].update(data[i]);
			}
		},
		save: function(){
			for (var i=0;i<this.levels.length;i++){
				this.levels[i].save();
			}
			this.tables['catalogcfg'].applyChanges();
			Brick.Catalog.Data[this.mmPrefix].request();
		}
	}
	
	Brick.Catalog.Structure.Manager = manager;

	var catTreeLevel = function(parent, level, data){
		this.init(parent, level, data);
	}
	catTreeLevel.prototype = {
		init: function(parent, level, data){
			this.parent = parent;
			this.level = level;
			this.data = data;
		},
		elId: function(name){
			return this.level+'-'+TId['cattreerow'][name];
		},
		el: function(name){ 
			return Dom.get(this.elId(name)); 
		},
		update: function(data){
			this.data = data;
			this.el('type').value = this.data.cell['lvltp'];
			this.el('name').value = this.data.cell['tl'];
			this.el('descript').value = this.data.cell['dsc'];
		},
		onClick: function(el){
			if (el.id == this.elId('btsadd')){
				return true;
			}
			return false;
		}, 
		save: function(){
			var row = this.data;
			row.update({
				'lvltp': this.el('type').value,
				'tl': this.el('name').value,
				'dsc': this.el('descript').value
			});
		}
	}

})();
};
})();