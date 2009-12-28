/*
@version $Id$
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Comment
 * @namespace Brick.mod.comment
 */

var Component = new Brick.Component();
Component.requires = {
    mod:[
         {name: 'sys', files: ['data.js', 'container.js', 'widgets.js']}
    ]
};
Component.entryPoint = function(){
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var __selfCT = this;
	
	var NS = this.namespace, 
		TMG = this.template;
	
	if (!Brick.objectExists('Brick.mod.comment.data')){
		Brick.mod.comment.data = new Brick.util.data.byid.DataSet('comment');
	}
	var DATA = Brick.mod.comment.data;


//////////////////////////////////////////////////////////////
//                      CommentListPanel                    //
//////////////////////////////////////////////////////////////
(function(){
	
	var TM = TMG.build('panel'), 
		T = TM.data,
		TId = TM.idManager;
	
	/**
	 * Панель "Список записей в блоге".
	 * 
	 * @class TopicListPanel
	 */
	var CommentListPanel = function(){
		CommentListPanel.superclass.constructor.call(this, T['panel'], {'width': '780px'});
	};
	YAHOO.extend(CommentListPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['panel'][name]); },
		onLoad: function(){
			
			this.commentListWidget = new NS.CommentListWidget(TId['panel']['container']);
			
			var firstRender = true, __self = this;
			this.commentListWidget.parentRender = this.commentListWidget.render;
			this.commentListWidget.render = function(){
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
			this.commentListWidget.destroy();
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
	
	NS.CommentListPanel = CommentListPanel;
})();

(function(){
	
	var encode = function(s) {
		return s ? ('' + s).replace(/[<>&\"]/g, function (c, b) {
			switch (c) {
			  	case '&': return '&amp;';
			  	case '"': return '&quot;';
			  	case '<': return '&lt;';
			  	case '>': return '&gt;';
			}
			return c;
		}) : s;
	};
	
	var CommentListWidget = function(el){
		
		this._TM = TMG.build('widget,table,row,rowwait,binotspam,bispam'); 
		this._T = this._TM.data;
		this._TId = this._TM.idManager;
		
		var config = {
			rowlimit: 10,
			tables: {
				'list': 'fulllist',
				'count': 'fulllistcount'
			},
			tm: this._TM,
			paginators: ['widget.pagtop', 'widget.pagbot'],
			DATA: DATA
		};
		CommentListWidget.superclass.constructor.call(this, el, config);    
	};
	
    YAHOO.extend(CommentListWidget, Brick.widget.TablePage, {
    	initTemplate: function(){
    		return this._T['widget'];
    	},
    	renderTableAwait: function(){
    		this._TM.getEl("widget.table").innerHTML = this._TM.replace('table', {'rows': this._T['rowwait']});
    	},
		renderRow: function(di){
    		var T = this._T;
    		return this._TM.replace('row', {
				'dl': Brick.dateExt.convert(di['dl']),
				'unm': di['unm'],
				'st': (di['st']==1?T['binotspam']:T['bispam']),
				'bd': encode(di['bd']),
				'id': di['id']
			});
    	},
    	renderTable: function(lst){
    		this._TM.getEl("widget.table").innerHTML = this._TM.replace('table', {'rows': lst}); 
    	}, 
    	onClick: function(el){
    		if (el.id == this._TM.getElId("widget.refresh")){
    			this.refresh();
    			return true;
    		}
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (this._TId['bispam']['id']+'-'): 
			case (this._TId['binotspam']['id']+'-'): 
				this.changeStatus(numid); 
				return true;
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

	NS.CommentListWidget = CommentListWidget;
})();
};
