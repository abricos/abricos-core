/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('Catalog.Element');

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
		
			T = Brick.util.Template['catalog']['element'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			Brick.util.CSS.update(Brick.util.CSS['catalog']['element']);

			moduleInitialize();
			delete moduleInitialize;
	  }
	});
	
var moduleInitialize = function(){
	
(function(){
	
	var manager = function(container, catalogid, mmPrefix){
		this.init(container, catalogid, mmPrefix);
	};
	manager.prototype = {
		init: function(container, catalogid, mmPrefix){
			this.container = container;
			this.catalogid = catalogid;
			this.mmPrefix = mmPrefix;

			if (!DATA[mmPrefix]){
				DATA[mmPrefix] = new Brick.util.data.byid.DataSet('catalog', mmPrefix);
			}
			
			var __self = this;
			container.innerHTML = T['panel'];
			
			var ds = DATA[mmPrefix];
			this.tables = {
				'catelements': ds.get('catelements', true),
				'catalog': ds.get('catalog', true),
				'eltype': ds.get('eltype', true),
				'eloption': ds.get('eloption', true),
				'eloptgroup': ds.get('eloptgroup', true)
			}
			
			this.param = {'catid': catalogid}; 
			this.rows = this.tables['catelements'].getRows(this.param);

			ds.onComplete.subscribe(this.onElementUpdate, this, true);
			if (ds.isFill(this.tables)){
				this.render();
			}
		},
		onElementUpdate: function(type, args){
			var f = args[0];
			if (f.checkWithParam('catelements', this.param)){
				this.render();
			}
		},
		render: function(){
			this.rows = this.tables['catelements'].getRows(this.param);
			var catalog = this.tables['catalog'].getRows().getById(this.catalogid);
			Dom.get(TId['panel']['catalog']).innerHTML = Brick.Catalog.Element.pathTitle(this.catalogid, this.mmPrefix);
			var data, lst = "", i, s, di;
			
			var rows = this.tables['eltype'].getRows();
			rows.foreach(function(row){
				di = row.cell;
				s = T['eltrow'];
				s = tSetVar(s, 'id', di['id']);
				s = tSetVar(s, 'tl', di['tl']);
				lst += s;
			}, this);
			lst = tSetVar(T['elttable'], 'rows', lst);

			var div = Dom.get(TId['panel']['elttable']);
			elClear(div);
			div.innerHTML = lst;
			
			lst = "";
			this.rows.foreach(function(row){
				di = row.cell;
				
				s = di['dd']>0 ? T['rowdel'] : T['row'];
				s = tSetVar(s, 'id', di['id']);
				var eltype = this.tables['eltype'].getRows().getById(di['eltid']);
				s = tSetVar(s, 'eltpnm', eltype.cell['tl']);
				s = tSetVar(s, 'tl', di['tl']);
				lst += s;
				
			}, this);
			
			lst = tSetVar(T['table'], 'rows', lst);

			var div = Dom.get(TId['panel']['table']);
			elClear(div);
			div.innerHTML = lst;
		},
		destroy: function(){
			DATA[this.mmPrefix].onComplete.unsubscribe(this.onElementUpdate, this, true);
		},
		onClick: function(el){
			if (el.id == TId['panel']['rcclear']){
				this.recycleClear(); return true;
			}else {
				var prefix = el.id.replace(/([0-9]+$)/, '');
				var numid = el.id.replace(prefix, "");
	
				switch(prefix){
				case (TId['eltrow']['add']+'-'): 
					Brick.Catalog.Element.create (this.catalogid, numid, this.mmPrefix);
					return true;
				case (TId['row']['edit']+'-'): 
					var element = this.rows.getById(numid);
					Brick.Catalog.Element.edit(this.catalogid, numid, element.cell['elid'], element.cell['eltid'], this.mmPrefix);
					return true;
				case (TId['row']['remove']+'-'): this.remove(numid); return true;
				case (TId['rowdel']['restore']+'-'): this.restore(numid); return true;
				}
			}
			return false;
		},
		remove: function(id){
			var row = this.rows.getById(id).remove();
			this._query();
		},
		restore: function(id){
			var row = this.rows.getById(id).restore();
			this._query();
		},
		recycleClear: function(){
			this.tables['catelements'].recycleClear();
			this._query();
		},
		_query: function(){
			this.tables['catelements'].applyChanges();
			DATA[this.mmPrefix].request();
		}
	}

	Brick.Catalog.Element.Manager = manager;
	
	/* Редактор свободного элемента */
	var Editor = function(mmPrefix, row, callback){

		this.tables = DATA[mmPrefix].tables;
		this.mmPrefix = mmPrefix;
		this.row = row;
		if (row.isNew()){
			row.cell['session'] = Math.round(((new Date()).getTime()/1000));
		}
		this.callback = callback;
		this.uploadWindow = null;
		Editor.superclass.constructor.call(this, T['editor']);
	}
	YAHOO.extend(Editor, Brick.widget.Panel, {
		initTemplate: function(t){
		
			var o = this.row.cell;
			var ds = DATA[this.mmPrefix];
			var catElementId = 0;
			var elementId = 0;
			if (!this.row.isNew()){
				catElementId = this.row.id;
				elementId = this.row.cell['elid'];
			}
			var eltype = this.elementType = ds.get('eltype').getRows().getById(o['eltid']);
			this.rows = {
				'eloption': ds.get('eloption').getRows().filter({'eltid': o['eltid']}),
				'eloptgroup': ds.get('eloptgroup').getRows().filter({'eltid': o['eltid']})
				// 'fotos': ds.get('fotos').getRows({'elid': elementId, 'eltid': o['eltid']})
			};
			
			var fotos = {};
			if (!this.row.isNew()){
				ds.get('fotos').getRows({'elid': elementId, 'eltid': o['eltid']}).foreach(function(row){
					fotos[row.cell['fid']] = row.cell['fid'];  
				});
			}
			this.fotos = fotos;

			t = tSetVar(t, 'catalog', Brick.Catalog.Element.pathTitle(o['catid'], this.mmPrefix));
			t = tSetVar(t, 'eltype', eltype.cell['tl']);
			
			// Построение опций элемента
			// участвующие в мульти не участвуют в общем списке
			var rowsMulti = this.rows['eloption'].filter({'fldtp': 6});
			rowsMulti.foreach(function(row){
				var di = row.cell;
				var prm = J.parse(decodeURIComponent(di['prms'])) || {};
				var list = prm['val'].split('\n');
				for (var j=0;j<list.length;j++){
					var row = this.rows['eloption'].get('nm', list[j]);
					if (row){ row['usedmulti'] = true; }
				}
			}, this);
			var lst = "";
			this.rows['eloption'].foreach(function(row){
				lst += this.buildRow(row, false); 
			}, this);
			t = tSetVar(t, 'options', lst);
			return t;
		},
		el: function(name){ return Dom.get(TId['editor'][name]); },
		elOnLoad: function(t, func){ func(t, tSetVar); },
		buildRow: function(row, child){
			if (!child && row['usedmulti']){ return ""; }

			var ds = DATA[this.mmPrefix];
			Brick.namespace('Catalog.Element.temp');

			var di = row.cell;
			var i, lst = "", s, prm, list, j, lists, ss, tt;
			prm = J.parse(decodeURIComponent(di['prms'])) || {};
			var cust = prm['cst'] || {};
			if (cust['en']){
				Brick.Catalog.Element.temp['currentOptRow'] = cust['inp'];
				
				tt = tSetVar(T['editoptrowonload'], 'script', cust['onld']);
				Brick.readScript(tt);
				s = tSetVar(T['editoptrowcust'], 'el', Brick.Catalog.Element.temp['currentOptRow']);
				s = tSetVar(s, 'optid', TId['_global']['opt']);
			}else{
				switch (di['fldtp']){
				case '0': s = T['editoptrow0']; break;
				case '1': case '2': case '3':  s = T['editoptrow1']; break;
				case '4':
					s = T['editoptrow4'];
					list = prm['val'].split('\n');
					lists = "";
					for (j=0;j<list.length;j++){
						ss = tSetVar(T['seloptionrow'], 'id', j);
						lists += tSetVar(ss, 'tl', list[j]);
					}
					s = tSetVar(s, 'list', lists);
					break;
				case '5':
					s = T['editoptrow5'];
					var rows = ds.get('eloptionfld').getRows({'eltpnm': this.elementType.cell['nm'], 'fldnm': di['nm']});
					rows.foreach(function(row){
						ss = tSetVar(T['seloptionrow'], 'id', row.cell['id']);
						lists += tSetVar(ss, 'tl', row.cell['tl']);
					});
					s = tSetVar(s, 'list', lists);
					break;
				case '6':
					s = T['editoptrow6'];
					list = prm['val'].split('\n');
					lists = "";
					var rows = this.rows['eloption'];
					for (j=0;j<list.length;j++){
						var row = rows.get('nm', list[j]);
						if (row)
							lists += this.buildRow(row, true)
					}					
					s = tSetVar(s, 'list', lists);
					break;
				case '7': s = T['editoptrow7']; break;
				default: s = ''; break;
				}
			}
			s = tSetVar(s, 'id', di['nm']);
			s = tSetVar(s, 'title', di['tl']);
			
			return s;
		},
		onLoad: function(){
			var rows = this.rows['eloption'];
			var element = this.row;
			rows.foreach(function(row){
				var di = row.cell;
				switch(di['fldtp']){
				case '0': case '1': case '2': case '3': case '4': case '5': case '7': case '8':
					var el = Dom.get(TId['_global']['opt']+'-'+di['nm']);
					Brick.util.Form.setValue(el, element.cell['fld_'+di['nm']]);
					break;
				}
			}, this);
			this.fotoRender();
		},
		onClick: function(el){
			
			var arr = el.id.split('-');
			
			if (arr[0] == TId['fotoitem']['id']){
				this.imageRemove(arr[1]);
				return true;
			}
			
			var tp = TId['editor']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bsave']: this.save(); return true;
			case tp['imgload']:
				this.imageUpload();
				break;
			}
			return false;
		},
		save: function(){

			var element = this.row;
			var rows = this.rows['eloption'];
			var options = {};
			rows.foreach(function(row){
				var di = row.cell;
				
				switch(di['fldtp']){
				case '0': case '1': case '2': case '3': case '4': case '5': case '7': case '8':
					var el = Dom.get(TId['_global']['opt']+'-'+di['nm']);
					options['fld_'+di['nm']] = Brick.util.Form.getValue(el);
					break;
				}
				if (di['fldtp']=='5'){
					var newval = Brick.util.Form.getValue(Dom.get(TId['_global']['opt']+'-'+di['nm']+'-alt'));
					if (newval.length > 0){
						options['fld_'+di['nm']+'-alt'] = newval;
						this.tables['eloptionfld'].getRows({'eltpnm': this.elementType.cell['nm'], 'fldnm': di['nm']}).clear();
					}
				}
			}, this);

			var afotos = [];
			for (var fid in this.fotos){
				afotos[afotos.length] = fid;
			}
			options['fids'] = afotos.join(","); 
			
			this.row.update(options);
			
			if (!this.row.isNew()){
				DATA[this.mmPrefix].get('fotos').getRows({'elid': this.row.cell['elid'], 'eltid': this.row.cell['eltid']}).clear();
			}
			
			this.callback();
			this.close();
		},
		imageUpload: function(){
			if (!L.isNull(this.uploadWindow) && !this.uploadWindow.closed){
				this.uploadWindow.focus();
			}else{
				var element = this.row;
				
				var url = '/catalogbase/'+this.mmPrefix+'/upload/';
				if (!element.isNew()){
					url += 'id/'+ element.cell['elid'] + '/';
				} else {
					url += 'sess/'+ element.cell['session'] + '/';
				}
				url += element.cell['eltid']+'/';
				this.uploadWindow = window.open(
					url, 'catalogimage',	
					'statusbar=no,menubar=no,toolbar=no,scrollbars=yes,resizable=yes,width=480,height=270' 
				); 
			}
		},
		imageUploadComplete: function(data){
			var fotos = {};
			for (var i=0;i<data.length;i++){
				fotos[data[i]] = data[i];
			}
			this.fotos = fotos;
			this.fotoRender();
		},
		imageRemove: function(fotoid){
			var fotos = {};
			for (var id in this.fotos){
				if (fotoid != id){ fotos[id] = this.fotos[id]; }
			}
			this.fotos = fotos;
			this.fotoRender();
		},
		fotoRender: function(){
			var lst = "";
			for(var fid in this.fotos){
				lst += tSetVar(T['fotoitem'], 'id', fid); 
			}
			var flist = this.el("fotolist");
			flist.innerHTML = lst;
		}
	});	
	
	Brick.Catalog.Element.Editor = Editor;
	
	Brick.Catalog.Element.pathTitle = function(catalogid, mmPrefix){
		var get = function(id){
			var d = DATA[mmPrefix].get('catalog').getRows().getById(id).cell;
			var ret = d['tl'];
			if (d['pid']>0){
				ret = get(d['pid'])+' / '+ret;
			}
			return ret;
		};
		return get(catalogid);
	};

})();
};
})();