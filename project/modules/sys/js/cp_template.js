/**
* @version $Id: eltype.js 753 2009-04-15 12:54:14Z AKuzmin $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('mod.sys.template');

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
		     {name: 'sys', files: ['data.js', 'form.js']}
		    ],
    onSuccess: function() {
		
			if (!Brick.objectExists('Brick.mod.sys.data')){
				Brick.mod.sys.data = new Brick.util.data.byid.DataSet('sys');
			}
			DATA = Brick.mod.sys.data;
			
			T = Brick.util.Template['sys']['cp_template'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);

			moduleInitialize();
			delete moduleInitialize;
	  }
	});
	
var moduleInitialize = function(){

(function(){
	
	var manager = function(container){
		this.init(container);
	};
	manager.prototype = {
		init: function(container){
			var __self = this;
			container.innerHTML = T['panel'];
			
			this.tables = {
				'bricks': DATA.get('bricks', true)
			};
			
			this.rows = {
				'bricks': this.tables['bricks'].getRows({tp: 0}),
				'templates': this.tables['bricks'].getRows({tp: 1}),
				'contents': this.tables['bricks'].getRows({tp: 2})
			};

			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}
		},
		onDSUpdate: function(type, args){
			if (args[0].check(['bricks'])){ this.render(); }
		},
		destroy: function(){
			 DATA.onComplete.unsubscribe(this.onDSUpdate, this);
		},
		onClick: function(el){
			if (el.id == TId['panel']['rcclear']){
				this.recycleClear();
				return true;
			}			

			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['row']['edit']+'-'):
			case (TId['rowdel']['edit']+'-'):
				this.editById(numid);
				return true;
			case (TId['row']['remove']+'-'):
				this.remove(numid);
				return true;
			case (TId['rowdel']['restore']+'-'):
				this.restore(numid);
				return true;
			}
			return false;
		},
		renderType: function(bricktype){
			var rows;
			if (bricktype == 2){
				rows = this.rows['contents'];
			}else if (bricktype == 1){
				rows = this.rows['templates'];
			}else{
				rows = this.rows['bricks'];
			}
			
			var lst = "", s, di, grp = "", ss;
			rows.foreach(function(row){
				di = row.cell;
				
				if (grp != di['own']){
					grp = di['own'];
					s = T['rowgrptype'+bricktype];
					s = tSetVar(s, 'own', di['own']);
					lst += s;
				}
				
				s = di['dd']>0 ? T['rowdel'] : T['row'];
				s = tSetVar(s, 'id', di['id']);
				ss = di['nm'];
				if (di['ud']>0){
					ss = tSetVar(T['rownmedit'], 'nm', di['nm']);
				}
				s = tSetVar(s, 'nm', ss);
				ss = di['cmt'];
				
				if (ss.length > 50){ ss = ss.substring(0, 50)+"..."; }
				s = tSetVar(s, 'cmt', ss);
				s = tSetVar(s, 'ud', (di['ud']>0 ? dateExt.convert(di['ud']) : ""));
				s = tSetVar(s, 'dd', (di['dd']>0 ? dateExt.convert(di['dd']) : ""));

				lst += s;
			}, this);
			return lst;
		},
		render: function(){
			var lst = "";
			lst += this.renderType(1);
			lst += this.renderType(0);
			lst += this.renderType(2);

			var div = Dom.get(TId['panel']['table']);
			elClear(div);
			div.innerHTML = tSetVar(T['table'], 'rows', lst);;
			
		},
		editById: function(id){
			var tables = {
				'brick': DATA.get('brick', true),
				'brickparam': DATA.get('brickparam', true)
			}
			var rows = {
				'brick': tables['brick'].getRows({'bkid': id}),
				'brickparam': tables['brickparam'].getRows({'bkid': id})
			}
			
			var __self = this;
			var complete = function(type, args){
				DATA.onComplete.unsubscribe(complete);
				__self.edit({id: id, rows: rows});
			};
			
			if (DATA.isFill(tables)){
				__self.edit({id: id, rows: rows});
			} else {
				DATA.onComplete.subscribe(complete);
				DATA.request();
			}
		},
		edit: function(obj){
			this.activeEditor = new Editor(obj);
		},
		getrow: function(id){
			var row = this.rows['bricks'].getById(id);
			if (L.isNull(row)){
				row = this.rows['templates'].getById(id);
			}
			if (L.isNull(row)){
				row = this.rows['contents'].getById(id);
			}
			return row;
		},
		remove: function(id){
			var row= this.getrow(id);
			row.remove();
			this.tables['bricks'].applyChanges();
			DATA.request();
		},
		restore: function(id){
			// в два шага: 1-удалить активный, восстановить запрашиваемый
			var row = this.getrow(id);

			var rows = this.tables['bricks'].getRows({tp: row.cell['tp']});
			var trows = rows.filter({'own': row.cell['own'], 'nm': row.cell['nm']});
			trows.foreach(function(row){
				if (row.cell['dd'] == 0){
					row.remove();
				}
			});
			
			row.restore();
			this.tables['bricks'].applyChanges();
			DATA.request();
		},
		recycleClear: function(){
			this.tables['bricks'].recycleClear();
			DATA.request();
		}
	}
	Brick.mod.sys.template.Manager = manager;

	var Editor = function(d){
		this.brickid = d['id'];
		this.rows = d['rows'];
		Editor.superclass.constructor.call(this, T['editor']);
	}
	YAHOO.extend(Editor, Brick.widget.Panel, {
		initTemplate: function(t){
			return t;
		},
		onLoad: function(){
			this.param = new Param(this.el('param'), {id: this.brickid, 'rows': this.rows['brickparam']});
			var o = this.rows['brick'].getById(this.brickid).cell;
			this.setelv('owner', o['own']);
			this.setelv('name', o['nm']);
			this.setelv('body', o['bd']);
			this.setelv('cmt', o['cmt']);
		},
		el: function(name){ return Dom.get(TId['editor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		onClick: function(el){
			if (this.param.onClick(el)){ return true; }
			
			var tp = TId['editor']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bsave']: this.save(); return true;
			}
		},
		save: function(){
			this.param.save();
			var row = this.rows['brick'].getById(this.brickid); 
			row.update({
				'own': this.elv('owner'),
				'nm': this.elv('name'),
				'bd': this.elv('body'),
				'cmt': this.elv('cmt')
			});
			
			DATA.get('brick').applyChanges();
			DATA.get('brickparam').applyChanges();
			DATA.get('bricks').getRows({tp: row.cell['tp']}).clear();
			DATA.request();
			this.close();
		}
	});
	
	var Param = function(container, obj){
		this.init(container, obj);
	}; 
	Param.prototype = {
		init: function(container, obj){
			container.innerHTML = T['param'];
			this.brickid = obj['id'];
			this.source = obj['rows'];
			this.rows = obj['rows'].clone();
			this.render();
		},
		render: function(){
			var lang = Brick.util.Language.getData()['sys']['brick']['paramtype'];
			var lst = "", i, s, di, val;
			this.rows.foreach(function(row){
				if (row.isRemove()){
					return;
				}
				
				di = row.cell;
				s = T['rowparam'];
				s = tSetVar(s, 'id', di['id']);
				s = tSetVar(s, 'tp', lang[di['tp']]);
				s = tSetVar(s, 'nm', di['nm']);
				
				val = Brick.util.Form.encode(di['v']);
				if (val.length > 50){
					val = val.substr(0, 50)+'...';
				}
				
				s = tSetVar(s, 'v', val);
				lst += s;
			}, this);
			
			lst = tSetVar(T['tableparam'], 'rows', lst);

			var div = Dom.get(TId['param']['table']);
			elClear(div);
			div.innerHTML = lst;
		},
		onClick: function(el){
			if (el.id == TId['param']['badd']){
				this.edit();
				return true;
			}
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['rowparam']['edit']+'-'):
				this.edit(numid);
				return true;
			case (TId['rowparam']['remove']+'-'):
				this.remove(numid);
				return true;
			}
			return false;
		},
		remove: function(id){
			var row = this.rows.getById(id);
			row.remove();
			this.render();
		},
		edit: function(id){
			id = id || 0;
			var row;
			if (id == 0){
				row = DATA.get('brickparam').newRow();
				row.cell['bkid'] = this.brickid;
			}else{
				row = this.rows.getById(id);
			}
			var __self = this;
			new ParamEditor(row, function(){
				if (id == 0){
					__self.rows.add(row);
				}
				__self.render();
			});
		},
		save: function(){
			this.source.sync(this.rows);
		}
	};
	
	var ParamEditor = function(row, callback){
		this.row = row;
		this.callback = callback;
		Editor.superclass.constructor.call(this, T['parameditor']);
	}
	YAHOO.extend(ParamEditor, Brick.widget.Panel, {
		initTemplate: function(t){
		
			return t;
		},
		onLoad: function(){
			
			var o = this.row.cell;
			this.setelv('name', o['nm']);
			this.setelv('value', o['v']);
			this.setelv('type', o['tp']);
			
			var contname = Dom.get(TId['parameditor']['name']+'-cont');
			var contvalue = Dom.get(TId['parameditor']['value']+'-cont');
			var elType = this.el('type');
			
			if (!this.row.isNew()){
				elType.disabled = "disabled";
			}
			
			var __self = this;
			var typeUpdate = function(){
				contname.style.display = '';
				contvalue.style.display = '';
				switch(elType.value){
				case '5': case '6': case '7': case '8':
					contname.style.display = 'none';
					break;
				}
			};
			
			E.on(elType, 'change', function(e){ typeUpdate(); });
			typeUpdate();
		},
		el: function(name){ return Dom.get(TId['parameditor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		onClick: function(el){
			var tp = TId['parameditor']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bsave']: this.save(); return true;
			}
		},
		save: function(){
			this.row.update({
				'tp': this.elv('type'),
				'nm': this.elv('name'),
				'v': this.elv('value')
			});
			this.close();
			this.callback();
		}
	});
})();
};
})();