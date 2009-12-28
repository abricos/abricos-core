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
		T, TId;
	
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

			T = Brick.util.Template['faq']['cp_arhive'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			
			moduleInitialize();
			delete moduleInitialize;
	  }
	});

var moduleInitialize = function(){
(function(){
/*	
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
			this.setelv('dl', dateExt.convert(di['dl']));
			
			var msg = di['msg']; //получили текст вопроса
			var arr = msg.split('\n'); //разбили его на строки по переводу строки
			msg = ""; // зачистили переменную
			for (var i=0;i<arr.length;i++){//в цикле перебираем все строки и перед строкой выводим >_, а в конце - перевод строки
				msg += "> " + arr[i]+"\n";
			}
			this.setelv('msg', msg);
		},
		onClick: function(el){
			var tp = TId['reply']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['breply']: this.reply(); return true;
			}
		},
		reply: function(){
			var table = DATA.get('arhive', true);
	 		this.row.update({
	 			'st':  1,
	 			'rp_body': this.elv('msg')
	 		});
	 		table.applyChanges();
			DATA.request();
			this.close();
		}
	});
*/	
	var Edit = function(row){
		this.row = row;
		Edit.superclass.constructor.call(this, T['edit']);
	}
	YAHOO.extend(Edit, Brick.widget.Panel, {
		el: function(name){ return Dom.get(TId['edit'][name]); },
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
			this.setelv('qd', dateExt.convert(di['qd']));
			this.setelv('ad', dateExt.convert(di['ad']));
			//var ad = dateExt.convert(di['ad']);
			//t = tSetVar(t, 'ad', dateExt.convert(di['ad']));
			this.setelv('msg', di['msg']);
			this.setelv('ans', di['ans']);
		},
		onShow: function(){
			//Помещаем курсор в конец текстового поля для IE. Для нормальных браузеров сработает this.el('ans').focus();
            /*
			if (document.selection) { // ie
    			this.el('ans').select(); 
    			with(document.selection.createRange()) 
    			collapse(false),select();
            } else	{*/
            	this.el('ans').focus();
            	/*
            };*/

			},
		onClick: function(el){
			var tp = TId['edit']; 
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bremove']: this.remove(); return true;
			case tp['breply']: this.reply(); return true;
			}
		},
		reply: function(){
			var table = DATA.get('arhive', true);
			var pub = this.elv('pub');
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
			DATA.request();
			this.close();
		},
		remove: function(){
			this.close();
		}
	});
	
	
	var Arhive = function(container){
		this.init(container);
	};
	Arhive.prototype = {
		init: function(container){
			container.innerHTML = T['panel'];
			
			this.tables = { 
				'arhive': DATA.get('arhive', true)
			};
			
			DATA.onComplete.subscribe(this.onDSComplete, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}
			
			// Запрос данныx о настройке и профиле
			DATAuser.get('user', true).getRows({ 'id': Brick.env.user.id });
			DATAsys.get('config', true).getRows({'mod': 'sys'});
			//DATAsys.request(true);
			//DATAuser.request(true);
		},
		onDSComplete: function(type, args){
			if (args[0].check(['arhive'])){ this.render(); }
		},
		render: function(){
			var rows = this.tables['arhive'].getRows();
			var lst = "", t, di;

			rows.foreach(function(row){
				di = row.cell;
				t = T['row'];
				t = tSetVar(t, 'id', di['id']);
				t = tSetVar(t, 'qd', dateExt.convert(di['qd']));
				t = tSetVar(t, 'fio', di['fio']);
				t = tSetVar(t, 'phn', di['phn']);
				t = tSetVar(t, 'ml', di['ml']);
				t = tSetVar(t, 'ad', dateExt.convert(di['ad']));
				var msg = di['msg'];
				//if (msg.length > 50){
					// msg = msg.substring(0,50) + "...";
				//}
				t = tSetVar(t, 'msg', msg);
				var ans = di['ans'];
				t = tSetVar(t, 'ans', ans);
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
			case (TId['row']['view']+'-'): this.view(numid); return true;
			case (TId['row']['remove']+'-'): this.remove(numid); return true;
			}
			return false;
		},
		view: function(id){
			var rows = this.tables['arhive'].getRows();
			var row = rows.getById(id);
			new Edit(row);
		},
		remove: function (id){
			DATA.get('arhive').getRows().getById(id).remove();
			DATA.get('arhive').applyChanges();
			DATA.request();
		}
	};
	
	Brick.mod.faq.admin.Arhive = Arhive;

})();
};
})();
