/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	
	Brick.namespace('mod.news');

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		C = YAHOO.util.Connect,
		T, TId;
	
	var DATA;

	var readScript = Brick.readScript;
	var uniqurl = Brick.uniqurl;
	var dateExt = Brick.dateExt;
	var wWait = Brick.widget.WindowWait;
	var elClear = Brick.elClear;
	var tSetVar = Brick.util.Template.setProperty;

	function connectFailure(o){ wWait.hide();alert("CONNECTION FAILED!");	};
	
	var connectCallback = {
		success: function(o) { 
			wWait.hide();
			readScript(o.responseText);
		}, failure: connectFailure
	};

	Brick.Loader.add({
    yahoo: ["paginator"],
		mod:[{name: 'news', files: ['api.js']},
		     {name: 'subscribe', files: ['api.js']},
		     {name: 'sys', files: ['data.js']}
		],
    onSuccess: function() {
			if (!Brick.objectExists('Brick.mod.news.data')){
				Brick.mod.news.data = new Brick.util.data.byid.DataSet('news');
			}
			DATA = Brick.mod.news.data;

			T = Brick.util.Template['news']['cp_man'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
	  }
	});
	
(function(){
	
	Brick.mod.news.CP = function(){
		return {
			initialize: function(container){
				container.innerHTML = T['panel'];
		
				var __self = this;
				E.on(container, 'click', function(e){if (__self.clickEvent(E.getTarget(e))){ E.stopEvent(e);}});
				
				this.Newslist = new newslist();
				
				Brick.mod.news.data.request();
			},
			clickEvent: function(el){
				if (el.id == TId['panel']['refresh']){
					this.Newslist.refresh(); return true;
				}
				if (this.Newslist.clickEvent(el)){
					return true;
				}
				return false;
			}
		}
	}();
	
	var PAGEROWLIMIT = 10;
	
	var newslist = function(){ this.init(); };
	newslist.prototype = {
		init: function(){

			this.savedCountNews = -1;
			var __self = this;
			this.scbAPI =  Brick.objectExists('Brick.Subscribe.API') ? Brick.Subscribe.API : null;

			this.pagtop = new YAHOO.widget.Paginator({containers : TId['panel']['pagtop'], rowsPerPage: PAGEROWLIMIT});
			this.pagbot = new YAHOO.widget.Paginator({containers : TId['panel']['pagbot'], rowsPerPage: PAGEROWLIMIT});
			
			var hdlPagination = function (state) { __self.refreshPage(state.page, true) };
			this.pagtop.subscribe('changeRequest', hdlPagination);
			this.pagbot.subscribe('changeRequest', hdlPagination);

			this.tables = { 
				'newslist': DATA.get('newslist', true),
				'newscount': DATA.get('newscount', true)
			};
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			this.refreshPage(1, false);
		},
		onDSUpdate: function(type, args){
			var __self = this;
			var checkParam = {page: this.send.page, limit: PAGEROWLIMIT};
			if (args[0].checkWithParam('newslist', checkParam)){ __self.render(checkParam); }
		},
		destroy: function(){ DATA.onComplete.unsubscribe(this.onDSUpdate, this); },
		refreshPage: function(page, request){
			this.send = {page: page, limit: PAGEROWLIMIT}
			this.rows = this.tables['newslist'].getRows(this.send)
			if (DATA.isFill(this.tables)){
				this.render(this.send);
			}else if (request){
				Brick.mod.news.data.request(); 
			}
		},
		getrow: function(newsid){ return DATA.get('newslist').getRows(this.send).getById(newsid); },
		render: function(param){
			var tablenews = DATA.get('newslist');
			var rows = tablenews.getRows(param);
			var page = param['page']*1; 
			var total = DATA.get('newscount').getRows().getByIndex(0).cell['cnt']*1;
			
			if (this.savedCountNews < 0){
				this.savedCountNews = total;
			}else if (this.savedCountNews != total){
				tablenews.removeNonParam(param);
			}
			this.savedCountNews = total;
			
			this.pagtop.setState({ page: page, totalRecords: total});
			this.pagtop.render();

			this.pagbot.setState({ page: page, totalRecords: total});
			this.pagbot.render();
			
			var lst = "", s="", tmp="", di;
			rows.foreach(function(row){
				di = row.cell; 
				s = di['dd']>0 ? T['rowdel'] : T['row'];
				s = tSetVar(s, 'dl', dateExt.convert(di['dl']));
				s = tSetVar(s, 'tl', di['tl']);
				s = tSetVar(s, 'dp', (di['dp']>0 ? dateExt.convert(di['dp']) : T['btnpub']));
				s = tSetVar(s, 'prv', '/news/'+di['id']+'/');
				s = tSetVar(s, 'scb', L.isNull(this.scbAPI)?'':T['scbrow']);
				s = tSetVar(s, 'id', di['id']);
				lst += s;
			});
			
			var table = tSetVar(T['table'], 'scb', L.isNull(this.scbAPI)?'':T['scbhead']);
			lst = tSetVar(table, 'body', lst);
			
			var div = Dom.get(TId['panel']['table']);
			elClear(div);
			div.innerHTML = lst;
		},
		clickEvent: function(el){
			if (el.id == TId['panel']['btnnew']){
				Brick.mod.news.api.edit(0);
				return true;
			}
			if (el.id == TId['panel']['rcclear']){
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
				this.remove(numid)
				return true;
			case (TId['row']['edit']+'-'):
				Brick.mod.news.api.edit(numid);
				return true;
			case (TId['btnpub']['id']+'-'):
				this.publish(numid)
				return true;
			case (TId['scbrow']['id']+'-'):
				this.subscribe(numid);
				return true;
			}
			return false;
		},
		refresh: function(){this.refreshPage(this.currentPage);},
		subscribe: function(newsid){
			wWait.show();
			C.asyncRequest("GET", 
				uniqurl('/ajax/query.html?md=news&bk=admsubscribe&newsid='+newsid), 
				connectCallback); 
		},
		publish: function(newsid){
			var row = DATA.get('newslist').getRows(this.send).getById(newsid);
			row.update({
				'dp': ((new Date()).getTime()/1000)
			});
			DATA.get('newslist').applyChanges();
			DATA.request();
		},
		recycleClear: function(){
			DATA.get('newslist').recycleClear();
			DATA.request();
		},
		remove: function(newsid){
			var row = this.getrow(newsid);
			row.remove();
			DATA.get('newslist').applyChanges();
			DATA.request();
		}, 
		restore: function(newsid){
			var row = this.getrow(newsid);
			row.restore();
			DATA.get('newslist').applyChanges();
			DATA.request();
		}
	}
})();


})();
