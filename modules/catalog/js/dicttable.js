/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('Catalog.Data');
	Brick.namespace('Catalog.Dictionary.Table');

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
				 {name: 'catalog', files: ['lib.js']}
				],
    onSuccess: function() {
			DATA = Brick.Catalog.Data;
			
			T = Brick.util.Template['catalog']['dicttable'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);

			moduleInitialize();
			delete moduleInitialize;
	  }
	});
	
var moduleInitialize = function(){

(function(){
	
	var manager = function(container, dictid, mmPrefix){
		this.init(container, dictid, mmPrefix);
	};
	manager.prototype = {
		init: function(container, dictid, mmPrefix){
			this.mmPrefix = mmPrefix;
			this.dictid = dictid;
			if (!Brick.Catalog.Data[mmPrefix]){
				Brick.Catalog.Data[mmPrefix] = new Brick.util.Data.DataSet('catalog', mmPrefix);
			}

			var __self = this;
			container.innerHTML = T['panel'];
			
			var ds = Brick.Catalog.Data[mmPrefix];
			this.ds = {
				'dictlist': ds.get(DATA.TN_DICT_LIST, true),
				'dicttable': ds.get(DATA.TN_DICTICTIONARY+dictid, true)
			}
			this.ds['dicttable'].onUpdate.subscribe(this.onDictUpdate, this, true);
			
			if (this.ds['dicttable'].isFill()){
				this.render();
			}else{
				ds.loader.request();
			}
		},
		destroy: function(){
			this.ds['dicttable'].onUpdate.unsubscribe(this.onDictUpdate, this);
		},
		onDictUpdate: function(){ this.render(); },
		onClick: function(el){
			if (el.id == TId['panel']['badd']){
				this.edit();
				return true;
			}else if (el.id == TId['panel']['rcclear']){
				this.recyclerClear();
				return true;
			}else{
				var prefix = el.id.replace(/([0-9]+$)/, '');
				var numid = el.id.replace(prefix, "");
				
				switch(prefix){
				case (TId['row']['edit']+'-'):
					this.editById(numid);
					return true;
				case (TId['row']['values']+'-'):
					this.showDictionary(numid);
					return true;
				case (TId['row']['remove']+'-'):
					this.remove(numid);
					return true;
				case (TId['rowdel']['restore']+'-'):
					this.restore(numid);
					return true;
				}
			}
			return false;
		},
		editById: function(id){
			var row = this.ds['dicttable'].find('id', id); 
			this.activeEditor = new Editor(this.dictid, row, this.mmPrefix);
		},
		edit: function(obj){
			this.activeEditor = new Editor(this.dictid, obj, this.mmPrefix);
		},
		remove: function(id){
			this._query({'act': 'remove', 'data':{'id': id}});
		},
		restore: function(id){
			this._query({'act': 'restore', 'data':{'id': id}});
		},
		recyclerClear: function(){
			this._query({'act': 'rcclear'});
		},
		_query: function(o){
			o['dictid'] = this.dictid;
			var ds = Brick.Catalog.Data[this.mmPrefix]; 
			ds.setReloadFlag(this.ds['dictlist'].name);
			
			var dict = ds.loader.getJSON();
			if (!L.isNull(dict)){o = L.merge(dict, o);}
			var __self = this;
			BC.sendCommand('catalog', 'js_dicttable', { json: o });
		},
		render: function(){
			var lbl = Dom.get(TId['panel']['dictname']);
			lbl.innerHTML = this.ds['dictlist'].find('id', this.dictid)['tl'];
			var data = this.ds['dicttable']['data'];
			var lst = "", i, s, di;
			for (i=0;i<data.length;i++){
				di = data[i];
				
				s = di['dd']>0 ? T['rowdel'] : T['row'];
				s = tSetVar(s, 'id', di['id']);
				s = tSetVar(s, 'tl', di['tl']);
				lst += s;
			}
			
			lst = tSetVar(T['table'], 'rows', lst);

			var div = Dom.get(TId['panel']['table']);
			elClear(div);
			div.innerHTML = lst;
		}
	}
	Brick.Catalog.Dictionary.Table.Manager = manager;

	var Editor = function(dictid, obj, mmPrefix){
		this.mmPrefix = mmPrefix;
		this.obj = L.merge({dictid: dictid, id: 0, nm: "", tl: ""}, obj || {});
		Editor.superclass.constructor.call(this, T['editor']);
	}
	YAHOO.extend(Editor, Brick.widget.Panel, {
		initTemplate: function(t){
			return t;
		},
		onLoad: function(){
			var o = this.obj;
			
			var elName = this.el('name'); 
			this.setelv('name', o['nm']);
			this.setelv('title', o['tl']);
			
			if (o['id']>0){
				name.disabled = "disabled";
			}
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
			var o = {
				'act': 'save',
				'data': {
					'dictid':  this.obj['dictid'],
					'id': this.obj['id'],
					'nm': this.elv('name'),
					'tl': this.elv('title')
				}
			};
			var ds = Brick.Catalog.Data[this.mmPrefix]; 
			ds.setReloadFlag([DATA.TN_DICTICTIONARY+this.obj['dictid']]);
			var dict = ds.loader.getJSON();
			
			if (!L.isNull(dict)){
				o = L.merge(dict, o);
			}
			
			var __self = this;
			BC.sendCommand('catalog', 'js_dicttable', { json: o,
				success: function(){ __self.close(); }
			});
		}
	});
	
	Brick.Catalog.Dictionary.Table.Editor = Editor;

})();
};
})();