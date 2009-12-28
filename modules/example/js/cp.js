/*
@version $Id$
@package BrickCMS
@copyright Copyright (C) 2008 BrickCMS. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
/**
 * Регистрация модуля в панели управления
 * 
 * @module Example
 * @namespace Brick.mod.example
 */
(function(){
	
	// Если панель управления не инициализирована, то выход
	if (!Brick.objectExists('Brick.User.CP.Manager')){ return; }

	// Если пользователь не имеет права админа, то выход
	if (!Brick.env.user.isAdmin()){ return; }

	var wWait = Brick.widget.WindowWait;
	
	// Обьект-параметры JS компонента
	var module = {
		// Имя модуля
		name: 'example',

		// Идентификатор фразы (из файла langs/cp_ru.js)
		titleid: "mod.example.cp.title",
		
		// Метод инициализации. Будет выполнен когда пользователь кликнет на
		// "Разработка - примеры" в меню панели управления
		// @param container {Object} объект элемента Dom в котором будет отображен результат
		initialize: function(container){
		
			// Отобразить виджет "Загрузка"
			wWait.show();
			
			// Подгрузить необходимый JS компонент модуля example, по окончанию загрузки отобразить панель 
			Brick.Loader.add({
				mod:[{name: 'example', files: ['cp_manager.js']}],
				onSuccess: function() {

					// Скрыть виджет "Загрузка"
					wWait.hide();
					
					// Произвести инициализацию страницы в панели управления
					Brick.mod.example.CPanel.initialize(container);
				}
			});
		}
	};

	// Зарегистрировать JS компонент
	Brick.User.CP.Manager.register(module);

})();