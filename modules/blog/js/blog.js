/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){

	Brick.namespace('Blog');

	var Dom, E,	L, W,	C;
	
	var uniqurl = Brick.uniqurl;
	var dateExt = Brick.dateExt;
	var readScript = Brick.readScript;
	var wWait = Brick.widget.WindowWait;
	
	Brick.Loader.add({
		yahoo: ["connection","container"],
    onSuccess: function() {
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;
			W = YAHOO.widget;
			C = YAHOO.util.Connect;
	  }
	});

	function elClear(el){ while(el.childNodes.length){el.removeChild(el.childNodes[0]);} }
	
	function connectFailure(o){
		wWait.hide();
		alert("CONNECTION FAILED!");
	};
	
	var connectCallback = {
		success: function(o) {
			wWait.hide();
			readScript(o.responseText);
		}, failure: connectFailure
	};

/* * * * * * * * * * Blog Topic List Manager * * * * * * * * * */
(function(){
	
	Brick.Blog.TopList = function(){
		return {
			initComtById: function(id){
				var a = Dom.get('bk-bg-comt-'+id);
				
				if (L.isNull(a)){return;}
				E.on(a, 'click', function(){
					Brick.Blog.Comment.show(id);
					return false;
				});
			},
			initTopBodyById: function(id){
				var div = Dom.get('bk-bg-topload-c-'+id);
				if (L.isNull(div)){ return;}
				div.style.display = "";

				var a = Dom.get('bk-bg-topload-'+id);
				E.on(a, 'click', function(){
					var container = Dom.get('bk-bg-topbody-'+id);
					wWait.show();
					C.asyncRequest("GET", 
						uniqurl('/ajax/query.html?md=blog&bk=topic&do=loadbody&topicid='+id), {
						success: function(o) {
							wWait.hide();
							container.innerHTML = o.responseText;
						}, failure: connectFailure
					}); 
					
					return false;
				});
			},
			init: function(comtid, topid){
				for (var i=0;i<comtid.length;i++){
					this.initComtById(comtid[i])
				}
				for (var i=0;i<topid.length;i++){
					this.initTopBodyById(topid[i])
				}
			}
		}
	}(); 

})();


/* * * * * * * * * * Comment Fast Reply * * * * * * * * * */
(function(){
	
	Brick.Blog.Comment = function(){
		var panels = {}, panelCount = 0, man = null;
		
		return {
			show: function(contentid){
				var __self = this;
				if (typeof Brick.Comment == 'undefined'){
					wWait.show();
					Brick.Loader.add({
						mod:[{name:'comment',files:['comment.js']}], 
						onSuccess: function() { 
							wWait.hide();
							__self.show(contentid);
						},
						onFailure: function(){ wWait.hide(); }
					});
					return;
				}
				
				var panel = panels[contentid];
				if (typeof panel != 'undefined'){
					panel.show();
					return;
				}
				if (L.isNull(man)){ man = new W.OverlayManager(); }

				wWait.show();
				var __self = this;
				C.asyncRequest("GET", 
					uniqurl('/ajax/query.html?md=blog&bk=cmtpanel&contentid='+contentid), {
					success: function(o) {
						wWait.hide();
						var div = document.createElement('div');
						div.innerHTML = o.responseText;
						s = Brick.cleanScript(div);
						document.body.appendChild(div);
						readScript(s);
						
						var id = 'bk-cmt-panel-'+contentid;
						var pancnt = panelCount;
						panel = new W.Panel(id, { 
							constraintoviewport:true,
							xy:[30+pancnt*30,30+pancnt*30], 
							visible:false,width:"640px"
						});
						panel.render();
						
						var resize = new YAHOO.util.Resize(id, {
	            handles: ["br"],
	            autoRatio: false,
	            minWidth: 400,
	            minHeight: 100,
	            status: false 
	         });
						
						panel.show();
						
						man.register(panel);
						panels[contentid] = panel;
						panelCount++;
					}, failure: connectFailure
				}); 
			}
		}
	}();
	
})();

/* * * * * * * * * * Comment Online Panel * * * * * * * * * */
(function(){
	Brick.namespace('Blog.CmtOnline');
	
	Brick.Blog.CmtOnline = function(){
		
		return {
			setById: function(id){
				var a = Dom.get('bk-bg-comtonl-'+id);
				
				if (L.isNull(a)){return;}
				
				a.style.cursor = 'pointer';
				E.on(a, 'click', function(){
					Brick.Blog.Comment.show(id);
					return false;
				});
			},
			set: function(ids){
				for (var i=0;i<ids.length;i++){
					this.setById(ids[i])
				}
			}
		}
	}();

	var refresh = function(){
		wWait.show();
		var __self = this;
		C.asyncRequest("GET", 
			uniqurl('/ajax/query.html?md=blog&bk=p_commentlive&do=updcmtonl'), {
			success: function(o) {
				wWait.hide();
				var divr = document.createElement('div');
				divr.innerHTML = o.responseText;
				s = Brick.cleanScript(divr);
				
				var div = Dom.get('mod-blog-commentlive');
				elClear(div);
				div.innerHTML = divr.innerHTML;
				
				readScript(s);
				
			}, failure: connectFailure
		}); 
	};
	
	window.bReady.on(function(){
		var a = Dom.get('mod-blog-commentlive-refresh');
		if (L.isNull(a)){return;}
		a.style.cursor = 'pointer';
		E.on(a, 'click', function(){
			refresh();
			return false;
		});
	});
	
})();
})();