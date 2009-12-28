/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('Blog.Category');
	
	var T, TId;

	var Dom = YAHOO.util.Dom;
	var E = YAHOO.util.Event;
	var L = YAHOO.lang;
	var J = YAHOO.lang.JSON;

	var BC = Brick.util.Connection;

	var dateExt = Brick.dateExt;
	var elClear = Brick.elClear;
	var tSetVar = Brick.util.Template.setProperty;
	
	Brick.Loader.add({
		mod:[{name: 'sys', files: ['table.js', 'container.js', 'form.js']}],
    onSuccess: function() {
			T = Brick.util.Template['blog']['category'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			
			moduleInitialize();
			delete moduleInitialize;
		}
	});

var moduleInitialize = function(){
	
(function(){
	
	Brick.Blog.Category.Manager = function(){
		return {
			data: null,
			activeListView: null,
			select: function(callback){
				if (!L.isNull(this.activeListView)){ this.activeListView.destroy(); }
				if (L.isNull(this.data)){
					var __self = this;
					BC.sendCommand('blog', 'js_category', {
						success: function(){
							__self.activeListView = new listView(callback);
						}
					});
				}else{
					this.activeListView = new listView(callback);
				}
			},
			update: function(d){
				this.data = d;
				if (!L.isNull(this.activeListView) && this.activeListView.isOpen){
					this.activeListView.update();
				}
			},
			findCategory: function (id){
				var i;
				for (i=0;i<this.data.length;i++){
					if (this.data[i]['id'] == id){
						return this.data[i];
					}
				}
				return null;
			}
		}
	}();
	
	var M = Brick.Blog.Category.Manager;
	
	var listView = function(callback){
		this.callback = callback;
		this.selectedRow = null;
		listView.superclass.constructor.call(this, T['listview']);
	};
	
	YAHOO.extend(listView, Brick.widget.Panel, {
		onLoad: function(){
			this.update();
		},
		update: function(){
			var d = M.data, i, rows = "", t, di;
			for (i=0;i<d.length;i++){
				di = d[i];
				t = T['lvrow'];
				t = tSetVar(t, 'ph', di['ph']);
				t = tSetVar(t, 'cnt', di['cnt']);
				t = tSetVar(t, 'id', di['id']);
				rows += t;
			}

			var div = Dom.get(TId['listview']['table']);
			elClear(div);
			div.innerHTML = tSetVar(T['lvtable'], 'rows', rows);

			Brick.util.Table.highLight(TId['lvtable']['table'], 'tr_bg', '');
		},
		onClick: function(el){
			switch(el.id){
			case TId['listview']['bselect']: this.select();	return true;
			case TId['listview']['bcancel']: this.close(); return true;
			case TId['listview']['bnew']: 
				new Brick.Blog.Category.Editor(); 
				return true;
			}
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			var row = numid > 0 ? M.findCategory(numid) : null;

			switch(prefix){
			case TId['lvrow']['td1']+'-':
			case TId['lvrow']['td2']+'-':
			case TId['lvrow']['td3']+'-':
				Dom.get(TId['listview']['category']).value = row['ph'];
				this.selectedRow = row;
				return true;
			case TId['lvrow']['edit']+'-':
				new Brick.Blog.Category.Editor(row);
				return true;
			case TId['lvrow']['del']+'-': this.remove(row); return true;
			}
			return false;
		},
		select: function(){
			if (L.isNull(this.selectedRow)){ return; }
			this.close();
			this.callback(this.selectedRow);
		},
		remove: function(obj){
			if (obj['cnt']>0){
				new notdel(obj);
				return;
			}
			BC.sendCommand('blog', 'js_category', {json:{act:'remove', id:obj.id}});
		}
	});

	var notdel = function(obj){
		this.obj = obj;
		notdel.superclass.constructor.call(this, T['notdel']);
	}
	YAHOO.extend(notdel, Brick.widget.Panel, {
		initTemplate: function(t){
			t = tSetVar(t, 'ph', this.obj['ph']);
			return t;
		},
		onClick: function(el){
			if(el.id == TId['notdel']['bclose']){
				this.close(); return true;
			}
			return false;
		}
	});
	
})();

/* * * * * * * * * * * * Category Editor * * * * * * * * * * * * */
(function(){

	var editor = function(obj){
		this.obj = L.merge({id:0, ph:'', nm:''}, obj || {});
		editor.superclass.constructor.call(this, T['editor']);
		var phrase = this.el('phrase');
		this.validator = new Brick.util.Form.Validator({
			elements: {'phrase':{ obj: phrase, rules: ["empty"], args:{"field":"Название"}}}
		});
	};
	YAHOO.extend(editor, Brick.widget.Panel, {
		initTemplate: function(t){
			t = tSetVar(t, 'phrase', this.obj['ph']);
			t = tSetVar(t, 'name', this.obj['nm']);
			return t;
		},
		el: function(name){
			return Dom.get(TId['editor'][name]);
		},
		onClick: function(el){
			switch(el.id){
			case TId['editor']['bsave']: this.save(); return true;
			case TId['editor']['bcancel']: this.close(); return true;
			case TId['editor']['name']: this._updateCatName(); return false;
			}
			return false;
		},
		_updateCatName: function(){
			var txtname = this.el('name');
			
			if (txtname.value.length == 0){
				var txtphrase = this.el('phrase');
				txtname.value = Brick.util.Translite.ruen(txtphrase.value);
			}
		},
		save: function(){
			var __self = this;
			this._updateCatName();
			
			var errors = this.validator.check();
			if (errors.length > 0){ return; }

			var obj = this.obj;
			
			BC.sendCommand('blog', 'js_category', {
				json:{
					act: 'save',
					id: obj.id,
					ph: this.el('phrase').value,
					nm: this.el('name').value
				},
				success: function(){
					__self.close();
				}
			});
		}
	});

	Brick.Blog.Category.Editor = editor;
})();
};
})();
