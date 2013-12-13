/* *
 * abricos.js - Template management framework (JavaScript)
 * http://github.com/abricos/abricos.js
 * 
 * The algorithm used based Abricos Platform (http://abricos.org)
 * 
 * The MIT License
 */

if (typeof Abricos == 'undefined' || !Abricos){
	var Abricos = {};
}

if (typeof Abricos_Config == 'undefined'){
	var Abricos_Config = {};
}

var _initAbricos = function(){

	var A = Abricos,
		Y = YUI,
		L = Y.Lang,
		SLICE = Array.prototype.slice;

	A._loading = true;
	
	var CONF = A.config = Y.merge({
		'lang': 'en',
		'defModName': '_module_',
		'defCompName': '_component_'
	}, Abricos_Config || {});
	
	A.Env = {
		'DOMReady': false,
		'mods': {},
		'temps': {},
		'langs': {},
		'css': {}
	};
	
	A.mod = A.mod || {};
	
	/**
	 * The Language class manages phrases localization
	 * 
	 * @class Language
	 * @static
	 */

	var LNG = A.Language = {};

	// Clone languge data (private function)
	var cloneLang = function(from, to){
		for (var n in from){
			if (L.isObject(from[n]) || L.isArray(from[n])){
				if (typeof to[n] == 'undefined'){
					to[n] = {};
				}
				cloneLang(from[n], to[n]);
			}else{
				to[n] = from[n];
			}
		}
	};
	
	/**
	 * Add a language phrases in global storage
	 * @param {String} Language ID
	 * @param {Object} Language phrases
	 * @method add
	 * @static
	 */
	LNG.add = function(lang, o){

		var cfg = {
				'modName': CONF.defModName,
				'compName': CONF.defCompName,
				'inRoot': false // True - ignore component namespace (mod.modname.compname)
			},
			d = A.Env.langs,
			dLang = d[lang] || (d[lang] = {}),
			args = SLICE.call(arguments, 0),
			aln = args.length;
		
		if (aln > 2 && L.isObject(args[aln-1])){
			cfg = L.merge(cfg, args[aln-1]);
		}
		
		if (cfg.inRoot){
			cloneLang(o, dLang);
		}else{
			if (aln >= 4){
				cfg = Y.merge(cfg, {
					'modName': args[2],
					'compName': args[3]
				});
			}
			var mnm = cfg.modName, cnm = cfg.compName,
				no = {'mod': {}};
			
			no['mod'][mnm] = {};
			no['mod'][mnm][cnm] = o;
	
			cloneLang(no, dLang);
		}
	};
	
	/**
	 * Get a phrase or phrases collection by ID.
	 * Example: 
	 * 	Abricos.Language.get('mod.mymod.mycomp.title')
	 * 	or
	 * 	Abricos.Language.get(['mod', 'mymod', 'mycomp', 'title'])
	 * @method add
	 * @static
	 */
	LNG.get = function(key, cfg){
		
		cfg = Y.merge({
			'lang': A.config.lang
		}, cfg || {});
		
		var d = A.Env.langs[cfg.lang];
		if (!d){ return ''; }

		if (L.isString(key)){
			key = key.split('.');
		}
		if (!L.isArray(key)){
			return '';
		}
		
		var i, l = d;
		for (i=0;i<key.length;i++){
			l = l[key[i]];
			if (!L.isValue(l)){
				return '';
			}
		}
		return l;
	};
	
	/**
	 * Replace language IDs in text.
	 * @param {String} s Source.
	 * @param {Object|NULL} cfg Config.
	 * @return {String} Text filled language phrases.
	 * @method fillText
	 * @static
	 */
	LNG.fillText = function(s, cfg){

		cfg = Y.merge({
			'lang': 'en',
			'modName': null,
			'compName': null,
			'tName': null
		}, cfg || {});
		
		// replacement of long IDs {#...}
		var exp = new RegExp("(\{\#[a-zA-Z0-9_\.\-]+\})", "g"),		
			arr = s.match(exp);

		if (L.isArray(arr)){ 
			var i, key, ph;
			for (i=0;i<arr.length;i++){
				key = arr[i].replace(/[\{#\}]/g, '');
				
				ph =  LNG.get(key);
				s = s.replace(arr[i], ph);
			}
		}

		// replacement of short IDs {##...}
		if (L.isValue(cfg['modName']) 
				&& L.isValue(cfg['compName'])
				&& L.isValue(cfg['tName'])){

			var exp = new RegExp("(\{\##[a-zA-Z0-9_\.\-]+\})", "g"),
				arr = s.match(exp);

			if (L.isArray(arr)){ 
				var i, key, ph;
				for (i=0;i<arr.length;i++){
					key = arr[i].replace(/[\{##\}]/g, '');
					
					key = 'mod.'+cfg['modName']+'.'+cfg['compName']+'.'
						+cfg['tName']+'.'+key;

					ph =  LNG.get(key);
					s = s.replace(arr[i], ph);
				}
			}
		}
		
		return s;
	};
	
	/**
	 * The CSS class
	 * 
	 * @class Language
	 * @static
	 */

	var CSS = A.CSS = {};
	
	
	/**
	 * Get the css source of a specific component.
	 * @param {String} mnm The name of the module.
	 * @param {String} cnm The name of the component.
	 * @method get
	 * @return {Object}
	 * @static
	 */
	CSS.get = function(mnm, cnm){
		var t = A.Env.css;
		
		if (t[mnm] && t[mnm][cnm]){
			return t[mnm][cnm];
		}
		return null;
	};
	
	CSS.add = function(seed, mnm, cnm, cfg){
		
		if (!L.isString(seed)){ return; }
		
		var cfg = {
				'modName': CONF.defModName,
				'compName': CONF.defCompName
			},
			args = SLICE.call(arguments, 0),
			aln = args.length,
			css = A.Env.css;
		
		var source = L.trim(args[0]);
		
		if (source.indexOf('#') === 0){
			var el = document.getElementById(source.substring(1));
			if (!el){
				source = "";
			}else{
				source = el.innerHTML;
			}
			seed = source;
		}
		
		if (aln >= 3){
			cfg = Y.merge(cfg, {
				'modName': args[1],
				'compName': args[2]
			});
		}
		
		mnm = cfg.modName;
		cnm = cfg.compName;			

		var cssm = css[mnm] || (css[mnm] = {});
		cssm[cnm] = seed;
		
		return seed;
	};
	
	CSS.apply = function(mnm, cnm){
		var css = CSS.get(mnm, cnm);
		if (!L.isValue(css)){ return null; }
		
		if (CSS.disable){ return; }

		var style = document.createElement('style');
		style['type'] = 'text/css';
		
		if (style.styleSheet){ // IE
			style.styleSheet.cssText = css;
		}else{
			var tt1 = document.createTextNode(css);
			style.appendChild(tt1);
		}
		
		var hh1 = document.getElementsByTagName('head')[0];
		hh1.appendChild(style);
	};
	
	/**
	 * The Template class manages template elements
	 * 
	 * @class Template
	 * @static
	 */

	var T = A.Template = {};
	
	/**
	 * Get templates of a specific component.
	 * @param {String} mnm The name of the module.
	 * @param {String} cnm The name of the component.
	 * @method get
	 * @return {Object}
	 * @static
	 */
	T.get = function(mnm, cnm){
		
		var args = SLICE.call(arguments, 0);
		if (L.isObject(args[0])){
			var cfg = args[0];
			mnm = cfg.modName;
			cnm = cfg.compName;
		}
		mnm = mnm || CONF['defModName'];
		cnm = cnm || CONF['defCompName'];

		var t = A.Env.temps;
		
		if (t[mnm] && t[mnm][cnm]){
			return t[mnm][cnm];
		}
		return null;
	};
	
	T.parse = function(source){
		if (!L.isString(source)){ return {}; }
		
		var t = {},
			sre = '<!--{([a-zA-Z0-9_-]+)}-->',
			re = new RegExp(sre, 'g'),
			lre = new RegExp(sre),
			ma = source.match(re),
			i, lma, pos, tnm;
			
		for (i=ma.length-1;i>=0;i--){
			lma = ma[i].match(lre);
			tnm = lma[1];
			pos = source.indexOf(lma[0]);
			
			t[tnm] = source.substring(pos+lma[0].length);
			source = source.substring(0, pos-1);
		}
		return t;
	};
	
	// T.add(oSeed, sModName, sCompName)
	// T.add(sTElName, sTElBody, sModName, sCompName);
	// T.add(sSeed, sModName, sCompName)
	// T.add('#htmlElId', sModName, sCompName);
	T.add = function(){

		var args = SLICE.call(arguments, 0),
			alen = args.length, 
			mnm = CONF['defModName'], // module name 
			cnm = CONF['defCompName'], // component name
			seed,
			isSetMC = false;
		
		if (L.isObject(args[0])){ // T.add(oSeed, sModName, sCompName)
			isSetMC = alen == 3;
			seed = args[0];
		}else if (L.isString(args[0])){
			var source = L.trim(args[0]);
			
			if (source.indexOf('#') === 0){
				var el = document.getElementById(source.substring(1));
				if (!el){
					source = "";
				}else{
					source = el.innerHTML;
				}
			}
			
			if (alen==2 || alen==4){// T.add(sTElName, sTElBody, sModName, sCompName);
				isSetMC = alen == 4;

				
			}else if (alen==1 || alen==3){// T.add(sSeed, sModName, sCompName)
				isSetMC = alen == 3;
				
				seed = T.parse(source);
			}
		}
		
		if (isSetMC){
			mnm = args[alen-2];
			cnm = args[alen-1];
		}
		
		var t = A.Env.temps,
			tm = t[mnm] || (t[mnm] = {}),
			tmc = tm[cnm] || (tm[cnm] = {});

		if (L.isObject(seed)){
			// Template.add({...}, modName, compName)
			for (var tName in seed){
				
				if (!L.isString(seed[tName])){ continue; }
				
				tmc[tName] = seed[tName];
			}
		}else if (L.isString(seed)){
			
		}
		
		return T.get(mnm, cnm);
	};
	
	T.build = function(names, cfg){
		cfg = Y.merge({
			'modName': CONF.defModName,
			'compName': CONF.defCompName,
			'defTName': null
		}, cfg || {});
		
		var t = T.get(cfg);
		if (!L.isObject(t)){
			t = {};
		}
		
		names = L.isString(names) ? names : '';
		
		// cloning template elements
		var ct = {};
		if (names != ''){
			var arr = names.split(','), i, name, defTName = null;
			for (i=0;i<arr.length;i++){
				name = L.trim(arr[i]);
				
				if (!t[name]){ continue; }
				ct[name] = t[name];
				if (!defTName){
					defTName = name;
				}
			}
			if (!L.isValue(cfg['defTName'])){
				cfg['defTName'] = defTName;
			}
		}else{
			for (var name in t){
				ct[name] = t[name]; 
			}
		}
		
		var css = CSS.get(cfg.modName, cfg.compName);
		if (L.isValue(css) && !css._cssApplied){
			css._cssApplied = true;
			
			// applying CSS on the first call buildTemplate
			CSS.apply(cfg.modName, cfg.compName);
		}
	
		return new A.TemplateManager(ct, cfg);
	};
	
	var TemplateManager = function(t, cfg){
		
		t = t || {};
		
		cfg = Y.merge({
			'modName': null,
			'compName': null,
			'idPrefix': 'abricos_',
			'defTName': null
		}, cfg || {});
		
		this.init(t, cfg);
	};
	
	TemplateManager._counter = 1;
	
	TemplateManager.prototype = {
		init: function(t, cfg){
			this.cfg = cfg;
			
			// map unique identifiers in the template
			this.idMap = {};
			
			// fill identifiers language phrases
			var lngCfg = Y.merge(cfg);
			for (var name in t){
				if (!L.isValue(cfg['defTName'])){
					cfg['defTName'] = name;
				}
				lngCfg['tName'] = name;
				
				t[name] = LNG.fillText(t[name], lngCfg);
			}
			
			// create a map of unique identifiers in the template
			// Eexample: "<div id='{i#mydiv}'>...</div>" => (idMap[mydiv] = 'abricos_8462') 
			var exp = new RegExp("(\{i\#[a-z0-9_\-]+\})", "gi");
			for (var name in t){
				var s = t[name],
					arr = s.match(exp);
				
				if (!L.isArray(arr)) { continue; }
				
				var i, key, genid,
					tIdMap = this.idMap[name] = {};
				for (i=0;i<arr.length;i++){
					key = arr[i].replace(/\{i#([a-zA-Z0-9_\-]+)\}/, '$1');
					
					if (tIdMap[key]){ continue; }
					
					tIdMap[key] = genid = this.genid(name);
					
					t[name] = s = s.replace(new RegExp(arr[i], "gi"), genid);
				}
			}
			
			this.data = t;
		},
		genid: function(name){
			var cfg = this.cfg,
				id = cfg.idPrefix+name;

			if (L.isString(cfg.modName) && L.isString(cfg.compName)){
				id += '_'+cfg.modName.substring(0,3);
				id += '_'+cfg.compName.substring(0,3);
			}
			
			id += '_'+(TemplateManager._counter++);
			
			return id;
		},
		get: function(tnm){
			return (this.data[tnm] || "");
		},
		replace: function(tnm, o){
			var t = this.get(tnm),
				args = SLICE.call(arguments, 0);
			
			if (args.length > 2 && L.isString(args[1])){
				// Example: TM.replace('widget', 'myvar', 'Hello World!');
				var no = {};
				no[args[1]] = args[2];
				o = no;
			}
			
			if (!L.isObject(o)){ return t; }
			
			var exp;
			for (var nm in o){
				exp = new RegExp("\{v\#"+nm+"\}", "g");
				t = t.replace(exp, o[nm]);
			}
			
			return t;
		},
		
		// Get HTML element Id
		gelid: function(key){
			if (!L.isString(key)){ return null; }
			
			var tName = this.cfg['defTName'],
				a = key.split('.');
			
			if (!L.isString(tName)){ return null; }
			
			if (a.length > 1){
				var tnm = L.trim(a[0]);
				if (tnm.length > 0){
					tName = tnm;
				}
				key = a[1];
			}
			var ta = this.idMap[tName];
			if (!ta){ return null; }
			
			return ta[key] || null;
		},
		
		// Get HTML element
		gel: function(key){
			var id = this.gelid(key);
			if (!L.isValue(id)){ return null; }
			
			var el = document.getElementById(id);
			
			return el || null;
		}
	};
	A.TemplateManager = TemplateManager;

	
	var Component = function(cfg){
		cfg = Y.merge({
			'entryPoint': null
		}, cfg || {});
		
		this.init(cfg);
	};
	Component.prototype = {
		init: function(cfg){
		
			this.moduleName = cfg['modName'];
			
			this.name = cfg['compName'];
			
			this.entryPoint = cfg['entryPoint'];
			
			this.namespace = A.mod[this.moduleName] || (A.mod[this.moduleName] = {});
			
			this.template = new A.ComponentTemplate(this);
			
			this.language = new A.ComponentLanguage(this);

			// TODO: necessary to implement
			this.requires = {};
		}
	};
	A.Component = Component;
	
	var ComponentTemplate = function(component){
		this.init(component);
	};
	ComponentTemplate.prototype = {
		init: function(component){
			this.component = component;
		},
		getItems: function(){
			var comp = this.component,
				ts = T.get(comp.moduleName, comp.name);
			
			return L.isValue ? ts : {};
		},
		get: function(name){
			var ts = this.getItems();
			return ts[name] || null; 
		},
		build: function(){
			var args = SLICE.call(arguments, 0),
				comp = this.component,
				mnm = comp.moduleName,
				cnm = comp.name,
				tNames = "";
			
			if (L.isObject(args[0])){
				// TODO: bind TM functions
				
				if (L.isString(args[1])){
					tNames = args[1];
				}
			}
			if (L.isString(args[0])){
				tNames = args[0];
			}
			
			return T.build(tNames, {
				'modName': mnm, 
				'compName': cnm 
			});
		}
	};
	A.ComponentTemplate = ComponentTemplate;
	
	var ComponentLanguage = function(component){
		this.init(component);
	};
	ComponentLanguage.prototype = {
		init: function(component){
			this.component = component;
		},
		get: function(key, cfg){
			var comp = this.component;
			
			return LNG.get('mod.'+comp.moduleName+'.'+comp.name+'.'+key);
		}
	};
	A.ComponentLanguage = ComponentLanguage;
	
    /**
     * The Abricos global namespace object
     * 
     * @class Abricos
     * @static
     */

	
	/**
	 * Determines if the component with the given name exists.
	 * 
	 * @param {String} mnm The name of the module.
	 * @param {String} cnm The name of the component.
	 * @return {Boolean} True if the component exists, false if not.
	 * @method exists
	 * @static
	 */
	A.exists = function(mnm, cnm){
		var mods = A.Env.mods;

		if (!mods[mnm]){ return false; }

		return !!(mods[mnm][cnm]);
	};

	var stackUse = [];
	
	A.use = function(){
        var args = SLICE.call(arguments, 0),
        	callback = args[args.length - 1];
        
        if (L.isFunction(callback)){
        	args.pop();
        }else{
        	callback = null;
        }

    	stackUse[stackUse.length] = [args, callback];

        if (!A._loading){
        	A._use();
        }
	};
	
	A._use = function(){
		if (stackUse.length == 0){ return; }

		var su = stackUse.pop(),	
			args = su[0],
			callback = su[1];

		if (L.isFunction(callback)){
			callback();
		}
		A._use();
	};

	
	var stackModsToInit = [];
	
	A.add = function(mnm, cnm, o){
		var mods = A.Env.mods;

		if (A.exists(mnm, cnm)){
			throw new Error("Component is already registered: module="+mnm+", component="+cnm);
		}
		
		var comp;

		if (o instanceof Component){
			comp = o;
		}else if (L.isFunction(o)){
			comp = new Component({
				'entryPoint': o
			});
		}else if (L.isObject(o)){
			comp = new Component(o);
		} else {
			return;
		}
		
		comp.moduleName = mnm;
		comp.name = cnm;
		
		var m = mods[mnm] || (mods[mnm] = {});
		m[cnm] = comp;

		stackModsToInit[stackModsToInit.length] = comp;

		if (!A._loading){
			A._add();
		}
	};
	
	A._add = function(){
		if (stackModsToInit.length == 0){ return; }
		
		var comp = stackModsToInit.pop();

		if (L.isFunction(comp.entryPoint)){
			
			var mnm = comp.moduleName, 
				NS = A.mod[mnm] || (A.mod[mnm] = {});
			
			comp.entryPoint(NS, comp);
		}
		A._add();
	};
	
	var onDOMReady = function(){
		A._loading = false;
		
		A._add();
		A._use();
	};
	
	(function() {
	    if (document.addEventListener) {
	        return document.addEventListener('DOMContentLoaded', onDOMReady, false);
	    }
	    window.attachEvent('onload', onDOMReady);
	}) ();
	
};


/* 
 * The minimum set of basic functions taken from the YUI library (http://yuilibrary.com/).
 * 
 * All of the features of this wonderful library, you can get a call using the line:
 * <script src="http://yui.yahooapis.com/3.14.0/build/yui/yui-min.js"></script>
 * 
 * YUI Library License:
 * 
 * Software License Agreement (BSD License)
 * ========================================
 * 
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * ----------------------------------------------------
 * 
 * Redistribution and use of this software in source and binary forms, with or
 * without modification, are permitted provided that the following conditions are
 * met:
 *   * Redistributions of source code must retain the above copyright notice, this
 *     list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright notice,
 *     this list of conditions and the following disclaimer in the documentation
 *     and/or other materials provided with the distribution.
 *   * Neither the name of Yahoo! Inc. nor the names of YUI's contributors may be
 *     used to endorse or promote products derived from this software without
 *     specific prior written permission of Yahoo! Inc.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

if (typeof YUI == 'undefined' || !YUI.Lang){
	
	var YUI = YUI || {};
	
(function(){	
	
	var Y = YUI;
	
	var hasOwn = Object.prototype.hasOwnProperty;
	
	
	/**
	Returns a new object containing all of the properties of all the supplied
	objects. The properties from later objects will overwrite those in earlier
	objects.
	
	Passing in a single object will create a shallow copy of it. For a deep copy,
	use `clone()`.
	
	@method merge
	@param {Object} objects* One or more objects to merge.
	@return {Object} A new merged object.
	**/
	Y.merge = function () {
	    var i      = 0,
	        len    = arguments.length,
	        result = {},
	        key,
	        obj;
	
	    for (; i < len; ++i) {
	        obj = arguments[i];
	
	        for (key in obj) {
	            if (hasOwn.call(obj, key)) {
	                result[key] = obj[key];
	            }
	        }
	    }
	
	    return result;
	};
	
	/**
	 * Provides core language utilites and extensions used throughout YUI.
	 *
	 * @class Lang
	 * @static
	 */

	var L = Y.Lang || (Y.Lang = {}),

		STRING_PROTO = String.prototype,
		TOSTRING     = Object.prototype.toString,
	
		TYPES = {
		    'undefined'        : 'undefined',
		    'number'           : 'number',
		    'boolean'          : 'boolean',
		    'string'           : 'string',
		    '[object Function]': 'function',
		    '[object RegExp]'  : 'regexp',
		    '[object Array]'   : 'array',
		    '[object Date]'    : 'date',
		    '[object Error]'   : 'error'
		},
	
		SUBREGEX         = /\{\s*([^|}]+?)\s*(?:\|([^}]*))?\s*\}/g,
	
		WHITESPACE       = "\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF",
		WHITESPACE_CLASS = "[\x09-\x0D\x20\xA0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+",
		TRIM_LEFT_REGEX  = new RegExp("^" + WHITESPACE_CLASS),
		TRIM_RIGHT_REGEX = new RegExp(WHITESPACE_CLASS + "$"),
		TRIMREGEX        = new RegExp(TRIM_LEFT_REGEX.source + "|" + TRIM_RIGHT_REGEX.source, "g"),
	
		NATIVE_FN_REGEX  = /\{\s*\[(?:native code|function)\]\s*\}/i;

	// -- Protected Methods --------------------------------------------------------

	/**
	Returns `true` if the given function appears to be implemented in native code,
	`false` otherwise. Will always return `false` -- even in ES5-capable browsers --
	if the `useNativeES5` YUI config option is set to `false`.

	This isn't guaranteed to be 100% accurate and won't work for anything other than
	functions, but it can be useful for determining whether a function like
	`Array.prototype.forEach` is native or a JS shim provided by another library.

	There's a great article by @kangax discussing certain flaws with this technique:
	<http://perfectionkills.com/detecting-built-in-host-methods/>

	While his points are valid, it's still possible to benefit from this function
	as long as it's used carefully and sparingly, and in such a way that false
	negatives have minimal consequences. It's used internally to avoid using
	potentially broken non-native ES5 shims that have been added to the page by
	other libraries.

	@method _isNative
	@param {Function} fn Function to test.
	@return {Boolean} `true` if _fn_ appears to be native, `false` otherwise.
	@static
	@protected
	@since 3.5.0
	**/
	L._isNative = function (fn) {
	    // return !!(Y.config.useNativeES5 && fn && NATIVE_FN_REGEX.test(fn));
		// Abricos changes
		return true;
	};

	// -- Public Methods -----------------------------------------------------------

	/**
	 * Determines whether or not the provided item is an array.
	 *
	 * Returns `false` for array-like collections such as the function `arguments`
	 * collection or `HTMLElement` collections. Use `Y.Array.test()` if you want to
	 * test for an array-like collection.
	 *
	 * @method isArray
	 * @param o The object to test.
	 * @return {boolean} true if o is an array.
	 * @static
	 */
	L.isArray = L._isNative(Array.isArray) ? Array.isArray : function (o) {
	    return L.type(o) === 'array';
	};

	/**
	 * Determines whether or not the provided item is a boolean.
	 * @method isBoolean
	 * @static
	 * @param o The object to test.
	 * @return {boolean} true if o is a boolean.
	 */
	L.isBoolean = function(o) {
	    return typeof o === 'boolean';
	};

	/**
	 * Determines whether or not the supplied item is a date instance.
	 * @method isDate
	 * @static
	 * @param o The object to test.
	 * @return {boolean} true if o is a date.
	 */
	L.isDate = function(o) {
	    return L.type(o) === 'date' && o.toString() !== 'Invalid Date' && !isNaN(o);
	};

	/**
	 * <p>
	 * Determines whether or not the provided item is a function.
	 * Note: Internet Explorer thinks certain functions are objects:
	 * </p>
	 *
	 * <pre>
	 * var obj = document.createElement("object");
	 * Y.Lang.isFunction(obj.getAttribute) // reports false in IE
	 * &nbsp;
	 * var input = document.createElement("input"); // append to body
	 * Y.Lang.isFunction(input.focus) // reports false in IE
	 * </pre>
	 *
	 * <p>
	 * You will have to implement additional tests if these functions
	 * matter to you.
	 * </p>
	 *
	 * @method isFunction
	 * @static
	 * @param o The object to test.
	 * @return {boolean} true if o is a function.
	 */
	L.isFunction = function(o) {
	    return L.type(o) === 'function';
	};

	/**
	 * Determines whether or not the provided item is null.
	 * @method isNull
	 * @static
	 * @param o The object to test.
	 * @return {boolean} true if o is null.
	 */
	L.isNull = function(o) {
	    return o === null;
	};

	/**
	 * Determines whether or not the provided item is a legal number.
	 * @method isNumber
	 * @static
	 * @param o The object to test.
	 * @return {boolean} true if o is a number.
	 */
	L.isNumber = function(o) {
	    return typeof o === 'number' && isFinite(o);
	};

	/**
	 * Determines whether or not the provided item is of type object
	 * or function. Note that arrays are also objects, so
	 * <code>Y.Lang.isObject([]) === true</code>.
	 * @method isObject
	 * @static
	 * @param o The object to test.
	 * @param failfn {boolean} fail if the input is a function.
	 * @return {boolean} true if o is an object.
	 * @see isPlainObject
	 */
	L.isObject = function(o, failfn) {
	    var t = typeof o;
	    return (o && (t === 'object' ||
	        (!failfn && (t === 'function' || L.isFunction(o))))) || false;
	};

	/**
	 * Determines whether or not the provided value is a regexp.
	 * @method isRegExp
	 * @static
	 * @param value The value or object to test.
	 * @return {boolean} true if value is a regexp.
	 */
	L.isRegExp = function(value) {
	    return L.type(value) === 'regexp';
	};

	/**
	 * Determines whether or not the provided item is a string.
	 * @method isString
	 * @static
	 * @param o The object to test.
	 * @return {boolean} true if o is a string.
	 */
	L.isString = function(o) {
	    return typeof o === 'string';
	};

	/**
	 * Determines whether or not the provided item is undefined.
	 * @method isUndefined
	 * @static
	 * @param o The object to test.
	 * @return {boolean} true if o is undefined.
	 */
	L.isUndefined = function(o) {
	    return typeof o === 'undefined';
	};

	/**
	 * A convenience method for detecting a legitimate non-null value.
	 * Returns false for null/undefined/NaN, true for other values,
	 * including 0/false/''
	 * @method isValue
	 * @static
	 * @param o The item to test.
	 * @return {boolean} true if it is not null/undefined/NaN || false.
	 */
	L.isValue = function(o) {
	    var t = L.type(o);

	    switch (t) {
	        case 'number':
	            return isFinite(o);

	        case 'null': // fallthru
	        case 'undefined':
	            return false;

	        default:
	            return !!t;
	    }
	};

	/**
	 * Returns the current time in milliseconds.
	 *
	 * @method now
	 * @return {Number} Current time in milliseconds.
	 * @static
	 * @since 3.3.0
	 */
	L.now = Date.now || function () {
	    return new Date().getTime();
	};

	/**
	 * Performs `{placeholder}` substitution on a string. The object passed as the 
	 * second parameter provides values to replace the `{placeholder}`s.
	 * `{placeholder}` token names must match property names of the object. For example,
	 * 
	 *`var greeting = Y.Lang.sub("Hello, {who}!", { who: "World" });`
	 *
	 * `{placeholder}` tokens that are undefined on the object map will be left 
	 * in tact (leaving unsightly `{placeholder}`'s in the output string). 
	 *
	 * @method sub
	 * @param {string} s String to be modified.
	 * @param {object} o Object containing replacement values.
	 * @return {string} the substitute result.
	 * @static
	 * @since 3.2.0
	 */
	L.sub = function(s, o) {
	    return s.replace ? s.replace(SUBREGEX, function (match, key) {
	        return L.isUndefined(o[key]) ? match : o[key];
	    }) : s;
	};

	/**
	 * Returns a string without any leading or trailing whitespace.  If
	 * the input is not a string, the input will be returned untouched.
	 * @method trim
	 * @static
	 * @param s {string} the string to trim.
	 * @return {string} the trimmed string.
	 */
	L.trim = L._isNative(STRING_PROTO.trim) && !WHITESPACE.trim() ? function(s) {
	    return s && s.trim ? s.trim() : s;
	} : function (s) {
	    try {
	        return s.replace(TRIMREGEX, '');
	    } catch (e) {
	        return s;
	    }
	};

	/**
	 * Returns a string without any leading whitespace.
	 * @method trimLeft
	 * @static
	 * @param s {string} the string to trim.
	 * @return {string} the trimmed string.
	 */
	L.trimLeft = L._isNative(STRING_PROTO.trimLeft) && !WHITESPACE.trimLeft() ? function (s) {
	    return s.trimLeft();
	} : function (s) {
	    return s.replace(TRIM_LEFT_REGEX, '');
	};

	/**
	 * Returns a string without any trailing whitespace.
	 * @method trimRight
	 * @static
	 * @param s {string} the string to trim.
	 * @return {string} the trimmed string.
	 */
	L.trimRight = L._isNative(STRING_PROTO.trimRight) && !WHITESPACE.trimRight() ? function (s) {
	    return s.trimRight();
	} : function (s) {
	    return s.replace(TRIM_RIGHT_REGEX, '');
	};

	/**
	Returns one of the following strings, representing the type of the item passed
	in:

	 * "array"
	 * "boolean"
	 * "date"
	 * "error"
	 * "function"
	 * "null"
	 * "number"
	 * "object"
	 * "regexp"
	 * "string"
	 * "undefined"

	Known issues:

	 * `typeof HTMLElementCollection` returns function in Safari, but
	    `Y.Lang.type()` reports "object", which could be a good thing --
	    but it actually caused the logic in <code>Y.Lang.isObject</code> to fail.

	@method type
	@param o the item to test.
	@return {string} the detected type.
	@static
	**/
	L.type = function(o) {
	    return TYPES[typeof o] || TYPES[TOSTRING.call(o)] || (o ? 'object' : 'null');
	};
	
})();

}

_initAbricos();

