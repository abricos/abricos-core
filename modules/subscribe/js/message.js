/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('Subscribe.Message');

	var Dom, E,	L, W,	C, T, J, TId;

	var BC = Brick.util.Connection;
	var dateExt = Brick.dateExt;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
		mod:[{name: 'sys', files: ['form.js','container.js']}],
    onSuccess: function() {
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;
			
			T = Brick.util.Template['subscribe']['message'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			
			Brick.util.CSS.update(T['css']);
			delete T['css'];

			moduleInitialize();
			delete moduleInitialize;
	  }
	});

var moduleInitialize = function(){
(function(){ // sender
	
	var Report = function(obj){
		this.obj = obj;
		Report.superclass.constructor.call(this, T['senderreport']);
	}
	YAHOO.extend(Report, Brick.widget.Panel, {
		initTemplate: function(t){
			var o = this.obj;
			t = tSetVar(t, 'count', o['count']);
			t = tSetVar(t, 'error', o['error']);
			var mls = o['errml'], i, lst = "";
			for (i=0;i<mls.length;i++){
				lst += tSetVar(T['senderreportrow'], 'ml', mls[i]);
			}
			t = tSetVar(t, 'mllist', lst);
			return t;
		},
		onClick: function(el){
			if (el.id == TId['senderreport']['bclose']){
				this.close();
			}
		}
	});
	
	var Sender = function(){ Sender.superclass.constructor.call(this, T['sender']);	}
	YAHOO.extend(Sender, Brick.widget.Panel);
	
	Brick.Subscribe.Message.Sender = function(){
		var active = null;
		var __self = this;
		return {
			showSender: function(obj){ active = new Sender(); },
			report: function(obj){
				active.close();
				new Report(obj);
				// alert('Рассылка завершена, отправлено писем: '+obj['count']);
			},
			send: function(obj){ obj['act'] = 'send'; this.start(obj); }, 
			test: function(obj){ obj['act'] = 'test'; this.start(obj); },
			start: function(obj){
				this.showSender(obj);
				BC.sendCommand('subscribe', 'sender', { json: obj });
			}
		}
	}();
	
})();
	
(function(){
	
	var globalMsgBoxTest=null;
	
	var msgboxtest = function(obj, callback){
		this.init(obj, callback);
	};
	msgboxtest.prototype = {
		init: function(obj, callback){
			if (!L.isNull(globalMsgBoxTest)){ globalMsgBoxTest.destroy(); }
			
			var __self = this;
			var t = T['msgtestsend'];
			
			t = tSetVar(t, 'email', obj['cfg']['testmail']);
	
			var div = document.createElement('div');
			div.innerHTML = t;
	
			var win = new YAHOO.widget.Panel(div, {width: '400px', zindex:1000, draggable: true, modal:true, visible:false}); win.render(document.body);
			globalMsgBoxTest = this.win = win;
			win.show();
			win.center();
			
			var email = Dom.get(TId['msgtestsend']['email']);
	
			E.on(div, 'click', function(e){
				var el = E.getTarget(e);
				switch(el.id){
				case TId['msgtestsend']['bsend']:
					__self.close();
					obj['cfg']['testmail'] = email.value; 
					callback(email.value);
					break;
				case TId['msgtestsend']['bcancel']:
					__self.close();
					break;
				}
			});
		}, 
		close: function(){ this.win.hide(); }
	}

	var globalPanelMsgBox=null;
	
	var msgbox = function(obj, callback){
		this.init(obj, callback);
	};
	msgbox.prototype = {
		init: function(obj, callback){
			if (!L.isNull(globalPanelMsgBox)){ globalPanelMsgBox.destroy(); }
			
			var __self = this;
			var t = T['msgsend'];

			t = tSetVar(t, 'cnt', obj['cnt']);
	
			var div = document.createElement('div');
			div.innerHTML = t;
	
			var win = new YAHOO.widget.Panel(div, {width: '500px', zindex:1000, draggable: true, modal:true, visible:false}); win.render(document.body);
			globalPanelMsgBox = this.win = win;
			win.show();
			win.center();
	
			E.on(div, 'click', function(e){
				var el = E.getTarget(e);
				switch(el.id){
				case TId['msgsend']['bsend']:
					__self.close();
					callback();
					break;
				case TId['msgsend']['bcancel']:
					__self.close();
					break;
				}
			});
		}, 
		close: function(){ this.win.hide(); }
	}
	
	
	var globalPanel=null;
	var preview = function(obj){
		this.init(obj);
	};
	preview.prototype = {
		init: function(obj){
			if (!L.isNull(globalPanel)){ globalPanel.destroy(); }
			
			var __self = this;
			var t = T['panel'];

			if (obj['act'] == 'preview' || obj['act'] == 'send'){
				t = tSetVar(t, 'btn', T['bsend']);
			}else{
				t = tSetVar(t, 'btn', T['badd']);
			}

			
			t = tSetVar(t, 'template', obj['tpnm'] || '');
			t = tSetVar(t, 'subject', obj['subject']);
			t = tSetVar(t, 'body', obj['body']);
	
			var div = document.createElement('div');
			div.innerHTML = t;
	
			var win = new YAHOO.widget.Panel(div, {width: '640px', zindex:1000, draggable: true, modal:true, visible:false}); win.render(document.body);
			globalPanel = this.win = win;
			win.show();
			win.center();
	
			E.on(div, 'click', function(e){
				var el = E.getTarget(e);
				switch(el.id){
				case TId['panel']['bfinpreview']:
					Brick.Subscribe.Message.Preview.finalPreview(obj);
					break;
				case TId['panel']['bcancel']:
					__self.close();
					break;
				case TId['badd']['id']:
					__self.close();
					Brick.Subscribe.API.add(obj);
					break;
				case TId['bsend']['id']:
					new msgbox(obj, function(){
						__self.close();
						Brick.Subscribe.Message.Sender.send(obj);
					});
					break;
				case TId['bsend']['idtest']:
					new msgboxtest(obj, function(email){
						obj['email'] = email;
						Brick.Subscribe.Message.Sender.test(obj);
					});
					break;
				}
			});
		}, 
		close: function(){
			this.win.hide();
		}
	}
	
	Brick.Subscribe.Message.Preview = function(){
		var active = null;
		var actWindow = null;
		return {
			show: function(obj){
				active = new preview(obj);
			},
			finalPreview: function(obj){
				var text = "";
				if (obj['tpbody']){
					var exp = new RegExp("\{v\#message\}", "g");
					text = obj['tpbody'].replace(exp, obj['body']);
				}else{
					text = obj['body'];
				}
				
				var html = "<html><head><title>"+obj['subject']+"</title>";  
				html += "<meta http-equiv='Content-Type' content='text/html; charset=utf-8' /></head><body>";
				html += text+"</body></html>";

				actWindow = window.open(
					'about:blank', 'subspreview',	
					'statusbar=no,menubar=no,toolbar=no,scrollbars=yes,resizable=yes'	+ 
					',width=' + 740 + ',height=' + 590);
	
				actWindow.document.open();
				actWindow.document.write(html);
				actWindow.document.close();
			}
		}
	}();
	
})();

(function(){

	
	var Editor = function(obj){
		this.obj = L.merge({id: 0, subject: '', body: '', tpid: 0, tps: [], files: []}, obj || {});
		this._validator = null;
		this._editor = null;
		this._attachment = null;
		
		Editor.superclass.constructor.call(this, T['msgeditor']);
	}
	YAHOO.extend(Editor, Brick.widget.Panel, {
		initTemplate: function(t){
			var o = this.obj;
			var isnew = !(o['id']>0);
	
			t = tSetVar(t, 'title', Brick.util.Language.getc('subscribe.message.editor.title.'+(isnew?'new':'edit')));
			t = tSetVar(t, 'bok', Brick.util.Language.getc('button.'+(isnew?'add':'save')));
			
			var lst = "", tt;
			for (var i=0;i<o['tps'].length;i++){
				tt = T['msgrowtp'];
				tt = tSetVar(tt, 'id', o['tps'][i]['id']);
				tt = tSetVar(tt, 'nm', o['tps'][i]['nm']);
				lst += tt;
			}
			t = tSetVar(t, 'tplist', lst);

			return t;
		},
		el: function(name){
			return Dom.get(TId['msgeditor'][name]);
		},
		onLoad: function(){
			var subject = this.el('subject');
			subject.value = this.obj['subject'];
			subject.focus();
			
			var validobj = {
				elements: {
					'subject':{ obj: subject, rules: ["empty"], args:{"field":"Subject"}}
				}
			};
			
			var tplist = this.el('template');
			tplist.value = this.obj["tpid"];
			
			this._validator = new Brick.util.Form.Validator(validobj);
			
			var editor = this._editor = new Brick.util.Editor.Simple(TId['msgeditor']['editor'],{
				width: '600px', height: '400px', buttonsgroup: 'page', 
				'value': this.obj['body']
			});

			this._attachment = new Brick.Subscribe.widget.Attachment(TId['msgeditor']['attach'], 
				function(attachhtml){	editor.insertValue(attachhtml);	}
			);
			this._attachment.update(this.obj['files']);
		},
		onClose: function(){ this._editor.destroy(); },
		onClick: function(el){
			var tp = TId['msgeditor']; 
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
			var subject = this.el('subject');
			var template = this.el('template');
			var body = this._editor.getValue();

			var errors = this._validator.check();
			if (errors.length > 0){ return; }

			var o = this.obj;
			o['act'] = 'save';
			o['subject'] = subject.value;
			o['body'] = body;
			o['tpid'] = template.value;
			o['files'] = this._attachment.data;

			var __self = this;
			BC.sendCommand('subscribe', 'api', { json: o,
				success: function(){ __self.close(); }
			});
		}
	});
	
	Brick.Subscribe.Message.Editor = Editor;
	
})();
};
})();