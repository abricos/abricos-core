/*
@version $Id$
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module User
 * @namespace Brick.mod.user.cp
 */

var Component = new Brick.Component();
Component.requires = {
    yahoo: ['connection','container','json','cookie'],
	mod:[
         {name: 'sys', files: ['container.js']},
         {name: 'user', files: ['permission.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var TMG = this.template,
		NS = this.namespace,
		API = NS.API;

	Brick.namespace('Brick.mod.user.cp');
	
(function(){
	
	var T = TMG.get('css', 'css').data;
	Brick.util.CSS.update(T['css']);
	delete T['css'];
	
})();

(function(){
	
	var TM = TMG.build('wrapwidget'),
		T = TM.data,
		TId = TM.idManager;
	
	var WrapWidget = function(container){
		container = container || 'bk_user_cp';
		container = L.isString(container) ? Dom.get(container) : container;
		
		if (L.isNull(container)){ return; }
		this.init(container);
	};
	WrapWidget.prototype = {
		init: function(container){
			container.innerHTML = T['wrapwidget'];
			this.widget = new NS.cp.Widget(TId['wrapwidget']['container']);
		}
	};
	
	NS.cp.WrapWidget = WrapWidget;
	
})();

(function(){
	
	var Widget = function(container){
		container = L.isString(container) ? Dom.get(container) : container;
		
		this.init(container);
	};
	
	Widget.prototype = {
		/**
		 * Текущий элемент меню
		 * 
		 * @property selectedMenuItem
		 * @type Brick.mod.user.cp.MenuItem
		 */
		selectedMenuItem: null,
		
		/**
		 * Ассоциативный массив страниц панели управления.
		 * 
		 * @property pages
		 * @type {String, Object}
		 */
		pages: null,
		
		init: function(container){
			
			var TM = this._TM = TMG.build('widget,miicon,menuitem'),
				T = this._T = TM.data,
				TId = this._TId = TM.idManager;
			
			this.selectedMenuItem = null;
			this.pages = {};
		
			var __self = this;
			container.innerHTML = T['widget'];
	
			E.on(container, 'click', function(e){ 
				if (__self.onClick(E.getTarget(e))){ 
					E.stopEvent(e);
				}
			});
			Brick.Permission.load(function(){
				__self.initMenu();
			});

		},
		
		initMenu: function(){
			var __self = this;
			var list = [];
			// сформировать список модулей имеющих компонент 'cp' в наличие
			for (var m in Brick.Modules){
				if (Brick.componentExists(m, 'cp') && !Brick.componentLoaded(m, 'cp')){
					list[list.length] = {name: m, files:['cp.js']};
				}
			}
			if (list.length > 0){
				Brick.Loader.add({ 
					mod: list,
					onSuccess: function() { 
						__self.renderMenu(); 
					}
				});
			}else{
				this.renderMenu(); 
			}
		},
		
		el: function(name){ return Dom.get(this._TId['widget'][name]); },
		
		onClick: function(el){
			var mid = el.id.replace(this._TId['menuitem']['id']+"-", "");
			
			var menuItem = MenuManager.each(function(item){
				if (item.getId() == mid){ return true; }
			});
			
			if (!L.isNull(menuItem)){
				this.selectMenuItem(menuItem.getId());
				return true;
			}
			return false;
		},
		buildMenuItem: function(item){
			return {
				'css': this._TM.replace('miicon', {
					'id': item.getId(),
					'url': item.icon
				}),
				'html': this._TM.replace('menuitem', {
					'id': item.getId(),
					'tl': item.getTitle(),
					'child': ''
				})
			};
		},
		renderMenu: function(){
			var __self = this;
			var lst = "", iconcss = "", firstmod;
			NS.cp.MenuManager.each(function(item){
				if (!firstmod) firstmod = item.getId();
				
				var bb = __self.buildMenuItem(item); 
				
				lst += bb['html'];
				iconcss += bb['css'];
			});
			
			Brick.util.CSS.update(iconcss);
			
			var menu = this._TM.getEl('widget.mainmenu');
			menu.innerHTML = lst;
			
			var cookiesave = YAHOO.util.Cookie.get("cp_menuitem") || '';
			var selItem = NS.cp.MenuManager.getById(cookiesave) || MenuManager.getFirst();
			if (!L.isNull(selItem)){
				this.selectMenuItem(selItem.getId());
			}
		},
		/**
		 * Выбрать элемент меню
		 * 
		 * @method selectMenuItem
		 * @param {String} id Идентификатор элемента меню
		 */
		selectMenuItem: function(id){
			var __self = this;
			
			var waitsh = function(show){
				__self.el('wait').style.display = show ? '' : 'none';
			};
			
			waitsh(false);

			var item = MenuManager.getById(id);
			if (L.isNull(item)){ return; }
			if (!L.isNull(this.selectedMenuItem) && this.selectedMenuItem.getId() == id){
				return;
			}

			if (!L.isNull(this.selectedMenuItem)){
				this.pages[this.selectedMenuItem.getId()].style.display = 'none';
			}
			this.selectedMenuItem = item;

			this.el('contname').innerHTML = item.getTitle();
			
			if (this.pages[id]){
				this.pages[id].style.display = 'block';
			}else{
				var div = document.createElement('div');
				div.id = Dom.generateId();
				this.pages[id] = div;
				this.el('modbody').appendChild(div);

				waitsh(true);
				item.fireEntryPoint(div, function(){
					waitsh(false);
				});
			}
			
			var d = new Date();
			d.setDate(d.getDate()+30);
			YAHOO.util.Cookie.remove("cp_menuitem"); 
			YAHOO.util.Cookie.set("cp_menuitem", id, { path: "/user", expires: d }); 

		}
	};
	
	NS.cp.Widget = Widget;
	
})();

	/**
	 * Элемент меню панели управления
	 * 
	 * @class MenuItem
	 * @constructor
	 * @param {String} moduleName Имя модуля
	 * @param {String} name (optional) Имя элемента меню
	 */
	var MenuItem = function(moduleName, name){
		
		name = name || moduleName;
		
		/**
		 * Имя модуля.
		 * @property moduleName
		 * @type String
		 */
		this.moduleName = moduleName;
		
		/**
		 * Имя элемента меню, в роли идентификатора
		 * @property name
		 * @type String
		 * @default <i>moduleName</i>
		 */
		this.name = name;
		
		/**
		 * Надпись элемента меню.
		 * @property title
		 * @type String
		 */
		this.title = '';
		
		/**
		 * Идентификатор надписи в менеджере фраз. Например: "mod.user.cp.title"
		 * @property titleId
		 * @type String
		 * @default mod.<i>moduleName</i>.cp.title
		 */
		this.titleId = "mod."+moduleName+'.cp.title';
		
		/**
		 * Путь к иконке
		 * @property icon
		 * @type String
		 * @default modules/user/css/images/cp_icon_default.gif
		 */
		this.icon = "";
		
		/**
		 * Компонент этого модуля, который должен быть загружен, 
		 * когда будет клик по элементу меню.<br>
		 * Установите значение пустым, если подгрузка компонента ненужна.  
		 * @property entryComponent
		 * @type String
		 */
		this.entryComponent = '';
		
		/**
		 * Точка входа (функция), которая будет выполнена по клику элемента меню. 
		 * @property entryPoint
		 * @type String | Function
		 */
		this.entryPoint = null;
		
		/**
		 * Получить надпись.
		 * 
		 * @method getTitle
		 * @return {String}  
		 */
		this.getTitle = function(){
			var phrase = Brick.util.Language.getc(this.titleId);
			if (L.isString(phrase)){
				return phrase;
			}
			return this.title != '' ? this.title : this.name; 
		};
		
		/**
		 * Получить идентификатор. 
		 * 
		 * @method getId
		 * @return {String}  
		 */
		this.getId = function(){
			return this.moduleName+'_'+this.name;
		};
		
		/**
		 * Пользователь выбрал пункт меню, необходимо выполнить 
		 * функцию указанную в entryPoint. Если указан entryComponent,
		 * то необходимо его подгрузить перед выполнением функции.
		 * 
		 * @method fireEntryPoint
		 * @param {Object} container HTML элемент - контейнер, будет 
		 * указан в параметрах функции entryPoint
		 * @param {Function} callback выполнить функцию, когда все необходимые элементы 
		 * будут загружены
		 */
		this.fireEntryPoint = function(container, callback){
			
			var __self = this;
			
			var fire = function(){
				var fn;
				if (L.isFunction(__self.entryPoint)){
					fn = __self.entryPoint;
				}else{
					fn = Brick.convertToObject(__self.entryPoint); 
				}
				if (L.isFunction(callback)){
					callback();
				}
				fn(container);
			};
			
			if (this.entryComponent != ''){
				if (!Brick.componentLoaded(this.moduleName, this.entryComponent)){
					Brick.Component.API.fireFunction(this.moduleName, this.entryComponent, function(){
						fire();
					});
				}else{
					fire();
				}
			}else{
				fire();
			}
		};
	};
	NS.cp.MenuItem = MenuItem;
	
	/**
	 * Менеджер модулей панели управления
	 * 
	 * @class MenuManager
	 * @static
	 */
	var MenuManager = new (function(){
		
		var items = [];
		
		var __self = this;

		// сортировка элементов меню по надписи
		var sort = function(){
			var keysort = function(a, b){
			    var anew = a.toLowerCase();
			    var bnew = b.toLowerCase();
			    if (anew < bnew) return -1;
			    if (anew > bnew) return 1;
			    return 0;
			};
			var arr = [];
			for (var i=0;i<items.length;i++){
				arr[arr.length] = items[i].getTitle()+'::'+items[i].getId();
			}
			arr.sort(keysort);
			var nitems = [];
			for (var i=0;i<arr.length;i++){
				var id = arr[i].split('::')[1];
				nitems[nitems.length] = __self.getById(id); 
			}
			items = nitems;
		};
		

		/**
		 * Добавить элемент меню
		 * 
		 * @method add
		 * @static
		 * @param {String} menuItem Элемент меню
		 */
		this.add = function(menuItem){
			items[items.length] = menuItem;
			sort();
		};
		
		/**
		 * Получить элемент меню по идентификатору
		 * 
		 * @method getById
		 * @static
		 * @param {String} menuItemId Идентификатор элемента меню
		 */
		this.getById = function(menuItemId){
			for (var i=0;i<items.length;i++){
				if (items[i].getId() == menuItemId){
					return items[i];
				}
			}
			return null;
		};

		/**
		 * Выбрать элементы меню из коллекции.
		 * Останавливает перебор в коллекции и возвращает элемент, если функция 
		 * обработчик вернула True, иначе возвращает null.
		 * 
		 * @method each
		 * @static
		 * @param {Function} func Функция обработчик элемента 
		 * @return {Brick.mod.user.cp.MenuItem} Возвращает элемент меню,
		 * на котором функция обработчик вернула True. 
		 */
		this.each = function(func){
			for (var i=0;i<items.length;i++){
				if (func(items[i])){
					return items[i];
				}
			}
			return null;
		};
		
		/**
		 * Вернуть первый элемент меню
		 * 
		 * @method getFirst
		 * @static
		 * @return {Brick.mod.user.cp.MenuItem} Элемент меню
		 */
		this.getFirst = function(){
			if (items.length == 0){ return null; }
			return items[0];
		};

	});
	
	NS.cp.MenuManager = MenuManager;
};
