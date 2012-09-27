<?php 
/**
 * @version $Id$
 * @package Abricos
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

/**
 * Модуль управления пользователями
 *  
 * @package Abricos
 */
class User extends Ab_Module {

	/**
	 * Идентификатор текущего пользователя
	 * 
	 * @var integer
	 */
	public $id = 0;
	
	/**
	 * Имя учетной записи текущего пользователя
	 * 
	 * @var string
	 */
	public $login = 'Guest';
	
	/**
	 * Группа пользователей "Гость"
	 * 
	 * @var integer
	 * @deprecated
	 */
	const UG_GUEST = 1;
	
	/**
	 * Группа пользователей "Зарегистрированный"
	 * 
	 * @var integer
	 * @deprecated
	 */
	const UG_REGISTERED = 2;
	
	/**
	 * Группа пользователей "Администратор"
	 * 
	 * @var integer
	 * @deprecated
	 */
	const UG_ADMIN = 3;
	
	// TODO: На удаление
	private static $UG_REGISTERED_TO = array(1,2);
	// TODO: На удаление
	private static $UG_ADMIN_TO = array(1,2,3);
	
	private $_manager = null;
	
	/**
	 * Информация текущего пользователя из БД
	 * 
	 * @var array
	 */
	public $info = array(
		"userid"	=> 0,
		"group"		=> array(1),
		"username"	=> "Guest"
	);
	private $userinfo = null;
	
	/**
	 * Идентификатор сессии пользователя
	 * 
	 * @var string
	 */
	public $sessionHash = '';

	public function __construct(){
		$this->version = "0.2.5";
		$this->name = "user";
		$this->takelink = "user"; 
		$this->permission = new UserPermission($this);
		Abricos::$user = $this;
	}
	
	/**
	 * Получить менеджер пользователей
	 *
	 * @return UserManager
	 */
	public function GetManager(){
		if (is_null($this->_manager)){
			require_once 'includes/manager.php';
			$this->_manager = new UserManager($this);
		}
		return $this->_manager;
	}
	
	public function GetContentName(){
		$adress = $this->registry->adress;
		$cname = '';
		
		if ($adress->level == 1){ // http://mysite.com/user/
			if (Abricos::$user->id == 0){
				$cname = 'index_guest';
			}else{
				$cname = 'index';
			}
		}else if ($adress->level > 1){
			$cname = $adress->dir[1];
		}
		if ($cname == ''){
			$this->registry->SetPageStatus(PAGESTATUS_404);
		}
		return $cname;
	}

	/**
	 * Менеджер сессии
	 * 
	 * @var UserSession
	 */
	public $session;
	
	public function GetSessionPrivateKey(){
		return md5($_SERVER['REMOTE_ADDR']);
	}

	/**
	 * @return AntibotModule
	 */
	public function GetAntibotModule(){
		$mod = Abricos::GetModule('antibot');
		return $mod;
	}
	
	public function AntibotUserDataUpdate($userid=0){
		$mod = $this->GetAntibotModule();
		if (empty($mod)){
			return;
		}
		$mod->UserDataUpdate($userid);
	}
	
	public function SessionUpdate(){
		
		$core = $this->registry;
		$db = $core->db;

		$this->session = $session = new UserSession();
		$userid = $session->Get('userid');
		$flag = $session->Get('flag');
		
		if (empty($userid) && empty($flag)){ 
			// сессия на пользователя не установлена, проверка на автологин
			$sessionKey = Abricos::CleanGPC('c', $session->cookieName, TYPE_STR);
			if (!empty($sessionKey)){
				$privateKey = $this->GetSessionPrivateKey();
				$sessionDB = UserQuery::Session($db, $session->sessionTimeOut, $sessionKey, $privateKey);
				if (!empty($sessionDB)){
					$userid = $sessionDB['userid']; 
				}
			}
		}
		
		if ($userid > 0){
			$info = UserQuery::User($db, $userid);
			if (empty($info)){ // Гость
				$session->Drop('userid');
				$this->id = 0;
			}else{
				$this->id = $userid;
				$info['superadmin'] = false;
				if (!empty($core->config['superadmin'])){
					$ids = explode(',', $core->config['superadmin']);
					foreach($ids as $id){
						if ($id == $info['userid']){
							$info['superadmin'] = true;
							$db->readonly = false;
							break;
						}
					}
				}
				$this->info = &$info;
				UserQuery::UserUpdateLastActive($db, $userid, $_SERVER['REMOTE_ADDR']);
				$this->AntibotUserDataUpdate($userid);
			}
		}
		// установка флага который сообщит нам что сессия установлена
		$session->Set('userid', $userid);
		$session->Set('flag', 1);
		
		$this->login = $info['username'];
	}
	
	/**
	 * Текущий пользователь СУПЕРАДМИНИСТРАТОР
	 * @return boolean
	 */
	public function IsSuperAdmin (){
		return $this->info["superadmin"];
	}
	
	/**
	 * Вернуть TRUE если пользователь является администратором
	 * TODO: необходимо удалить (временое решение для совместимости)
	 * 
	 * @ignore
	 * @deprecated
	 * @return bool
	 */
	public function IsAdminMode (){
		foreach ($this->info["group"] as $group){
			if ($group == 3){
				return true;
			}
		}
		return false;
	}
	
	/**
	 * Вернуть TRUE если пользователь является зарегистрированным
	 * TODO: необходимо удалить (временое решение для совместимости)
	 * @deprecated
	 * @ignore
	 * @return bool
	 */
	public function IsRegistred(){
		foreach ($this->info["group"] as $group){
			if ($group == 2 || $group == 3){
				return true;
			}
		}
		return false;
	}
}

/**
 * Идентнификаторы действий ролей пользователя
 * 
 * @package Abricos
 */
class UserAction {
	// регистрация пользователя
	const REGISTRATION = 10;

	// администрирование пользователей 
	const USER_ADMIN = 50;
}

/**
 * Роли пользователей для модуля пользователей
 * 
 * @package Abricos
 */
class UserPermission extends Ab_UserPermission {
	
	public function __construct(User $module){
		
		$defRoles = array(
			new Ab_UserRole(UserAction::REGISTRATION, Ab_UserGroup::GUEST),
			new Ab_UserRole(UserAction::USER_ADMIN, Ab_UserGroup::ADMIN)
		);
		parent::__construct($module, $defRoles);
	}
	
	public function GetRoles(){
		return array(
			UserAction::REGISTRATION => $this->CheckAction(UserAction::REGISTRATION),
			UserAction::USER_ADMIN => $this->CheckAction(UserAction::USER_ADMIN)
		);
	}
}

/**
 * Класс работы с сессиями
 *
 * @package Abricos
 */
class UserSession {

	/**
	 * Время хранения сесси
	 * @var integer
	 */
	public $sessionTimeOut = 1209600; // 86400*14
	
	public $sessionHost = null;
	
	public $sessionPath = '/';
	
	private $phpSessionName = 'PHPSESSID';

	public $cookieName = 'skey';
	
	/**
	 * Идентификатор PHP сессии
	 * @var string
	 */
	public $key;
	
	public function __construct(){
		
		$cfg = &CMSRegistry::$instance->config['session'];
		
		if (isset($cfg['phpname'])){
			$this->phpSessionName = $cfg['phpname']; 
		}
		
		if (isset($cfg['timeout'])){
			$this->sessionTimeOut = $cfg['timeout']; 
		}
		
		if (isset($cfg['host'])){
			$this->sessionHost = $cfg['host']; 
		}
		
		if (isset($cfg['path'])){
			$this->sessionPath = $cfg['path']; 
		}

		$cookiePrefix = '';
		if (isset($cfg['cookie_prefix'])){
			$cookiePrefix = $cfg['cookie_prefix'];
		}
		
		$cookieName = 'skey';
		if (isset($cfg['cookie_name'])){
			$cookieName = $cfg['cookie_name'];
		}
		$this->cookieName = $cookiePrefix.$cookieName;
		
		$this->Start();
		
		$this->key = session_id();
	}
	
	/**
	 * Старт сессии
	 */
	public function Start(){
		$sessionIDG = Abricos::CleanGPC('g', 'session', TYPE_STR);
		if (!empty($sessionIDG)){
			session_id($sessionIDG); 
		}
		
		session_name($this->phpSessionName);
		session_set_cookie_params($this->sessionTimeOut, $this->sessionPath, $this->sessionHost);
		session_start();
	}
	
	public function Get($name) {
		return isset($_SESSION[$name]) ? $_SESSION[$name] : null;
	}
	
	public function GetData() {
		return $_SESSION;
	}
	
	public function Set($name, $value) {
		$_SESSION[$name] = $value;
	}
	
	public function Drop($name) {
		unset($_SESSION[$name]);
	}

	public function DropSession() {
		unset($_SESSION);
		session_destroy();
	}
}


/**
 * Часто запрашиваемые запросы (для внутреннего использования)
 * 
 * @package Abricos
 */
class UserQuery {
	
	/**
	 * Вернуть полные данные пользователя для внутренних функций.
	 * 
	 * @param Ab_Database $db
	 * @param integer $userid
	 * @return array
	 */
	public static function User(Ab_Database $db, $userid){
		$userid = bkint($userid);
		if ($userid < 1){ return; }
		$sql = "
			SELECT *
			FROM ".$db->prefix."user
			WHERE userid='".bkint($userid)."'
			LIMIT 1
		";
		$user = $db->query_first($sql);
		if (empty($user)){ return; }
		$user['group'] = UserQuery::GroupByUserId($db, $user['userid']);
		return $user;
	}
	
	public static function UserByName(Ab_Database $db, $username){
		$sql = "
			SELECT *
			FROM ".$db->prefix."user
			WHERE username='".bkstr($username)."'
			LIMIT 1
		";
		$user = $db->query_first($sql);
		if (empty($user)){ return; }
		$user['group'] = UserQuery::GroupByUserId($db, $user['userid']);
		return $user;
	}
	
	public static function GroupByUserId(Ab_Database $db, $userid){
		$rows = $db->query_read("
			SELECT 
				groupid as id
			FROM ".$db->prefix."usergroup
			WHERE userid=".bkint($userid)."
		");
		$ret = array();
		while (($row = $db->fetch_array($rows))){
			array_push($ret, $row['id']*1);
		}
		return $ret;
	}

	public static function Session(Ab_Database $db, $cookieTimeOut, $hash, $idHash){
		$sql = "
			DELETE FROM ".$db->prefix."session 
			WHERE lastactivity < ".(TIMENOW - $cookieTimeOut)." and userid > 0
		";
		$db->query_write($sql, true);
		
		$sql = "
			SELECT *
			FROM ".$db->prefix."session
			WHERE 
				sessionhash='".bkstr($hash)."'
				AND lastactivity > ".(TIMENOW - $cookieTimeOut)."
				AND idhash='".bkstr($idHash)."'
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function SessionAppend(Ab_Database $db, $userid, $hash, $idHash){
		$sql = "
			INSERT INTO ".$db->prefix."session (userid, sessionhash, idhash, lastactivity)
			VALUES (
				".bkint($userid).", 
				'".bkstr($hash)."', 
				'".bkstr($idHash)."',
				".TIMENOW."
			)
		";
		$db->query_write($sql, true);
	}

	public static function SessionRemove(Ab_Database $db, $sessionHash){
		$sql = "
			DELETE FROM ".$db->prefix."session
			WHERE sessionhash='".bkstr($sessionHash)."' 
		";
		$db->query_write($sql);
	}
	
	public static function UserUpdateLastActive(Ab_Database $db, $userid, $ip){
		$sql = "
			UPDATE ".$db->prefix."user
			SET lastvisit='".TIMENOW."',
				ipadress='".bkstr($ip)."'
			WHERE userid='".bkint($userid)."'
			LIMIT 1
		";
		$db->query_write($sql, true);
	}
	
	public static function UserRole(Ab_Database $db, $user){
		if ($user['userid'] == 0){
			$sql = "
				SELECT
					ma.module as md,
					ma.action as act,
					ur.status as st 
				FROM ".$db->prefix."userrole ur
				LEFT JOIN ".$db->prefix."sys_modaction ma ON ur.modactionid = ma.modactionid
				WHERE ur.userid = 1 AND ur.usertype = 0
			";
		}else{
			$sql = "
				SELECT
					ma.module as md,
					ma.action as act,
					ur.status as st 
				FROM ".$db->prefix."userrole ur
				LEFT JOIN ".$db->prefix."sys_modaction ma ON ur.modactionid = ma.modactionid
				WHERE ur.userid = ".bkint($user['userid'])." AND ur.usertype = 1
			";
			$gps = $user['group'];
			if (count($gps) > 0){
				$arr = array();
				foreach ($gps as $gp){
					array_push($arr, "gp.groupid = ".$gp);
				}
				$sql .= "
					UNION
					SELECT
						ma.module as md,
						ma.action as act,
						ur.status as st 
					FROM ".$db->prefix."userrole ur
					LEFT JOIN ".$db->prefix."sys_modaction ma ON ur.modactionid = ma.modactionid
					LEFT JOIN ".$db->prefix."group gp ON gp.groupid = ur.userid
					WHERE ur.usertype = 0 AND (".implode(' OR ', $arr).")
				";
			}
		}
		return $db->query_read($sql);
	}
}

Abricos::ModuleRegister(new User());

?>