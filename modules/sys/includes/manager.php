<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage Sys
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

/**
 * Менеджер 
 * @package Abricos
 * @subpackage Sys
 */
class SystemManager {
	
	/**
	 * Ядро
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	/**
	 * База данных
	 *
	 * @var CMSDatabase
	 */
	public $db = null;
	
	/**
	 * Модуль
	 * 
	 * @var SystemModule
	 */
	public $module = null;
	
	public $user = null;
	
	public function SystemManager(SystemModule $module){
		$this->module = $module;
		$this->registry = $module->registry;
		$this->db = $module->registry->db;
		$this->user = $this->registry->user->info;
	}
	
	public function IsRegister(){
		return $this->registry->user->IsRegistred();
	}
	
	public function IsAdminRole(){
		return $this->registry->user->IsAdminMode();
	}

	/**
	 * Получить список модулей
	 */
	public function ModuleList(){
		if (!$this->IsAdminRole()){ return null; }
		
		$this->registry->modules->RegisterAllModule();
		$modules = $this->registry->modules->GetModules();
		$ret = array();
		foreach ($modules as $name => $mod){
			if ($name == 'user' || $name == 'ajax'){ continue; }
			array_push($ret, array(
				"id" => $name,
				"nm" => $name,
				"vs" => $mod->version,
				"rv" => $mod->revision
			));
		}
		return $ret;
	}
}

?>