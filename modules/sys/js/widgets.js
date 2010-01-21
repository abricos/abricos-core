/*
@version $Id$
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Sys
 * @namespace Brick.widget
 */

var Component = new Brick.Component();
Component.requires = {
    yahoo: ['element', 'paginator'],
    mod:[
         {name: 'sys', files: ['data.js']},
    ]
};
Component.entryPoint = function(){
	
	Brick.namespace('widget');

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

/////////////////////////////////////////////////////////////////////
//                             TablePage                           //
/////////////////////////////////////////////////////////////////////
(function(){
	
	/**
	 * Прототип таблицы с постраничным выводом.
	 * 
	 * @class TablePage
	 * @constructor
	 * @param {String} el HTML элемент, куда будет помещен виджет.
	 * @param {String} template Базовый элемент шаблон, на основе которого будет построен виджет.
	 * @param сonfig {Object} Настройки виджета.
	 */
	var TablePage = function(el, config){
		el = L.isString(el) ? Dom.get(el) : el;
		this.init(el, config);
	};
	
	TablePage.prototype = {
		
		_tableList: '',
		_tableListCount: '',
		_rowlimit: 10,
		_DATA: null,
		_paginators: {},
		_handlePagination: function(state){
			this.setPage(state.page);
			this._DATA.request(true);
		},
			
		init: function(el, config){
			
			config = L.merge({
				rowlimit: 10,
				tables: {
					'list': '',
					'count': ''
				},
				tm: null,
				paginators: [], 
				DATA: null
			}, config || {});
			
			this._rowlimit = config.rowlimit;
			this._DATA = config.DATA;
			this._tableList = config.tables.list;
			this._tableListCount = config.tables.count;
			
			var template = this.initTemplate();
			
			el.innerHTML = template;

			for (var i=0;i<config.paginators.length;i++){
				var pagId = config.paginators[i];
				var pagEl = null;
				if (!L.isNull(config.tm)){
					pagEl = config.tm.getEl(pagId);
				}else{
					pagEl = Dom.get(pagId);
				}
				var pag = this._paginators[pagId] = new YAHOO.widget.Paginator({containers : pagEl, rowsPerPage: config.rowlimit});
				pag.subscribe('changeRequest', this._handlePagination, this, true);
			}
			
			this.onLoad();
			
			var __self = this;
			E.on(el, 'click', function(e){
				var cel = E.getTarget(e);
				if (__self.onClick(cel)){ E.stopEvent(e); }
			});
			
			this.renderTableAwait();
			
			this.tables = {};
			this.tables[this._tableList] = this._DATA.get(this._tableList, true);
			this.tables[this._tableListCount] = this._DATA.get(this._tableListCount, true);
			
			this._DATA.onComplete.subscribe(this.dsComplete, this, true);
			this.setPage(1);
		},
		
		destroy: function(){
			this._DATA.onComplete.unsubscribe(this.dsComplete);
		},
		
		dsComplete: function(type, args){
			if (args[0].checkWithParam(this._tableList, this._sendParam)){ 
				this.render(); 
			}
		},
		
		getRows: function(){
			return this.rows;
		},
		
		refresh: function(){
			for (var n in this.tables){
				this.tables[n].clear();
			}

			this.setPage(this._sendParam.page);
			this._DATA.request(true);
		},
		
		setPage: function(page){
			this._sendParam = {'page': page, 'limit': this._rowlimit};
			
			this.rows = this.tables[this._tableList].getRows(this._sendParam);
			this.tables[this._tableListCount].getRows();
			if (this._DATA.isFill(this.tables)){
				this.render();
			}else{
				this.renderTableAwait();
			}
		},
		
		saveChanges: function(){
			for (var n in this.tables){
				this.tables[n].applyChanges();
			}
			if (!this._DATA.isFill(this.tables)){
				this.renderTableAwait();
				this._DATA.request(true);
			}
		},
		
		render: function(){
			var param = this._sendParam;
			var DATA = this._DATA;
			var table = DATA.get(this._tableList);
			var rows = table.getRows(param);
			var page = param['page']*1; 
			var total = DATA.get(this._tableListCount).getRows().getByIndex(0).cell['cnt']*1;
			
			var cfg = { page: page, totalRecords: total };
			for(var n in this._paginators){
				this._paginators[n].setState(cfg);
				this._paginators[n].render();
			}
			
			var dateExt = Brick.dateExt;
			
			var __self = this;
			var lst = "";
			rows.foreach(function(row){
				lst += __self.renderRow(row.cell);
			});
			this.renderTable(lst);
		},
		
		renderRow: function(di){ return ""; },
		renderTable: function(lst){ },
		renderTableAwait: function(){},

		/**
		 * Обработать базовый элемент шаблона.
		 * Инициализировать элемент шаблона. 
		 * 
		 * @method initTemplate
		 * @param {String} template Элемент шаблона
		 * @return {String}
		 */
		initTemplate: function(t){ return t; },
		
		onLoad: function(){},
		
		onClick: function(el){ return false; }
		
		
	};
	
	Brick.widget.TablePage = TablePage;
	
})();	
};
