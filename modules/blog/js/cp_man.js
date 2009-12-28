/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

Brick.namespace('Blog.Admin');

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

	// BUG!! в этом месте - 
	// Если использовать в подгрузке одновременно 'dragdrop' и 'treeview',
	// то загрузчик уходит в аут
	// Предположение: В процессе загрузки этой либы, поступает запрос на подгрузку
	// 'dragdrop' и 'treeview', а они делают запрос в YUILoader на те либы, которые 
	// уже загруженны, но не зафиксированны, потому как сработал onSuccess раньше
	Brick.Loader.add({
//	yahoo: ["connection",'animation','dragdrop','container','treeview'], // - не работает 
// 	yahoo: ["connection",'animation','container','treeview'], // - работает
    yahoo: ["paginator"],
		// ext: [{name: "accordionview"}],
		mod:[{name: 'sys', files: ['container.js']}],
    onSuccess: function() {
			W = YAHOO.widget;

			T = Brick.util.Template['blog']['cp_man'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
		}
	});

(function(){
	
	Brick.Blog.Admin.CP = function(){
		return {
			initialize: function(container){
				container.innerHTML = T['panel'];
		
				var __self = this;
				E.on(container, 'click', function(e){
					if (__self.clickEvent(E.getTarget(e))){ E.stopEvent(e); }
				});
				
				this.Bloglist = new bloglist();
			},
			clickEvent: function(el){
				
				switch(el.id){
				case TId['panel']['btnadd']: this.topicLoad(0); return true;
				case TId['panel']['refresh']: this.Bloglist.refresh(); return true;
				case TId['panel']['rcshow']: this.recycle('show'); return true;
				case TId['panel']['rchide']: this.recycle('hide'); return true;
				case TId['panel']['rcclear']: this.recycleClear(); return true;
				}
				
				var prefix = el.id.replace(/([0-9]+$)/, '');
				var numid = el.id.replace(prefix, "");
				
				switch(prefix){
				case (TId['row']['edit']+'-'): this.topicLoad(numid); return true;
				case (TId['row']['remove']+'-'): this.topicRemove(numid); return true;
				case (TId['rowdel']['restore']+'-'): this.topicRestore(numid); return true;
				case (TId['bipub']['id']+'-'): this.topicPublish(numid); return true;
				}
				return false;
			},
			recycle: function(show){
				BC.sendCommand('blog', 'js_bloglist', { 
					json: {
						'rc': show, 
						'page': this.currentPage
					}
				});
			},
			recycleClear: function(){
				this.Bloglist.recycleClear();
			},
			topicPublish: function(topicid){
				this.Bloglist.publish(topicid);
			},
			topicRemove: function(topicid){
				this.Bloglist.remove(topicid);
			},
			topicRestore: function(topicid){
				this.Bloglist.restore(topicid);
			},
			topicLoad: function(topicid){
				if (!Brick.objectExists('Brick.Blog.Topic.Manager')){
					wWait.show();
					Brick.Loader.add({
						mod: [ {name: 'blog', files: ['topic.js']} ],
				    onSuccess: function() {
							wWait.hide();
							Brick.Blog.Topic.Manager.load(topicid);
						},
						onFailure: function(){ wWait.hide(); }
					});
				}else{
					Brick.Blog.Topic.Manager.load(topicid);
				}
			}
		}
	}();
	
	var bloglist = function(){

		this.data = [];
		this.pagtop = null;
		this.pagbot = null;
		this.currentPage = 0;
		this.showRecycle = 'show';

		this.init();
	}; 
	bloglist.prototype = {
		init: function(){
			
			var __self = this;
			var handlePagination = function (state) {
				__self.refreshPage(state.page)
			};

			this.pagtop =  new W.Paginator({containers : TId['panel']['pagtop'], rowsPerPage: 10});
			this.pagbot =  new W.Paginator({containers : TId['panel']['pagbot'], rowsPerPage: 10});
			
			this.pagtop.subscribe('changeRequest', handlePagination);
			this.pagbot.subscribe('changeRequest', handlePagination);
			this.refresh();
		},
		refresh: function(){
			this.refreshPage(this.currentPage);
		},
		refreshPage: function(page){
			BC.sendCommand('blog', 'js_bloglist', { json: {'page': page} });
		},
		update: function(d, page, total, rc){
			this.data = d;
			this.currentPage = page;
			this.showRecycle = rc;
			var cfg = { page: page, totalRecords: total };
			this.pagtop.setState(cfg);
			this.pagtop.render();

			this.pagbot.setState(cfg);
			this.pagbot.render();
			
			var i, rows="", t, di, tt;
			for (i=0;i<d.length;i++){
				di=d[i];
				t = di['dd']>0 ? T['rowdel']:T['row'];

				t = tSetVar(t, 'unm', di['unm']);
				t = tSetVar(t, 'dl', dateExt.convert(di['dl']));
				t = tSetVar(t, 'de', dateExt.convert(di['de']));
				if (di['dp']>0){
					t = tSetVar(t, 'dp', dateExt.convert(di['dp']));
				}else{
					t = tSetVar(t, 'dp', T['bipub']);
				}
				t = tSetVar(t, 'cat', di['cat']);

				t = tSetVar(t, 'lnk', '/blog/'+di['catnm']+'/'+di['id']);
				
				t = tSetVar(t, 'tl', di['tl']);
				
				t = tSetVar(t, 'id', di['id']);
				rows += t;
			}
			
			var div = Dom.get(TId['panel']['table']);
			elClear(div);
			
			var tt = tSetVar(T['table'], 'rows', rows);
			div.innerHTML = tt;
			
			var rcshow = Dom.get(TId['panel']['rcshow']);
			var rchide = Dom.get(TId['panel']['rchide']);
			
			rcshow.style.display = rc == 'show'?'none':'';
			rchide.style.display = rc != 'show'?'none':'';
		},
		publish: function(id){
			BC.sendCommand('blog', 'js_bloglist', { 
				json: {
					'type': 'topic',
					'id': id,
					'act': 'publish', 
					'page': this.currentPage,
					'rc': this.showRecycle
				}
			});
		},
		remove: function(id){
			BC.sendCommand('blog', 'js_bloglist', { 
				json: {
					'type': 'topic',
					'id': id,
					'act': 'remove', 
					'page': this.currentPage,
					'rc': this.showRecycle
				}
			});
		},
		restore: function(id){
			BC.sendCommand('blog', 'js_bloglist', { 
				json: {
					'type': 'topic',
					'id': id,
					'act': 'restore', 
					'page': this.currentPage,
					'rc': this.showRecycle
				}
			});
		},
		recycleClear: function(){
			BC.sendCommand('blog', 'js_bloglist', { 
				json: {
					'act': 'rcclear', 
					'page': this.currentPage,
					'rc': this.showRecycle
				}
			});
		}
	}

})();


})();
