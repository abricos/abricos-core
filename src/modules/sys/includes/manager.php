<?php
/**
 * Менеджер системного модуля
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Core
 * @link http://abricos.org
 * @copyright Copyright (C) 2012 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
class Ab_CoreSystemManager extends Ab_ModuleManager {
	
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
	
	private $_disableRoles = false;
	
	public function __construct(Ab_CoreSystemModule $module){
		parent::__construct($module);
		$this->module = $module;

		Ab_CoreSystemManager::$instance = $this;
	}
	
	public function DisableRoles(){
		$this->_disableRoles = true;
	}
	
	public function EnableRoles(){
		$this->_disableRoles = false;
	}
	
	public function IsRegister(){
		return Abricos::$user->id > 0;
	}
	
	public function IsAdminRole(){
		if ($this->_disableRoles){ return true; }
		return $this->IsRoleEnable(Ab_CoreSystemAction::ADMIN);
	}
	
	public function AJAX($d){
		switch($d->do){
		}
		return null;
	}
	
	private function SetConfig($name, $value){
		if (!$this->IsAdminRole()){ return; }
		$phrase = Ab_CorePhrase::GetInstance();
		$phrase->PreloadByModule('sys');
		$phrase->Set('sys', $name, $value);
		$phrase->Save();
	}
	
	private function GetConfig($name){
		$phrase = Ab_CorePhrase::GetInstance();
		$phrase->PreloadByModule('sys');
		return $phrase->Get('sys', $name);
	}
	
	/**
	 * Устноавить шаблон
	 * @param string $value имя шаблона (в папке /tt/)
	 */
	public function SetTemplate($value){
		if (!$this->IsAdminRole()){ return; }
		$this->SetConfig('style', $value);
	}
	
	public function GetTemplate(){
		return $this->GetConfig('style');
	}
	
	/**
	 * Установить название сайта (переменная в шаблоне site_name)
	 * @param string $value
	 */
	public function SetSiteName($value){
		if (!$this->IsAdminRole()){ return; }
		$this->SetConfig('site_name', $value);
	}
	public function GetSiteName(){
		return $this->GetConfig('site_name');
	}
	
	/**
	 * Установить краткое описание сайта (переменная в шаблоне site_title)
	 * @param string $value
	 */
	public function SetSiteTitle($value){
		if (!$this->IsAdminRole()){ return; }
		$this->SetConfig('site_title', $value);
	}
	public function GetSiteTitle(){
		return $this->GetConfig('site_title');
	}
	
	
	/**
	 * Получить список модулей
	 */
	public function ModuleList(){
		if (!$this->IsAdminRole()){ return null; }

        Abricos::$modules->RegisterAllModule();
		$modules = Abricos::$modules->GetModules();
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