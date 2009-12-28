/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	
	Brick.namespace('mod.faq.admin');
	Brick.namespace('mod.sys');
	Brick.namespace('mod.user');

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		C = YAHOO.util.Connect,
		T, TId, LNG;
	
	var DATA, DATAsys, DATAuser;

	var dateExt = Brick.dateExt;
	var wWait = Brick.widget.WindowWait;
	var elClear = Brick.elClear;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
		yahoo: ["tabview","paginator"],
		mod:[{name: 'sys', files: ['data.js', 'form.js']}],
    onSuccess: function() {
			if (!Brick.objectExists('Brick.mod.faq.data')){
				Brick.mod.faq.data = new Brick.util.data.byid.DataSet('faq');
			}
			DATA = Brick.mod.faq.data;

			// Config DATA
			if (!Brick.objectExists('Brick.mod.sys.data')){
				Brick.mod.sys.data = new Brick.util.data.byid.DataSet('sys');
			}
			DATAsys = Brick.mod.sys.data;

			// Profile DATA
			if (!Brick.objectExists('Brick.mod.user.data')){
				Brick.mod.user.data = new Brick.util.data.byid.DataSet('user');
			}
			DATAuser = Brick.mod.user.data;

			T = Brick.util.Template['faq']['cp_message'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);

			LNG = Brick.util.Language.getData()['faq']['cp_message'];   
			
			moduleInitialize();
			delete moduleInitialize;
	  }
	});

var moduleInitialize = function(){
(function(){
	
	var Reply = function(row){
		this.row = row;
		Reply.superclass.constructor.call(this, T['reply']);
	}
	YAHOO.extend(Reply, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['reply'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setel: function(el, value){ Brick.util.Form.setValue(el, value); },
		setelv: function(name, value){ 
			Brick.util.Form.setValue(this.el(name), value); 
		},
		onLoad: function(){
			var di = this.row.cell;
			this.setelv('id', di['id']);
			this.setelv('fio', di['fio']);
			this.setelv('phn', di['phn']);
			this.setelv('qd', dateExt.convert(di['dl']));
			
			var msg = di['msg'];
			/*
			var arr = msg.split('\n');
			msg = "";
			for (var i=0;i<arr.length;i++){
				msg += "> " + arr[i]+"\n";
			}
			*/
			this.setelv('msg', msg);
			//alert(this.el('ans'));
			//this.el('ans').focus();
		},
		onShow: function(){
			this.el('ans').focus();
			},
		onClick: function(el){
			var tp = TId['reply']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['breply']: this.reply(); return true;
			}
		},
		reply: function(){
			var table = DATA.get('messages', true);
			if(this.elv('ans')==''){//проверяем, есть ли ответ на вопрос, если нет, прерываем выполнение функции
				alert(LNG['error']['email']);
				
				this.el('ans').focus();
				return false;
			}
			var pub = this.elv('pub'); //проверяем, надо ли публиковать ответ на сайте если pub=1 - надо.
			if (pub==1){
				pub=2;
			}else{
				pub=1;
			};
	 		this.row.update({
	 			'st':  pub,
	 			'body': this.elv('msg'),
	 			'rp_body': this.elv('ans')
	 		});
	 		table.applyChanges();
	 		
	 		if (DATA.get('arhive')){
	 			DATA.get('arhive').getRows().clear();
	 		}
			DATA.request();
			this.close();
		}
	});
/*	
	var MessageView = function(row){
		this.row = row;
		MessageView.superclass.constructor.call(this, T['view']);
	}
	YAHOO.extend(MessageView, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['view'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setel: function(el, value){ Brick.util.Form.setValue(el, value); },
		setelv: function(name, value){ 
			Brick.util.Form.setValue(this.el(name), value); 
		},
		onLoad: function(){
			var di = this.row.cell;
			this.setelv('id', di['id']);
			this.setelv('fio', di['fio']);
			this.setelv('phn', di['phn']);
			this.setelv('dl', dateExt.convert(di['dl']));
			this.setelv('msg', di['msg']);
		},
		onClick: function(el){
			var tp = TId['view']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bremove']: this.remove(); return true;
			case tp['breply']: this.reply(); return true;
			}
		},
		reply: function(){
			this.close();
			new Reply(this.row);
		},
		remove: function(){
			this.close();
		}
	});
	
*/	
	var MessageList = function(container){
		this.init(container);
	};
	MessageList.prototype = {
		init: function(container){
			container.innerHTML = T['panel'];
			
			this.tables = { 
				'messages': DATA.get('messages', true)
			};
			
			DATA.onComplete.subscribe(this.onDSComplete, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}
			
			// Запрос данны о настройке и профиле
			DATAuser.get('user', true).getRows({ 'id': Brick.env.user.id });
			DATAsys.get('config', true).getRows({'mod': 'sys'});
			DATAsys.request(true);
			DATAuser.request(true);
		},
		onDSComplete: function(type, args){
			if (args[0].check(['messages'])){ this.render(); }
		},
		render: function(){
			var rows = this.tables['messages'].getRows();
			var lst = "", t, di;

			rows.foreach(function(row){
				di = row.cell;
				t = T['row'];
				t = tSetVar(t, 'id', di['id']);
				t = tSetVar(t, 'qd', dateExt.convert(di['dl']));
				t = tSetVar(t, 'fio', di['fio']);
				t = tSetVar(t, 'phn', di['phn']);
				t = tSetVar(t, 'own', di['own']);
				var msg = di['msg'];
				if (msg.length > 50){
					// msg = msg.substring(0,50) + "...";
				}
				t = tSetVar(t, 'msg', msg);
				lst += t;
			});
			var div = Dom.get(TId['panel']['table']);
			elClear(div);

			var tt = tSetVar(T['table'], 'rows', lst);
			div.innerHTML = tt;
		},
		onClick: function(el){
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['row']['reply']+'-'): this.reply(numid); return true;
			case (TId['row']['remove']+'-'): this.remove(numid); return true;
			}
			return false;
		},
		reply: function(id){
			var rows = this.tables['messages'].getRows();
			var row = rows.getById(id);
			new Reply(row);
		},
		remove: function (id){
			DATA.get('messages').getRows().getById(id).remove();
			DATA.get('messages').applyChanges();
			DATA.request();
		}
	};
	
	Brick.mod.faq.admin.MessageList = MessageList;

})();
};
})();
