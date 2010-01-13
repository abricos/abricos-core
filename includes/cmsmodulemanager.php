<?php
/**
* @version $Id$
* @package Abricos
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * Модуль
 */
abstract class CMSModule {
	
	/**
	 * Политика безопасности
	 * 
	 * @var CMSPermission
	 */
	public $permission = null;
	
	/**
	 * Версия модуля
	 *
	 * @var string
	 */
	public $version = "0.0";
	
	/**
	 * Ревизия модуля
	 * 
	 * @var string
	 */
	public $revision = "";
	
	/**
	 * Наименование - идентификатор модуля
	 *
	 * @var string
	 */
	public $name = "";
	
	/**
	 * Перехват линка модуля. 
	 * Если имеет значение "__super", то модуль берет на себя
	 * управление с главной страницы. 
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
	 * CSS по умолчанию (имя файла в папке css модуля).
	 */
	public $defaultCSS = "";
	
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

/**
 * Менеджер обновления модуля
 */
class CMSUpdateManager {
	
	/**
	 * Текущий модуль
	 *
	 * @var CMSModule
	 */
	public $module;
	
	/**
	 * Версия сервера
	 * 
	 * @var string
	 */
	public $serverVersion;
	
	public $modinfo;
	
	public function CMSUpdateManager($module, $info){
		$this->module = $module;
		$this->modinfo = $info;
		$this->serverVersion = $info['version'];
	}
	
	/**
	 * Является ли модуль новым в данной системе
	 * 
	 * @return Boolean
	 */
	public function isInstall(){
		$aSV = $this->ParseVersion($this->serverVersion);
		$cnt = count($aSV);
		for ($i=0;$i<$cnt;$i++){
			if ($aSV[$i]>0){
				return false;
			}
		}
		return true;
	}
	
	/**
	 * Является ли запрашиваемая версия больше версии модуля на сервере. 
	 *  
	 * @param string $version
	 * @return Boolean
	 */
	public function isUpdate($newVersion){
		$aSV = $this->ParseVersion($this->serverVersion);
		$aNV = $this->ParseVersion($newVersion);
		$cnt = count($aSV);
		for ($i=0;$i<$cnt;$i++){
			if ($aNV[$i] > $aSV[$i]){
				return true;
			}
		}
		return false;
	}
	
	private function ParseVersion($version){
		$arr = explode(".", $version);
		$retarr = array();
		foreach ($arr as $s){
			array_push($retarr, $this->str2int($s));
		}
		$count = count($retarr);
		for ($i=$count;$i<7;$i++){
			array_push($retarr, 0);
		}
		return $retarr;
	}
	
	private function str2int($string, $concat = true) {
		$length = strlen($string);   
		for ($i = 0, $int = '', $concat_flag = true; $i < $length; $i++) {
			if (is_numeric($string[$i]) && $concat_flag) {
				$int .= $string[$i];
			} elseif(!$concat && $concat_flag && strlen($int) > 0) {
				$concat_flag = false;
			}       
		}
		return (int) $int;
	}
}

/**
 * Менеджер модулей
 *
 */
class CMSModuleManager {
	
	/**
	 * Массив зарегистрированных модулей
	 *
	 * @var array
	 */
	public $table = array();
	
	/**
	 * Пользовательская настройка работы модулей (из config.php)
	 *  
	 * @var boolean
	 */
	public $customTakelink = false;
	
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
	 * @var CMSUpdateManager
	 */
	public $updateManager = null;
	
	/**
	 * Конструктор
	 *
	 * @param CMSRegistry $cms
	 * @return CMSModuleManager
	 */
	public function CMSModuleManager($registry){
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
				$rows = CMSSqlQuery::ModulesInfo($db);
			}else{ 
				// проблемы в настройках сайта или коннекта с БД
				die('<strong>Configuration</strong>: DataBase error<br />'.$db->errorText);
			}
		}
		
		$cfg = $this->registry->config["Takelink"];
		$adress = $this->registry->adress;
		$link = $adress->level === 0 ? "__super" : $adress->dir[0];
		if (!empty($cfg) && count($cfg) > 0 && !empty($link)){
			$cfglink = $cfg[$link];
			$modname = $cfglink["module"];
			$enmod = is_array($cfglink["enmod"]) > 0 ? $cfglink["enmod"] : array();
			// print_r($enmod); exit; 
			while(($row = $this->db->fetch_array($rows))){
				$name = $row['name'];
				if ($name == $modname){
					$row["takelink"] = $link;
				}
				if ($name != "sys" && $name != "ajax" && $name != "user"
					&& count($enmod) > 0 && $modname != $name){
					$find = false;
					foreach ($enmod as $key){
						if ($key == $name){
							$find = true;
							break;
						}
					}
					if (!$find){
						continue;
					}
				}
				$file = $this->GetModuleFileName($name);
				if (file_exists($file)){
					$this->modulesInfo[$name] = $row;
				}
			}
			$this->customTakelink = true;
		}else{
			while(($row = $this->db->fetch_array($rows))){
				$name = $row['name'];
				$file = $this->GetModuleFileName($name);
				if (file_exists($file)){
					$this->modulesInfo[$name] = $row;
				}
			}
		}
	}
	
	public function RegisterAllModule(){
		// первым регистрируется системный модуль
		$this->RegisterByName('sys');
		
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
			if (!empty($mod)){
				// добавить ревизию если есть
				if ($name == 'sys'){
					$revision = CWD."/revision";
				}else{
					$revision = CWD."/modules/".$name."/revision";
				}
				if (file_exists($revision)){
					$rev = file_get_contents($revision);
					$mod->revision = intval($rev); 
				}
			}
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
		
		$serverVersion = $info['version'];
		$newVersion = $module->version;
		
		if ($serverVersion == $newVersion){ return; }
		
		$this->updateManager = new CMSUpdateManager($module, $info);
		
		$shema = CWD."/modules/".$module->name."/includes/shema.php";
		if (file_exists($shema)){
			require_once($shema);
		}
		CMSSqlQuery::ModuleUpdateVersion($this->db, $module);

		$this->updateManager = null;
		// Удалить временные файлы
		$chFiles = globa(CWD."/temp/*.gz");
		foreach ($chFiles as $rfile){
			@unlink($rfile);
		}
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