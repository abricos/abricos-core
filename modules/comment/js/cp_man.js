/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

Brick.namespace('Comment.Admin');

(function(){
	var W, T, J, TId;

	var Dom = YAHOO.util.Dom;
	var E = YAHOO.util.Event;
	var L = YAHOO.lang;
	var C = YAHOO.util.Connect;
	var BC = Brick.util.Connection;

	var uniqurl = Brick.uniqurl;
	var dateExt = Brick.dateExt;
	var readScript = Brick.readScript;
	var wWait = Brick.widget.WindowWait;
	var elClear = Brick.elClear;
	function connectFailure(o){ wWait.hide(); alert("CONNECTION FAILED!"); };
	var connectCallback = {success: function(o) {wWait.hide(); readScript(o.responseText);}, failure: connectFailure};
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
    yahoo: ["paginator"],
		mod:[{name: 'sys', files: ['editorold.js']}],
    onSuccess: function() {
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;
			W = YAHOO.widget;
			C = YAHOO.util.Connect;

			T = Brick.util.Template['comment']['cp_man'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
	  }
	});
	
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
(function(){
	
	Brick.Comment.Admin.CP = function(){
		return {
			initialize: function(container){
				container.innerHTML = T['panel'];
		
				var __self = this;
				E.on(container, 'click', function(e){
					if (__self.clickEvent(E.getTarget(e))){ E.stopEvent(e); }
				});
				
				this.Commlist = new commlist();
			},
			clickEvent: function(el){
				if (el.id == TId['panel']['refresh']){
					this.Commlist.refresh(); return true;
				}
				if (this.Commlist.clickEvent(el)){
					return true;
				}
				return false;
			}
		}
	}();
	
	var commlist = function(){
		this.init();
	}
	commlist.prototype = {
		init: function(){
		
			this.data = [];
			this.pagtop = null;
			this.pagbot = null;
			this.currentPage = 0;
			
			var __self = this;
			var handlePagination = function (state) {
				__self.refreshPage(state.page)
			};

			this.pagtop = new W.Paginator({containers : TId['panel']['pagtop'], rowsPerPage: 15});
			this.pagbot = new W.Paginator({containers : TId['panel']['pagbot'], rowsPerPage: 15});
			
			this.pagtop.subscribe('changeRequest', handlePagination);
			this.pagbot.subscribe('changeRequest', handlePagination);
			this.refresh();
		},
		clickEvent: function(el){
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['bispam']['id']+'-'): 
			case (TId['binotspam']['id']+'-'): 
				this.changeStatus(numid); 
				return true;
			}
			return false;
		},
		findComment: function(id){
			for (var i=0;i<this.data.length;i++){
				if (this.data[i]['id'] == id){
					return this.data[i];
				}
			}
			return null;
		},
		changeStatus: function(id){
			var comt = this.findComment(id)
			var st = comt['st']==1 ? 0 : 1;
			BC.sendCommand('comment', 'js_commlist', { 
				json: {
					'act': 'status',
					'page': this.currentPage,
					'id': id,
					'st': st
				}
			});
		},
		refresh: function(){
			this.refreshPage(this.currentPage);
		},
		refreshPage: function(page){
			BC.sendCommand('comment', 'js_commlist', { json: {'page': page} });
		},
		update: function(d, page, total){
			this.data = d;
			this.currentPage = page;
			var cfg = { page: page, totalRecords: total };
			this.pagtop.setState(cfg);
			this.pagtop.render();

			this.pagbot.setState(cfg);
			this.pagbot.render();
			
			var i, rows="", t, di;
			for (i=0;i<d.length;i++){
				di=d[i];
				t = T['row'];
				
				t = tSetVar(t, 'dl', dateExt.convert(di['dl']));
				t = tSetVar(t, 'unm', di['unm']);
				t = tSetVar(t, 'st', (di['st']==1?T['binotspam']:T['bispam']));
				t = tSetVar(t, 'bd', encode(di['bd']));
				t = tSetVar(t, 'id', di['id']);
				
				rows += t;
			}
			
			var div = Dom.get(TId['panel']['table']);
			elClear(div);
			div.innerHTML = tSetVar(T['table'], 'rows', rows); 
		}
	}
})();

})();
