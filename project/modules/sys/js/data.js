/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
(function(){

	Brick.namespace('util.data.byid');

	var Column = function(name){ this.init(name); };
	Column.prototype = {
		init: function(name){
			this.name = name;
		}
	}
	
	var Columns = function(){ this.init(); };
	Columns.prototype = {
		init: function(){
			var _cols = {};
			var _count = 0;
			
			this.clear = function(){
				_cols = {};
				_count = 0;
			};
			
			this.add = function(col){
				if (!_cols[col.name]){ _count++; }
				_cols[col.name] = col;
			};

			this.update = function(o){
				if (o.length == 0){ return; }
				var i;
				for (i=0;i<o.length;i++){
					this.add(new Column(o[i]));
				}
			};
			
			this.count = function(){ return _count; };
			
			this.getArray = function(){
				var ret = [];
				for (var nn in _cols){
					ret[ret.length] = _cols[nn];
				}
				return ret;
			};
		}
	};
	
	var _globalRowId = 1;
	
	var Row = function(data){
		this.init(data);
	};
	Row.prototype = {
		init: function(data){
			var _isnew = false;
			var _applychanges = false;
			var _isupdate = false;
			var _isremove = false;
			var _isrestore = false;
			
			if (!data['id']){
				data['id'] = 'nn'+(_globalRowId++);
				_isnew = true;
			}
			this.id = data['id'];
			this.cell = data;
			
			this.isNew = function(){ return _isnew; };
			this.isUpdate = function(){ return _isupdate; };
			this.isApplyChanges = function(){ return _applychanges; };
			this.isRemove = function(){ return _isremove; };
			this.isRestore = function(){ return _isrestore; };
			this.applyChanges = function(){
				if (this.isNew() || this.isUpdate() || this.isRemove() || this.isRestore()){
					_applychanges = true; 
				}
			};
			
			this.report = function(){
				var s = "Row: id="+this.id+" cell={";
				for (var nn in this.cell){
					s += nn + "="+ YAHOO.lang.dump(this.cell[nn])+", "
				}
				s += "} flag:";
				if (this.isNew()){ s += " new "}
				if (this.isUpdate()){ s += " update "}
					
				s += "\n"
				return s;
			};
			
			this.remove = function(){
				_isremove = true;
			};
			
			this.restore = function(){
				_isrestore = true;
			};

			this.checkExpression = function(exp){
				for (var nn in exp){
					if (this.cell[nn] != exp[nn]){ return false; }
				}
				return true;
			};
			
			this.getPostData = function(){
				if (!_applychanges){ return null; }
				var flag = "";
				if (this.isRestore()){ flag = 'r';
				}else if (this.isRemove()){ flag = 'd';
				}else if (this.isNew()){ flag = 'a';
				}else if (this.isUpdate()){ flag = 'u'; }
				return { f: flag, d: this.cell };
			};
			
			this.update = function(data){
				var newval, oldval;
				for (var nn in data){
					newval = data[nn];
					oldval = this.cell[nn];
					if (newval != oldval){
						_isupdate = true;
						this.cell[nn] = data[nn];
					}
				}
			};
			
			this.clone = function(){
				var data = {};
				for (var nn in this.cell){
					data[nn] = this.cell[nn];
				}
				var row = new Row(data);
				return row;
			};
			
			this.sync = function(row){
				this.update(row.cell);
				_isnew = row.isNew();
				_applychanges = row.isApplyChanges();
				_isupdate = row.isUpdate();
				_isremove = row.isRemove();
				_isrestore = row.isRestore();
			};
		}
	};
	
	var globalForeachId = 1;
	
	var keysort = function(a, b){
    var anew = a.toLowerCase();
    var bnew = b.toLowerCase();
    if (anew < bnew) return -1;
    if (anew > bnew) return 1;
    return 0;
	};
	
	var Rows = function(param, overparam){
		this.init(param, overparam);
	};
	Rows.getParamHash = function(param){
		param = param || {};
		var arr = [];
		for (var nn in param){
			arr[arr.length] = nn + param[nn];
		}
		arr.sort(keysort);
		return 'p'+arr.join('');
	};
	Rows.prototype = {
		init: function(param, overparam){
			param = param || {};
			overparam = overparam || {};
			this.param = param;
			this.overparam = overparam;
			this.key = Rows.getParamHash(param);

			var _rows = {};
			var _count = 0;
			var _lastUpdate = 0;
			
			this.lastUpdateTime = function(){ return _lastUpdate; };
			
			this.clear = function(){
				_rows = {};
				_count = 0;
				_lastUpdate = 0;
			};
			
			this.count = function(){ return _count; };
			
			this.add = function(row){
				if (!_rows[row.id]){ _count++; }
				_rows[row.id] = row;
			};
			
			this.remove = function(row){ delete _rows[row.id]; };
			
			this.getById = function(id){
				if (_rows[id])
					return _rows[id];
				return null;
			};
			
			this.get = function(field, value){
				var row;
				for (var id in _rows){
					row = _rows[id];
					if (row[field] == value){
						return row;
					}
				}
				return null;
			};
			
			this.getByIndex = function(index){
				var i = 0;
				for (var id in _rows){
					if (i == index){
						return _rows[id];
					}
					i++;
				}
				return null;
			};
			
			this.find = function(exp){
				var rows = this.filter(exp);
				if (rows.count() == 0){
					return null;
				}
				return rows.getByIndex(0);
			};
			
			this.filter = function(exp){ // example: {fld1: 0, fld2: ''}
				var row, rows = new Rows(), isret;
				for (var id in _rows){
					row = this.getById(id);
					if (row.checkExpression(exp)){ 
						rows.add(row); 
					}
				}
				return rows;
			};
			
			this.foreach = function(func, owner){
				var fname = "__rows_foreach"+(globalForeachId++);
				owner = owner || {};
				owner[fname] = func;
				var i = 0;
				for (var id in _rows){
					owner[fname](_rows[id], i);
					i++;
				}
				delete owner[fname];
			};

			this.getValues = function(){
				var data = [];
				for (var id in _rows){
					data[data.length] = _rows[id].cell;
				}
				return data;
			};
			
			this.getArray = function(){
				var data = [];
				for (var id in _rows){
					data[data.length] = _rows[id];
				}
				return data;
			};
			
			this.applyChanges = function(){
				for (var id in _rows){
					_rows[id].applyChanges();
				}
			};

			this.getPostData = function(){
				var arr = [], pd;
				for (var id in _rows){
					pd = _rows[id].getPostData();
					if (!YAHOO.lang.isNull(pd)){ arr[arr.length] = pd; }
				}
				if (arr.length > 0 || _lastUpdate == 0){
					return { 
						p: param,
						op: overparam,
						r: arr
					};
				}
				return null;
			};
			
			this.report = function(){
				var s = "Rows: ";
				for (var nn in this.param){
					s += nn+": "+this.param[nn];
				}
				s += "\n";
				for (var id in _rows){
					s += _rows[id].report();
				}
				return s;
			};
			
			this.update = function(data){
				this.clear();
				var i, row;
				for (i=0;i<data.length;i++){
					row = new Row(data[i]);
					this.add(row);
				}
				_lastUpdate =  Math.round(((new Date()).getTime()/1000));
			};
			
			this.clone = function(){
				var rows = new Rows(this.param);
				var data = [];
				for (var id in _rows){
					data[data.length] = _rows[id].clone().cell;
				}
				rows.update(data);
				return rows;
			};
			
			this.sync = function(rows){
				var source = rows.getArray();
				var srow, drow;
				for (var i=0;i<source.length;i++){
					srow = source[i];
					drow = this.getById(srow.id);
					if (YAHOO.lang.isNull(drow)){
						this.add(srow);
					}else{
						drow.sync(srow);
					}
				}
			};
		}
	};
	
	var RowsParam = function(){
		this.init();
	};
	
	RowsParam.prototype = {
		init: function(){
			var _rows = {};
			var _count = 0;
			
			this.count = function(){ return _count; };
			
			/**
			 * Удаление всех rows не соотвествующих param
			 */
			this.removeNonParam = function(param){
				var _newrows = {};
				var key = Rows.getParamHash(param);
				_count = 0;
				if (_rows[key]){
					_newrows[key] = _rows[key];
					_count = 1;
				}
				_rows = _newrows;
			};
			
			this.getRows = function(param, overparam){
				var key = Rows.getParamHash(param);
				if (!_rows[key]){
					_rows[key] = new Rows(param, overparam);
					_count++;
				}
				return _rows[key];
			};
			
			this.getLastUpdateRows = function(){
				var rows = null;
				var lastUpdateTime = 0;
				for(var nn in _rows){
					var lu = _rows[nn].lastUpdateTime(); 
					if (lu >= lastUpdateTime){
						lu = lastUpdateTime;
						rows = _rows[nn];
					}
				}
				return rows;
			};
			
			/**
			 * Найти rows в котором запись соответствует условию exp 
			 */
			this.findRows = function(exp){
				for(var nn in _rows){
					var row = _rows[nn].find(exp);
					if (row){ return row; }
				}
				return null;
			};
			
			this.update = function(o){
				var di, i, rows;
				for (i=0;i<o.length;i++){
					di = o[i];
					rows = this.getRows(di['p']);
					rows.update(di['d']);
				}
			};
			
			this.clear = function(){
				for(var nn in _rows){_rows[nn].clear();}				
			};
			
			this.applyChanges = function(){
				for(var nn in _rows){
					_rows[nn].applyChanges();
				}				
			};
			
			this.getPostData = function(){
				if (this.count() == 0){ this.getRows(); }
				var ret = [];
				for(var nn in _rows){
					var obj = _rows[nn].getPostData();
					if (!YAHOO.lang.isNull(obj)){
						ret[ret.length] = obj;
					}
				}
				if (ret.length > 0){ return ret; }
				return null;
			};
			
			this.report = function(){
				var s = "Parameters Row: <br />";
				for(var nn in _rows){
					s += _rows[nn].report();
				}
				return s;
			};
		}
	};

	var Table = function(name){
		this.init(name);
	};
	Table.prototype = {
		init: function(name){
			this.name = name;
			this.columns = new Columns();
			
			var _rowsparam = new RowsParam();
			var _lastUpdate = 0;
			var _recycleclear = false;
			
			/**
			 * Получить последний обновляемый rows
			 */
			this.getLastUpdateRows = function(){
				return _rowsparam.getLastUpdateRows();
			};
			
			this.findRows = function(exp){
				return _rowsparam.findRows(exp);
			};
			
			this.newRow = function(){
				var cols = this.columns.getArray();
				var data = {};
				for (var i=0;i<cols.length;i++){
					data[cols[i].name] = "";
				}
				return new Row(data);
			};
			
			this.recycleClear = function(){
				_recycleclear = true;
			};
			
			this.getPostData = function(){
				var cmd = [];
				if (this._lastUpdate == 0 || this.columns.count() == 0){
					cmd[cmd.length] = 'i';
				}
				if (_recycleclear){
					cmd[cmd.length] = 'rc';
					_rowsparam.clear();
				}
				
				var rows = _rowsparam.getPostData();
				if (YAHOO.lang.isNull(rows)){ return null; }
				var post = { 'nm': this.name, 'rs': rows };
				
				post['cmd'] = cmd;
				return post;
			}; 

			/**
			 * True - таблица заполнена и в ней не изменялись данные
			 */
			this.isFill = function(){
				var pd = this.getPostData();
				return YAHOO.lang.isNull(pd); 
			};

			this.getRows = function(param, overparam){
				return _rowsparam.getRows(param, overparam);
			};
			
			this.removeNonParam = function(param){
				_rowsparam.removeNonParam(param);
			}
			
			this.update = function(o){
				o['cs'] = o['cs'] || [];
				this.columns.update(o['cs']);
				_rowsparam.update(o['rs']);
				_lastUpdate =  Math.round((new Date()).getTime()/1000);
				_recycleclear = false;
			};
			
			this.applyChanges = function(){
				_rowsparam.applyChanges();
			};
			
			this.report = function(){
				var s = "Table: "+this.name+"<br />";
				s += "Columns: "
				var cols = this.columns.getArray();
				for (var i=0;i<cols.length;i++){
					s += cols[i].name+" ";
				}
				s += _rowsparam.report();
				
				return s;
			};
		}
	};
	
	var DataSet = function(name, prefix){
		this.init(name, prefix);
	};
	DataSet.prototype = {
		init: function(name, prefix){
			this.name = name;
			this.prefix = prefix;
			this.tables = {};
			this.session =  Math.round((new Date()).getTime()/1000);
			this.onComplete = new YAHOO.util.CustomEvent("onComplete"); 
		},
		add: function(table){
			if (this.tables[table.name]){
				return;
			}
			this.tables[table.name] = table;
		},
		addRange: function(tables){
			for (var nn in tables){
				this.add(tables[nn]);
			}
		},
		get: function(name, createIfNotFound){
			if (!this.tables[name] && createIfNotFound){
				this.add(new Table(name));
			}
			return this.tables[name];
		},
		update: function(obj){
			
			var checker = function(rq){
				this.check = function(tables){
					for (var i=0;i<tables.length;i++){
						if (rq[tables[i]]){ return true; }
					}
					return false;
				};
				
				this.checkWithParam = function(tname, param){
					if (!rq[tname]){
						return false;
					}
					var fromKey = Rows.getParamHash(param);
					var arr = rq[tname];
					for (var i=0;i<arr.length;i++){
						if (fromKey == Rows.getParamHash(arr[i])){ return true; }
					}
					return false;
				};
			};
			var updtbls = {};
			var i, di, isempty, table;
			for (i=0; i<obj['_ds'].length; i++){
				di = obj['_ds'][i];
				
				updtbls[di['nm']] = function(){
					var lst = [];
					for (var i=0;i<di['rs'].length;i++){
						lst[lst.length] = di['rs'][i]['p'];
					}
					return lst;
				}();
				this.get(di['nm'], true).update(di);
			}
			this.onComplete.fire(new checker(updtbls));
		},
		getPostData: function(tables){
			tables = tables || this.tables;
			var ts = [], tmp;
			for (var nn in tables){
				tmp = this.tables[nn].getPostData();
				
				if (!YAHOO.lang.isNull(tmp)){
					ts[ts.length] = tmp;
				}
			}
			if (ts.length == 0){
				return null;
			}
			return ts;
		},
		request: function(hidden){
			hidden = hidden || false;
			var ts = this.getPostData();
			if (YAHOO.lang.isNull(ts)){ return; }
			Brick.util.Connection.sendCommand(this.name, 'js_data', {
				hidden: hidden,
				json: {
					'_ds': {
					'pfx': this.prefix,
					'ss': this.session,
					'ts': ts
				}
			}});
		},
		isFill: function(tables){
			var ts = this.getPostData(tables);
			return YAHOO.lang.isNull(ts); 
		},
		report: function(){
			var s = "DataSet<br />";
			s += "name: "+this.name+", prefix: "+this.prefix+"<br />"
			for (var nn in this.tables){
				s += this.tables.report();
			}
			return s;
		}
	};
	
	Brick.util.data.byid.DataSet = DataSet;
	Brick.util.data.byid.Table = Table;
	Brick.util.data.byid.Row = Row;	

})();
(function(){
	Brick.namespace('util.Data');
	
	/* * * * * * * * * * * * * Table * * * * * * * * * * */
	var Table = function(name){
		this.init(name);
	}
	Table.prototype = {
		init: function(name){
			this.data = [];
			this.name = name;
			this.lastUpdate = null;
			this.onUpdate = new YAHOO.util.CustomEvent("onUpdate"); 
		},
		isFill: function(){
			return !YAHOO.lang.isNull(this.lastUpdate);
		},
		setReloadFlag: function(){
			this.lastUpdate = null;
		},
		update: function(data, session){
			session = session || 1;
			this.lastUpdate = new Date();
			this.data = data;
			this.onUpdate.fire({data: this.data, session: session});
		},
		find: function(name, value){
			var i, di;
			for (i=0;i<this.data.length;i++){
				di = this.data[i];
				if (di[name] == value){
					return di;
				}
			}
			return null;
		},
		count: function(){
			return this.data.length;
		},
		filter: function(name, value){
			var ret = [], i, di;
			for (i=0;i<this.data.length;i++){
				di = this.data[i];
				if (di[name] == value){
					ret[ret.length] = di;
				}
			}
			return ret;
		}
	}
	Brick.util.Data.Table = Table;

	var loader = function(parent, moduleName, mmPrefix){
		this.init(parent, moduleName, mmPrefix);
	}
	loader.prototype = {
		init: function(parent, moduleName, mmPrefix){
			this.moduleName = moduleName;
			this.parent = parent;
			this.moduleManagerPrefix = mmPrefix;
		},
		add: function(tableName){
			var table = this.parent.get(tableName, true);
			table.lastUpdate = null;
		},
		getJSON: function(){
			var obj = [], send = false, table;
			for (var n in this.parent.ds){
				table = this.parent.ds[n];
				if (!table.isFill()){
					obj[obj.length] = table.name;
					send = true;
				}
			}
			if (!send){ return null; }

			var json = {
				'__data': {
					'session':  Math.round((new Date()).getTime()/1000), 
					'dictlist': obj
				}
			};
			if (this.moduleManagerPrefix){
				json['__data']['mmprefix'] = this.moduleManagerPrefix; 
			}
			return json;
		},
		request: function(){
			var json = this.getJSON();
			if (YAHOO.lang.isNull(json)){
				return;
			}
			Brick.util.Connection.sendCommand(this.moduleName, 'js_data', { json: json });
		}
	}
	
	var DataSet = function(moduleName, mmPrefix){
		this.init(moduleName, mmPrefix);
	}
	DataSet.prototype = {
		init: function(moduleName, mmPrefix){
			this.ds = {};
			if (moduleName){
				this.loader = new loader(this, moduleName, mmPrefix);
			}
			this.onComplete = new YAHOO.util.CustomEvent("onComplete"); 
		}, 
		update: function(name, data, session){
			session = session || 1;
			var table = this.get(name, true);
			table.update(data, session);
		},
		setReloadFlag: function(tables){
			tables = tables || [];
			var i, table;
			for (i=0;i<tables.length;i++){
				table = this.get(tables[i], true);
				table.setReloadFlag();
			}
		},
		get: function(name, createIfNotExists){
			if (!createIfNotExists){
				return this.ds[name];
			}
			var table;
			if (!this.ds[name]){
				table = new Table(name);
				this.ds[name] = table;
			}else{
				table = this.ds[name];
			}
			return table;
		},
		isFill: function(){
			for (var tn in this.ds){
				if (!this.ds[tn].isFill()){
					return false;
				}
			}
			return true;
		},
		complete: function(){
			this.onComplete.fire();
		}
	}
	
	Brick.util.Data.DataSet = DataSet;


	/* * * * * * * * * * * * * Tree * * * * * * * * * * */
	var TreeNode = function(id, pid, data){
		this.init(id, pid, data);
	};
	TreeNode.prototype = {
		init: function(id, pid, data){
			this.id = id;
			this.pid = pid;
			this.data = data;
			this.parent = null;
			this.child = {};
		},
		setChild: function(node){
			this.child[node['id']] = node;
			node['parent'] = this;
		}
	}
	
	var Tree = function(cfg){
		this.init(cfg);
	};
	Tree.prototype = {
		init: function(cfg){
			this.cfg = YAHOO.lang.merge({id: 'id', pid: 'pid', root: {}}, cfg || {});
			this.root = new TreeNode(0, -1, this.cfg['root']);
		},
		update: function(d){
			this.root = new TreeNode(0, -1, this.cfg['root']);
			this.build(this.root, d);
		}, 
		build: function(node, d){
			var c = this.cfg, cnode, di;
			for (var i=0;i<d.length;i++){
				di = d[i];
				if (node['id'] == di[c['pid']]){
					cnode = new TreeNode(di[c['id']], di[c['pid']], di);
					node.setChild(cnode);
				}
			}
		}
	}
	
	Brick.util.Data.Tree = Tree;

})();
})();
