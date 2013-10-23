<?php
/**
 * Абстрактный класс модуля в платформе Абрикос
 * 
 * Структура модуля 
 * 
 * Модуль в платформе Абрикос — это самостоятельная сущность, со своим шаблоном, 
 * стилями css, картинками, серверными скриптами и прочими необходимыми для его 
 * работы компонентами. Все модули в платформе Абрикос располагаются в папке modules.
 * 
 * Главным файлом любого модуля в платформе является скрипт module.php, 
 * который должен находиться в корневой папке модуля. Когда ядро платформы просматривает 
 * доступные модули, то она смотрит именно этот файл.
 * 
 * @version $Id$
 * @package Abricos
 * @copyright Copyright (C) 2008-2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @example modules/example/module.php
 */
abstract class Ab_Module {
	
	/**
	 * Ошибка модуля. Если true, модуль не инициализируется в ядре
	 * @var boolean
	 */
	public $error = false;
	
	/**
	 * Политика безопасности модуля
	 * 
	 * @var Ab_UserPermission
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
	 * Наименование модуля латинскими буквами и цифрами
	 * 
	 * Используется в качестве уникального идентификатора модуля 
	 * в платформе Абрикос
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
	 * @var Abricos
	 */
	public $registry = null;
	
	/**
	 * Локализация - массив фраз
	 *
	 * @var mixed
	 */
	public $lang = array();
	
	/**
	 * CSS по умолчанию (имя файла в папке css модуля).
	 */
	public $defaultCSS = "";
	
	/**
	 * Список зависимых модулей и их версии
	 * Например: 
	 * <code>
	 * array(
	 *   'sys' => '0.5.5', 
	 *   'uprofile' => '0.1.2'
	 * );
	 * </code>
	 * Примечание: модуль 'core' является синонимом 'sys'
	 * @var array
	 */
	public $depends = array();

	/**
	 * Когда управление по формированию ответа сервера переходит модулю,
	 * происходит вызов этого метода, который должен вернуть имя
	 * контент файла (стартового кирпича).
	 *
	 * Стартовые кирпичи находяться в папке модуля content и содержат в себе
	 * всю необходимую информацию для формирования ответа.
	 *
	 * Если метод возвращает пустую строку, платформа выдает 404 ошибку.
	 *
	 * Если файл контент не найден, то платформа выдает 500 ошибку.
	 *
	 * @return string
	 */
	public function GetContentName(){
		return $this->registry->adress->contentName; 
	}
	
	/**
	 * Явно указать информацию о шаблоне, тем самым игнорируя шаблон 
	 * указанный в стартовом кирпиче.
	 * Для определения необходимо возвращать массив в формате:
	 * array(
	 *   'owner' => 'имя стиля',
	 *   'name' => 'имя шаблона'
	 * )
	 *  
	 * @return null || array 
	 */
	public function GetTemplate(){
		return null;
	}
	
	/**
	 * Получить менеджер модуля
	 * 
	 * Пример из модуля Example:
	 * <code>
	 * class ExampleModule extends Ab_Module {
	 * 	// экземпляр менеджера модуля
	 * 	private $_manager = null;
	 * 	...
	 * 	public function GetManager(){
	 * 		if (is_null($this->_manager)){
	 * 			require_once 'includes/manager.php';
	 * 			$this->_manager = new ExampleManager($this);
	 * 		}
	 * 		return $this->_manager;
	 * 	}
	 * 	...
	 * }
	 * </code>
	 * 
	 * @return Ab_ModuleManager
	 */
	public function GetManager(){
		return null;
	}
}

/**
 * Абстрактный класс менеджера модуля в платформе Абрикос
 * 
 * Все AJAX запросы и прочие функции внешнего взаимодействия 
 * с этим модулей поступают именно в этот класс.
 * 
 * Вызов и инициализацию менеджера необходимо осуществлять в
 * методе {@link Ab_Module::GetManager()}
 * 
 * @package Abricos
 * @example modules/example/includes/manager.php
 */
abstract class Ab_ModuleManager {
	
	/**
	 * Ядро
	 *
	 * @var Abricos
	 */
	public $core;
	
	/**
	 * База данных
	 *
	 * @var AbricosDatabase
	 */
	public $db;
	
	
	/**
	 * Пользователь
	 * 
	 * @var User
	 */
	public $user;
	
	/**
	 * Идентификатор пользователя
	 * 
	 * @var integer
	 */
	public $userid = 0;
	
	/**
	 * Модуль
	 * 
	 * @var Ab_Module
	 */
	public $module = null;
	
	public function __construct(Ab_Module $module){
		$this->module = $module;
		$this->core = $module->registry;
		$this->db = Abricos::$db;
		
		$this->user = Abricos::$user;
		$this->userid = Abricos::$user->id;
	}
	
	public function AJAX($data){
		return "";
	}
	
	/**
	 * Получить значение роли текущего пользователя в политики безопасиности модуля
	 * 
	 * Вызывает метод $this->module->permission->CheckAction($action)
	 * 
	 * @var integer идентификатор роли
	 * 
	 * @return integer -1 - запрещено, 0 - отсутсвует, 1 - разрешено 
	 */
	public function GetRoleValue($action){
		return $this->module->permission->CheckAction($action);
	}

	/**
	 * Разрешено ли действие @action текущего пользователя в политики безопасности модуля
	 * 
	 * @param integer $action идентификатор роли
	 * 
	 * @return boolean true действие разрешено
	 */
	public function IsRoleEnable($action){
		return $this->GetRoleValue($action) > 0;
	}
}


/**
 * Менеджер модулей в платформе Абрикос
 * 
 * @package Abricos
 * @subpackage Core
 */
class Ab_CoreModuleManager {
	
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
	 * @var Abricos
	 */
	public $registry = null;
	
	/**
	 * Менеджер БД
	 *
	 * @var AbricosDatabase
	 */
	public $db = null;
	
	public $currentMenuId = MENUID_ADMIN;
	
	/**
	 * Текущий модуль управления
	 *
	 * @var Ab_Module
	 */
	public $managesModule = null;
	
	public $checkManagesModule = false;
	
	/**
	 * Модуль в котором в данный момент идет обновление схемы БД
	 * 
	 * Оставлен для совместимости, необходимо использовать Ab_UpdateManager::$current
	 *
	 * @var Ab_UpdateManager
	 * @deprecated
	 * @ignore
	 */
	public $updateManager = null;
	
	private $_firstError = false;
	
	/**
	 * Конструктор
	 * 
	 * @ignore
	 * @param Abricos $registry ядро
	 */
	public function __construct($registry){
		$this->registry = $registry;
		$this->db = $registry->db;
	}
	
	/**
	 * Прочитать информации из БД по зарегистрированным модулям
	 */
	public function FetchModulesInfo(){
		$db = $this->db;
		$this->modulesInfo = array();
		$rows = Ab_CoreQuery::ModuleList($db);
		if ($db->IsError() && !$this->_firstError){ // возникла ошибка, вероятнее всего идет первый запуск движка
			$db->ClearError();
			Ab_CoreQuery::ModuleCreateTable($db);
			if (!$db->IsError()){ // таблица была создана успешно, значит можно регистрировать все модули
				$rows = Ab_CoreQuery::ModuleList($db);
			}else{ 
				// проблемы в настройках сайта или коннекта с БД
				die('<strong>Configuration</strong>: DataBase error<br />'.$db->errorText);
			}
		}
		$this->_firstError = true;
		
		$cfg = $this->registry->config["Takelink"];
		$adress = $this->registry->adress;
		$link = $adress->level === 0 ? "__super" : $adress->dir[0];
		$mainLink = null;
		if (!empty($cfg) && count($cfg) > 0 && !empty($link)){
			$cfglink = $cfg[$link];
			$modname = $cfglink["module"];
			$enmod = is_array($cfglink["enmod"]) > 0 ? $cfglink["enmod"] : array();
			while(($row = $this->db->fetch_array($rows))){
				$name = $row['name'];
				if ($name == $modname){
					$row["takelink"] = $link;
					$mainLink = $row;
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
			if (!is_null($mainLink)){
				foreach ($this->modulesInfo as &$row){
					if ($mainLink['name'] != $row['name'] && $mainLink['takelink'] == $row['takelink']){
						$row['takelink'] = '';
					}
				}
			}
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
	
	/**
	 * Зарегистрировать в ядре все модули
	 */
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
		$name = preg_replace("/[^0-9a-z\-_,\/\.]+/i", "", $name);
		return CWD."/modules/".$name."/module.php";
	}

	/**
	 * Регистрация модуля по имени
	 *
	 * @param string $moduleName
	 * @return Ab_Module
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
	
	private function LoadLanguage(Ab_Module $module, $languageid){
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
	 * @param Ab_Module $module
	 */
	public function Register(Ab_Module $module){
		$modName = $module->name; 
		if (empty($module)){ return; }

		$module->registry = $this->registry;
		
		if (!$this->LoadLanguage($module, LNG)){ // загрузка фраз языка
			if (LNG != 'ru'){ // загрузка не удалась, попытка загрузить русский язык по умолчанию
				$this->LoadLanguage($module, 'ru');
			}
		}

		/* зарегистрирован ли этот модуль в БД */
		$info = $this->modulesInfo[$modName];

		if (empty($info)){
			Ab_CoreQuery::ModuleAppend($this->db, $module);
			$this->FetchModulesInfo();
		}
		
		$info = $this->modulesInfo[$modName];
		
		$serverVersion = $info['version'];
		$newVersion = $module->version;
		
		require_once 'updatemanager.php';
		$cmp = Ab_UpdateManager::CompareVersion($serverVersion, $newVersion);

		
		if ($cmp == -1){ return; } // downgrade модуля запрещен
		
		$this->table[$modName] = &$module;
		
		if ($cmp == 0){ return; }
		
		Ab_UpdateManager::$current = new Ab_UpdateManager($module, $info);
		
		// TODO: удалить, оставлен для совместимости
		$this->updateManager = Ab_UpdateManager::$current;
		
		$shema = CWD."/modules/".$modName."/includes/shema.php";
		if (file_exists($shema)){
			require_once($shema);
		}
		Ab_CoreQuery::ModuleUpdateVersion($this->db, $module);
		$this->FetchModulesInfo();
		
		Ab_UpdateManager::$current = null;
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
	 * @return Ab_Module
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


/* * * * * * * * * * * Устаревшии версии классов * * * * * * * * * * * */

/**
 * Устарел, оставлен для совместимости
 * 
 * @package Abricos
 * @subpackage Deprecated
 * @deprecated устарел начиная с версии 0.5.5, необходимо использовать {@link AbricosAdress}
 * @ignore
 */
abstract class CMSModule extends Ab_Module {
}

/**
 * Устарел, оставлен для совместимости
 * 
 * @package Abricos
 * @subpackage Deprecated
 * @deprecated устарел начиная с версии 0.5.5, необходимо использовать {@link AbricosAdress}
 * @ignore
 */
class CMSModuleManager extends Ab_CoreModuleManager {
}

/**
 * Устарел, оставлен для совместимости
 * 
 * @package Abricos
 * @subpackage Deprecated
 * @deprecated устарел начиная с версии 0.5.5, необходимо использовать {@link Ab_ModuleManager}
 * @ignore
 */
abstract class ModuleManager extends Ab_ModuleManager {
	public function ModuleManager(Ab_Module $module){
		parent::__construct($module);
	}
}

