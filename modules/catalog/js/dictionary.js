/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('Catalog.Data');
	Brick.namespace('Catalog.Dictionary');

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
				 {name: 'catalog', files: ['lib.js', 'dicttable.js']}
				],
    onSuccess: function() {
			DATA = Brick.Catalog.Data;
			
			T = Brick.util.Template['catalog']['dictionary'];
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
			if (!Brick.Catalog.Data[mmPrefix]){
				Brick.Catalog.Data[mmPrefix] = new Brick.util.Data.DataSet('catalog', mmPrefix);
			}

			var __self = this;
			container.innerHTML = T['panel'];
			
			var ds = Brick.Catalog.Data[mmPrefix];
			this.ds = {
				'dictionary': ds.get(DATA.TN_DICT_LIST, true)
			}
			this.ds['dictionary'].onUpdate.subscribe(this.onDictUpdate, this, true);
			
			if (this.ds['dictionary'].isFill()){
				this.render();
			}
		},
		onDictUpdate: function(){
			this.render();
		},
		onClick: function(el){
			if (this.activeDict){
				if (this.activeDict.onClick(el)){ return true; }
			}
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
			var row = this.ds[DATA.TN_DICT_LIST].find('id', id); 
			this.activeEditor = new Editor(row, this.mmPrefix);
		},
		edit: function(obj){
			this.activeEditor = new Editor(obj, this.mmPrefix);
		},
		showDictionary: function(id){
			if (this.activeDict){
				if (this.activeDict.dictid == id){
					return;
				}else{
					this.activeDict.destroy();
				}
			}
			this.activeDict = new Brick.Catalog.Dictionary.Table.Manager(Dom.get(TId['panel']['dictpanel']), id, this.mmPrefix);
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
			var rtbl = [];
			if (o['act'] == 'remove' || o['act'] == 'restore'){
				// rtbl = ['eltype'];
			}else{
				// rtbl = ['eltype', 'eloption', 'eloptgroup'];
			}
			rtbl = [DATA.TN_DICT_LIST];
			
			var ds = Brick.Catalog.Data[this.mmPrefix]; 
			ds.setReloadFlag(rtbl);
			
			var dict = ds.loader.getJSON();
			
			if (!L.isNull(dict)){
				o = L.merge(dict, o);
			}
			var __self = this;
			BC.sendCommand('catalog', 'js_dictionary', { json: o });
		},
		render: function(){
			var data = this.ds['dictionary']['data'];
			var lst = "", i, s, di;
			for (i=0;i<data.length;i++){
				di = data[i];
				
				s = di['dd']>0 ? T['rowdel'] : T['row'];
				s = tSetVar(s, 'id', di['id']);
				s = tSetVar(s, 'tl', di['tl']);
				s = tSetVar(s, 'dsc', di['dsc']);
				lst += s;
			}
			
			lst = tSetVar(T['table'], 'rows', lst);

			var div = Dom.get(TId['panel']['table']);
			elClear(div);
			div.innerHTML = lst;
		}
	}
	Brick.Catalog.Dictionary.Manager = manager;

	var Editor = function(obj, mmPrefix){
		this.mmPrefix = mmPrefix;
		this.obj = L.merge({
			id: 0, nm: "", tl: "", dsc: ""
		}, obj || {});
		
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
			this.setelv('descript', o['dsc']);
			
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
					'id': this.obj['id'],
					'nm': this.elv('name'),
					'tl': this.elv('title'),
					'dsc': this.elv('descript')
				}
			};
			var ds = Brick.Catalog.Data[this.mmPrefix]; 
			ds.setReloadFlag([DATA.TN_DICT_LIST]);
			var dict = ds.loader.getJSON();
			
			if (!L.isNull(dict)){
				o = L.merge(dict, o);
			}
			
			var __self = this;
			BC.sendCommand('catalog', 'js_dictionary', { json: o,
				success: function(){ __self.close(); }
			});
		}
	});
	
	Brick.Catalog.Dictionary.Editor = Editor;

})();
};
})();