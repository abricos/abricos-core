<?php
/**
 * Ядро платформы Абрикос
 * 
 * Содержит в себе все необходимые объекты и методы для полноценного 
 * взаимодействия с платформой
 * 
 * @version $Id$
 * @package Abricos
 * @link http://abricos.org
 * @copyright Copyright (C) 2008-2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
*/
final class Abricos {
	
	/**
	 * Экземпляр ядра
	 * 
	 * @var CMSRegistry
	 * @deprecated
	 */
	public static $instance = null;
	
	/**
	 * Стандартизированный адрес URI
	 *
	 * @var Ab_URI
	 */
	public static $adress;
	
	/**
	 * Текущий пользователь
	 * 
	 * @var User
	 */
	public static $user;	
	
	/**
	 * Обработчик глобальных переменных GET, POST..
	 *
	 * @var Ab_CoreInputCleaner
	 */
	public static $inputCleaner;
	
	/**
	 * База данных
	 * 
	 * @var Ab_Database
	 */
	public static $db;
	
	/**
	 * Настройки из файла /includes/config.php
	 * 
	 * @example includes/config.example.php
	 * @var array
	 */
	public static $config;
	
	private static $_notification = null;
	
	/**
	 * Менеджер доставки сообщений пользователям
	 *
	 * @return Ab_Notification
	 */
	public static function Notify(){
		if(!is_null(Abricos::$_notification)){
			return Abricos::$_notification;
		}
		$modNotify = Abricos::GetModule('notify');
		if (empty($modNotify)){
			Abricos::$_notification = new Ab_Notification();
		}else{
			Abricos::$_notification = $modNotify->GetManager();
		}
		return Abricos::$_notification;
	}
	
	
	/**
	 * Обработать глобальную переменную для безопасного использования 
	 * 
	 * @see Ab_CoreInputCleaner::clean_gpc()
	 * @param string $source Тип глобальной переменной g, p, c, r or f (соответственно GET, POST, COOKIE, REQUEST и FILES)
	 * @param string $varname Имя переменной
	 * @param integer $vartype Тип переменной
	 * @return mixed
	 */
	public static function CleanGPC($source, $varname, $vartype = TYPE_NOCLEAN){
		return Abricos::$inputCleaner->clean_gpc($source, $varname, $vartype);
	}
	
	/**
	 * Зарегистрировать модуль в платформе
	 *
	 * @see Ab_CoreModuleManager::Register()
	 * @param Ab_Module $module Экземпляр класса модуля
	 */
	public static function ModuleRegister(Ab_Module $module){
		CMSRegistry::$instance->modules->Register($module);
	}
	
	/**
	 * Получить экземпляр модуля по его имени
	 *
	 * @see Ab_CoreModuleManager::GetModule()
	 * @param string $modname имя модуля
	 * @return Ab_Module зарегистрированный модуль в платформе 
	 */
	public static function GetModule($modname){
		return CMSRegistry::$instance->modules->GetModule($modname);
	}
	
	/**
	 * Получить менеджер модуля
	 * 
	 * @param string $modname имя модуля
	 * @return Ab_ModuleManager менеджер модуля 
	 */
	public static function GetModuleManager($modname){
		$module = Abricos::GetModule($modname);
		if (empty($module)){ return null; }
		return $module->GetManager();
	}

	/**
	 * Парсер текста поступившего от пользователя (комментарии и т.п.)
	 * @return Ab_UserText 
	 */
	public static function TextParser($fullerase = false){
		require_once ('usertext.php');
		return new Ab_UserText($fullerase);
	}
}

/**
 * Устарел, оставлен для совместимости
 * 
 * @package Abricos
 * @subpackage Deprecated
 * @deprecated устарел начиная с версии 0.5.5, необходимо использовать {@link Ab_CoreCustomBrickManager}
 * @ignore
 */
class CMSRegistry {

	/**
	 * Экземляр ядра
	 *
	 * @var CMSRegistry
	 */
	public static $instance;
	
	/**
	 * Статус собираемой странички
	 * 
	 * @var string
	 */
	public $pageStatus = PAGESTATUS_OK;
	
	/**
	 * Обработчик глобальны переменных GET, POST..
	 *
	 * @var Ab_CoreInputCleaner
	 */
	public $input;
	
	/**
	 * Настройки из файла /includes/config.php
	 * 
	 * @example includes/config.example.php
	 * @var array
	 */
	public $config;
	
	/**
	 * Менеджер работы с БД
	 *
	 * @var Ab_Database
	 */
	public $db;
	
	/**
	 * Менеджер модулей
	 *
	 * @var Ab_CoreModuleManager
	 */
	public $modules;
	
	/**
	 * Стандартизированный адрес URI
	 *
	 * @var Ab_URI
	 */
	public $adress;
	
	/**
	 * Системный модуль
	 * 
	 * @var Ab_CoreSystemModule
	 */
	public $system;
	
	/**
	 * Модуль пользователя
	 * 
	 * @var User
	 */
	public $user;
	
	private $json = null;
	
	/**
	 * Конструктор
	 *
	 * @ignore
	 */
	public function __construct(){
		CMSRegistry::$instance = $this;
		Abricos::$instance = $this;
		
		$this->adress = new Ab_URI(Ab_URI::fetch_uri());
		$this->input = new Ab_CoreInputCleaner();
		
		$this->fetch_config();
		
		
		if (empty($this->config['Misc']['language'])){
			$this->config['Misc']['language'] = 'ru';
		}
		
		define('LNG', $this->config['Misc']['language']);
		
		$db = new Ab_DatabaseMySql($this, $this->config['Database']['tableprefix']);
		$db->connect(
			$this->config['Database']['dbname'],
			$this->config['Server']['servername'],
			$this->config['Server']['port'],
			$this->config['Server']['username'],
			$this->config['Server']['password']
		);
		$db->readonly = $this->config['Database']['readonly'];
		
		$this->db = $db;
		
		Abricos::$db			= $this->db;
		Abricos::$adress		= $this->adress;
		Abricos::$inputCleaner	= $this->input;
		Abricos::$config		= $this->config;
		
		$this->modules = new Ab_CoreModuleManager($this);
		
		$this->modules->FetchModulesInfo();
		
		$modsinfo = $this->modules->modulesInfo;
		
		// временное решение в связи с переходом на платформу Abricos
		if (!empty($modsinfo['sys']) && empty($modsinfo['sys']['installdate'])){
			Ab_CoreQuery::UpdateToAbricosPackage($this->db);
		}
		$this->modules->RegisterByName('sys');
		$this->modules->RegisterByName('user');
		
		$modUser = $this->modules->GetModule('user');
		$modUser->SessionUpdate();
		Abricos::$user = $modUser;
		$this->user = $modUser;
		
		// проверка на наличие нового модуля в движке
		$smoddir = CWD."/modules/";
		$dir = dir($smoddir);
		while(($sDir = $dir->read()) !== false) {
			if($sDir != '.' && $sDir != '..' && is_dir($smoddir.$sDir)) {
				if (!$modsinfo[$sDir]){ // модуль явно не зарегистрирован
					// а модуль ли это?
					if (file_exists($smoddir.$sDir."/module.php")){ // чтото похожее на него
						// регистрируем его в системе
						$this->modules->RegisterByName($sDir);
					}
				}
			}
		}
	}
	
	
	/**
	 * Обработать глобальную переменную для безопасного использования 
	 * 
	 * @see Ab_CoreInputCleaner::clean_gpc()
	 * @param string $source Тип глобальной переменной g, p, c, r or f (соответственно GET, POST, COOKIE, REQUEST и FILES)
	 * @param string $varname Имя переменной
	 * @param integer $vartype Тип переменной
	 * @return mixed
	 */
	public static function CleanGPC($source, $varname, $vartype = TYPE_NOCLEAN){
		return CMSRegistry::$instance->input->clean_gpc($source, $varname, $vartype);
	}
	
	/**
	 * Получить менеджер обработки пользовательского текста
	 *
	 * @return Ab_UserText
	 * @deprecated
	 */
	public function GetUserTextManager($fullerase = false){
		return Abricos::TextParser($fullerase);
	} 
	
	/**
	 * Установка статуса страницы (производится единожды)
	 *  
	 * @var $status 
	 */
	public function SetPageStatus($status){
		if ($this->pageStatus > PAGESTATUS_OK){
			return;
		}
		$this->pageStatus = $status;
	}
	/**
	 * @return Services_JSON
	 */
	public function GetJSON(){
		if (empty($this->json)){
			require_once CWD.'/includes/json/json.php';
			$this->json = new Services_JSON();
		}
		return $this->json;
	}
	
	private function fetch_config()	{
		
		if (!file_exists(CWD. '/includes/config.php')) {
			die('<strong>Configuration</strong>: includes/config.php does not exist. Please fill out the data in config.new.php and rename it to config.php');
		}
		$config = array();
		include(CWD . '/includes/config.php');
		
		if (!isset($config['JsonDB']['use']) || !$config['JsonDB']['use']){
			$config['JsonDB']['password'] = TIMENOW;
		}
		$this->config =& $config;
	}
	

	private $_notification = null;
	
	/**
	 * Менеджер сообщений.
	 * 
	 * @return Ab_Notification
	 */
	public function GetNotification(){
		if(!is_null($this->_notification)){
			return $this->_notification;
		}
		$modNotify = $this->modules->GetModule('notify');
		if (empty($modNotify)){
			$this->_notification = new Ab_Notification();
		}else{
			$this->_notification = $modNotify->GetManager();
		}
		return $this->_notification;
	}
}

class Ab_Notification {
	
	/**
	 * Отправить EMail пользователю
	 * 
	 * @param string $email
	 * @param string $subject
	 * @param string $message
	 * @return boolean true - если сообщение отправлено
	 */
	public function SendMail($email, $subject, $message){ }
}

define('PAGESTATUS_OK',				0);
define('PAGESTATUS_404', 			404);
define('PAGESTATUS_500',			500);


?>