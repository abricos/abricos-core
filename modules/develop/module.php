<?php 
/**
 * Модуль Develop
 * 
 * @version $Id: module.php 96 2009-10-16 13:10:09Z roosit $
 * @package Abricos 
 * @subpackage Develop
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$mod = new CMSModDevelop();

CMSRegistry::$instance->modules->Register($mod);

class CMSModDevelop extends CMSModule {
	
	/**
	 * Конструктор
	 */
	public function __construct(){
		// Версия модуля
		$this->version = "0.1";
		
		// Название модуля
		$this->name = "develop";
	}

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

?>