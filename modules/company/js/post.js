/*
* @version $Id: post.js 177 2009-11-16 15:40:07Z roosit $
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'sys', files: ['data.js', 'form.js', 'container.js']},
		{name: 'company', files: ['api.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace,
		TMG = this.template;
	
	var API = NS.API;

	if (!Brick.objectExists('Brick.mod.company.data')){
		Brick.mod.company.data = new Brick.util.data.byid.DataSet('company');
	}
	var DATA = Brick.mod.company.data;
	
(function(){
	
	var PostSelectWidget = function(container, postid, config){
		this.postid = postid * 1 || 0;
		config = L.merge({
			manvisible: true
		}, config || {});
		this.init(container, config);
	};
	PostSelectWidget.prototype = {
		init: function(container, config){
			var TM = TMG.build('postwidget,posttable,postrow,postrowwait,postrowempty'), 
				T = TM.data, TId = TM.idManager;

			this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T['postwidget'];
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
			
			if (Brick.Permission.check('company', '50') > 0 && config.manvisible){
				TM.getEl('postwidget.man').style.display = '';
			}

			this.tables = {'postlist': DATA.get('postlist', true)};
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}else{
				this.renderTableAwait();
			}
		},
		destroy: function(){
			DATA.onComplete.unsubscribe(this.onDSUpdate, this);
		},
		onDSUpdate: function(type, args){
			if (args[0].check(['postlist'])){ this.render(); }
		},
		renderTableAwait: function(){
			var TM = this._TM;
			TM.getEl('postwidget.table').innerHTML = TM.replace('posttable', {
				'rows': this._T['postrowwait']
			});
		},
		render: function(){
			
			var TM = this._TM, T = this._T;
			var lst = T['postrowempty'];
			
			DATA.get('postlist').getRows().foreach(function(row){
				var di = row.cell;
				lst += TM.replace('postrow', {
					'id': di['id'],
					'nm': di['nm']
				});
			});
			TM.getEl('postwidget.table').innerHTML = TM.replace('posttable', { 'rows': lst });
			
			var __self = this;
			E.on(TM.getEl('posttable.id'), 'change', function(){
				__self.onSelect();
			});
			this.setValue(this.postid);
		},
		onSelect: function(){},
		setValue: function(postid){
			this.postid = postid;
			var el = this._TM.getEl('posttable.id');
			el.value = postid;
			el.disabled = '';
		},
		getValue: function(){
			var el = this._TM.getEl('posttable.id');
			return el.value * 1;
		},
    	onClick: function(el){
			var TId = this._TId;
			switch(el.id){
			case TId['postwidget']['bedit']:
			case TId['postwidget']['beditimg']:
				new NS.PostListPanel();
				return true;
			}
			return false;
    	}
		
	};
	
	NS.PostSelectWidget = PostSelectWidget;
	
})();	
	
(function(){
	
	var PostListPanel = function(){
		this._TM = TMG.build('postlistpanel');
		this._T = this._TM.data;
		this._TId = this._TM.idManager;
		
		PostListPanel.superclass.constructor.call(this, {
			width: "400px", height: "480px", fixedcenter: true
		});
	};
	YAHOO.extend(PostListPanel, Brick.widget.Panel, {
		initTemplate: function(){
			return this._T['postlistpanel'];
		},
		onLoad: function(){
			this.postList = new NS.PostListWidget(this._TM.getEl('postlistpanel.container'));
		}
	});

	NS.PostListPanel = PostListPanel; 	
	
})();
	
(function(){
	
	var PostListWidget = function(container){
		this.init(container);
	};
	PostListWidget.prototype = {
    	init: function(container){
			var TM = TMG.build('postlistwidget,postlisttable,postlistrow,postlistrowwait'),
				T = TM.data, TId = TM.idManager;
		
			this._TM = TM; this._T = T; this._TId = TId;
				this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T['postlistwidget'];
		
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});
		
			this.tables = { 'postlist': DATA.get('postlist', true) };
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){
				this.render();
			}else{
				this.renderTableAwait();
			}
		},
		onDSUpdate: function(type, args){
			if (args[0].check(['postlist'])){ this.render(); }
		},
		destroy: function(){DATA.onComplete.unsubscribe(this.onDSUpdate, this);},
		renderTableAwait: function(){
			var TM = this._TM;
			TM.getEl('postlistwidget.table').innerHTML = TM.replace('postlisttable', {
				'rows': this._T['postlistrowwait']
			});
		},
		render: function(){
			var TM = this._TM;
			var lst = "";
			DATA.get('postlist').getRows().foreach(function(row){
				var di = row.cell;
				lst += TM.replace('postlistrow', {
					'id': di['id'],
					'nm': di['nm'],
					'lvl': di['lvl']
				});
			});
			TM.getEl('postlistwidget.table').innerHTML = TM.replace('postlisttable', { 'rows': lst });
		},
    	onClick: function(el){
			
			var TId = this._TId;
			switch(el.id){
			case TId['postlistwidget']['bcreate']:
				new NS.PostEditorPanel(0);
				return true;
			}
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['postlistrow']['edit']+'-'):
				new NS.PostEditorPanel(numid);
				return true;
			}
			return false;
    	}
	};
	NS.PostListWidget = PostListWidget;
	
})();	

(function(){
	
	var PostEditorPanel = function(postid){
		this.postid = postid * 1 || 0; 
		PostEditorPanel.superclass.constructor.call(this, {
			modal: true, fixedcenter: true
		});
	};
	YAHOO.extend(PostEditorPanel, Brick.widget.Panel, {
		el: function(name){ return Dom.get(this._TId['posteditor'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		initTemplate: function(){
			var TM = TMG.build('posteditor'), T = TM.data, TId = TM.idManager;
		
			this._TM = TM; this._T = T; this._TId = TId; 
		
			return  T['posteditor'];
		}, 
		onLoad: function(){
			var TId = this._TId;
			
			if (this.postid > 0){
				var row = DATA.get('postlist').getRows().getById(this.postid);
				var di = row.cell;
				this.setelv('nm', di['nm']);
				this.setelv('lvl', di['lvl']);
			}else{
				
			}
		},
    	onClick: function(el){
			var tp = this._TId['posteditor'];
			switch(el.id){
			case tp['bsave']: this.save(); return true;
			case tp['bcancel']: this.close(); return true;
			}
			return false;
    	},
    	save: function(){
    		var table = DATA.get('postlist');
    		var rows = table.getRows();
    		var row = this.postid > 0 ? rows.getById(this.postid) : table.newRow();
    		row.update({
    			'nm': this.elv('nm'),
    			'lvl': this.elv('lvl') * 1
    		});
    		if (this.postid == 0){
    			rows.add(row);
    		}
    		table.applyChanges();
    		API.dsRequest();
    		this.close();
    	}
	});	
	
	NS.PostEditorPanel = PostEditorPanel;

})();
};
