/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){

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
		yahoo: ['json'],
		mod:[
		     {name: 'sys', files: ['form.js','data.js']},
		     {name: 'catalog', files: ['lib.js','element.js']}
		    ],
    onSuccess: function() {

			DATA = Brick.Catalog.Data;
			
			T = Brick.util.Template['catalog']['catalog'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);

			Brick.util.CSS.update(T['css']);

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

			container.innerHTML = T['panel'];

			if (!Brick.Catalog.Data[mmPrefix]){
				Brick.Catalog.Data[mmPrefix] = new Brick.util.data.byid.DataSet('catalog', mmPrefix);
			}
			var ds = Brick.Catalog.Data[mmPrefix];
			
			this.tables = {
				'catalog': 		ds.get('catalog', true),
				'catalogcfg': ds.get('catalogcfg', true),
				'eltype': 		ds.get('eltype', true),
				'eloption': 	ds.get('eloption', true),
				'eloptgroup': ds.get('eloptgroup', true)
			};

			var __self = this;
			ds.onComplete.subscribe(function(type, args){
				var f = args[0];
				if (f.check(['catalog', 'catalogcfg'])){
					__self.render();
				}
			});
		},
		onCatalogUpdate: function(){
			this.render();
		},
		render: function(){
			var rows = this.tables['catalog'].getRows().filter({'pid': 0});
			
			var lst = "";
			rows.foreach(function(row){
				lst += this.buildrow(row, 0);
			}, this);
			var div = Dom.get(TId['panel']['list']);
			elClear(div);
			div.innerHTML = lst;
		},
		buildrow: function(row, level){
			var t = T['item'];
			
			var badd = (level >= this.tables['catalogcfg'].getRows().count()-1) ? T['bcatempty'] : T['bcatadd'];
			t = tSetVar(t, 'badd', badd);
			
			t = tSetVar(t, 'id', row.cell['id']);
			t = tSetVar(t, 'level', level);
			t = tSetVar(t, 'tl', row.cell['tl']);
			
			var lst="", rows = this.tables['catalog'].getRows().filter({'pid': row.cell['id']});
			rows.foreach(function(row){
				lst += this.buildrow(row, level+1);
			}, this);
			
			if (lst.length > 0){
				lst = tSetVar(T['list'], 'list', lst);
			}
			
			t = tSetVar(t, 'child', lst);
			return t;
		},
		destroy: function(){ },
		onClick: function(el){
			if (this.activeElements){
				if (this.activeElements.onClick(el)){return true;}
			}
			if (el.id == TId['panel']['badd']){ this.add(0); return true; }

			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['item']['bview']+'-'): this.showElements(numid); return true;
			case (TId['bcatadd']['badd']+'-'): this.add(numid); return true;
			case (TId['item']['bedit']+'-'): this.edit(numid); return true;
			case (TId['item']['bremove']+'-'): this.remove(numid); return true;
			}
			return false;
		},
		showElements: function(catalogid){
			if (this.activeElements){
				if (this.activeElements.catalogid == catalogid){
					return;
				}else{
					this.activeElements.destroy();
				}
			}
			this.activeElements = new Brick.Catalog.Element.Manager(Dom.get(TId['panel']['elements']), catalogid, this.mmPrefix);
			Brick.Catalog.Data[this.mmPrefix].request();
		},
		add: function(pid){
			var row = this.tables['catalog'].newRow();
			this.tables['catalog'].getRows().add(row);
			row.cell['pid'] = pid;
			this.activeEditor = new Editor(row, this.mmPrefix);
		},
		edit: function(id){
			var row = this.tables['catalog'].getRows().getById(id);
			this.activeEditor = new Editor(row, this.mmPrefix);
		},
		remove: function(id){
			var __self = this;
			var row = this.tables['catalog'].getRows().getById(id);
			var data = Brick.Catalog.Data[this.mmPrefix]; 
			new CatalogRemoveMsg(row, function(){
				row.remove();
				__self.tables['catalog'].applyChanges();
				data.request();
			});
		}
	}

	Brick.Catalog.Manager = manager;
	
	
	var CatalogRemoveMsg = function(row, callback){
		this.row = row;
		this.callback = callback;
		CatalogRemoveMsg.superclass.constructor.call(this, T['itemremovemsg']);
	};
	YAHOO.extend(CatalogRemoveMsg, Brick.widget.Panel, {
		initTemplate: function(t){ return tSetVar(t, 'info', this.row.cell['tl']); },
		onClick: function(el){
			var tp = TId['itemremovemsg'];
			switch(el.id){
			case tp['bremove']: this.close(); this.callback(); return true;
			case tp['bcancel']: this.close(); return true;
			}
			return false;
		}
	});
	
	
	var Editor = function(row, mmPrefix){
		this.mmPrefix = mmPrefix;
		this.row = row;
		Editor.superclass.constructor.call(this, T['editor']);
	};

	YAHOO.extend(Editor, Brick.widget.Panel, {
		initTemplate: function(t){
			return t;
		},
		onLoad: function(){
			var o = this.row.cell;
			this.setelv('name', o['nm']);
			this.setelv('title', o['tl']);
			this.setelv('descript', o['dsc']);
		},
		el: function(name){
			return Dom.get(TId['editor'][name]);
		},
		elv: function(name){
			return Brick.util.Form.getValue(this.el(name));
		},
		setelv: function(name, value){
			Brick.util.Form.setValue(this.el(name), value);
		},
		nameTranslite: function(){
			var el = this.el('name');
			var title = this.el('title');
			if (!el.value && title.value){
				el.value = Brick.util.Translite.ruen(title.value);
			}
		},
		onClick: function(el){
			var tp = TId['editor']; 
			switch(el.id){
			case tp['name']:
				this.nameTranslite();
				return true;
			case tp['bcancel']: this.close(); return true;
			case tp['bsave']: this.save(); return true;
			}
		},
		save: function(){
			this.nameTranslite();
			this.row.update({
				'nm': this.elv('name'),
				'tl': this.elv('title'),
				'dsc': this.elv('descript')
			});
			var ds = Brick.Catalog.Data[this.mmPrefix]; 
			ds.get('catalog').applyChanges();
			ds.request();
			this.close();
		}
	});
	
	Brick.Catalog.Editor = Editor;

})();
};
})();