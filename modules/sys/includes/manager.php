<?php
/**
 * Менеджер системного модуля
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Core
 * @link http://abricos.org
 * @copyright Copyright (C) 2008-2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
class Ab_CoreSystemManager extends Ab_ModuleManager {
	
	/**
	 * Ядро
	 *
	 * @var CMSRegistry
	 */
	public $registry;
	
	/**
	 * Модуль
	 * 
	 * @var Ab_CoreSystemModule
	 */
	public $module;
	
	/**
	 * @var Ab_CoreSystemManager
	 */
	public static $instance;
	
	public function __construct(Ab_CoreSystemModule $module){
		parent::__construct($module);
		$this->module = $module;
		$this->registry = $module->registry;
		
		Ab_CoreSystemManager::$instance = $this;
	}
	
	public function IsRegister(){
		return Abricos::$user->id > 0;
	}
	
	public function IsAdminRole(){
		return $this->IsRoleEnable(Ab_CoreSystemAction::ADMIN);
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