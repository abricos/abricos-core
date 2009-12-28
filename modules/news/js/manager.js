/**
* @version $Id$
* @package Abricos
* @copyright Copyright (C) 2008 Abricos All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/


/**
 * @module News
 * @namespace Brick.mod.news
 */

var Component = new Brick.Component();
Component.requires = {
    mod:[
         {name: 'sys', files: ['data.js', 'container.js', 'widgets.js']},
         {name: 'news', files: ['api.js']}
    ]
};
Component.entryPoint = function(){
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var __selfCT = this;
	
	var NS = this.namespace, 
		TMG = this.template;
	
	var API = NS.API;
	
	if (!Brick.objectExists('Brick.mod.news.data')){
		Brick.mod.news.data = new Brick.util.data.byid.DataSet('news');
	}
	var DATA = Brick.mod.news.data;
	
(function(){
	
	var TM = TMG.build('panel'), 
		T = TM.data,
		TId = TM.idManager;

	/**
	 * Панель "Список новостей".
	 * 
	 * @class NewsListPanel
	 */
	var NewsListPanel = function(){
		NewsListPanel.superclass.constructor.call(this, {
			modal: true,
			fixedcenter: true			
		});
	};
	YAHOO.extend(NewsListPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['panel'][name]); },
		initTemplate: function(){
			return T['panel'];
		},
		onLoad: function(){
			
			this.newsListWidget = new NS.NewsListWidget(TId['panel']['container']);
			
			var firstRender = true, __self = this;
			this.newsListWidget.parentRender = this.newsListWidget.render;
			this.newsListWidget.render = function(){
				this.parentRender();
				if (firstRender){
					__self.center();
				}
				firstRender = false;
			};
		},
		
		/**
		 * Обработать закрытие панели.
		 * 
		 * @method onClose
		 */
		onClose: function(){
			this.newsListWidget.destroy();
		},
		
		/**
		 * Обработать клик мыши по области панели.
		 * 
		 * @method onClick
		 * @param {HTMLElement} el
		 * @return {Boolean}
		 */
		onClick: function(el){
			var tp = TId['panel'];
			switch(el.id){
			case tp['bclose']: this.close(); return true;
			}
			return false;
		}
	});
	
	NS.NewsListPanel = NewsListPanel;	
})();	

(function(){
	
	var scbAPI =  Brick.objectExists('Brick.Subscribe.API') ? Brick.Subscribe.API : null;

	var NewsListWidget = function(el){
		
		var TM = TMG.build('widget,table,row,rowwait,rowdel,btnpub'), 
			T = TM.data, TId = TM.idManager;
		this._TM = TM, this._T = T, this._TId = TId;
		
		var config = {
			rowlimit: 10,
			tables: {
				'list': 'newslist',
				'count': 'newscount'
			},
			tm: TM,
			paginators: ['widget.pagtop', 'widget.pagbot'],
			DATA: DATA
		};
		NewsListWidget.superclass.constructor.call(this, el, config);    
	};
	
    YAHOO.extend(NewsListWidget, Brick.widget.TablePage, {
    	initTemplate: function(){
    		return this._T['widget'];
    	},
    	renderTableAwait: function(){
    		this._TM.getEl("widget.table").innerHTML = this._TM.replace('table', {
    			'scb': '',
    			'rows': this._T['rowwait']
    		});
    	},
		renderRow: function(di){
    		return this._TM.replace(di['dd']>0 ? 'rowdel' : 'row', {
    			'dl': Brick.dateExt.convert(di['dl']),
    			'tl': di['tl'],
    			'dp': (di['dp']>0 ? Brick.dateExt.convert(di['dp']) : this._T['btnpub']),
    			'prv': '/news/'+di['id']+'/',
    			'scb': '',
    			// 'scb': L.isNull(this.scbAPI)?'':T['scbrow']
    			'id': di['id']
			});
    	},
    	renderTable: function(lst){
    		this._TM.getEl("widget.table").innerHTML = this._TM.replace('table', {
    			'scb': '',
    			'rows': lst
    		}); 
    	}, 
    	onClick: function(el){
    		var TM = this._TM, T = this._T, TId = this._TId;
    		
    		if (el.id == TM.getElId("widget.refresh")){
    			this.refresh();
    			return true;
    		}
			if (el.id == TId['widget']['btnnew']){
				API.showEditorPanel(0);
				return true;
			}
			if (el.id == TId['widget']['rcclear']){
				this.recycleClear();
				return true;
			}
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['rowdel']['restore']+'-'):
				this.restore(numid);
				return true;
			case (TId['row']['remove']+'-'):
				this.remove(numid);
				return true;
			case (TId['row']['edit']+'-'):
				API.showEditorPanel(numid);
				return true;
			case (TId['btnpub']['id']+'-'):
				this.publish(numid);
				return true;
			//case (TId['scbrow']['id']+'-'):
			//	this.subscribe(numid);
			//	return true;
			}
			return false;
    	},
    	
		changeStatus: function(commentId){
    		var rows = this.getRows();
    		var row = rows.getById(commentId);
    		row.update({
    			'st': row.cell['st'] == 1 ? 0 : 1,
    			'act': 'status'
    		});
    		row.clearFields('st,act');
    		this.saveChanges();
		}
    });

	NS.NewsListWidget = NewsListWidget;
})();
};
