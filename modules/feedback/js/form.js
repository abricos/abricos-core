/*
@version $Id$
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Feedback
 * @namespace Brick.mod.feedback
 */

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'sys', files: ['data.js','container.js','form.js']},
		{name: 'feedback', files: ['api.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace, 
		TMG = this.template; 

	var tSetVar = Brick.util.Template.setProperty;
	
	if (!Brick.objectExists('Brick.mod.feedback.data')){
		Brick.mod.feedback.data = new Brick.util.data.byid.DataSet('feedback');
	}
	DATA = Brick.mod.feedback.data;
	
	var API = NS.API;

	var NewMessageElement = function(container, param){
		this.init(container, param);
	};
	NewMessageElement.prototype = {
		init: function(container, param){
		
			var TM = TMG.build('widget'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;

			this.isdisable = false;
			this.container = container;
			this.param = L.merge({
				'phonehide': false,
				'owner': '',
				'ownerparam': '',
				'beforemsg': '',
				'aftermsg': ''
			}, param || {});

			var p = this.param;
			var head = p['header'] || Brick.util.Language.getc('mod.feedback.user.form.header');
			var title = p['title'] || Brick.util.Language.getc('mod.feedback.user.form.title');

			container.innerHTML = TM.replace('widget',{
				'header': head,
				'title': title,
				'phonehide': p['phonehide']?'none':'',
				'messagehide': p['messagehide']?'none':''
			});

		},
		onload: function(){},
		el: function(name){ return Dom.get(this._TId['widget'][name]); },
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
			this.isdisable = true;
			this.el('fio')['disabled'] = 'disabled';
			this.el('phone')['disabled'] = 'disabled';
			this.el('email')['disabled'] = 'disabled';
			this.el('message')['disabled'] = 'disabled';
		}
	};
	
	var NewMessagePanel = function(param){
		this.param = L.merge({'phonehide': false}, param || {});
		NewMessagePanel.superclass.constructor.call(this, {
			modal: true,
			fixedcenter: true
		});
	};
	YAHOO.extend(NewMessagePanel, Brick.widget.Panel, {
		initTemplate: function(){
			var TM = TMG.build('standart'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			var p = this.param;
			return TM.replace('standart', {
				'header': p['header'] || Brick.util.Language.getc('mod.feedback.user.form.header') 
			});
			return t;
		},
		onLoad: function(){
			this.widget = new NewMessageElement(this._TM.getEl('standart.widget'), this.param);
		},
		onClick: function(el){
			var TId = this._TId;
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

	NS.NewMessagePanel = NewMessagePanel;

	
	var NewMessageWidget = function(container, param){
		container = L.isString(container) ? Dom.get(container) : container;
		this.init(container, param);
	};
	NewMessageWidget.prototype = {
		init: function(containerid, param){
			var container = Dom.get(containerid);
			container.innerHTML = T['panel'];

			var p = Dom.get(TId['panel']['widget']);
			this.widget = new NewMessageElement(p, param);

			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
		},
		onClick: function(el){
			if (TId['panel']['bsave'] == el.id){ this.save(); return true; }
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
	
	NS.NewMessageWidget = NewMessageWidget;	
};
