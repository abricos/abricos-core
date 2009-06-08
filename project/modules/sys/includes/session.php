<?php
/**
* @version $Id: session.php 767 2009-04-24 12:40:07Z AKuzmin $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

class CMSSysSession extends CMSBaseClass {
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
	 */
	public $session = null;

	/**
	 * Информация пользователя
	 */
	public $userinfo = array(
		"userid"			=>	0,
		"usergroupid"	=>	2,
		"username"		=>	"Guest"
	);
	
	public function __construct(CMSRegistry $registry){
		$this->registry = $registry;
		$this->sessionIdHash = md5($_SERVER['HTTP_USER_AGENT'] . $this->registry->ip_address);
		$this->cookieTimeOut = intval($this->registry->config['Misc']['cookietimeout']);
		$this->cookiePrefix = $this->registry->config['Misc']['cookieprefix'];
		
		$cookieName = $this->cookiePrefix.'sessionhash';
		$this->sessionHash = $this->registry->input->clean_gpc('c', $cookieName, TYPE_STR);
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
		// cms_setcookie($cookieName, $this->sessionHash, true, true);
		
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
	
	public function Login($userid){
		$this->session = CMSQSys::SessionUserUpdate($this, $userid);
		$this->userinfo = CMSQSys::UserById($this->registry->db, $this->session['userid']);
	}
	
	public function Logout(){
		$this->session = CMSQSys::SessionUserUpdate($this, 0);
		$this->userinfo = array(
			"userid"			=>	0,
			"usergroupid"	=>	2,
			"username"		=>	"Guest"
		);
	}
		
	/**
	 * Является ли пользователь администратором
	 */
	public function IsAdminMode (){
		return $this->userinfo["usergroupid"] >= USERGROUPID_ADMINISTRATOR;
	}

	public function IsSuperAdminMode (){
		return $this->userinfo["usergroupid"] == USERGROUPID_SUPERADMINISTRATOR;
	}
	
	/**
	 * Является ли пользователь залогиненым
	 */
	public function IsRegistred(){
		return $this->userinfo["usergroupid"] >= USERGROUPID_REGISTERED;
	}
}
?>