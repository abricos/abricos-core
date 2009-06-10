<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * Модуль
 */
abstract class CMSModule extends CMSBaseClass {
	
	/**
	 * Версия модуля
	 *
	 * @var string
	 */
	public $version = "0.0.0";
	
	/**
	 * Наименование - идентификатор модуля
	 *
	 * @var string
	 */
	public $name = "";
	
	/**
	 * Перехват линка модуля
	 *
	 * @var string
	 */
	public $takelink = "";
	
	/**
	 * Ядро
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	/**
	 * Массив фраз
	 *
	 * @var mixed
	 */
	public $lang = array();
	
	/**
	 * Получить имя кирпича данного модуля для сборки вывода
	 *
	 * @return unknown
	 */
	public function GetContentName(){
		return $this->registry->adress->contentName; 
	}
	
	public function GetBaseDir(){
		return CWD."/modules/".$this->name;
	}
}

class CMSModuleUpdShema extends CMSBaseClass {
	/**
	 * Текущий модуль управления
	 *
	 * @var CMSModule
	 */
	public $module;
	
	public $serverVersion;
	
	function __construct($module, $serverVersion){
		$this->module = $module;
		$this->serverVersion = $serverVersion;
	}
}

/**
 * Менеджер модулей
 *
 */
class CMSModuleManager extends CMSBaseClass {
	
	/**
	 * Массив зарегистрированных модулей
	 *
	 * @var array
	 */
	public $table = array();
	
	/**
	 * Модули зарегистрированные в БД
	 *
	 * @var array
	 */
	public $modulesInfo = array();
	
	/**
	 * Ядро движка
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	/**
	 * Менеджер БД
	 *
	 * @var CMSDatabase
	 */
	public $db = null;
	
	public $currentMenuId = MENUID_ADMIN;
	
	/**
	 * Текущий модуль управления
	 *
	 * @var CMSModule
	 */
	public $managesModule = null;
	
	public $checkManagesModule = false;
	
	/**
	 * Модуль в котором в данный момент идет обновление схемы БД
	 *
	 * @var CMSModuleUpdShema
	 */
	public $moduleUpdateShema = null;
	
	/**
	 * Конструктор
	 *
	 * @param CMSRegistry $cms
	 * @return CMSModuleManager
	 */
	public function __construct($registry){
		$this->registry = $registry;
		$this->db = $registry->db;
	}
	
	/**
	 * Чтение информации из БД по зарегистрированным модулям
	 *
	 */
	public function FetchModulesInfo(){
		$db = $this->db;
		$this->modulesInfo = array();
		$rows = CMSSqlQuery::ModulesInfo($db);
		
		if ($db->IsError()){ // возникла ошибка, вероятнее всего идет первый запуск движка
			$db->ClearError();
			CMSSqlQuery::ModuleCreateTable($db);
			if (!$db->IsError()){ // таблица была создана успешно, значит можно регистрировать все модули
				$this->RegisterAllModule();
				$rows = CMSSqlQuery::ModulesInfo($db);
			}else{ 
				// проблемы в настройках сайта или коннекта с БД
				die('<strong>Configuration</strong>: DataBase error<br />'.$db->errorText);
			}
		}
		
		while(($row = $this->db->fetch_array($rows))){
			$name = $row['name'];
			$file = $this->GetModuleFileName($name);
			if (file_exists($file)){
				$this->modulesInfo[$name] = $row;
			}
		}
	}
	
	public function RegisterAllModule(){
		 
		// Регистрация всех имеющихся модулей в системе 
		$modRootDir = dir(CWD."/modules");
		while (false !== ($entry = $modRootDir->read())) {
			if ($entry == "." || $entry == ".." || empty($entry)){
				continue;
			}
			$modFile = CWD."/modules/".$entry."/module.php";
			if (!file_exists($modFile)){
				continue;
			}
			$this->RegisterByName($entry);
		}
	}
	
	function GetModuleFileName($name){
		return CWD."/modules/".$name."/module.php";
	}

	/**
	 * Регистрация модуля по имени
	 *
	 * @param string $moduleName
	 * @return CMSModule
	 */
	public function RegisterByName($name){
		$mod = $this->table[$name];
		
		if (empty($mod)){
			$file = $this->GetModuleFileName($name);
			if (!file_exists($file)){return null;}
			require_once($file);
			$mod = $this->table[$name];
		}
		return $mod;
	}
	
	private function LoadLanguage(CMSModule $module, $languageid){
		// загрузка языка
		$langfile = CWD."/modules/".$module->name."/language/".$languageid.".php";
		if (file_exists($langfile)){
			$arr = include($langfile);
			if (is_array($arr)){
				$module->lang = $arr;
				return true;
			}
		}
		return false;
	}
	
	/**
	 * Регистрация модуля.
	 *
	 * @param CMSModule $module
	 */
	public function Register(CMSModule $module){
		if (empty($module)){ return; }

		$module->registry = $this->registry;
		$this->table[$module->name] = &$module;
		
		if (!$this->LoadLanguage($module, LNG)){ // загрузка фраз языка
			if (LNG != 'ru'){ // загрузка не удалась, попытка загрузить русский язык по умолчанию
				$this->LoadLanguage($module, 'ru');
			}
		}

		/* зарегистрирован ли этот модуль в БД */
		$info = $this->modulesInfo[$module->name];

		if (empty($info)){
			CMSSqlQuery::ModuleAdd($this->db, $module);
			$this->FetchModulesInfo();
		}
		
		$info = $this->modulesInfo[$module->name];
		$svers = $info['version'];
		$cvers = $module->version;

		if (version_compare($svers, $cvers, "==")){return;}
		
		$shema = CWD."/modules/".$module->name."/includes/shema.php";
		if (file_exists($shema)){
			$this->moduleUpdateShema = new CMSModuleUpdShema($module, $svers);
			require_once($shema);
			$this->moduleUpdateShema = null;
		}
		CMSSqlQuery::ModuleUpdateVersion($this->db, $module);
	}
	
	/**
	 * Получить модуль 
	 *
	 * @param string $name - имя модуля
	 * @return CMSModule
	 */
	public function GetModule($name){
		if (empty($name)){
			return null;
		}
		$module = $this->table[$name];
		if (!empty($module)){
			return $module;
		}
		/* попытка зарегистрировать модуль */ 
		$this->RegisterByName($name);
		$module = $this->table[$name];
		return $module;
	}
	
	/**
	 * Получить список зарегистрированных модулей в ядре
	 */
	public function &GetModules(){
		return $this->table;
	}
}
?>