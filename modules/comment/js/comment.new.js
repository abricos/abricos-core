/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	
	Brick.namespace('mod.comment');
	
	var Dom, E, L, W;
	
	var dateExt = Brick.dateExt;
	var elClear = Brick.elClear;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;
	var tSetVarA = Brick.util.Template.setPropertyArray;
	
	var DATA;

	Brick.Loader.add({
		mod:[{name: 'sys', files: ['data.js']}],
    onSuccess: function() {
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;
			W = YAHOO.widget;
			
			Brick.util.Template.fillLanguage(
					Brick.util.Template['comment']['comment.new']
			);
			
			if (!Brick.objectExists('Brick.mod.comment.data')){
				Brick.mod.comment.data = new Brick.util.data.byid.DataSet('comment');
			}
			DATA = Brick.mod.comment.data;

			moduleInitialize();
			delete moduleInitialize;
    }
	});

var moduleInitialize = function(){
(function(){
	
	var isreplyLibLoad = false;
	var replyLibLoader = function(callback){
		if (isreplyLibLoad){ callback(); return; }
		isreplyLibLoad = true;
		wWait.show();
		Brick.Loader.add({
			mod:[{name: 'sys', files: ['editor.js','data.js']}],
	    onSuccess: function() {
				wWait.hide();
				callback(); 
			}
		});
	};
	
	var Builder = function(contentid, data){
		this.init(contentid, data);
	};
	Builder.prototype = {
		init: function(contentid, data){
		
			var T = Brick.util.Template['comment']['comment.new'];
			T = Brick.util.clone(T);
			var TId = new Brick.util.TIdManager(T);

			this.contentid = contentid;
			this.replyman = null;
			// Id последнего комментария
			this.lastid = 0;

			var buildnode = function(d){
				return tSetVarA(T['comment'], {
					'unm': d['unm'],
					'ttname': Brick.env.ttname,
					'reply': (Brick.env.user.isRegister() ? T['reply'] : ""),
					'de':  dateExt.convert(d['de']),
					'id': d['id'],
					'bd': d['st']>0?T['spam']: d['bd']
				});
			};
			
			this.build = function(data){
				var cid = this.contentid;
				var __self = this;

				// чтение данных
				var body = {};
				var c = Dom.get('mod-comment-data-'+cid);
				var t;
				while(c.childNodes.length){
					t = c.childNodes[0];
					if (t.childNodes.length == 3){
						body[t.childNodes[0].innerHTML] = t.childNodes[2].innerHTML;
					}
					c.removeChild(t);
				}
				
				var t = tSetVarA(T['panel'], {
					'id': cid,
					'ttname': Brick.env.ttname
				});
				elClear(c);
				c.innerHTML = t;
				
				if (Brick.env.user.isRegister()){
					Dom.get(TId['panel']['replyrootnone']).style.display = 'none';
				}else{
					Dom.get(TId['panel']['breplyroot']).style.display = 'none';
				}
				var lastid = 0;
				var _buildnode = function(container, pid){
					
					var i, di, lst = "";
					for (i=0;i<data.length;i++){
						di = data[i];
						if (di['id']*1 > lastid){
							lastid = di['id']*1;
						}
						if (di['pid'] == pid){
							di['bd'] = body[di['id']];
							lst += buildnode(di);
						}
					}
					if (lst.length == 0){ return; }
					var t = tSetVar(T['list'], 'id', pid);
					container.innerHTML = tSetVar(t, 'list', lst);
					
					for (i=0;i<data.length;i++){
						di = data[i];
						if (di['pid'] == pid){
							var child = Dom.get(TId['comment']['child']+'-'+di['id']);
							_buildnode(child, di['id']);
						}
					}
				};
				
				var list = Dom.get(TId['panel']['list']);
				_buildnode(list, 0);

				this.lastid = lastid;
				this.count = data.length;
				this.renderCount();
				
				E.on(c, 'click', function(e){if (__self.onClick(E.getTarget(e))){ E.stopEvent(e);}});
				
				var tables = {'comments': DATA.get('comments', true)}
				var rows = tables['comments'].getRows({'cid': cid}, {'lid': lastid});
				DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			};

			this.onDSUpdate = function(type, args){
				var __self = this;
				if (args[0].checkWithParam('comments', {'cid': this.contentid})){
					__self.update(); 
				}
			};

			this.update = function(){
				var rows = DATA.get('comments').getRows({'cid': this.contentid});
				var lastid = this.lastid;
				var count = this.count;
				rows.foreach(function(row){
					var di = row.cell;
					var pid = di['pid'];
					if (di['id']*1 > lastid){ lastid = di['id']*1; }
					var item = buildnode(di);
					var child;
					if (count == 0){
						child = Dom.get(TId['panel']['list']);
					}else{
						child = Dom.get(TId['comment']['child']+'-'+pid);
					}
					var list = Dom.get(TId['list']['id']+'-'+pid);
					if (L.isNull(list)){
						var t = tSetVar(T['list'], 'id', pid);
						child.innerHTML = tSetVar(t, 'list', item);
					}else{
						list.innerHTML += item;
					}
					count++;
				});
				this.count = count;
				this.lastid = lastid;
				rows.overparam.lid = lastid;
				this.renderCount();
			};
			
			this.renderCount = function(){
				var span = Dom.get(TId['panel']['count']);
				span.innerHTML = "("+this.count+")";
			};
			
			this.onClick = function(el){
				if (this.replyman){
					if (this.replyman.onClick(el)){ return true; }
				}
				switch(el.id){
				case TId['panel']['breplyroot']:
					this.reply(this.contentid, 0);
					return true;
				case TId['panel']['refresh']:
				case TId['panel']['refreshimg']:
					this.refresh();
					return true;
				}
				
				var prefix = el.id.replace(/([0-9]+$)/, '');
				var numid = el.id.replace(prefix, "");
				
				switch(prefix){
				case (TId['reply']['id']+'-'):
					this.reply(this.contentid, numid);
					return true;
				}
				return false;
			};
			
			this.reply = function(commentid, id){
				if (!L.isNull(this.replyman)){
					this.replyman.destroy();
				}
				this.replyman = new Reply(commentid, id);
			};
			
			this.refresh = function(){
				var table = DATA.get('comments');
				var rows = table.getRows({'cid': this.contentid});
				rows.clear();
				DATA.request();
			};
			
			var Reply = function(cid, id){
				this.init(cid, id);
			};
			Reply.prototype = {
				init: function(cid, id){
					this.id = id;
					this.contentid = cid;
					this.isDestroy = false;
					if (id == 0){
						this.contbutton = Dom.get(TId['panel']['replycont']);
						this.panel = Dom.get(TId['panel']['reply']);
					}else{
						this.contbutton = Dom.get(TId['reply']['contbtn']+'-'+id);
						this.panel = Dom.get(TId['reply']['reply']+'-'+id);
					}
					this.contbutton.style.display = 'none';
					var __self = this;
					replyLibLoader(function(){
						__self.build();
					});
				}, 
				destroy: function(){
					if (this.idDestroy){ return; }
					this.editor.destroy();
					this.contbutton.style.display = '';
					elClear(this.panel);
					this.isDestroy = true;
				},
				build: function(){
					this.panel.innerHTML = T['replypanel'];
					this.editor = new Brick.widget.editor.TinyMCE(TId['replypanel']['editor'],{'value': '',
						width: '550px', height: '100px', buttonsgroup: 'comment' 
					});
				},
				preview: function(){
					var table = DATA.get('preview', true);
					table.columns.update(["id","bd"]);
					var row = table.newRow();
					row.cell['bd'] = this.editor.getValue();
					var rows = table.getRows();
					rows.clear();
					rows.add(row);
					table.applyChanges();
					
					var oncomplete = function(){
						Dom.get(TId['replypanel']['preview']).innerHTML = rows.getById(1).cell['bd'];
						DATA.onComplete.unsubscribe(oncomplete);
					};
					DATA.onComplete.subscribe(oncomplete);
					DATA.request();
				},
				send: function(){
					var table = DATA.get('comments');
					var rows = table.getRows({'cid': this.contentid});
					var row = table.newRow();
					row.cell['pid'] = this.id;
					row.cell['bd'] = this.editor.getValue();
					rows.add(row);
					table.applyChanges();
					DATA.request();
					this.destroy();
				},
				onClick: function(el){
					var tp = TId['replypanel'];
					switch(el.id){
					case tp['bcancel']: this.destroy(); return true;
					case tp['bsend']: this.send();	return true;
					case tp['bpreview']: this.preview(); return true;
					}
					return false;
				}
			};
			
			
			this.build(data);
		}
	};
	
	Brick.mod.comment.Builder = Builder;
	
})();
};
})();
