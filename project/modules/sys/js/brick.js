/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

if (typeof Brick == 'undefined' || !Brick){ Brick = {};}

Brick.env = function(){
	return {
		version: '1.1.2',
		language: 'ru',
		user:{ 
			id: 0,
			name: 'guest', session: '', group: 0,
			isAdmin: function(){ return this.group >= 6; },
			isModerator: function(){ return this.group >= 5; },
			isRegistred: function(){ return this.group >= 4; },
			isRegister: function(){ return this.group >= 4; }
		},
		host: '',
		lib: {
			yui: '2.8.0r4'
		}
	}
}();

Brick.env.host = function(){
	return 'http://'+document.location.host;
}();

Brick.objectExists = function(str){
	var d=str.split(".");
  var o=Brick;
  for (j=(d[0] == "Brick")?1:0; j<d.length; j++) {
  	if (typeof o[d[j]] == 'undefined'){
  		return false;
  	}
    o=o[d[j]];
  }
  
  return true;
};

/**/
Brick.namespace = function() {
  var a=arguments, o=null, i, j, d;
  for (i=0; i<a.length; i=i+1) {
  	d=a[i].split(".");
    o=Brick;
    for (j=(d[0] == "Brick") ? 1 : 0; j<d.length; j=j+1) {
    	o[d[j]]=o[d[j]] || {};
      o=o[d[j]];
    }
  }
  return o;
};

Brick.namespace('util');
Brick.namespace('widget');

(function(){

	var cleanScript = function(o){
		if (!o.childNodes.length){
			return "";
		}
		var i, s = "", c;
		for (i=0;i<o.childNodes.length;i++){
			c = o.childNodes[i];
			if (typeof c.tagName != 'undefined'){
				if (c.tagName.toLowerCase() == 'script'){
					s += c.innerHTML;
					o.removeChild(c);
				}else{
					s += cleanScript(c);
				}
			}
		}
		return s;
	};
	
	Brick.cleanScript = cleanScript;
	
	var elClear = function(el){ while(el.childNodes.length){el.removeChild(el.childNodes[0]);} };
	Brick.elClear = elClear;

	Brick.elCreate = function(tag, parent){
		var el = document.createElement(tag);
		if (typeof parent != 'undefined'){
			parent.appendChild(el);
		}
		return el;
	};

})();

/* * * * * * * * * * * * CSS Style Manager * * * * * * * * * * */
(function(){
	Brick.util.CSS = {};
	
	/**
	 * Добавление стиля CSS в браузер
	 */
	Brick.util.CSS.update = function(t){
		if (typeof t == 'undefined'){
			return;
		}
		/**/
		var style = document.createElement('style');
		style['type'] = 'text/css';
		
		if (style.styleSheet){ // IE
			style.styleSheet.cssText = t;
		}else{
			var tt1 = document.createTextNode(t);
	    style.appendChild(tt1);
		}
		
		var hh1 = document.getElementsByTagName('head')[0];
		hh1.appendChild(style);
	}
})();

/* * * * * * * * * * * * Template Manager * * * * * * * * * * */
(function(){

	Brick.util.clone = function(t){
		var ct = {};
		for (var name in t){
			ct[name] = t[name];
		};
		return ct;
	};
	Brick.util.Template = {};
	Brick.util.Template.fillLanguage = function(t){
		if (typeof t == 'undefined'){
			return;
		}
		
		var lang = Brick.env.language;
		var exp = new RegExp("(\{\#[a-zA-Z0-9_\.\-]+\})", "g"), s, arr, key, phrase, i;
		for (var name in t){
			s = t[name];
			arr = s.match(exp)
			if (YAHOO.lang.isArray(arr)){
				for (i=0;i<arr.length;i++){
					key = arr[i].replace(/[\{#\}]/g, '');
					phrase = Brick.util.Language.getc(key);
					if (!YAHOO.lang.isNull(phrase)){
						s = s.replace(arr[i], phrase);
					}
				}
			}
			t[name] = s;
		}
	}
	
	Brick.util.Template.setProperty = function(t, name, value){
		var exp = new RegExp("\{v\#"+name+"\}", "g");
		return t.replace(exp, value);
	};

	Brick.util.Template.setPropertyArray = function(t, obj){
		for (var n in obj){
			t = Brick.util.Template.setProperty(t, n, obj[n]);
		}
		return t;
	};
})();

/* * * * * * * * * * * * Template Id Manager * * * * * * * * * * */
(function(){
	
	var counter = 0;
	
	var idman = function(template){
		if (typeof template == 'undefined'){
			return;
		}
		this.init(template);
	};
	
	idman.prototype = {
		init: function(t){
		
			this['_global'] = {};
			
			var s, arr, key, genid, i;
			
			// global id setting
			var exp = new RegExp("(\{gi\#[a-z0-9_\-]+\})", "gi");

			var uniq = {};
			for (var name in t){
				s = t[name];
				arr = s.match(exp)
				if (YAHOO.lang.isArray(arr)){
					for (i=0;i<arr.length;i++){
						if (!uniq[arr[i]])
							uniq[arr[i]] = 'bkgtid_'+counter++;
						
						s = s.replace(new RegExp(arr[i], "gi"), uniq[arr[i]]);
						
						key = arr[i].replace(/\{gi#([a-zA-Z0-9_\-]+)\}/, '$1');
						this['_global'][key] = uniq[arr[i]];
					}
				}
				t[name] = s;
			}
		
			exp = new RegExp("(\{i\#[a-z0-9_\-]+\})", "gi");
			for (var name in t){
				s = t[name];
				arr = s.match(exp)
				if (YAHOO.lang.isArray(arr)){
					this[name] = {};
					for (i=0;i<arr.length;i++){
						key = arr[i].replace(/\{i#([a-zA-Z0-9_\-]+)\}/, '$1');
						if (typeof this[name][key] == 'undefined'){
							genid = 'bktid_'+name.substring(0,1)+key.substring(0,1)+'_'+counter++;
							this[name][key] = genid;
							s = s.replace(new RegExp(arr[i], "gi"), genid);
						}
					}
				}
				t[name] = s;
			}
		}
	}
	
	Brick.util.TIdManager = idman;
	
})();

/* * * * * * * * * * * * Language Manager * * * * * * * * * * */
(function(){
	
	var clone = function(from, to){
		for (var el in from){
			if (YAHOO.lang.hasOwnProperty(from, el)){
				if (YAHOO.lang.isObject(from[el])){
					if (typeof to[el] == 'undefined')
						to[el] = {};
					clone(from[el], to[el])
				}else{
					to[el] = from[el];
				}
			}
		}
	};
	
	var language = function(){
		this._dict = {};
	};
	
	language.prototype = {
		getData: function(){
			return this._dict[Brick.env.language];
		},
		add: function(lang, o){
			if (typeof this._dict[lang] == 'undefined')
				this._dict[lang] = {};
			clone(o, this._dict[lang]);
		},
		get: function(lang, key){
			var l = this._dict[lang], k = key.split('.'), i;
			for (i=0;i<k.length;i++){
				l = l[k[i]];
				if (typeof l == 'undefined'){
					return null;
				}
			}
			
			return l;
		},
		getc: function(key){
			return this.get(Brick.env.language, key);
		},
		dump: function(lang){
			alert(YAHOO.lang.dump(this._dict[lang]));
		}
	}
	
	Brick.util.Language = new language();
	
})();

/* * * * * * * * * * * * JS Loader * * * * * * * * * * */
(function(){
	
	var module = function(o){
		this.yahoo = [];
		this.ext = [];
		this.mod = [];
		this.isLoad = false;
		this.event = null;
		this.init(o);
	}
	module.prototype = {
		init: function(o){
			if (typeof o.yahoo != 'undefined'){ this.yahoo = o.yahoo; }
			if (typeof o.ext != 'undefined'){ this.ext = o.ext; }
			if (typeof o.mod != 'undefined'){ this.mod = o.mod; }
			this.event = { onSuccess: o.onSuccess, onFailure: o.onFailure, executed: false}
		}
	}
	
	var loader = function(){
		
		this._isProccess = false;
		this._countModule = 0;
		this._modules = [];
		this._reqYUI = {};
		
		this.init();
	};
	
	loader.prototype = {
		init: function(){
			var __self = this;
			this._yuiLoader = new YAHOO.util.YUILoader({ 
		    base: "/js/yui/"+Brick.env.lib.yui+"/",
				gzip: true, gzipBase: "/gzip.php?file=",
		    filter: "MIN", 
	      ignore: ['containercore'],
		    onSuccess: function() { __self._event(false); },
		    onFailure: function (err){
		    	__self._event(true); alert ('Ошибка загрузки модуля: ' + YAHOO.lang.dump(err) );
		    }
			});
		},
		add: function(o){
			var m = new module(o);
			this._modules[this._modules.length] = m;
			if (!this._isProccess){
				this._start();
			}
		},
		addRange: function(o){
			var m, i;
			for (i=0;i<o.length;i++){
				m = new module(o[i]);
				this._modules[this._modules.length] = m;
			}
			if (!this._isProccess){ this._start(); }
		},
		_event: function(error){
			var __self = this;
			this._isProccess = false;
			/**
			 * Если в процессе загрузки модулей были добавлены еще модули,
			 * то события предыдущих модулей остаются в ожидании и производится запуск
			 * загрузки оставшихся
			 */
			if (this._modules.length != this._countModule){
				this._start();
				return;
			}

			if (this._reqtinymce){
				/**
				 * Был запрошен gzip-модуль TinyMCE  
				 */
				this._reqtinymce = false;
				tinyMCE_GZ.init(
					{
						baseURL: '/js/tinymce/3.2.6',
						themes : "advanced",
						plugins : "safari,pagebreak,style,layer,table,save,advhr,advimage,advlink,emotions,iespell,insertdatetime,preview,media,searchreplace,print,contextmenu,paste,directionality,fullscreen,noneditable,visualchars,nonbreaking,xhtmlxtras",
				    languages : "en,ru", disk_cache : true, version: '3.2.6'
					}, 
					function() {__self._event();}
				);
				return;
			}

			/**
			 * Установить флаг загрузки. Необходим для предотвращения запуска загрузки 
			 * добавляемых модулей в процессе выполнения событий загруженных модулей
			 */
			this._isProccess = true;
			
			/**
			 * выполнение событий по принципу fifo (последнии модули приоритетнее) 
			 */
			var i, m, cnt = this._modules.length;
			for(i=cnt-1;i>=0;i--){
				m = this._modules[i];
				if (m.event.executed){
					break;
				}
				m.event.executed = true;
				var f = error ? m.event.onFailure : m.event.onSuccess;
				//try{
					if (typeof f == 'function'){
						f();
					}
				//}catch(e){ alert(YAHOO.lang.dump(e)); }
			}
			this._isProccess = false;
			/**
			 * Во время выполнения событий были добавлены еще модули на загрузку.
			 */
			if (this._modules.length != this._countModule){
				this._start();
			}
		},
		_start: function(){
			this._isProccess = true;
			this._countModule = this._modules.length;
			
			var i, m, j, k, r, ylib = [], elib = [], mlib = [];
			
			for (i=0;i<this._modules.length;i++){
				m = this._modules[i];
				if (!m.isLoad){
					m.isLoad = true;
					// Brick Module
					for (j=0;j<m.mod.length;j++){ mlib[mlib.length] = m.mod[j]; }
					// Ext
					for (j=0;j<m.ext.length;j++){ elib[elib.length] = m.ext[j]; }
					// YAHOO
					for (j=0;j<m.yahoo.length;j++){
						r = m.yahoo[j];
						if (typeof this._reqYUI[r] == 'undefined'){
							this._reqYUI[r] = true;
							ylib[ylib.length] = r; 
						}
					}
				}
			}
			var loader = this._yuiLoader;
			if (ylib.length > 0){
				for (i=0;i<ylib.length;i++){loader.calculate({require: ylib[i]});}
			}
			if (elib.length > 0){
				var l = [];
				var nm, fp, type;
				for (i=0;i<elib.length;i++){
					nm = elib[i].name;
					type = 'js';
					switch(nm){
					case 'tinymce':
						this._reqtinymce = true;
						fp = "/js/tinymce/3.2.6/tiny_mce_gzip.js"; 
						break;
					case 'accordionview':
						fp = "/gzip.php?file=/js/yui/"+Brick.env.lib.yui+"/accordionview/accordionview-min.js";
						loader.addModule({
							name: "accordionview-css", type: "css", 
							fullpath: "/js/yui/"+Brick.env.lib.yui+"/accordionview/assets/skins/sam/accordionview.css"});
						loader.require("accordionview-css");
						loader.calculate({require: "button"});
						loader.calculate({require: "animation"});
						break;
					default:
						fp = elib[i].fullpath;
						type = elib[i].type;
					}
					l[l.length] = nm;
					loader.addModule({name: nm, type: type, fullpath: fp});
				}				
				loader.require(l);
			}
			if (mlib.length > 0){
				var mm, mb, mv, minfo, rq=[];
				var count = mlib.length;
				for (var ii=0;ii<count;ii++){
					if (mlib[ii]){
						mm = mlib[ii].name;
						minfo = Brick.Modules[mm];
						
						if (minfo){
							for (j=0;j<mlib[ii].files.length;j++){
								mb = mlib[ii].files[j];
								mv = "";
								for (k=0;k<minfo.length;k++){
									if (minfo[k]['f'] == mb){ mv = minfo[k]['k']; }
								}
								rq[rq.length]=mm+mb;
								loader.addModule({
									name: mm+mb, 
									type: "js", 
									fullpath: "/gzip.php?type=mod&module="+mm+"&version="+mv+"&tt="+Brick.env.ttname+"&file="+mb
								});
							}
						}
					}
				}
				loader.require(rq);
			}
			loader.insert();
		}
	}
	
	/**/
	Brick.Loader = function(){
		return {
			mods: [],
			add: function(o){
				this.mods[this.mods.length] = o;
			} 
		}
	}();
	

	var onReadyExecute = false;
	var readyFunc = [];
	var oldList = [];
	if (typeof window.bReady != 'undefined'){
		// oldList = window.bReady.list;
	}
	
	window.bReady = function(){
		return {
			on: function(f){
				if (typeof f != 'function'){
					alert('window.bReady.on(f): f must be function');
					return;
				}
				if (onReadyExecute){
					//try{ 
						f(); 
					//}catch(e){}
				}else{
					readyFunc[readyFunc.length] = { func: f, executed: false };
				}
			}
		}
	}();
	
	for (var i=0;i<oldList.length;i++){
		window.bReady.on(oldList[i]);
	}
	
	var onReady = function(){
		for (var i=0;i<readyFunc.length;i++){
			if (!readyFunc.executed){
				readyFunc[i].executed = true;
				//try{
					readyFunc[i].func();
				//}catch(e){}
			}
		}
		onReadyExecute = true;
	}
	Brick.Loader.add({ onSuccess: onReady });

	YAHOO.util.Event.onDOMReady(function(){
		var old = Brick.Loader;

		Brick.Loader = new loader();
		Brick.Loader.addRange(old.mods);
	});
})();

Brick.uniqurl = function(url){
	if (typeof Brick.uniqurl.querycount == 'undefined'){
		Brick.uniqurl.querycount = 0;
	}
	Brick.uniqurl.querycount++;
	var d = new Date();
	url += '&uniqurl='+Brick.uniqurl.querycount+d.getTime();
	return url;
};

Brick.readScript = function(text){
	var s = document.createElement("script");
	s.charset = "utf-8";
	s.text = text;
	document.body.appendChild(s);
};

Brick.byteToString = function(byte){
	var ret = byte;
	var px = "";
	if (byte < 1024){
		ret = byte;
		px = "б";
	}else if (byte < 1024*1024){
		ret = Math.round((byte/1024)*100)/100;
		px = 'кб';
	}else{
		ret = Math.round((byte/1024/1024)*100)/100;
		px = 'мб';
	}
	return ret+' '+px;
};


Brick.widget.WindowWait = function(){
	var win = null;
	return {
		show: function(){
			var wWait = new YAHOO.widget.Panel("wait",{ 
				width:"280px", 
				fixedcenter:true, close:false, draggable:false, 
				zindex:1001, modal:true, visible:false
			});
			
			wWait.setHeader("Идет загрузка...");
			wWait.setBody('<center><img src="/images/loading_line.gif" /></center>');
			wWait.render(document.body);
			wWait.show();
			win = wWait;
		},
		hide: function(){
			if (YAHOO.lang.isNull(win)){ return; }
			win.destroy();
			win = null;
		}
	}
}();

(function(){
	
	var uniqurl = Brick.uniqurl;
	var wWait = Brick.widget.WindowWait;
	var readScript = Brick.readScript;
	

	var sendPost = function(module, brick, cfg ){

		cfg = cfg || {};
		cfg['json'] = cfg['json'] || {};
		var hidden = cfg['hidden'] || false;

		var post = "json="+encodeURIComponent(YAHOO.lang.JSON.stringify(cfg['json']));
		if (!hidden){
			wWait.show();
		}
		YAHOO.util.Connect.asyncRequest("POST", 
			uniqurl('/ajax/query.html?md='+module+'&bk='+brick), 
			{
				success: function(o) {
					if (!hidden){wWait.hide();} 
					readScript(o.responseText);
					if (typeof cfg.success == 'function'){
						cfg.success(o);
					}
				}, 
				failure: function(o){ 
					if (!hidden){wWait.hide();} 
					alert("CONNECTION FAILED!"); 
				}
			}, 
			post
		);
	};
	
	Brick.util.Connection = {};
	Brick.util.Connection.sendCommand = function(module, brick, cfg){
		
		if (typeof YAHOO.util.Connect == 'undefined' || typeof YAHOO.lang.JSON == 'undefined'){
			wWait.show();
			Brick.Loader.add({
		    yahoo: ['connection', 'json'],
		    onSuccess: function() {
					wWait.hide();
					sendPost(module, brick, cfg);
				},
				onFailure: function(){
					wWait.hide();
				}
			});
		}else{
			sendPost(module, brick, cfg);
		}
	}
})();


Brick.dateExt = function(){
	var m = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
	var mp = ['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря'];
	var ds = ['Вчера', 'Сегодня', 'Завтра'];
	
	var z = function(num){
		if (num < 10){
			return '0'+num;
		}
		return num;
	};
	
	return {
		convert: function(udate, type){
			if (udate*1 == 0){
				return "";
			}
			var msec = udate*1000;
			var cd = new Date(msec);
			
			var day = z(cd.getDate());
			var mon = z(cd.getMonth());
			var mons= mp[cd.getMonth()];
			var min = z(cd.getMinutes()+1);
			var hour = z(cd.getHours());
			
			if (type == 1){
				return day+'.'+mon+'.'+cd.getFullYear()+', '+hour+':'+(min);
			}else{
				var ld = new Date(), s;
				ld = new Date(ld.getFullYear(), ld.getMonth(), ld.getDate());
	
				var v = (Math.round(ld.getTime()/1000) - udate)/60/60/24;
				if (v > 0 && v < 1){
					s = ds[0];
				}else if (v < 0 && v>-2){
					s = ds[1];
				}else{
					s = day+' '+mp[cd.getMonth()]+' '+cd.getFullYear();
				}
				var tm = hour +':'+(min);
				return s+', '+tm;
			}
		},
		unixToArray: function(udate){
			var msec = udate*1000;
			var cd = new Date(msec);
			return {
				'day': cd.getDate(),
				'month': cd.getMonth(),
				'year': cd.getFullYear(),
				'min': cd.getMinutes()+1,
				'hour': cd.getHours()
			};
		}
	}
}();
