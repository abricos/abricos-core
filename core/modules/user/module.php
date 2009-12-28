<?php 
/**
 * @version $Id$
 * @package Abricos
 * @subpackage User
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$modUser = new CMSModuleUser();
CMSRegistry::$instance->modules->Register($modUser);

/**
 * Модуль "Пользователи" 
 * @package Abricos
 * @subpackage User
 */
class CMSModuleUser extends CMSModule {
	
	/**
	 * @var CMSModuleUser
	 */
	public static $instance = null;
	
	private $_usermanager = null;
	
	function CMSModuleUser(){
		$this->version = "0.2";
		$this->name = "user";
		$this->takelink = "user"; 
		
		CMSModuleUser::$instance = $this; 
		$this->permission = new UserPermission($this);
	}
	
	/**
	 * Получить менеджер пользователей
	 *
	 * @return UserManager
	 */
	public function GetUserManager(){
		if (is_null($this->_usermanager)){
			require_once CWD.'/modules/user/includes/manager.php';
			$this->_usermanager = new UserManager($this);
		}
		return $this->_usermanager;
	}
	
	public function GetContentName(){
		$adress = $this->registry->adress;
		$cname = '';
		
		if ($adress->level == 1){ // http://mysite.com/user/
			$cname = 'index';
		}else if ($adress->level > 1){
			if ($adress->dir[1] == 'activate'){ // http://mysite.com/user/activate/{userid}/{idhash}
				$cname = "activate";
			}else if ($adress->dir[1] == 'recpwd'){ // http://mysite.com/user/recpwd/{idhash}
				$cname = "recpwd";
			}else if ($adress->dir[1] == 'json'){
				$cname = "json";
			}
		}
		if ($cname == ''){
			$this->registry->SetPageStatus(PAGESTATUS_404);
		}
		return $cname;
	}

}


class UserAction {
	/**
	 * Регистрация пользователя
	 * 
	 * @var unknown_type
	 */
	const USER_NEWUSER_REGISTER = 30;
	const USER_ADMIN = 50;
}

class UserPermission extends CMSPermission {
	
	public function UserPermission(CMSModuleUser $module){
		
		$defRoles = array(
			new CMSRole(UserAction::USER_NEWUSER_REGISTER, 1, USERGROUPID_GUEST),
			new CMSRole(UserAction::USER_ADMIN, 1, USERGROUPID_ADMINISTRATOR)
		);
		
		parent::CMSPermission($module, $defRoles);
	}
	
	public function GetRoles(){
		$roles = array();
		$roles[UserAction::USER_NEWUSER_REGISTER] = $this->CheckAction(UserAction::USER_NEWUSER_REGISTER);
		$roles[UserAction::USER_ADMIN] = $this->CheckAction(UserAction::USER_ADMIN);
		return $roles;
	}
}


/**
 * Набор статичных функций SQL запросов 
 * @package Abricos
 * @subpackage User
 */
class CMSQUser{
	
	const FIELDS_USERPUB = "
		userid as id, 
		username as unm,
		usergroupid as ugp,
		joindate as dl,
		lastvisit as vst,
		realname as rnm,
		sex,
		homepagename as hpnm,
		homepage as hp,
		birthday as bday,
		icq,
		skype
	";
	
	public static function UserPublicInfo(CMSDatabase $db, $username){
		$sql = "
			SELECT 
				".CMSQUser::FIELDS_USERPUB."
			FROM ".$db->prefix."user
			WHERE username='".bkstr($username)."'
			LIMIT 1
		";
		return $db->query_read($sql);
	}
	
	public static function UserPrivateInfo(CMSDatabase $db, $userid, $retarray = false){
		$sql = "
			SELECT 
				".CMSQUser::FIELDS_USERPUB.",
				email as eml,
				'' as oldpass,
				'' as pass
			FROM ".$db->prefix."user
			WHERE userid='".bkint($userid)."'
			LIMIT 1
		";
		if (!$retarray)
			return $db->query_read($sql);
		else
			return $db->query_first($sql);
	}

	public static function UserPrivateInfoByUserName(CMSDatabase $db, $username, $retarray = false){
		$sql = "
			SELECT 
				".CMSQUser::FIELDS_USERPUB.",
				email as eml,
				'' as pass
			FROM ".$db->prefix."user
			WHERE username='".bkstr($username)."'
			LIMIT 1
		";
		if (!$retarray)
			return $db->query_read($sql);
		else
			return $db->query_first($sql);
	}

	public static function UserPasswordInfoByUserName(CMSDatabase $db, $username, $retarray = false){
		$sql = "
			SELECT
				password,
				salt 
			FROM ".$db->prefix."user
			WHERE username='".bkstr($username)."'
			LIMIT 1
		";
		if (!$retarray)
			return $db->query_read($sql);
		else
			return $db->query_first($sql);
	}
	
	public static function UserById(CMSDatabase $db, $userid){
		$sql = "
			SELECT *
			FROM ".$db->prefix."user
			WHERE userid='".bkint($userid)."'
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function UserSave(CMSDatabase $db, $userid, $data){
		
		$arr = array();
		foreach ($data as $key => $value){
			if (!empty($value)){
				array_push($arr, $key."='".$value."'");
			}
		}
		if (empty($arr)){ return; }
		
		$sql = "
			UPDATE ".$db->prefix."user
			SET ".implode(',', $arr)." 
			WHERE userid = ".bkint($userid)."
			LIMIT 1
		";
		$db->query_write($sql);
	}

	public static function UserCount(CMSDatabase $db){
		$sql = "
			SELECT COUNT(userid) as cnt 
			FROM ".$db->prefix."user
			LIMIT 1
		";
		return $db->query_read($sql); 
	}
	
	public static function UserListAll(CMSDatabase $db){
		$sql = "
			SELECT 
				userid as id, 
				username as unm,
				usergroupid as ugp,
				email as eml,
				joindate as dl,
				lastvisit as vst
			FROM ".$db->prefix."user
		";
		return $db->query_read($sql); 		
	}
	
	public static function UserList(CMSDatabase $db, $page, $limit){
		$from = (($page-1)*$limit);
		$sql = "
			SELECT 
				userid as id, 
				username as unm,
				usergroupid as ugp,
				email as eml,
				joindate as dl,
				lastvisit as vst
			FROM ".$db->prefix."user
			ORDER BY userid DESC
			LIMIT ".$from.",".bkint($limit)."
		";
		return $db->query_read($sql); 
	}
	
	/**
	 * Проверить наличие пользователя в базе по логину или эл. почте.
	 * Вернуть результат проверки:
	 * 0 - такого пользователя нет в базе,
	 * 1 - пользователь с таким логином уже зарегистрирован, 
	 * 2 - пользователь с таким email уже зарегистрирован
	 * 
	 * @param CMSDatabase $db
	 * @param String $username
	 * @param String $email
	 * @return Integer
	 */
	public static function UserExists(CMSDatabase $db, $username, $email){
		$email = strtolower($email);
		$username = htmlspecialchars_uni($username);
		
		$whereEMail = empty($email) ? "" : " OR email = '".bkstr($email)."'";
		
		$sql = "
			SELECT userid, username 
			FROM ".$db->prefix."user 
			WHERE username = '".bkstr($username)."' ".$whereEMail."
		";
		$row = $db->query_first($sql);
		
		if (empty($row)){ return 0; }
		if ($username == $row['username']){ return 1; }
		return 2;
	}
	
	/**
	 * Добавить пользователя в базу
	 *
	 * @param CMSDatabase $db
	 * @param Array $user Указатель на массив данных пользователя
	 */
	public static function UserAdd(CMSDatabase $db, &$user, $userGroupId = 3){
		
		$db->query_write("
			INSERT INTO `".$db->prefix."user` 
				(usergroupid, username, password, email, joindate, salt) VALUES (
				".bkint($userGroupId).", 
				'".bkstr($user['username'])."', 
				'".bkstr($user['password'])."', 
				'".bkstr($user['email'])."', 
				'".bkstr($user['joindate'])."', 
				'".bkstr($user['salt'])."'".
		")");
		if ($userGroupId > 3){
			return;
		}
		
		$usernew = CMSSqlQuery::QueryGetUserInfoByUsername($db, $user['username']);
		$user["userid"] = $usernew["userid"];
		$user['activateid'] = cmsrand(0, 100000000);

		// информация для активации мылом
		$db->query_write("
			INSERT INTO `".$db->prefix."useractivate` 
				(userid, activateid, joindate) VALUES (
				'".bkint($user['userid'])."', 
				'".bkstr($user['activateid'])."', 
				'".bkstr($user['joindate'])."'
			)"
		);
	}
	
}

/**
 * Набор статичных функций SQL запросов (старая версию)
 * @package Abricos
 * @subpackage User
 */
class CMSSqlQueryUser{
	
	public static function PwdUserChange(CMSDatabase $db, $userid, $newpass){
		$db->query_write("
			UPDATE ".$db->prefix."user
			SET password = '".$newpass."'
			WHERE userid = ".bkint($userid)."
			LIMIT 1
		");
	}
	
	public static function PwdChange(CMSDatabase $db, $userid, $hash, $newpass){
		$pwdreq = CMSSqlQueryUser::PwdReqGetAccess($db, $hash);
		if (empty($pwdreq) || intval($pwdreq['userid']) != intval($userid)){
			// hm...
			return;
		}
		
		CMSSqlQueryUser::PwdUserChange($db, $userid, $newpass);
		
		$db->query_write("
			DELETE FROM ".$db->prefix."userpwdreq
			WHERE userid = ".bkint($userid)."
			LIMIT 1
		");
	}
	
	public static function PwdReqGetAccess(CMSDatabase $db, $hash){
		$row = $db->query_first("
			SELECT * 
			FROM ".$db->prefix."userpwdreq
			WHERE hash = '".bkstr($hash)."'
			LIMIT 1
		");
		return $row;
	}
	
	public static function PwdReqCreate(CMSDatabase $db, $userid, $hash){
		$sql = "
			INSERT ".$db->prefix."userpwdreq (userid, hash, dateline, counteml) VALUES
			(
				".bkint($userid).",
				'".bkstr($hash)."',
				".TIMENOW.",
				1
			)
		";
		$db->query_write($sql);
	}
	
	/**
	 * Кол-во отправленых писем по восстановлению пароля юзеру
	 */
	public static function PwdCountSend(CMSDatabase $db, $userid){
		$row = $db->query_first("
			SELECT counteml 
			FROM ".$db->prefix."userpwdreq
			WHERE userid='".bkint($userid)."'
			LIMIT 1
		");
		if (empty($row)){
			return 0;
		}
		return $row['counteml'];
	}
	
	public static function UserByEMail(CMSDatabase $db, $email){
		$email = strtolower(trim($email));
		$row = $db->query_first("
			SELECT * 
			FROM ".$db->prefix."user
			WHERE email = '".bkstr($email)."'
		");
		return $row;
	}
	
	public static function SqlUserList(CMSDatabase $db, $usergroupid, $from = 0, $limit = 40){
		return "
			SELECT *
			FROM ".$db->prefix."user
			WHERE usergroupid = ".bkint($usergroupid)."
			ORDER BY userid DESC 
			LIMIT ".intval($from).", ".intval($limit)."
		";
	}
	
	/**
	 * Активация пользователя
	 *
	 * @param CMSDatabase $db
	 * @param Integer $userid
	 * @param Integer $activateId
	 * @return Integer ошибка: 
	 * 		0 - ошибки нет;
	 * 		1 - пользователь не найден;
	 * 		2 - пользователь уже активирован;
	 * 		3 - прочая ошибка
	 */
	public static function QueryRegUserActivate(CMSDatabase  $db, $userid, $activateId){

		$user = CMSQUser::UserById($db, $userid);
		if (empty($user)){
			return 1;
		}
		
		if ($user['usergroupid'] > USERGROUPID_AVAITEMAIL){
			return 2;
		}
		$actData = $db->query_first("
			SELECT * 
			FROM ".$db->prefix."useractivate 
			WHERE userid=".bkint($userid)." AND activateid=".bkint($activateId)
		);
		
		if (empty($actData) || $actData['activateid'] != $activateId){
			return 3;
		}
		
		$db->query_write("
			UPDATE ".$db->prefix."user SET usergroupid = ".USERGROUPID_REGISTERED."
				WHERE userid = ".bkint($user['userid'])."
			");
		
		$db->query_write("
			DELETE FROM ".$db->prefix."useractivate 
			WHERE useractivateid = ".bkint($actData['useractivateid'])."
		");
		return 0;
	}

	
}

?>