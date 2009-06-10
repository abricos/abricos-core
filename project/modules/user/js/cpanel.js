/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){

	Brick.namespace('Brick.User.CP');

	var Dom, E,	L, W,	TId;

	var BC = Brick.util.Connection;

	var wWait = Brick.widget.WindowWait;
	var elClear = Brick.elClear;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
    yahoo: ["connection","container","json","cookie"],
		mod:[{name: 'sys', files: ['container.js']}],
    onSuccess: function() { 
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;
			W = YAHOO.widget;
			
			T = Brick.util.Template['user']['cpanel'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);
			Brick.util.CSS.update(Brick.util.CSS['user']['cpanel']);
			
			Brick.util.CSS.update(T['css']);
			delete T['css'];
	  } 
	});

(function(){
	
	var cpanel = function(modules){
		this.init(modules);
	}
	
	cpanel.prototype = {
		init: function(modules){

			this.modules = {};
			this.modids = {};
			this.modConfig = modules;
		
			var __self = this;
			var div = Dom.get('bk_user_cp');
			if (L.isNull(div)){ return; }
			elClear(div);
			div.innerHTML = T['panel'];

			E.on(div, 'click', function(e){ if (__self.onClick(E.getTarget(e))){ E.stopEvent(e);}});
			
			var list = [];
			for (var m in modules){
				list[list.length] = {name: m, files:['cp.js']};
			}
			Brick.Loader.add({
				mod: list,
		    onSuccess: function() { __self.buildMenu(); }
			})
		},
		onClick: function(el){
			var mid = el.id.replace(TId['_global']['menuid']+"-", "");
			
			if (this.modids[mid]){
				this.selectModule(mid)
				return true;
			}
			return false;
		},
		findModule: function(mid, parent){
			var ms = [];
			if (parent){
				ms = parent['child']; 
			}else{ 
				for(var n in this.modules){ ms[ms.length] = this.modules[n]; }
			}
			var i, ret, m;
			for (i=0; i<ms.length; i++){
				m = ms[i];
				if (m['id'] == mid){ return m; }
				if (m['child'] && m['child'].length > 0){
					ret = this.findModule(mid, m)
					if (ret){ return ret; }
				}
			}
			return null;
		},
		_selMenuItem: function(id, show){
			var mitem = Dom.get(TId['_global']['menuid']+"-"+id);
			if (mitem){
				var classname = mitem.className;
				classname = classname.replace('sel', "");
				if (show){
					classname += " sel";
				}
				mitem.className = classname;
			}
		},		
		_shChildUL: function(id, show){
			var smid = TId['menuchild']['id']+"-"+id;
			var mobj = Dom.get(smid);
			if (mobj){ mobj.className = show ? "" : "hide"; }
		},
		selectModule: function(mid){
			var mod = this.findModule(mid);
			
			if (this.selectedModule == mod){ return; }
			
			var d = new Date();
			d.setDate(d.getDate()+30);
			YAHOO.util.Cookie.remove("cp_selmod"); 
			YAHOO.util.Cookie.set("cp_selmod", mid, {
				path: "/user",
				expires: d
			}); 

			if (this.selectedModule){
				this._selMenuItem(this.selectedModule['id'], false)
				this.selectedModule['container'].style.display = 'none';

				if (mod['parent'] != this.selectedModule){
					var first = this.selectedModule['parent'] || this.selectedModule; 
					this._shChildUL(first['id'], false);
					this._selMenuItem(first['id'], false)
				}
			}
			
			this.selectedModule = mod;
			this._selMenuItem(mod['id'], true)
			this._shChildUL(mod['id'], true);
			if (mod['parent']){
				this._shChildUL(mod['parent']['id'], true);
				this._selMenuItem(mod['parent']['id'], true)
			}
			
			var title = mod['title'];
			if (mod['parent']){
				title = mod['parent']['title'] + " => " + title;
			}
			
			Dom.get(TId['panel']['contname']).innerHTML = title;
			if (typeof mod['container'] != 'undefined'){
				mod['container'].style.display = 'block';
				return;
			}

			var div = document.createElement('div');
			mod['container'] = div;
			mod['initialize'](div);
			
			Dom.get(TId['panel']['modbody']).appendChild(div);
		},
		register: function(mod){
			this.modules[mod['name']] = mod;
		}, 
		buildMenuItem: function(m){
			
			var mid = m['name'];
			var t = T['menuitem'];
			
			if (m['parent']){
				mid = m['parent']['id']+mid;
				t = T['menuchilditem'];
			}
			m['id'] = mid;
			this.modids[mid] = m;
			
			var icon = m['icon'] || "/modules/user/js/images/cp_icon_default.gif"; 
			var ti = T['miicon'];
			ti = tSetVar(ti, 'id', m['id']);
			ti = tSetVar(ti, 'url', icon);
			var iconcss = ti;

			t = tSetVar(t, 'id', m['id']);

			m['title'] = Brick.util.Language.getc(m['titleid']);
			delete m['titleid'];
			t = tSetVar(t, 'tl', m['title']);
			
			var child = "", childb, mc;
			if (m['child']){
				for (var i=0;i<m['child'].length;i++){
					mc = m['child'][i]; 
					mc['parent'] = m;
					ti = tSetVar(T['menuchild'], 'id', m['id']);
					childb = this.buildMenuItem(mc);
					iconcss += childb['css'];
					child += tSetVar(ti, 'items', childb['t']);
				}
			}
			t = tSetVar(t, 'child', child);

			return {t: t, css: iconcss};
		},
		buildMenu: function(){
			
			var lst = "", firstmod, iconcss = "";
			
			for (var n in this.modules){
				var m = this.modules[n];
				var item = this.buildMenuItem(m); 

				if (!firstmod) firstmod = m['id'];
				
				lst += item['t'];
				iconcss += item['css'];
			}
			Brick.util.CSS.update(iconcss);

			var menu = Dom.get(TId['panel']['mainmenu']);
			elClear(menu);
			menu.innerHTML = lst;
			
			var cookiesave = YAHOO.util.Cookie.get("cp_selmod");
			if (cookiesave){
				this.selectModule(cookiesave);
			}else{
				this.selectModule(firstmod);
			}
		}
	}
	
	Brick.User.CP.Manager = function(){
		return {
			initialize: function(modules){
				Brick.User.CP.Manager = new cpanel(modules);
			}
		}
	}();
})();
})();
