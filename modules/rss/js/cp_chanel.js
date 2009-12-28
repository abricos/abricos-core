/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	
	Brick.namespace('mod.rss');

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		T, TId;
	
	var DATA;

	var dateExt = Brick.dateExt;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;
	var tSetVarA = Brick.util.Template.setPropertyArray;

	Brick.Loader.add({
		mod:[{name: 'sys', files: ['data.js', 'form.js']}],
    onSuccess: function() {
			if (!Brick.objectExists('Brick.mod.rss.data')){
				Brick.mod.rss.data = new Brick.util.data.byid.DataSet('rss');
			}
			DATA = Brick.mod.rss.data;

			T = Brick.util.Template['rss']['cp_chanel'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			
			moduleInitialize();
			delete moduleInitialize;
	  }
	});

var moduleInitialize = function(){
(function(){
	
	var Chanel = function(container){ this.init(container); };
	Chanel.prototype = {
		init: function(container){
			container.innerHTML = T['panel'];
		
			this.tables = {
				'chanel': DATA.get('chanel', true),
				'source': DATA.get('source', true),
				'chanelsource': DATA.get('chanelsource', true)
			};
			DATA.onComplete.subscribe(this.onDSComplete, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}
		},
		onDSComplete: function(type, args){ 
			if (args[0].check(['chanel'])){ this.renderChanel(); } 
			if (args[0].check(['source'])){ this.renderSource(); } 
		},
		renderChanel: function(){
			var lst = "", di, rows = this.tables['chanel'].getRows();
			var url = Brick.env.host+'/rss/rss/';
			rows.foreach(function(row){
				di = row.cell;
				lst += tSetVarA(T['row'], {
					'id': di['id'], 'nm': di['nm'], 
					'url': url+di['id']+'/', 
					'chm': di['chm'],
					'chl': dateExt.convert(di['chl'])
				});
			});
			Dom.get(TId['panel']['table']).innerHTML = tSetVar(T['table'], 'rows', lst);
		},
		renderSource: function(){
			var lst = "", di, rows = this.tables['source'].getRows();
			rows.foreach(function(row){
				di = row.cell;
				lst += tSetVarA(T['rowsource'], {
					'id': di['id'], 'nm': di['nm'], 'url': di['url']
				});
			});
			Dom.get(TId['panel']['tablesource']).innerHTML = tSetVar(T['tablesource'], 'rows', lst);
		},
		onClick: function(el){
			switch(el.id){
			case TId['panel']['addchanel']:
				new ChanelEditor(DATA.get('chanel').newRow());
				return true;
			case TId['panel']['addsource']:
				new SourceEditor(DATA.get('source').newRow());
				return true;
			}
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['row']['edit']+'-'): 
				new ChanelEditor(DATA.get('chanel').getRows().getById(numid)); 
				return true;
			case (TId['row']['remove']+'-'): 
				DATA.get('chanel').getRows().getById(numid).remove();
				DATA.get('chanel').applyChanges();
				DATA.request();
				return true;
			case (TId['rowsource']['edit']+'-'): 
				new SourceEditor(DATA.get('source').getRows().getById(numid)); 
				return true;
			case (TId['rowsource']['remove']+'-'): 
				DATA.get('source').getRows().getById(numid).remove();
				DATA.get('source').applyChanges();
				DATA.request();
				return true;
			}
			return false;
		}
	};
	Brick.mod.rss.Chanel = Chanel;
	
	var ChanelEditor = function(row){
		this.row = row;
		ChanelEditor.superclass.constructor.call(this, T['editorchanel']);
	}
	YAHOO.extend(ChanelEditor, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['editorchanel'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setel: function(el, value){ Brick.util.Form.setValue(el, value); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(t){
			var lst = "";
			DATA.get('source').getRows().foreach(function(row){
				lst += tSetVarA(T['option'], {'id': row.id,'nm': row.cell['nm']});
			});
			return tSetVar(t, 'nslist', lst);
		},
		onLoad: function(){
			this.el('badd').style.display = this.row.isNew() ? '' : 'none';
			this.el('bsave').style.display = this.row.isNew() ? 'none' : '';
			
			var di = this.row.cell;
			this.setelv('nm', di['nm']);
			this.setelv('dsc', di['dsc']);
			this.setelv('chm', di['chm']);
			this.setelv('gcnt', di['gcnt']);
			
			var rowchanelsource = DATA.get('chanelsource').getRows().filter({'cid': di['id']});
			var rowsource = DATA.get('source').getRows();
			var sourcelist = {};
			rowchanelsource.foreach(function(row){
				var fr = rowsource.getById(row.cell['sid']);
				if (L.isNull(fr)){ return; }
				sourcelist[fr.id] = fr;
			});
			this.sourcelist = sourcelist;
			this.renderSourceList();
		},
		renderSourceList: function(){
			var lst = "", di;
			for (var id in this.sourcelist){
				di = this.sourcelist[id].cell;
				lst += tSetVarA(T['edchrow'], {'id': di['id'], 'nm': di['nm']});
			}
			this.el('table').innerHTML = tSetVar(T['edchtable'], 'rows', lst);
		},
		addSource: function(){
			var id = this.elv('newsource');
			if (!id){ return; }
			var row = DATA.get('source').getRows().getById(id);
			if (L.isNull(row)){ return; }
			this.sourcelist[id] = row;
			this.renderSourceList();
		},
		removeSource: function(removeid){
			var newlist = {};
			for (var id in this.sourcelist){
				if (id != removeid){newlist[id] = this.sourcelist[id]; }
			}
			this.sourcelist = newlist;
			this.renderSourceList();
		},
		onClick: function(el){
			var tp = TId['editorchanel']; 
			switch(el.id){
			case tp['baddsource']: this.addSource(); return true;
			case tp['badd']: this.save(); return true;
			case tp['bsave']: this.save(); return true;
			case tp['bcancel']: this.close(); return true;
			}
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			switch(prefix){
			case (TId['edchrow']['remove']+'-'): this.removeSource(numid); return true; 
			}
			return false;
		},
		save: function(){
			this.close();
			var row = this.row, table = DATA.get('chanel');
			var slist = [];
			for (var id in this.sourcelist){
				slist[slist.length] = id;
			}
			row.update({
				'nm': this.elv('nm'),
				'dsc': this.elv('dsc'),
				'chm': this.elv('chm'),
				'gcnt': this.elv('gcnt'),
				'sourcelist': slist
			});
			if (row.isNew()){ table.getRows().add(row); }
			table.applyChanges();
			
			var ctable = DATA.get('chanelsource');
			ctable.getRows().clear();
			ctable.applyChanges();
			
			DATA.request();
		}
	});
	
	var SourceEditor = function(row){
		this.row = row;
		SourceEditor.superclass.constructor.call(this, T['editorsource']);
	}
	YAHOO.extend(SourceEditor, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['editorsource'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setel: function(el, value){ Brick.util.Form.setValue(el, value); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		onLoad: function(){
			var di = this.row.cell;
			this.setelv('nm', di['nm']);
			this.setelv('url', di['url']);
			this.setelv('dsc', di['dsc']);
			this.setelv('pfx', di['pfx']);
			this.el('badd').style.display = this.row.isNew() ? '' : 'none';
			this.el('bsave').style.display = this.row.isNew() ? 'none' : '';
		},
		onClick: function(el){
			var tp = TId['editorsource']; 
			switch(el.id){
			case tp['badd']: this.save(); return true;
			case tp['bsave']: this.save(); return true;
			case tp['bcancel']: this.close(); return true;
			}
			return false;
		},
		save: function(){
			this.close();
			var row = this.row, table = DATA.get('source');
			row.update({
				'nm': this.elv('nm'),
				'url': this.elv('url'),
				'dsc': this.elv('dsc'),
				'pfx': this.elv('pfx')
			});
			if (row.isNew()){ table.getRows().add(row); }
			table.applyChanges();
			DATA.request();
		}
	});


})();
};
})();
