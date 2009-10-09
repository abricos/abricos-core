<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

define('PAGESTATUS_OK',				0);
define('PAGESTATUS_404', 			404);
define('PAGESTATUS_500',			500);

final class CMSRegistry extends CMSBaseClass {
	
	/**
	 * Экземляр ядра
	 *
	 * @var CMSRegistry
	 */
	public static $instance = null;
	
	/**
	 * Статус собираемой странички
	 */
	public $pageStatus = PAGESTATUS_OK;
	
	/**
	 * Enter description here...
	 *
	 * @var CMSInputCleaner
	 */
	public $input;
	
	/**
	 * Настройки
	 *
	 * @var array
	 */
	public $config;
	
	/**
	 * Менеджер работы с БД
	 *
	 * @var CMSDatabase
	 */
	public $db;
	
	public $ip_address;
	
	/**
	 * Enter description here...
	 *
	 * @var CMSSysSession
	 */
	public $session;
	
	/**
	 * Get,Post,Cookie
	 *
	 * @var array
	 */
	public $GPC = array();
	
	/**
	 * Временное хранилище объектов.
	 * Используется для передачи объектов между кирпичами
	 *
	 * @var array
	 */
	public $VarData = array();
	
	/**
	 * Менеджер модулей
	 *
	 * @var CMSModuleManager
	 */
	public $modules = null;
	
	/**
	 * Enter description here...
	 *
	 * @var CMSAdress
	 */
	public $adress = null;
	
	/**
	 * Конфигураторы
	 *
	 * @var array
	 */
	public $configs = null;
	
	/**
	 * @var CMSMailer
	 */
	private $mailer = null;
	
	private $json = null;
	
	public function __construct(){
		$this->input = new CMSInputCleaner($this);
		$this->ip_address = $this->fetch_alt_ip();
	}
	
	public function Init(){
		$this->modules = new CMSModuleManager($this);
		$this->modules->FetchModulesInfo();
		$modsinfo = $this->modules->modulesInfo;
		
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
	 * Менеджер обработки пользовательского текста
	 *
	 * @var CMSUserText
	 */
	private $_userTextManager = null;
	
	/**
	 * Получить менеджер обработки пользовательского текста
	 *
	 * @return CMSUserText
	 */
	public function GetUserTextManager(){
		if (is_null($this->_userTextManager)){
			require_once CWD.'/includes/cmsusertext.php';
			$this->_userTextManager = new CMSUserText();
		}
		return $this->_userTextManager;
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
	
	/**
	 * @return CMSMailer
	 */
	public function GetMailer(){
		return new CMSMailer($this);
	}
	
	function fetch_config()	{
		
		if (!file_exists(CWD. '/includes/config.php')) {
			die('<strong>Configuration</strong>: includes/config.php does not exist. Please fill out the data in config.new.php and rename it to config.php');
		}
		$config = array();
		include(CWD . '/includes/config.php');
		$this->config =& $config;
	}
	
	function fetch_ip(){
		return $_SERVER['REMOTE_ADDR'];
	}
	
	function fetch_alt_ip()	{
		if (isset($_SERVER['HTTP_CLIENT_IP'])){
			$alt_ip = $_SERVER['HTTP_CLIENT_IP'];
		} else if (isset($_SERVER['HTTP_X_FORWARDED_FOR']) AND preg_match_all('#\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}#s', $_SERVER['HTTP_X_FORWARDED_FOR'], $matches)) {
			// make sure we dont pick up an internal IP defined by RFC1918
			foreach ($matches[0] AS $ip) {
				if (!preg_match("#^(10|172\.16|192\.168)\.#", $ip)){
					$alt_ip = $ip;
					break;
				}
			}
		} else if (isset($_SERVER['HTTP_FROM'])) {
			$alt_ip = $_SERVER['HTTP_FROM'];
		} else {
			$alt_ip = $_SERVER['REMOTE_ADDR'];
		}
		return $alt_ip;
	}
}

?>