<?php
/**
* @version $Id$
* @package Abricos
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

define('PAGESTATUS_OK',				0);
define('PAGESTATUS_404', 			404);
define('PAGESTATUS_500',			500);

final class CMSRegistry {

	// TODO: Временное решение для отладки старой версии, после перевода, необходимо убрать
	private $session = null;
	private $ip_address;
	
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
	
	/**
	 * Get,Post,Cookie
	 *
	 * @var array
	 */
	public $GPC = array();
	
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
	 * Системный модуль
	 * @var SystemModule
	 */
	public $system = null;
	
	/**
	 * Модуль пользователя
	 * @var User
	 */
	public $user = null;
	
	private $json = null;
	
	public function CMSRegistry(){
		$this->input = new CMSInputCleaner($this);
		
		$this->fetch_config();
		
		CMSRegistry::$instance = $this;
		$this->adress = new CMSAdress();
		
		if (empty($this->config['Misc']['language'])){
			$this->config['Misc']['language'] = 'ru';
		}
		
		define('LNG', $this->config['Misc']['language']);
		
		$db = new CMSMySqlDB($this);
		$db->connect(
			$this->config['Database']['dbname'],
			$this->config['Server']['servername'],
			$this->config['Server']['port'],
			$this->config['Server']['username'],
			$this->config['Server']['password']
		);
		$db->readonly = $this->config['Database']['readonly'];
		
		$this->db = $db;
		
		$this->modules = new CMSModuleManager($this);
		
		$this->modules->FetchModulesInfo();
		
		$modsinfo = $this->modules->modulesInfo;
		
		// временное решение в связи с переходом на платформу Abricos
		if (!empty($modsinfo['sys']) && empty($modsinfo['sys']['installdate'])){
			CoreQuery::UpdateToAbricosPackage($this->db);
		}
		$this->modules->RegisterByName('sys');
		$this->modules->RegisterByName('user');
		
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
			require_once ('cmsusertext.php');
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
	
	function fetch_config()	{
		
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
	 * @return Notification
	 */
	public function GetNotification(){
		if(!is_null($this->_notification)){
			return $this->_notification;
		}
		$modNotify = $this->modules->GetModule('notify');
		if (empty($modNotify)){
			$this->_notification = new Notification();
		}else{
			$this->_notification = $modNotify->GetManager();
		}
		return $this->_notification;
	}
}

class Notification {
	
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

?>