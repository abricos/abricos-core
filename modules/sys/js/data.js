/*
@version $Id$
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Sys
 */

Brick.namespace('util.data.byid');

var Component = new Brick.Component();
Component.requires = {
	yahoo: ['dom']
};
Component.entryPoint = function(){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace;
	
	/**
	 * Менеджер таблиц DataSet. 
	 * 
	 * @class DataSet
	 * @submodule Data
	 * @namespace Brick.util.data.byid
	 * @constructor
	 * @param name {String} Имя модуля платформы Abricos с которым происходит обмен данными
	 * @param prefix {String} (optional) Префикс
	 */
	var DataSet = function(name, prefix){
		
		/**
		 * Имя DataSet
		 * 
		 * @property name
		 * @type String
		 */
		this.name = name;
		
		/**
		 * Префикс
		 * 
		 * @property prefix
		 * @type String
		 */
		this.prefix = prefix;
		
		/**
		 * Коллекция таблиц
		 * 
		 * @property tables
		 * @type {String: Brick.util.data.byid.Table}
		 */
		this.tables = {};
		
	    /**
	     * Событие onComplete вызывает, когда данные приходят с сервера в запросе и
	     * заполняют таблицы 
	     *
	     * @event onComplete
	     */
		this.onComplete = new YAHOO.util.CustomEvent("onComplete");

		this.onStart = new YAHOO.util.CustomEvent("onStart");
		
		this.session =  Math.round((new Date()).getTime()/1000);
	};
	DataSet.prototype = {
		
		/**
		 * Получить объект данных подготовленых для отправки в запросе серверу
		 * 
		 * @method _getPostData
		 * @param tables {Brick.util.data.byid.Table[]} (optional) Массив таблиц, если не указан, 
		 * будут использованы таблицы из коллекции этого DataSet 
		 * @return {Object}
		 * @private
		 */
		_getPostData: function(tables, resetFlags){
			tables = tables || this.tables;
			resetFlags = resetFlags || false;
			var ts = [], tmp;
			for (var nn in tables){
				var table = this.tables[nn];
				tmp = table.getPostData();
				
				if (!YAHOO.lang.isNull(tmp)){
					ts[ts.length] = tmp;
					if (resetFlags){
						table.resetFlags();
					}
				}
			}
			if (ts.length == 0){
				return null;
			}
			return ts;
		},
		
		/**
		 * Добавляет таблицу в коллекцию
		 * 
		 * @method add
		 * @param table {Brick.util.data.byid.Table} Добавляемая таблица
		 * @return {Boolean} True если таблица добавлена, иначе False
		 */
		add: function(table){
			if (this.tables[table.name]){
				return false;
			}
			this.tables[table.name] = table;
			return true;
		},
		
		remove: function(name){
			delete this.tables[name];
		},
		
		removeAll: function(){
			var ts = this.tables;
			for(var n in ts){
				delete this.tables[n];
			}
			this.tables = {};
		},
		
		/**
		 * Добавляет массив таблиц в коллекцию
		 * 
		 * @method addRange
		 * @param tables {Brick.util.data.byid.Table[]} Массив добавляемых таблиц
		 */
		addRange: function(tables){
			for (var nn in tables){
				this.add(tables[nn]);
			}
		},
		
		/**
		 * Получить таблицу из коллекции
		 * 
		 * @method get
		 * @param name {String} Имя таблицы
		 * @param createIfNotFound {Boolean} True - создаст таблицу, если ее нет в коллекции и вернее ее
		 * @return {Brick.util.data.byid.Table} Таблица
		 */
		get: function(name, createIfNotFound){
			if (!this.tables[name] && createIfNotFound){
				this.add(new Table(name));
			}
			return this.tables[name] || null;
		},
		
		/**
		 * Являются ли таблицы заполнеными
		 * 
		 * @method isFill
		 * @param tables {Brick.util.data.byid.Table[]} (optional) Массив таблиц
		 * @return {Boolean} Если False, то таблицы нуждаются в обновлении данных с сервера
		 */
		isFill: function(tables){
			var ts = this._getPostData(tables);
			return YAHOO.lang.isNull(ts); 
		},
		
		/**
		 * Обновить данные в таблицах, которые сервер вернул в запросе, 
		 * а так же выполнить событие onComplete
		 * 
		 * @method update
		 * @param obj {Object} Данные ответа сервера
		 * @return {Boolean} 
		 */
		update: function(obj){
			var updtbls = {};
			for (var i=0; i<obj['_ds'].length; i++){
				var di = obj['_ds'][i];
				
				updtbls[di['nm']] = function(){
					var lst = [];
					for (var i=0;i<di['rs'].length;i++){
						lst[lst.length] = di['rs'][i]['p'];
					}
					return lst;
				}();
				this.get(di['nm'], true).update(di);
			}
			try{
				this.onComplete.fire(new checker(updtbls));
			}catch(e){
			}
		},
		
		
		/**
		 * Запросить сервер обновить данные в таблицах
		 * 
		 * @method request
		 * @param hidden {Boolean} Если True, то запрос осуществить в фоновом режиме
		 */
		request: function(hidden, callback){
			hidden = hidden || false;
			var ts = this._getPostData(this.tables, true);
			if (YAHOO.lang.isNull(ts)){ return; }
			
			var f = function(di){
				var lst = [], rs = di['rs'];
				for (var ii=0;ii<rs.length;ii++){
					var p = rs[ii];
					lst[lst.length] = p['p'];
				}
				return lst;
			};

			var updtbls = {}, nm, di;
			for (var i=0;i<ts.length;i++){
				di = ts[i];
				updtbls[di['nm']] = f(ts[i]);
			}
			
			this.onStart.fire(new checker(updtbls));

			Brick.util.Connection.sendCommand(this.name, 'js_data', {
				hidden: hidden,
				success: callback,
				json: {
					'_ds': {
						'pfx': this.prefix,
						'ss': this.session,
						'ts': ts
					}
				}
			});
		}
	};
	
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

	
	/**
	 * Таблица 
	 * 
	 * @namespace Brick.util.data.byid
	 * @class Table
	 * @constructor
	 * @param name {String} Имя таблицы, используется для идентификации таблицы в коллекции
	 */
	var Table = function(name){

		/**
		 * Имя таблицы
		 * 
		 * @property name
		 * @type String
		 */
		this.name = name;
		
		/**
		 * Коллекция колонок
		 * 
		 * @property columns
		 * @type Brick.util.data.byid.Columns
		 */
		this.columns = new Columns();
		
		var _rowsparam = new RowsParam();
		var _lastUpdate = 0;
		var _recycleclear = false;
		
		/**
		 * Получить последний обновляемый rows
		 * 
		 * @method getLastUpdateRows
		 * @return {Brick.util.data.byid.RowsParam}
		 */
		this.getLastUpdateRows = function(){
			return _rowsparam.getLastUpdateRows();
		};
		
		/**
		 * Очистить таблицу от данных.
		 * 
		 * @method clear
		 */
		this.clear = function(){
			_rowsparam.clear();
		};
		
		this.countRowsParam = function(){
			return _rowsparam.count();
		};
		
		/**
		 * 
		 */
		this.findRows = function(exp){
			return _rowsparam.findRows(exp);
		};
		
		/**
		 * Создать и вернуть новую запись в таблице.
		 * 
		 * @method newRow
		 * @return {Row} Новая запись
		 */
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
		 * Указать, актуальны ли данные в этой таблицы, если нет, то есть
		 * необходимость запросить сервер на ее обновление.
		 * 
		 * @method isFill
		 * @return {Boolean} Если True, таблицу необходимо обновить.
		 */
		this.isFill = function(){
			var pd = this.getPostData();
			return YAHOO.lang.isNull(pd); 
		};

		/**
		 * Получить коолекцию записей по определенным параметрам.
		 * @method getRows
		 * @param {Object} param Параметры коллекции, так же является
		 * идентификатором ее.
		 * @param {Object} overparam Дополнительные параметры коллекции
		 * @return {Rows}
		 */
		this.getRows = function(param, overparam){
			return _rowsparam.getRows(param, overparam);
		};
		
		this.getAllRows = function(){
			return _rowsparam.getAllRows();
		};

		this.removeNonParam = function(param){
			_rowsparam.removeNonParam(param);
		};
		
		this.removeByParam = function(param){
			_rowsparam.removeByParam(param);
		};
		
		this.update = function(o){
			o['cs'] = o['cs'] || [];
			this.columns.update(o['cs']);
			_rowsparam.update(o['rs']);
			_lastUpdate =  Math.round((new Date()).getTime()/1000);
			_recycleclear = false;
		};
		
		/**
		 * Применить изменения в таблицы, тем самым указав DataSet 
		 * что ее необходимо обновить запросом на сервер. 
		 * 
		 * @method applyChanges
		 */
		this.applyChanges = function(){
			_rowsparam.applyChanges();
		};
		
		this.resetFlags = function(){
			_rowsparam.resetFlags();
		};
		
		/**
		 * Получить row осуществляя поиск во всех коллекциях по заданному идентификатору
		 * 
		 * @method getRowById
		 */
		this.getRowById = function(id){
			var arows = _rowsparam.getAllRows();
			for(var nn in arows){
				var row = arows[nn].getById(id);
				if (!L.isNull(row)){ return row; }
			}
			return null;
		};

	};
	
	var Column = function(name){ 
		this.init(name); 
	};
	Column.prototype = {
		init: function(name){
			this.name = name;
		}
	};
	
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
	
	/**
	 * Запись (строка) в коллекции Rows
	 * 
	 * @namespace Brick.util.data.byid
	 * @class Row
	 * @constructor
	 * @param data {String: Object} (optional) Данные записи 
	 */
	var Row = function(data){
		data = data || {};
		var _isnew = false;
		var _applychanges = false;
		var _isupdate = false;
		var _isremove = false;
		var _isrestore = false;
		
		if (!data['id']){
			data['id'] = 'nn'+(_globalRowId++);
			_isnew = true;
		}
		
		/**
		 * Идентификатор записи
		 * 
		 * @property id
		 * @type String
		 */
		this.id = data['id'];
		
		/**
		 * Данные записи
		 * @property cell
		 * @type Object
		 */
		this.cell = data;
		
		/**
		 * Указывает, является ли запись новой
		 * @method isNew
		 * @return {Boolean} Возвращает True, если запись новая, иначе False
		 */
		this.isNew = function(){ return _isnew; };
		
		/**
		 * Указывает, были ли изменены данные в записи
		 * @method isUpdate
		 * @return {Boolean} Возвращает True, если данные записи
		 * были изменены, иначе False
		 */
		this.isUpdate = function(){ return _isupdate; };
		
		/**
		 * Указывает, были ли какие либо изменения в записи 
		 * (удалена, обновлена или новая). Метод необходим для
		 * определения необходимости отправить эту запись серверу.
		 * 
		 * @method isApplyChanges
		 * @return {Boolean} Возвращает True, если запись
		 * была изменена, иначе False
		 */
		this.isApplyChanges = function(){ return _applychanges; };
		
		/**
		 * Указывает, помечена ли запись на удаление
		 * @method isRemove
		 * @return {Boolean} 
		 */
		this.isRemove = function(){ return _isremove; };
		
		/**
		 * Указывает, помечена ли запись как восстановленая
		 * @method isRestore
		 * @return {Boolean} 
		 */
		this.isRestore = function(){ return _isrestore; };
		
		/**
		 * Применить изменения в записи, тем самым подтвердив то,
		 * что запись необходимо актуализировать на сервере.
		 * @method applyChanges
		 */
		this.applyChanges = function(){
			if (this.isNew() || this.isUpdate() || this.isRemove() || this.isRestore()){
				_applychanges = true; 
			}
		};
		
		/**
		 * Отметить флаг состояния записи: удалена
		 * @method remove
		 */
		this.remove = function(){
			_isremove = true;
		};
		
		/**
		 * Отметить флаг состояния записи: восстановлена
		 * @method restore
		 */
		this.restore = function(){
			_isrestore = true;
		};
		
		/**
		 * Сравнить совпадение данных выражения с данными записи. 
		 * @method checkExpression
		 * @param {Object} exp Данные выражения
		 */
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

		/**
		 * Сброс всех флагов указывающих на изменения данных в строке.
		 * 
		 * @method resetFlags
		 */
		this.resetFlags = function(){
			_isnew = false;
			_applychanges = false;
			_isupdate = false;
			_isremove = false;
			_isrestore = false;
		};
		
		/**
		 * Удалить данные полей, при этом не удалять поле id и те, что 
		 * указаны в параметре noneRemove. <br>
		 * Зачастую бывает необходимо отправить на сервер изменения в
		 * полях записи, но при этом не отправлять в запросе все поля. 
		 * Как раз для этих случаев необходимо вызывать этот метод.  
		 * 
		 * @method clearFields
		 * @param {String} noneRemove Поля, которые необходимо оставить. 
		 * Указываются через запятую.
		 */
		this.clearFields = function(noneRemove){
			noneRemove = noneRemove || "";
			var arr = noneRemove.split(",");
			var newCell = {};
			for (var nn in this.cell){
				if (nn == 'id'){
					newCell[nn] = this.cell[nn];
				}else{
					var flagRemove = true;
					for (var i=0;i<arr.length;i++){
						if (nn == YAHOO.lang.trim(arr[i])){
							flagRemove = false;
							break;
						}
					}
					if (!flagRemove){
						newCell[nn] = this.cell[nn];
					}
				}
			}
			this.cell = newCell;
		};
		
		/**
		 * Обновить данные в записи.
		 * @method update
		 * @param {Object} data
		 */
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
		
		/**
		 * Клонировать запись.
		 * @method clone
		 * @return {Row}
		 */
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
	};
	
	var globalForeachId = 1;
	
	var keysort = function(a, b){
	    var anew = a.toLowerCase();
	    var bnew = b.toLowerCase();
	    if (anew < bnew) return -1;
	    if (anew > bnew) return 1;
	    return 0;
	};
	
	/**
	 * Коллекция записей
	 * @class Rows
	 * @constructor
	 * @param {Object} param Параметры коллекции, так же является ее идентификатором.
	 * @param {Object} overparam Дополнительные параметры коллекции.
	 */
	var Rows = function(param, overparam){
		this.init(param, overparam);
	};
	
	var toString = function(p){
		var ret = '';
		
		if (YAHOO.lang.isArray(p) || YAHOO.lang.isObject(p)){
			for (var n in p){
				ret += toString(p[n]); 
			}
		} else if (YAHOO.lang.isFunction(p)){
		} else {
			ret += p + '';
		}
		return ret;
	};
	
	/**
	 * Получить хеш-идентификатор из объекта параметров коллекции.
	 * 
	 * @method getParamHash
	 * @static
	 * @param {Object} param Параметры коллекции записей.
	 * @return {String} Хеш-идентификатор
	 */
	Rows.getParamHash = function(param){
		param = param || {};
		var arr = [];
		for (var nn in param){
			arr[arr.length] = nn + toString(param[nn]);
		}
		arr.sort(keysort);
		return 'p'+arr.join('');
	};
	
	Rows.prototype = {
		init: function(param, overparam){
			param = param || {};
			overparam = overparam || {};
			
			/**
			 * Параметры коллекции, так же является ее идентификатором.
			 * @property param
			 * @type Object
			 */
			this.param = param;

			/**
			 * Дополнительные параметры коллекции.
			 * @property overparam
			 * @type Object
			 */
			this.overparam = overparam;
			
			/**
			 * Идентификатор коллекции, сформирован из param методом Rows.getParamHash().
			 * 
			 * @property key
			 * @type String
			 */
			this.key = Rows.getParamHash(param);

			var _rows = {};
			var _count = 0;
			var _lastUpdate = 0;
			var _chrome = [];
			
			this.lastUpdateTime = function(){ return _lastUpdate; };
			
			/**
			 * Очистить записи в коллекции, тем самым указав DataSet необходимость
			 * обновить их запросом на сервер.
			 * @method clear
			 */
			this.clear = function(){
				_rows = {};
				_count = 0;
				_lastUpdate = 0;
			};
			
			/**
			 * Кол-во записей.
			 * @method count
			 * @return Integer
			 */
			this.count = function(){ return _count; };
			
			/**
			 * Добавить запись в коллекцию.
			 * @method add
			 * @param {Row} row запись.
			 */
			this.add = function(row){
				if (!_rows[row.id]){
					_chrome[_count] = row.id;
					_count++; 
				}
				_rows[row.id] = row;
			};
			
			this.remove = function(row){
				delete _rows[row.id];
				var nCount = 0, nChrome = [];
				for (var i=0;i<_chrome.length;i++){
					if (_rows[_chrome[i]]){
						nChrome[nCount++] = _chrome[i];
					}
				}
				_chrome = nChrome;
				_count = nCount;
			};
			
			/**
			 * Получить запись из коллекции по идентификатор row.id.
			 * @method getById
			 * @param {String} id Идентификатор записи.
			 * @return {Row | null}
			 */
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
			/**
			 * Получить запись из коллекции по индексу.
			 * @method getByIndex
			 * @param {Integer} index Индекс записи.
			 * @return {Row | null}
			 */
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
			
			/**
			 * Найти запись в коллекции используя выражение exp
			 * 
			 * @method find
			 * @param exp {String: String|Integer} Выражение
			 * @return
			 */
			this.find = function(exp){
				var rows = this.filter(exp);
				if (rows.count() == 0){
					return null;
				}
				return rows.getByIndex(0);
			};
			
			/**
			 * Вернуть коллекцию записей в таблице отфильтрованных по выражению exp.
			 * 
			 * Например: filter({'field1': 0, 'field2': 'black'})
			 * 
			 * @method filter
			 * @param exp {String: String|Integer} Выражение
			 * @return {Rows}
			 */
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
			
			/**
			 * Организовать проход по записям в коллекции.
			 * 
			 * @method foreach
			 * @param {Function} func Функция обработчик прохода. Необходимо
			 * определять с параметром, в него будет передаваться строка в процессе
			 * прохода по коллекции. 
			 * @param {Object} owner
			 */
			this.foreach = function(func, owner){
				var fname = "__rows_foreach"+(globalForeachId++);
				owner = owner || {};
				owner[fname] = func;
				
				for (var i=0;i<_chrome.length;i++){
					var id = _chrome[i];
					owner[fname](_rows[id], i);
				}
				delete owner[fname];
			};

			/**
			 * Получить массив записей с их данными.
			 * @method getValues
			 * @return {Array}
			 */
			this.getValues = function(from, count){
				
				from = from || 0;
				count = count || 9999999;
				
				var d = [];
				var i=0;
				for (var id in _rows){
					if (i >= from && d.length < count){
						d[d.length] = _rows[id].cell;
					}
					i++;
				}
				return d;
			};
			
			/**
			 * Получить массив записей
			 * @method getArray
			 * @return {[Row]}
			 */
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
			
			this.isFill = function(){
				var pd = this.getPostData();
				return YAHOO.lang.isNull(pd); 
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
			
			this.resetFlags = function(){
				for (var id in _rows){
					_rows[id].resetFlags();
				}
			};
			
			/**
			 * Клонировать коллекцию.
			 * @method clone
			 * @return {Rows}
			 */
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
	
	/**
	 * Коллекция коллекций записей в таблице. Идентификатором коллекции 
	 * является набор параметров
	 * @class RowsParam
	 */
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
			 * @method removeNonParam
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
			
			/**
			 * Удаление всех rows соответствующих param
			 * 
			 * @method removeByParam
			 */
			this.removeByParam = function(param){
				var key = Rows.getParamHash(param);
				
				if (_rows[key]){
					delete _rows[key];
					_count--;
				}
			};
			
			/**
			 * Получить коллекцию записей
			 * 
			 * @method getRows
			 * @param param 
			 * @param overparam
			 * @return
			 */
			this.getRows = function(param, overparam){
				var key = Rows.getParamHash(param);

				if (!_rows[key]){
					_rows[key] = new Rows(param, overparam);
					_count++;
				}
				return _rows[key];
			};
			
			this.getAllRows = function(){
				return _rows;
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
			 * Найти запись среди коллекций записей используя выражение exp
			 *  
			 * @method findRow
			 * @param exp Выражение
			 * @return {Row}
			 */
			this.findRow = function(exp){
				for(var nn in _rows){
					var row = _rows[nn].find(exp);
					if (row){ return row; }
				}
				return null;
			};
			
			// Метод findFows для обеспечения совместимости предыдущей версии.
			// Вместо него необходимо использовать метод findRow
			this.findRows = function(exp){
				return this.findRow(exp); 
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
				for(var nn in _rows){
					_rows[nn].clear();
				}
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
			
			this.resetFlags = function(){
				for(var nn in _rows){
					_rows[nn].resetFlags();
				}				
			};

		}
	};
	
	
	Brick.util.data.byid.DataSet = DataSet;
	Brick.util.data.byid.Table = Table;
	Brick.util.data.byid.Row = Row;
	
	
	var TablesManager = function(ds, list, cfg){
		if (L.isString(list)){
			list = [list];
		}
		cfg = L.merge({
			'owner': null,
			'disableCheckFill': false
		}, cfg || {});
		this.init(ds, list, cfg);
	};
	TablesManager.prototype = {
		init: function(ds, list, cfg){
			this.ds = ds;
			this.list = list;
			this.cfg = cfg;
			this._params = {};
			
			// TODO: в наследуемых классах методы и св-тва обработчика событий необходимо объявлять в процессе инициализации объекта
			this.dsEvent = function(type, args){
				for (var i=0;i<this.list.length;i++){
					var tname = this.list[i];
					var ps = this._params[tname] || [];
					if (ps.length == 0){
						ps[ps.length] = {};
					}
					for (var ii=0;ii<ps.length;ii++){
						if (args[0].checkWithParam(tname, ps[ii])){
							type == 'onComplete' ? this.onDataLoadComplete() : this.onDataLoadWait();
							return;
						}
					}
				}
			};
			
			ds.onStart.subscribe(this.dsEvent, this, true);
			ds.onComplete.subscribe(this.dsEvent, this, true);

			var tables = {};
			for (var i=0;i<list.length;i++){
				var tname = list[i];
				tables[tname] = ds.get(tname, true);
			}
			this.tables = tables;
			if (!cfg['disableCheckFill']){
				this.checkFill();
			}
		},
		destroy: function(){
			this.ds.onComplete.unsubscribe(this.dsEvent);
			this.ds.onStart.unsubscribe(this.dsEvent);
		},
		checkFill: function(){
			this.ds.isFill(this.tables) ? this.onDataLoadComplete() : this.onDataLoadWait();
		},
		onDataLoadComplete: function(){
			var owner = this.cfg.owner;
			if (L.isNull(owner) || !L.isFunction(owner['onDataLoadComplete'])){ return; }
			owner.onDataLoadComplete(this);
		},
		onDataLoadWait: function(){
			var owner = this.cfg.owner;
			if (L.isNull(owner) || !L.isFunction(owner['onDataLoadWait'])){ return; }
			owner.onDataLoadWait(this);
		},
		foreach: function(tname, fn, prms){
			prms = prms || {};
			this.ds.get(tname).getRows(prms).foreach(fn);
		},
		get: function(tname){
			return this.ds.get(tname);
		},
		request: function(){
			this.ds.request();
		},
		setParam: function(tname, param){
			var ps = this._params; 
			ps[tname] = ps[tname] || [];
			var a = ps[tname];
			a[a.length] = param;
			this.ds.get(tname, true).getRows(param);
		}
	};
	
	NS.TablesManager = TablesManager;
};
