/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('Catalog.Data');
	Brick.namespace('Catalog.Element.Type');

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
		     {name: 'catalog', files: ['lib.js','eloption.js']}
		    ],
    onSuccess: function() {
			DATA = Brick.Catalog.Data;
			
			T = Brick.util.Template['catalog']['eltype'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);

			moduleInitialize();
			delete moduleInitialize;
	  }
	});
	
var moduleInitialize = function(){

/* * * * * * * * * * * * Element Type * * * * * * * * * * * */
(function(){
	
	/* * * * * * * * * Список типов элемента каталога * * * * * * * */
	var manager = function(container, mmPrefix){
		this.init(container, mmPrefix);
	};
	manager.prototype = {
		init: function(container, mmPrefix){
			this.mmPrefix = mmPrefix;
			if (!DATA[mmPrefix]){
				DATA[mmPrefix] = new Brick.util.data.byid.DataSet('catalog', mmPrefix);
			}

			var __self = this;
			container.innerHTML = T['panel'];
			
			var ds = DATA[mmPrefix];
			this.tables = {
				'eltype': ds.get('eltype', true),
				'eloption': ds.get('eloption', true),
				'eloptgroup': ds.get('eloptgroup', true)
			};

			ds.onComplete.subscribe(this.onDSUpdate, this, true);
			if (ds.isFill(this.tables)){
				this.render();
			}
		},
		onDSUpdate: function(type, args){
			if (args[0].check(['eltype'])){ this.render(); }
		},
		destroy: function(){
			 DATA[this.mmPrefix].onComplete.unsubscribe(this.onDSUpdate, this);
		},
		onClick: function(el){
			if (this.activeOption){
				if (this.activeOption.onClick(el)){ return true; }
			}
			
			if (el.id == TId['panel']['badd']){
				this.add();
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
				case (TId['row']['conf']+'-'):
					this.showOption(numid);
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
		add: function(){
			var row = this.tables['eltype'].newRow();
			this.edit(row);
		},
		editById: function(id){
			var eltype = this.tables['eltype'].getRows().getById(id);
			this.activeEditor = new Editor(eltype, this.mmPrefix);
		},
		edit: function(row){
			this.activeEditor = new Editor(row, this.mmPrefix);
		},
		showOption: function(id){
			if (this.activeOption){
				if (this.activeOption.eltypeid == id){
					return;
				}else{
					this.activeOption.destroy();
				}
			}
			this.activeOption = new Brick.Catalog.Element.Type.Option.Manager(Dom.get(TId['panel']['optpanel']), id, this.mmPrefix);
			DATA[this.mmPrefix].request();
		},
		remove: function(id){ this._query({'act': 'remove', 'data':{'id': id}}); },
		restore: function(id){ this._query({'act': 'restore', 'data':{'id': id}}); },
		recyclerClear: function(){ this._query({'act': 'rcclear'}); },
		_query: function(o){
			var rtbl = [];
			if (o['act'] == 'remove' || o['act'] == 'restore'){
				rtbl = ['eltype'];
			}else{
				rtbl = ['eltype', 'eloption', 'eloptgroup'];
			}
			var ds = DATA[this.mmPrefix];
			
			ds.setReloadFlag(rtbl);
			
			var dict = ds.loader.getJSON();
			
			if (!L.isNull(dict)){
				o = L.merge(dict, o);
			}
			var __self = this;
			BC.sendCommand('catalog', 'js_eltype', { json: o });
		},
		render: function(){
			var rows = this.tables['eltype'].getRows();
			
			var lst = "", i, s, di;
			rows.foreach(function(row){
				di = row.cell;
				
				s = di['dd']>0 ? T['rowdel'] : T['row'];
				s = tSetVar(s, 'id', di['id']);
				s = tSetVar(s, 'tl', di['tl']);
				s = tSetVar(s, 'dsc', di['dsc']);
				lst += s;
			}, this);
			
			lst = tSetVar(T['table'], 'rows', lst);

			var div = Dom.get(TId['panel']['table']);
			elClear(div);
			div.innerHTML = lst;
		}
	}
	Brick.Catalog.Element.Type.Manager = manager;

	var Editor = function(row, mmPrefix){
		this.mmPrefix = mmPrefix;
		this.row = row;
		Editor.superclass.constructor.call(this, T['editor']);
	}
	YAHOO.extend(Editor, Brick.widget.Panel, {
		initTemplate: function(t){
			return t;
		},
		onLoad: function(){
			var o = this.row.cell;
			
			var elName = this.el('name'); 
			this.setelv('name', o['nm']);
			this.setelv('title', o['tl']);
			this.setelv('descript', o['dsc']);
			this.setelv('foto', o['foto']);
			
			if (!this.row.isNew()){
				name.disabled = "disabled";
			}
		},
		el: function(name){ return Dom.get(TId['editor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
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
		onClose: function(){
			if (this.row.isNew()){
				DATA[this.mmPrefix].get('eltype').getRows().remove(this.row);
			}
		},
		save: function(){
			this.nameTranslite();
			this.row.update({
				'nm': this.elv('name'),
				'tl': this.elv('title'),
				'dsc': this.elv('descript'),
				'foto': this.elv('foto')
			});
			var ds = DATA[this.mmPrefix];
			if (this.row.isNew()){
				ds.get('eltype').getRows().add(this.row);
			}
			ds.get('eltype').applyChanges();
			ds.request();
			this.close();
		}
	});
	
	Brick.Catalog.Element.Type.Editor = Editor;


})();
};
})();