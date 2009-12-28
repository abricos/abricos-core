/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Feedback
 * @namespace Brick.mod.feedback
 */
var Component = new Brick.Component();
Component.requires = {
	yahoo: ['tabview','dragdrop'],
	mod:[
		{name: 'feedback', files: ['api.js']},
		{name: 'sys', files: ['data.js', 'form.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace, 
		TMG = this.template; 
	
	var API = NS.API;
	
	if (!Brick.objectExists('Brick.mod.feedback.data')){
		Brick.mod.feedback.data = new Brick.util.data.byid.DataSet('feedback');
	}
	var DATA = Brick.mod.feedback.data;
	
	// Config DATA
	if (!Brick.objectExists('Brick.mod.sys.data')){
		Brick.namespace('mod.sys');
		Brick.mod.sys.data = new Brick.util.data.byid.DataSet('sys');
	}
	var DATAsys = Brick.mod.sys.data;

	// Profile DATA
	if (!Brick.objectExists('Brick.mod.user.data')){
		Brick.namespace('mod.user');
		Brick.mod.user.data = new Brick.util.data.byid.DataSet('user');
	}
	var DATAuser = Brick.mod.user.data;

	
(function(){
	
	/**
	 * Панель администратора.
	 * 
	 * @class ManagerPanel
	 */
	var ManagerPanel = function(){
		ManagerPanel.superclass.constructor.call(this, T['panel'], {'width': '780px'});
	};
	YAHOO.extend(ManagerPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['panel'][name]); },
		onLoad: function(){
			this.managerWidget = new NS.ManagerWidget(TId['panel']['container']);
		},
		onClick: function(el){
			var tp = TId['panel'];
			switch(el.id){
			case tp['bclose']: this.close(); return true;
			}
			return false;
		}
	});
	
	NS.ManagerPanel = ManagerPanel;	
	
	var ManagerWidget = function(container){
		container = L.isString(container) ? Dom.get(container) : container;
		this.init(container);
	};
	ManagerWidget.prototype = {
		pages: null,
		
		init: function(container){
			var TM = TMG.build('widget'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;

			container.innerHTML = T['widget'];
			
			var tabView = new YAHOO.widget.TabView(TId['widget']['id']);
			var pages = {};
			
			pages['messages'] = new NS.MessageListWidget(TM.getEl('widget.messages'));
			pages['config'] = new NS.ConfigWidget(TM.getEl('widget.config'));
			
			this.pages = pages;
	
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
		}, 
		onClick: function(el){
			for (var n in this.pages){
				if (this.pages[n].onClick(el)){ return true; }
			}
			return false;
		}
	};
	
	NS.ManagerWidget = ManagerWidget;
})();

/////////////////////////////////////////////////////////////
//                      MessageListWidget                  //
/////////////////////////////////////////////////////////////
(function(){
	
	var MessageListWidget = function(container){
		this.init(container);
	};
	MessageListWidget.prototype = {
		init: function(container){
			var TM = TMG.build('msglistwidget,msglisttable,msglistrowwait,msglistrow'), 
				T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T['msglistwidget'];
			
			this.tables = { 
				'messages': DATA.get('messages', true)
			};
			
			DATA.onComplete.subscribe(this.onDSComplete, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}else{
				this.renderAwait();
			}
			
			DATAuser.get('user', true).getRows({ 'id': Brick.env.user.id });
			DATAuser.request(true);
			DATAsys.get('config', true).getRows({'mod': 'sys'});
			DATAsys.request(true);
		},
		onDSComplete: function(type, args){
			if (args[0].check(['messages'])){ this.render(); }
		},
		renderAwait: function(){
			var TM = this._TM, T = this._T;
			TM.getEl('msglistwidget.table').innerHTML =
				TM.replace('msglisttable', {
					'rows': T['msglistrowwait']
				});
		},
		render: function(){
			var TM = this._TM, T = this._T;
			var rows = this.tables['messages'].getRows();
			var lst = "";
			rows.foreach(function(row){
				var di = row.cell;
				var msg = di['msg'];
				if (msg.length > 50){
					// msg = msg.substring(0,50) + "...";
				}
				lst += TM.replace('msglistrow', {
					'id': di['id'],
					'dl': Brick.dateExt.convert(di['dl']),
					'fio': di['fio'],
					'phn': di['phn'],
					'own': di['own'],
					'msg': msg
				});
			});
			TM.getEl('msglistwidget.table').innerHTML =
				TM.replace('msglisttable', {
					'rows': lst
				});
		},
		onClick: function(el){
			var TId = this._TId;
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['msglistrow']['view']+'-'): this.view(numid); return true;
			case (TId['msglistrow']['remove']+'-'): this.remove(numid); return true;
			}
			return false;
		},
		view: function(id){
			var rows = this.tables['messages'].getRows();
			var row = rows.getById(id);
			new NS.MessageViewPanel(row);
		},
		remove: function (id){
			DATA.get('messages').getRows().getById(id).remove();
			DATA.get('messages').applyChanges();
			API.dsRequest();
		}
	};
	
	NS.MessageListWidget = MessageListWidget;
	
})();

(function(){
	
	var ReplyPanel = function(row){
		this.row = row;
		ReplyPanel.superclass.constructor.call(this, {
			modal: true, fixedcenter: true
		});
	};
	YAHOO.extend(ReplyPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(this._TId['reply'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setel: function(el, value){ Brick.util.Form.setValue(el, value); },
		setelv: function(name, value){ 
			Brick.util.Form.setValue(this.el(name), value); 
		},
		initTemplate: function(){
			var TM = TMG.build('reply'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;

			return T['reply'];
		},
		onLoad: function(){
			var di = this.row.cell;
			this.setelv('id', di['id']);
			this.setelv('fio', di['fio']);
			this.setelv('phn', di['phn']);
			this.setelv('dl', Brick.dateExt.convert(di['dl']));
			
			var msg = di['msg'];
			var arr = msg.split('\n');
			msg = "";
			for (var i=0;i<arr.length;i++){
				msg += "> " + arr[i]+"\n";
			}
			this.setelv('msg', msg);
		},
		onClick: function(el){
			var tp = this._TId['reply']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['breply']: this.reply(); return true;
			}
		},
		reply: function(){
			var table = DATA.get('messages', true);
	 		this.row.update({
	 			'st':  1,
	 			'rp_body': this.elv('msg')
	 		});
	 		table.applyChanges();
			API.dsRequest();
			this.close();
		}
	});
	NS.ReplyPanel = ReplyPanel;
	
	var MessageViewPanel = function(row){
		this.row = row;
		MessageViewPanel.superclass.constructor.call(this, {
			modal: true, fixedcenter: true
		});
	};
	YAHOO.extend(MessageViewPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(this._TId['view'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setel: function(el, value){ Brick.util.Form.setValue(el, value); },
		setelv: function(name, value){ 
			Brick.util.Form.setValue(this.el(name), value); 
		},
		initTemplate: function(){
			var TM = TMG.build('view'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;

			return T['view'];
		},
		onLoad: function(){
			var di = this.row.cell;
			this.setelv('id', di['id']);
			this.setelv('fio', di['fio']);
			this.setelv('phn', di['phn']);
			this.setelv('dl', Brick.dateExt.convert(di['dl']));
			this.setelv('msg', di['msg']);
		},
		onClick: function(el){
			var tp = this._TId['view']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bremove']: this.remove(); return true;
			case tp['breply']: this.reply(); return true;
			}
		},
		reply: function(){
			this.close();
			new ReplyPanel(this.row);
		},
		remove: function(){
			this.close();
		}
	});
	NS.MessageViewPanel = MessageViewPanel;
})();

/////////////////////////////////////////////////////////////
//                        ConfigWidget                     //
/////////////////////////////////////////////////////////////
(function(){
	
	var ConfigWidget = function(container){
		this.init(container);
	};
	ConfigWidget.prototype = {
		init: function(container){
			var TM = TMG.build('configwidget'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;

			container.innerHTML = T['configwidget'];
			
			this.tables = {
				'config': DATA.get('config', true)
			};
			this.rows = {
				'config': this.tables['config'].getRows({'mod': 'feedback'})
			};
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){ this.render(); }
		},
		onDSUpdate: function(type, args){if (args[0].check(['config'])){ this.render(); }},
		destroy: function(){DATA.onComplete.unsubscribe(this.onDSUpdate, this);},
		el: function(name){ return Dom.get(this._TId['configwidget'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		onClick: function(el){
			if (el.id == this._TId['configwidget']['bsave']){
				this.save();
				return true;
			}			
			return false;
		},
		render: function(){
			var __self = this;
			this.rows['config'].foreach(function(row){
				var di = row.cell;
				var el = __self.el(di['nm']);
				if (!el){ return; }
				__self.setelv(di['nm'], di['ph']);
			});
		},
		save: function(){
			var __self = this;
			this.rows['config'].foreach(function(row){
				var di = row.cell;
				var el = __self.el(di['nm']);
				if (!el){ return; }
				row.update({'ph': __self.elv(di['nm'])});
			});
			this.tables['config'].applyChanges();
			DATA.request();
		}
	};
	NS.ConfigWidget = ConfigWidget;	
	
})();
};