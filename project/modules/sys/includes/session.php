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
 * Сессия пользователя
 * @package Abricos
 * @subpackage Sys
 */
class CMSSysSession {
	/**
	 * Ядро
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;

	/**
	 * Идентификатор сессии. Хранится в куках и базе
	 */
	public $sessionHash;

	/**
	 * Проверочный идентификатор сессии. Генерируется на стороне сервера из IP-пользователя и информации браузера
	 */
	public $sessionIdHash;
	
	/*
	 * Время хранения куки
	 */
	public $cookieTimeOut = 0;

	public $cookiePrefix = "";
	
	/**
	 * Данные сессии в БД
	 * @var mixed
	 */
	public $session = null;

	/**
	 * Информация пользователя
	 * @var mixed
	 */
	public $userinfo = array(
		"userid"			=>	0,
		"usergroupid"	=>	2,
		"username"		=>	"Guest"
	);
	
	public function CMSSysSession(CMSRegistry $registry){
		$this->registry = $registry;
		
		
		// $this->sessionIdHash = md5($_SERVER['HTTP_USER_AGENT'] . $this->registry->ip_address);
		// Изменено в связи с тем, что когда к серверу обращается flash загрузчик файлов, 
		// то уже имеем в наличие другого пользователя 
		$this->sessionIdHash = md5($this->registry->ip_address);
		
		$this->cookieTimeOut = intval($this->registry->config['Misc']['cookietimeout']);
		$this->cookiePrefix = $this->registry->config['Misc']['cookieprefix'];
		
		$cookieName = $this->cookiePrefix.'sessionhash';
		// если сессия была передана GET запросом, то используем её
		$getSession = $this->registry->input->clean_gpc('g', 'session', TYPE_STR);
		if (empty($getSession)){
			$this->sessionHash = $this->registry->input->clean_gpc('c', $cookieName, TYPE_STR);
		}else{
			$this->sessionHash = $getSession;
		}
		$session = CMSQSys::Session($this);
		
		if (empty($session)){
			$this->sessionHash = md5(TIMENOW.$this->sessionIdHash.cmsrand(1, 1000000));
			$session = CMSQSys::SessionAppend($this);
		}
		if (empty($session)){
			return;
		}
		$this->session = &$session;

		$expire = TIMENOW + $this->cookieTimeOut;
		setcookie($cookieName, $this->sessionHash, $expire, '/');
		
		CMSQSys::SessionUserLastActiveUpdate($this);
		$userinfo = CMSQSys::UserById($this->registry->db, $this->session['userid']);
		if (empty($userinfo)){
			return;
		}
		if (!empty($this->registry->config['superadmin'])){
			$ids = explode(',', $this->registry->config['superadmin']);
			foreach($ids as $id){
				if ($id == $userinfo['userid']){
					$userinfo['usergroupid'] = 7;
					$registry->db->readonly = false;
					break;
				}
			}
		}
		$this->userinfo =& $userinfo;
		CMSQSys::UserUpdateActive($this->registry->db, $userinfo['userid']);
	}
	
	/**
	 * Авторизация пользователя
	 * @param $userid идентификатор пользователя
	 */
	public function Login($userid){
		$this->session = CMSQSys::SessionUserUpdate($this, $userid);
		$this->userinfo = CMSQSys::UserById($this->registry->db, $this->session['userid']);
	}
	
	/**
	 * Выход пользователя 
	 */
	public function Logout(){
		$this->session = CMSQSys::SessionUserUpdate($this, 0);
		$this->userinfo = array(
			"userid"			=>	0,
			"usergroupid"	=>	2,
			"username"		=>	"Guest"
		);
	}
		
	/**
	 * Вернуть TRUE если пользователь является администратором
	 * @return bool
	 */
	public function IsAdminMode (){
		return $this->userinfo["usergroupid"] >= USERGROUPID_ADMINISTRATOR;
	}

	/**
	 * Вернуть TRUE если пользователь является супер администратором
	 * @return bool
	 */
	public function IsSuperAdminMode (){
		return $this->userinfo["usergroupid"] == USERGROUPID_SUPERADMINISTRATOR;
	}
	
	/**
	 * Вернуть TRUE если пользователь является зарегистрированным
	 * @return bool
	 */
	public function IsRegistred(){
		return $this->userinfo["usergroupid"] >= USERGROUPID_REGISTERED;
	}
}
?>