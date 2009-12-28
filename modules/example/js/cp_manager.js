/**
* @version $Id$
* @package Abricos
* @copyright Copyright (C) 2008 Abricos All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * Статичный класс элемента страницы в панели управления
 *
 * @module Example
 * @class CPanel
 * @namespace Brick.mod.example
 * @static
 */
(function(){
	
	Brick.namespace('mod.example');

	var Dom, E, L, T, TId,
		wWait = Brick.widget.WindowWait,
		tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
		mod:[
		     {name: 'sys', files: ['data.js','container.js','form.js']},
		     {name: 'example', files: ['example1.js']}
		],
		onSuccess: function() {
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;

			T = Brick.util.Template['example']['cp_manager'];
			TId = new Brick.util.TIdManager(T);
		}
	});

	Brick.mod.example.CPanel = {
		
		/**
		 * Текущий открытый пример
		 * @type Object
		 */
		currentExample: null,
		
		/**
		 * Метод инициализации раздела "Разработка - примеры" в панели управления
		 * 
		 * @param container {Object} объект элемента Dom в котором будет отображен результат
		 */
		initialize: function(container){
			container.innerHTML = T['panel'];

			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ 
					E.stopEvent(e); 
				}
			});
		},
		
		/**
		 * Метод обработки события на клик по области страницы раздела в панели управления
		 * 
		 * @param el {Object} элемент по которому кликнули левой кнопкой мыши
		 */
		onClick: function(el){
			if (!L.isNull(this.currentExample) && this.currentExample.onClick(el)){
				return true;
			}
			switch (el.id){
			case TId['panel']['button1']:
				this.currentExample = new Brick.mod.example.Example1(Dom.get(TId['panel']['example']));
				return true;
			}
			return false;
		}
	};
	
})();
