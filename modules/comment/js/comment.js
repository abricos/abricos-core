/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	if (typeof Brick.Comment != 'undefined'){
		return;
	}
	
	Brick.namespace('Comment');
	
	var Dom, E,	L, W,	C;
	
	var uniqurl = Brick.uniqurl;
	var dateExt = Brick.dateExt;
	var readScript = Brick.readScript;
	var elClear = Brick.elClear;
	var wWait = Brick.widget.WindowWait;

	Brick.Loader.add({
    yahoo: ["connection","container","dragdrop","resize"], 
    onSuccess: function() {
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;
			W = YAHOO.widget;
			C = YAHOO.util.Connect;
    }
	});

	
	function connectFailure(o){ wWait.hide(); alert("CONNECTION FAILED!"); };
	
	var connectCallback = {
		success: function(o) {
			wWait.hide();
			readScript(o.responseText);
		}, failure: connectFailure
	};
	
(function(){
	
	Brick.Comment.List = function(){
		var list = [];
		return {
			init: function(d, cid){
				var m = list[cid] = new man();
				m.init(d, cid);
			},
			update: function(d, cid){
				var m = list[cid];
				m.update(d);
			}
		}
	}();;
	
	var getComment = function(id, man){
		var i, d = man.data;
		for (i=0;i<d.length;i++){
			if (d[i].id == id){
				return d[i];
			}
		}
		return null;
	}
	
	var createTree = function(cmt, man){
		var i, d= man.data, ccmt;
		for (i=0;i<d.length;i++){
			ccmt = d[i]; 
			if (ccmt.pid == cmt.id){
				cmt.child.set(ccmt);
				createTree(ccmt, man);
			}
		}
	}
	
	var renderTree = function(container, cmt){
		container.appendChild(cmt.build());
		var ccnt = cmt.child.count(); 

		if (ccnt == 0){return;}
		
		var i, ul = document.createElement('ul'), ccmt;
		for (i=0;i<ccnt;i++){
			ccmt = cmt.child.index(i);
			renderTree(ul, ccmt);
		}
		container.appendChild(ul);
	}
	
	var man = function(){};
	man.prototype = {
		data: null,
		contentid: null,
		lastDate: null,
		reply: null,
		init: function(d, cid){

			this.reply = new reply(this);
			var __self = this;
			this.data = [];
			this.contentid = cid;
			this.el = {};
			
			var c = this.el.container = Dom.get('bk-comt-d');
			c.id = Dom.generateId();

			this.el.comtcount = Dom.get('bk-comt-count');
			this.el.comtcount.id = Dom.generateId();
			
			this.el.btnrefresh = Dom.get('bk-comt-refresh');
			this.el.btnrefresh.id = Dom.generateId();
			
			this.el.btnsend = Dom.get('bk-comt-send');
			if (!L.isNull(this.el.btnsend)){
				this.el.btnsend.id = Dom.generateId();
			}

			this.el.rootreply = Dom.get('bk-comt-send-cont');
			if (!L.isNull(this.el.rootreply)){
				this.el.rootreply.id = Dom.generateId();
			}
			
			this.data[0] = new comment({id:0, pid:-1, bd:'', de:0}, this);
			this.data[0].reply = this.el.rootreply;

			var i, lastDate = 0;
			
			for (i=0;i<d.length;i++){
				lastDate = Math.max((d[i]['de'])*1, lastDate);
				this.data[this.data.length] = new comment(d[i], this); 
			}
			this.lastDate = lastDate;
			
			var  t, id, cmt, cmt, body;
			while(c.childNodes.length){
				t = c.childNodes[0];
				if (t.childNodes.length == 3){
					id = t.childNodes[0];
					body = t.childNodes[2];
					cmt = getComment(id.innerHTML, this);
					cmt.d['bd'] = body.innerHTML;
				}
				c.removeChild(t);
			}
			this.render();

			var a = this.el.btnsend;
			if (!L.isNull(a)){
				a.style.cursor = 'pointer';
				E.on(a, 'click', function(){
					__self.reply.show(getComment(0, __self));
					return false;
				});
			}
			a = this.el.btnrefresh;
			a.style.cursor = 'pointer';
			E.on(a, 'click', function(){
				__self.refresh();
				return false;
			});
			
		},
		render: function(){
			var c = this.el.container;
			elClear(c);
			for (i=0;i<this.data.length;i++){
				if (this.data[i].pid == 0){
					createTree(this.data[i], this);
				}
			}
			var ul = document.createElement('ul');
			c.appendChild(ul);
			for (i=0;i<this.data.length;i++){
				if (this.data[i].pid == 0){
					renderTree(ul, this.data[i]);
				}
			}
			this.el.comtcount.innerHTML = "("+(this.data.length-1)+")";
		},
		update: function(d){
			if (d.length == 0){ return; }
			var i, lastDate = 0, nd = [], old, currIndex = this.data.length;
			
			for (i=0;i<d.length;i++){
				lastDate = Math.max((d[i]['de'])*1, lastDate);
				nd[nd.length] = new comment(d[i], this); 
			}
			this.lastDate = lastDate;
			
			for (i=0;i<nd.length;i++){
				old = getComment(nd[i], this);
				if (L.isNull(old)){
					this.data[this.data.length] = nd[i];
				}
			}
			
			var newData = [];
			newData[0] = new comment({id:0, pid:-1, bd:'', de:0}, this);
			newData[0].reply = this.el.rootreply;
			
			for (i=0;i<this.data.length;i++){
				newData[newData.length] = new comment(this.data[i].d, this);
			}
			this.data = newData;
			this.render();
		},
		refresh: function(){
			var __self = this;
			var url ='/ajax/query.html?md=comment&bk=list';
			url += '&contentid='+this.contentid;
			url += "&last="+this.lastDate;
			wWait.show();
			C.asyncRequest("POST", uniqurl(url), connectCallback); 
		}
	}
	
	Brick.Comment.ReplyEngine = function(){
		return {
			current: null,
			set: function(reply){
				if (!L.isNull(this.current)){
					this.current.close();
				}
				this.current = reply;
			}
		}
	}();
	
	var reply = function(man){this.init(man)};
	reply.prototype = {
		init: function(man){
			this.man = man;
			this.saved= null;
			this.form= null;
			this.editor= null;
			this.current= null;
			this.commentid= null;
		},
		show: function(cmt){
			if (typeof tinyMCE == 'undefined'){
				var __self = this;
				wWait.show();
				Brick.Loader.add({
					ext: [{name: "tinymce"}],
					mod:[{name:'sys',files:['editorold.js']}], 
			    onSuccess: function() {
						wWait.hide();
						__self.show(cmt);
				  },
				  onFailure: function(){ wWait.hide(); }
				});
				return;
			}
			Brick.Comment.ReplyEngine.set(this);
			this.commentid = cmt.id;
			this.current = cmt;
			
			var saved = [], i;
			for (i=0;i<cmt.reply.childNodes.length;i++){
				saved[saved.length] = cmt.reply.childNodes[i];
			}
			this.saved = saved;
			elClear(cmt.reply);
			cmt.reply.appendChild(this.build());

			tinyMCE.init(Brick.util.Editor.TinyMCE.get('comment'));
			tinyMCE.execCommand( 'mceAddControl', true, this.form);
		},
		close: function(){
			if (L.isNull(this.form)){ return; }
			tinyMCE.execCommand( 'mceRemoveControl', true, this.form);
			elClear(this.current.reply);
			for (var i=0;i<this.saved.length;i++){
				this.current.reply.appendChild(this.saved[i]);
			}
			this.form = null;
		},
		send: function(){
			var __self = this;
			var postData = 'comment='+encodeURIComponent(this.saveHTML());
			var url = '/ajax/query.html?md=comment&bk=list&do=send';
			url += '&contentid='+this.man.contentid;
			url += '&commentid='+this.commentid;
			url += "&last="+this.man.lastDate;

			wWait.show();
			C.asyncRequest("POST", 
				uniqurl(url),{
					success: function(o) {
						wWait.hide();
						__self.close();
						readScript(o.responseText);
					}, failure: connectFailure
				}, postData
			); 
		},
		build: function(){
			var __self = this;
			var div, h3, p, input, label, ta;
			div = document.createElement('div');
			div.className = 'bk-comt-reply';
			var ret = div;
			
			var form = document.createElement('form');
			this.form = form;
			
			p = document.createElement('p');
			div.appendChild(p);
			
			ta = document.createElement('textarea');
			ta.rows = 8;
			ta.cols = 45;
			ta.style.overflow = 'hidden';
			p.appendChild(ta);
			this.form = ta;
			
			p = document.createElement('p');
			div.appendChild(p);
			
			input = document.createElement('input');
			input.type = 'button';
			input.value = ' Просмотр ';
			p.appendChild(input);
			var previewBtn = input;

			input = document.createElement('input');
			input.type = 'button';
			input.value = ' Отправить комментарий ';
			E.on(input, 'click', function(){__self.send();});
			p.appendChild(input);

			input = document.createElement('input');
			input.type = 'button';
			input.value = ' Отмена ';
			E.on(input, 'click', function(){__self.close();});
			p.appendChild(input);
			
			var previewDiv = document.createElement('div');
			ret.appendChild(previewDiv);
			
			E.on(previewBtn, 'click', function(){
				elClear(previewDiv);
				var div = document.createElement('div');
				div.innerHTML = __self.saveHTML();
				previewDiv.appendChild(div); 
			});
			
			return ret;
		},
		validator: null,
		saveHTML: function(){
			var editor = tinyMCE.get(this.form); 
			var html = editor.getContent();
			
			if (L.isNull(this.validator)){
				this.validator = new Brick.util.Editor.HTMLClean(
						Brick.util.Editor.EnableTags.Comment
				); 
			}
			
			var clhtml = this.validator.cleanHTML(html);
			
			editor.setContent(clhtml);
			return clhtml;
		}
	};
	
	var comment = function(d, man){this.init(d, man);};
	comment.prototype = {
		d: null,
		id: null, pid: null,
		child: null,
		reply: null,
		man: null,
		init: function(d, man){
			this.man = man;
			this.d = d;
			this.id = d['id'];
			this.pid = d['pid'];
			var __self = this; 
			this.child = function(){
				return {
					d: [],
					index: function(i){ return this.d[i]; },
					set: function(cmt){
						if (cmt.pid != __self.id){
	            throw new TypeError("comment.child.set: is not a child comment");
						}
						this.d[this.d.length] = cmt;
					},
					get: function(id){
						var i;
						for (i=0;i<this.d.length;i++){
							if (this.d[i].id == id){return this.d[i];}
						}
						return null;
					},
					count: function(){return this.d.length;}
				}
			}();
		},
		build: function(){
			var __self = this;
			var li, div, a, img, d = this.d, abbr, p;
			
			li = document.createElement('li');
			
			div = document.createElement('div');
			li.appendChild(div);
			div.className = "bk-comt-meta";
			
			a = document.createElement('a');
			div.appendChild(a);
			a.title = d['unm'];
			a.href = "#";
			
			img = document.createElement('img');
			a.appendChild(img);
			img.src = "/images/stub-user-small.gif";
			img.alt = d['unm'];
			img.className = 'bk-comt-user';
			
			a = document.createElement('a');
			div.appendChild(a);
			a.className = 'bk-comt-url';
			a.href = "#";
			a.innerHTML = d['unm'];
			
			var date = dateExt.convert(d['dl']);
			abbr = document.createElement('abbr');
			div.appendChild(abbr);
			abbr.title = date;
			abbr.innerHTML = date;

			a = document.createElement('a');
			div.appendChild(a);
			a.href = "#";
			a.title = "Ссылка на комментарий";
			a.innerHTML = "#";
			
			div = document.createElement('div');
			li.appendChild(div);
			div.className = "bk-comt-content";
			if (d['st'] == 1){
				div.innerHTML = '<font style="font-size: 120%">Сообщение заблокировано администрацией</font>';
			}else{
				div.innerHTML = d['bd'];
			}
			
			if (Brick.env.user.isRegistred() && d['st'] == 0){
				
				p = document.createElement('p');
				div.appendChild(p);
				a = document.createElement('a');
				p.appendChild(a);
				a.innerHTML = "Ответить";
				this.reply = p;
			
				E.on(a, 'click', function(){
					__self.man.reply.show(__self);
					return false;
				});
			}
			
			return li;
		}
	}
	
	
})();
})();
