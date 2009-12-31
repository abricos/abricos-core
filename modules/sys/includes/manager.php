<?php
/**
 * @version $Id: manager.php 270 2009-12-28 13:24:34Z roosit $
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
class SysManager {
	
	/**
	 * Ядро
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	/**
	 * Сессия пользователя
	 *
	 * @var CMSSysSession
	 */
	public $session = null;
	
	/**
	 * База данных
	 *
	 * @var CMSDatabase
	 */
	public $db = null;
	
	/**
	 * Модуль
	 * 
	 * @var CMSModuleSys
	 */
	public $module = null;
	
	public $user = null;
	
	public function SysManager(CMSModuleSys $module){
		$this->module = $module;
		$this->registry = $module->registry;
		$this->session = $module->registry->session;
		$this->user = $this->session->userinfo;
		$this->db = $module->registry->db;
	}
	
	public function IsRegister(){
		return $this->session->IsRegistred();
	}
	
	public function IsAdminRole(){
		return $this->session->IsAdminMode();
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