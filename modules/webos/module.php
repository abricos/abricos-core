<?php 
/**
 * Модуль Webos
 * 
 * @version $Id: module.php 96 2009-10-16 13:10:09Z roosit $
 * @package Abricos 
 * @subpackage Webos
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$mod = new CMSModWebos();

CMSRegistry::$instance->modules->Register($mod);

class CMSModWebos extends CMSModule {
	
	/**
	 * Конструктор
	 */
	public function __construct(){
		// Версия модуля
		$this->version = "0.1dev";
		
		// Название модуля
		$this->name = "webos";
		
		// $this->takelink = "__super";
		$this->takelink = "webos";
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
	
	public function GetContentName(){
		if (!CMSModWebos::IsRegistred()){
			return "index_guest";
		}
		$cname = 'index';
		
		if ($this->registry->adress->level >= 1 && 
			$this->registry->adress->dir[0] == 'upload'){
			$cname = 'upload';
		}
		
		return $cname;
	}

}

?>