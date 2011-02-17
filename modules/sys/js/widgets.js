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
	
	//Изменение значений next, prev, first, last пагинатора
	YAHOO.widget.Paginator.ui.FirstPageLink.init = function (p) {
	    p.setAttributeConfig('firstPageLinkLabel', {
	        value : '&lt;&lt;',//&lt;&lt; первый
	        validator : L.isString
	    });
	    p.setAttributeConfig('firstPageLinkClass', {
	        value : 'yui-pg-first',
	        validator : L.isString
	    });
	};
	YAHOO.widget.Paginator.ui.LastPageLink.init = function (p) {
	    p.setAttributeConfig('lastPageLinkLabel', {
	        value : '&gt;&gt;',//последний &gt;&gt;
	        validator : L.isString
	    });
	    p.setAttributeConfig('lastPageLinkClass', {
	        value : 'yui-pg-last',
	        validator : L.isString
	    });
	};
	YAHOO.widget.Paginator.ui.NextPageLink.init = function (p) {
	    p.setAttributeConfig('nextPageLinkLabel', {
	        value : '&gt;',//следующий &gt
	        validator : L.isString
	    });
	    p.setAttributeConfig('nextPageLinkClass', {
	        value : 'yui-pg-next',
	        validator : L.isString
	    });
	};
	YAHOO.widget.Paginator.ui.PreviousPageLink.init = function (p) {
	    p.setAttributeConfig('previousPageLinkLabel', {
	        value : '&lt;',//&lt; предыдущий
	        validator : L.isString
	    });
	    p.setAttributeConfig('previousPageLinkClass', {
	        value : 'yui-pg-previous',
	        validator : L.isString
	    });
	};

	/////////////////////////////////////////////////////////////////////
	//                             TablePage                           //
	/////////////////////////////////////////////////////////////////////
	
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
		_handlePagination: function(state){
			this.setPage(state.page);
			this._DATA.request(true);
		},
			
		init: function(el, config){

			this._tableList = '';
			this._tableListCount = '';
			this._rowlimit = 10;
			this._DATA = null;
			this._paginators = {};
			this._filter = {};

			config = L.merge({
				// загружать таблицу полностью, без деления ее на страницы
				fulldata: false,
				rowlimit: 10,
				tables: {
					'list': '',
					'count': ''
				},
				tm: null,
				paginators: [], 
				DATA: null,
				autohidepaginator: true,
				filter: {}
			}, config || {});
			this.config = config;
			
			this._rowlimit = config.rowlimit;
			this._DATA = config.DATA;
			this._tableList = config.tables.list;
			this._tableListCount = config.tables.count;
			this._filter = config.filter;
			
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
				pag.containerNode = pagEl; 
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
			
			this._DATA.onStart.subscribe(this.dsEvent, this, true);
			this._DATA.onComplete.subscribe(this.dsEvent, this, true);

			this.setPage(1);
		},
		
		destroy: function(){
			this._DATA.onStart.unsubscribe(this.dsEvent);
			this._DATA.onComplete.unsubscribe(this.dsEvent);
		},
		
		dsEvent: function(type, args){
			var prm = this.config.fulldata ? {} : this._sendParam;

			if (args[0].checkWithParam(this._tableList, prm)){
				type == 'onComplete' ? this.render() : this.renderTableAwait(); 
			}
		},
		
		getRows: function(){
			return this.rows;
		},
		
		refresh: function(notRequest){
			for (var n in this.tables){
				this.tables[n].clear();
			}

			this.setPage(this._sendParam.page);
			if (!notRequest){
				this._DATA.request(true);
			}
		},
		
		initTables: function(){
			var prm = this.config.fulldata ? {} : this._sendParam;
			this.rows = this.tables[this._tableList].getRows(prm);
			this.tables[this._tableListCount].getRows(prm);
		},
		
		getParam: function(){
			return this._sendParam;
		},
		
		buildSendParam: function(page){
			var prm = {};
			for (var nn in this._filter){
				prm[nn] = this._filter[nn];
			}
			prm['page'] = page;
			prm['limit'] = this._rowlimit;
			
			return prm;
		},
		
		setFilter: function(filter){
			this._filter = filter;
			this.setPage(this._sendParam.page);
		},
		
		setPage: function(page){
			this._sendParam = this.buildSendParam(page);
			this.initTables();
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
			var cfg = this.config;
			var param = this._sendParam;
			var DATA = this._DATA;
			var table = DATA.get(this._tableList);
			var rows = table.getRows(cfg.fulldata ? {} : this._sendParam);
			var page = param['page']*1; 
			var total = DATA.get(this._tableListCount).getRows(cfg.fulldata ? {} : this._sendParam).getByIndex(0).cell['cnt']*1;
			
			var param = { page: page, totalRecords: total };
			for(var n in this._paginators){
				var pg = this._paginators[n]; 
				
				pg.setState(param);
				pg.render();
				
				if (total > cfg.rowlimit){
					pg.containerNode.style.display = '';
				}else if (cfg.autohidepaginator && total < cfg.rowlimit){
					pg.containerNode.style.display = 'none';
				}
			}
			
			var dateExt = Brick.dateExt;
			
			var __self = this;
			var lst = "";
			if (cfg.fulldata){
				var counter = 0,
					ipage = page-1,
					begin = ipage*cfg.rowlimit,
					end = (ipage+1)*cfg.rowlimit;
				rows.foreach(function(row){
					if (begin <= counter && counter < end){
						lst += __self.renderRow(row.cell);
					}
					counter++;
				});
			}else{
				rows.foreach(function(row){
					lst += __self.renderRow(row.cell);
				});
			}
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
};
