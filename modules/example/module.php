<?php 
/**
 * Демонстрационный модуль
 * 
 * @version $Id$
 * @package Abricos 
 * @subpackage Example
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

// Создание экземпляра модуля
$mod = new CMSModExample();

// Регистрация экземпляра модуля в ядре.
CMSRegistry::$instance->modules->Register($mod);

/**
 * Модуль Example
 * @package Abricos 
 * @subpackage Example
 */
class CMSModExample extends CMSModule {
	
	/**
	 * Конструктор
	 */
	public function __construct(){
		// Версия модуля
		$this->version = "1.0.0";
		
		// Название модуля
		$this->name = "example";
		
		// Линк-перехватчик. Определяет, по какому идентификатору модулю передается упарвление.
		// В данном случае при запросе http://mysite.com/example/ данный модуль возьмет 
		// управление на себя
		$this->takelink = "example";
		
	}

	// * * * * * * * Статичные функции * * * * * * * //
	
	// * * * * * * * Права пользователя * * * * * * * //
	
	/**
	 * Является ли пользователь Администратором
	 * 
	 * @return boolean
	 */
	public static function IsAdmin(){
		return CMSRegistry::$instance->session->IsAdminMode();
	}
	
	/**
	 * Является ли пользователь зарегистрированным
	 * 
	 * @return boolean
	 */  
	public static function IsRegistred(){
		return CMSRegistry::$instance->session->IsRegistred();
	}

}

/**
 * Запросы к БД (статичные функции)
 * @package Abricos
 * @subpackage Example
 */
class CMSQExample {
	
	
}


?>