/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	
	Brick.namespace('mod.faq.user');

	var Dom, E, L, T, TId, J;
	var DATA;

	var dateExt = Brick.dateExt;
	var wWait = Brick.widget.WindowWait;
	var elClear = Brick.elClear;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
		yahoo: ['json'],
		mod:[
		     {name: 'faq', files: ['api.js']},
		     {name: 'sys', files: ['data.js','container.js','form.js']}
		],
    onSuccess: function() {
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;
			J =  YAHOO.lang.JSON;

			if (!Brick.objectExists('Brick.mod.faq.data')){
				Brick.mod.faq.data = new Brick.util.data.byid.DataSet('faq');
			}
			DATA = Brick.mod.faq.data;

			T = Brick.util.Template['faq']['form'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			
			moduleInitialize();
			delete moduleInitialize;
	  }
	});

var moduleInitialize = function(){
(function(){
	
	var FBWidget = function(container, param){
		this.init(container, param);
	};
	FBWidget.prototype = {
		init: function(container, param){
			this.isdisable = false;
			this.container = container;
			this.param = L.merge({
				'phonehide': false,
				'owner': '',
				'ownerparam': '',
				'beforemsg': '',
				'aftermsg': ''
			}, param || {});

			t = T['widget'];
			var p = this.param;
			var head = p['header'] || Brick.util.Language.getc('mod.faq.user.form.header');
			var title = p['title'] || Brick.util.Language.getc('mod.faq.user.form.title');
			
			t = tSetVar(t, 'header', head);
			t = tSetVar(t, 'title', title);
			t = tSetVar(t, 'phonehide', p['phonehide']?'none':'');
			t = tSetVar(t, 'messagehide', p['messagehide']?'none':'');
			container.innerHTML = t;
		},
		onload: function(){},
		el: function(name){ return Dom.get(TId['widget'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setel: function(el, value){ Brick.util.Form.setValue(el, value); },
		save: function(){
			if (this.isdisable){ return false; }
			
			if (this.param.callback){
				if (!this.param.callback(this)){ return false; }
			}
				
			var table = DATA.get('message', true);
			var rows = table.getRows();
	 		var row = table.newRow();
	 		var ownprm = "";
	 		if (this.param['ownerparam'] != ''){
	 			ownprm = encodeURIComponent(J.stringify(this.param['ownerparam']));
	 		}
	 		
	 		var msg = this.param['beforemsg']+this.elv('message')+this.param['aftermsg'];
	 		
	 		row.update({
	 			'fio': this.elv('fio'),
	 			'phone':  this.elv('phone'),
	 			'email':  this.elv('email'),
	 			'message': msg,
	 			'owner': this.param['owner'],
	 			'ownerparam': ownprm
	 		});
	 		rows.add(row);
	 		table.applyChanges();
			DATA.request();
			
			return true;
		},
		disable: function(){
			/*
			 *тут расписать ф-ию, скрывающую форму и выдающую сообщение об отправке формы
			 *пока сделал примитив, но надо, получить ответ от сервака и в зависимости от ответа выдать сообщение
			 * ок - Спасибо за вопрос
			 * неок - Проблема! Мы не получили Ваш вопрос, Возможно сервер перегружен, попробуйте написать чуть позже 
			 */
			
			Dom.get('faq').style.display = 'none';
			Dom.get('msg').style.display = 'block';
			/*
			this.isdisable = true;
			this.el('fio')['disabled'] = 'disabled';
			this.el('phone')['disabled'] = 'disabled';
			this.el('email')['disabled'] = 'disabled';
			this.el('message')['disabled'] = 'disabled';
			*/
		}
	};
	
	var Form = function(param){
		this.param = L.merge({'phonehide': false}, param || {});
		Form.superclass.constructor.call(this, T['standart']);
	};
	YAHOO.extend(Form, Brick.widget.Panel, {
		initTemplate: function(t){
			var p = this.param;
			var head = p['header'] || Brick.util.Language.getc('mod.faq.user.form.header');
			t = tSetVar(t, 'header', head);
			return t;
		},
		onLoad: function(){
			var container = Dom.get(TId['standart']['widget']);
			var __self = this;
			this.widget = new FBWidget(container, this.param);
		},
		onClick: function(el){
			var tp = TId['standart'];
			switch(el.id){
			case tp['bsave']: 
				if (this.widget.save()){ 
					this.close();
				}
				return true;
			case tp['bcancel']: this.close(); return true;
			}
			return false;
		},
		el: function(name){ return this.widget.el(name); }
	});

	Brick.mod.faq.user.Form = Form;

	var Panel = function(containerid, param){
		this.init(containerid, param);
	};
	
	Panel.prototype = {
		init: function(containerid, param){
			var container = Dom.get(containerid);
			container.innerHTML = T['panel'];

			var p = Dom.get(TId['panel']['widget']);
			this.widget = new FBWidget(p, param);

			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
		},
		onClick: function(el){
			if (TId['panel']['bsave'] == el.id){
				//Здесь поставить проверку на заполнения полей (мыло, телефон, имя, вопрос)
				//el2: function(name){ return Dom.get(TId['panel'][name]); },
				//elv2: function(name){ return Brick.util.Form.getValue(this.el2(name)); },
				//if(Dom.get(TId['panel']['email'])==''){alert('Укажите Ваш e-mail!');return false;}
				var email = Dom.get(TId['widget']['email']).value;
				alert(email);return false;
				this.save(); return true;
				}
		}, 
		save: function(){ 
			if (!this.widget.save()){ return false; }
				
			this.widget.disable();
			var btn = Dom.get(TId['panel']['bsave']);
			btn.style.display = 'none';
			return true;
		},
		el: function(name){ return this.widget.el(name); }
	};
	
	Brick.mod.faq.user.Panel = Panel;
	
})();
};
})();