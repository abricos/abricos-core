/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('Subscribe.Admin');

	var T, J, TId;

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		W = YAHOO.widget,
		J = YAHOO.lang.JSON;

	var BC = Brick.util.Connection;

	var dateExt = Brick.dateExt;
	var elClear = Brick.elClear;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
		yahoo: ['json', 'tabview', 'paginator'],
		mod:[
		     {name: 'sys', files: ['form.js','container.js','editorold.js']},
		     {name: 'subscribe', files: ['api.js','attachment.js']}
		    ],
    onSuccess: function() {
			
			T = Brick.util.Template['subscribe']['cp_man'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);

			moduleInitialize();
			delete moduleInitialize;

			Brick.Loader.add({ yahoo: ['dragdrop'] });
	  }
	});
	
	
var moduleInitialize = function(){

/* * * * * * * * * * * * Message List * * * * * * * * * * */
(function(){
	
	Brick.Subscribe.Admin.CP = function(){
		return {
			initialize: function(container){
				container.innerHTML = T['panel'];
				
				var tabView = new YAHOO.widget.TabView(TId['panel']['id']);
				this.tabView = tabView;
		
				var __self = this;
				E.on(container, 'click', function(e){
					if (__self.clickEvent(E.getTarget(e))){ E.stopEvent(e); }
				});

				this.MessageList = new messageList();
				this.MailList = new Brick.Subscribe.Contact.List();
				this.Template = new Brick.Subscribe.Template.List();
				
				BC.sendCommand('subscribe', 'cp_admin_man');

			},
			clickEvent: function(el){
				if (this.MessageList.clickEvent(el)){
					return true;
				}
				if (this.MailList.clickEvent(el)){
					return true;
				}
				if (this.Template.clickEvent(el)){
					return true;
				}
				return false;
			}
		}
	}();
	
	var messageList = function(){
		this.data = [];
		this.init();
	}
	messageList.prototype = {
		init: function(){
		},
		refresh: function(){
			BC.sendCommand('subscribe', 'api');
		},
		clickEvent: function (el){
			if (el.id == TId['panel']['baddmsg']){
				Brick.Subscribe.API.editById(0);
			}else{
				var prefix = el.id.replace(/([0-9]+$)/, '');
				var numid = el.id.replace(prefix, "");
					
				switch(prefix){
				case (TId['msgrow']['edit']+'-'):
					Brick.Subscribe.API.editById(numid);
					return true;
				case (TId['msgrow']['preview']+'-'):
					Brick.Subscribe.API.previewById(numid);
					return true;
				case (TId['msgrow']['remove']+'-'):
					Brick.Subscribe.API.remove({id: numid});
					return true;
				}
			}
		},
		getItem: function (id){
			var i=0, item;
			for (i=0;i<this.data.length;i++){
				if (this.data[i].id == id){ return this.data[i]; }
			}
			return null;
		},
		update: function(d){
			this.data = d;
				
			var lst = "", i, s, tr, di;
			for (i=0;i<d.length;i++){
				di = d[i];
				s = T['msgrow'];
				s = tSetVar(s, 'id', di['id']);
				s = tSetVar(s, 'dl', dateExt.convert(di['dl']));
				s = tSetVar(s, 'ds', dateExt.convert(di['ds']));
				s = tSetVar(s, 'sj', di['sj']);
				lst += s;
			}
			lst = tSetVar(T['msgtable'], 'body', lst);
				
			var div = Dom.get(TId['panel']['msgtable']);
			elClear(div);
			div.innerHTML = lst;
		}
	}
	
})();

/* * * * * * * * * * * * Contact * * * * * * * * * * * */
(function(){
	
	
	Brick.namespace('Subscribe.Contact');
	var BSC = Brick.Subscribe.Contact;
	
	BSC.List = function(){
		this.init();
	};
	BSC.List.prototype = {
		init: function(){
			this.data = [];

			this.currentPage = 1;

			var __self = this;
			var handlePagination = function (state) {
				__self.refreshPage(state.page)
			};

			this.pagtop = new YAHOO.widget.Paginator({containers : TId['panel']['usrpagtop'], rowsPerPage: 15});
			this.pagbot = new YAHOO.widget.Paginator({containers : TId['panel']['usrpagbot'], rowsPerPage: 15});

			this.pagtop.subscribe('changeRequest', handlePagination);
			this.pagbot.subscribe('changeRequest', handlePagination);
		},
		refresh: function(){
			this.query();
		},
		refreshPage: function(page){
			this.query({json: {'_page': page}});
		},
		query: function(conf){
			conf = conf || {};
			conf['json'] = conf['json'] || {}; 
			conf['json']['_page'] = conf['json']['_page'] || this.currentPage;
			BC.sendCommand('subscribe', 'maillist', conf);
		},
		removeItem: function(id){
			this.query({json: { act: 'remove', id: id}});
		},
		restoreItem: function(id){
			this.query({json: { act: 'restore', id: id}});
		},
		rcClear: function(){
			this.query({json: { act: 'rcclear'}});
		},
		clickEvent: function (el){
			if (el.id == TId['panel']['baddct']){
				new Brick.Subscribe.Contact.Editor();
				return true;
			}if (el.id == TId['panel']['rcclear']){
				this.rcClear();
			}else{
				var prefix = el.id.replace(/([0-9]+$)/, '');
				var numid = el.id.replace(prefix, "");
				
				switch(prefix){
				case (TId['usrrow']['edit']+'-'):
					new Editor(this.getItem(numid));
					return true;
				case (TId['usrrow']['remove']+'-'):
					this.removeItem(numid);
					return true;
				case (TId['usrrowdel']['restore']+'-'):
					this.restoreItem(numid);
					return true;
				}
			}
		},
		getItem: function (id){
			var i=0, item;
			for (i=0;i<this.data.length;i++){
				if (this.data[i].id == id){ return this.data[i]; }
			}
			return null;
		},
		update: function(d, page, total){
			this.data = d;
			
			this.currentPage = page;
			var cfg = { page: page, totalRecords: total };
			this.pagtop.setState(cfg);
			this.pagtop.render();
			this.pagbot.setState(cfg);
			this.pagbot.render();
			
			var st = {
				0: Brick.util.Language.getc('subscribe.status.0'),
				1: Brick.util.Language.getc('subscribe.status.1'),
				2: Brick.util.Language.getc('subscribe.status.2')
			}
			
			var lst = "", i, s, tr;
			for (i=0;i<d.length;i++){
				if (d[i]['dd']>0){
					s = T['usrrowdel'];
				}else{
					s = T['usrrow'];
				}
				s = tSetVar(s, 'id', d[i]['id']);
				s = tSetVar(s, 'cnm', d[i]['cnm']);
				s = tSetVar(s, 'ml', d[i]['ml']);
				s = tSetVar(s, 'st', st[d[i]['st']]);
				s = tSetVar(s, 'dl', dateExt.convert(d[i]['dl']));
				lst += s;
			}
			lst = tSetVar(T['usrtable'], 'body', lst);
			
			var div = Dom.get(TId['panel']['usrtable']);
			elClear(div);
			div.innerHTML = lst;
		}
	}
	
	var Editor = function(obj){
		this.obj = L.merge({id: 0, cnm: '', ml: ''}, obj || {});
		Editor.superclass.constructor.call(this, T['cteditor']);
	}
	YAHOO.extend(Editor, Brick.widget.Panel, {
		initTemplate: function(t){
			var o = this.obj;
			var isnew = !(o['id']>0);

			t = tSetVar(t, 'title', Brick.util.Language.getc('subscribe.editor.title.'+(isnew?'add':'edit')));
			t = tSetVar(t, 'bok', Brick.util.Language.getc('button.'+(isnew?'add':'save')));

			return t;
		},
		onLoad: function(){
			var cname = Dom.get(TId['cteditor']['cname']);
			cname.value = this.obj['cnm'];
			cname.focus();
			Dom.get(TId['cteditor']['email']).value = this.obj['ml'];
		},
		onClick: function(el){
			if (el.id == TId['cteditor']['bcancel']){
				this.close();
			}else if (el.id == TId['cteditor']['bok']){
				
				var cname = Dom.get(TId['cteditor']['cname']);
				var email = Dom.get(TId['cteditor']['email']);

				var validobj = {
					elements: {
						'email':{ obj: email, rules: ["empty","email"], args:{"field":"E-mail"}}
					}
				};

				var validator = new Brick.util.Form.Validator(validobj);
				var errors = validator.check();
				if (errors.length > 0){ return; }
				
				var o = this.obj;
				o['act'] = 'save';
				o['cnm'] = cname.value;
				o['ml'] = email.value;
				
				var __self = this;
				Brick.Subscribe.Admin.CP.MailList.query({
					json: o,
					success: function(){ __self.close(); }
				});
			}
			return false;
		}
	});
	
	BSC.Editor = Editor;
})();

/* * * * * * * * * * * * Template * * * * * * * * * * * */
(function(){
	
	Brick.namespace('Subscribe.Template');
	var BST = Brick.Subscribe.Template;

	BST.List = function(){
		this.init();
	};
	BST.List.prototype = {
		init: function(){
			this.data = [];
		},
		refresh: function(){
			BC.sendCommand('subscribe', 'maillist');
		},
		clickEvent: function(el){
			if (el.id == TId['panel']['baddtp']){
				new Brick.Subscribe.Template.Editor();
				return true;
			}else{
				var prefix = el.id.replace(/([0-9]+$)/, '');
				var numid = el.id.replace(prefix, "");
				
				switch(prefix){
				case (TId['tprow']['edit']+'-'):
					BC.sendCommand('subscribe', 'js_template', {json: {id: numid}});
					return true;
				}
			}
			return false;
		},
		update: function(d){
			this.data = d;
			
			var lst = "", i, s, tr;
			for (i=0;i<d.length;i++){
				s = T['tprow'];
				s = tSetVar(s, 'id', d[i]['id']);
				s = tSetVar(s, 'nm', d[i]['nm']);
				lst += s;
			}
			lst = tSetVar(T['tptable'], 'body', lst);
			
			var div = Dom.get(TId['panel']['tptable']);
			elClear(div);
			div.innerHTML = lst;
		}
	}
	
	var Editor = function(obj){
		this.obj = L.merge({id: 0, nm: '', body: '', files: []}, obj || {});
		this._validator = null;
		this._editor = null;
		this._attachment = null;
		
		Editor.superclass.constructor.call(this, T['tpeditor']);
	}
	YAHOO.extend(Editor, Brick.widget.Panel, {
		initTemplate: function(t){
			var o = this.obj;
			var isnew = !(o['id']>0);
	
			t = tSetVar(t, 'title', Brick.util.Language.getc('subscribe.template.editor.title.'+(isnew?'add':'edit')));
			t = tSetVar(t, 'bok', Brick.util.Language.getc('button.'+(isnew?'add':'save')));
	
			return t;
		},
		el: function(name){
			return Dom.get(TId['tpeditor'][name]);
		},
		onLoad: function(){
			var name = this.el('name');
			name.value = this.obj['nm'];
			name.focus();
			
			var validobj = {
				elements: {
					'name':{ obj: name, rules: ["empty"], args:{"field":"Name"}}
				}
			};
			this._validator = new Brick.util.Form.Validator(validobj);
			
			var editor = this._editor = new Brick.util.Editor.Simple(TId['tpeditor']['editor'],{
				width: '600px', height: '400px', buttonsgroup: 'page', 
				'value': this.obj['body'],
				'useTinyMCE': false
			});
			
			this._attachment = new Brick.Subscribe.widget.Attachment(TId['tpeditor']['attach'], 
				function(attachhtml){	editor.insertValue(attachhtml);	}
			);
			this._attachment.update(this.obj['files']);
		},
		onClose: function(){
			this._editor.destroy();
		},
		onClick: function(el){
			var tp = TId['tpeditor']; 
			switch(el.id){
			case tp['bcancel']:
				this.close();
				return true;
			case tp['bok']:
				this.save();
				return true;
			}
		}, 
		save: function(){
			var name = this.el('name');
			var body = this._editor.getValue();

			var errors = this._validator.check();
			if (errors.length > 0){ return; }

			var o = this.obj;
			o['act'] = 'save';
			o['nm'] = name.value;
			o['body'] = body;
			o['files'] = this._attachment.data;

			var __self = this;
			BC.sendCommand('subscribe', 'js_templates', { json: o,
				success: function(){ __self.close(); }
			});
		}
	});
	
	BST.Editor = Editor;
	
})();
};
})();