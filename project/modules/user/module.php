<?php 
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

global $cms;

$modUser = new CMSModuleUser();
$cms->modules->Register($modUser);

class CMSModuleUser extends CMSModule {
	
	private $_usermanager = null;
	
	function CMSModuleUser(){
		$this->version = "1.0.1";
		$this->name = "user";
		$this->takelink = "user"; 
	}
	
	/**
	 * Получить менеджер пользователей
	 *
	 * @return CMSUserManager
	 */
	public function GetUserManager(){
		if (is_null($this->_usermanager)){
			require_once CWD.'/modules/user/includes/manager.php';
			$this->_usermanager = new CMSUserManager($this->registry);
		}
		return $this->_usermanager;
	}
	
	public function GetContentName(){
		$adress = $this->registry->adress;
		$cname = '';
		// $baseUrl = "/".$this->takelink."/";
		
		if ($adress->level == 1){ // http://mysite.com/user/
			$cname = 'index';
		}else if ($adress->level > 1){
			if ($adress->dir[1] == 'activate'){ // http://mysite.com/user/activate/{userid}/{idhash}
				$cname = "activate";
			}else if ($adress->dir[1] == 'recpwd'){ // http://mysite.com/user/recpwd/{idhash}
				$cname = "recpwd";
			}
		}
		if ($cname == ''){
			$this->registry->SetPageStatus(PAGESTATUS_404);
		}
		return $cname;
	}
	
	public static function UserCreateSalt() {
		$length = 3;
		$salt = '';
		for ($i = 0; $i < $length; $i++) {
			$salt .= chr(rand(32, 126));
		}
		return $salt;
	} 
	
	public static function UserVerifyName(&$username) {
		$username = trim($username);
		$length = strlen($username);
		if ($length == 0) {
			return false;
		} else if ($length < 3) {
			return false;
		} else if ($length > 100) {
			return false;
		} else if (preg_match('/(?<!&#[0-9]{3}|&#[0-9]{4}|&#[0-9]{5});/', $username)) {
			return false;
		} 
		$username = htmlspecialchars_uni($username);
		return true;
	}

	public static function UserPasswordCrypt($password, $salt){
		return md5(md5($password).$salt);
	}
	
}


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
	
	public static function UserPrivateInfo(CMSDatabase $db, $userid){
		$sql = "
			SELECT 
				".CMSQUser::FIELDS_USERPUB.",
				email as eml,
				'' as pass
			FROM ".$db->prefix."user
			WHERE userid='".bkint($userid)."'
			LIMIT 1
		";
		return $db->query_read($sql);
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
}


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

		$user = CMSSqlQuery::QueryGetUserInfo($db, $userid);
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

	/**
	 * добавление пользователя в базу
	 *
	 * @param CMSDatabase $db
	 * @param array $user
	 */
	public static function QueryAddUser(CMSDatabase $db, &$user){
		$db->query_write("INSERT INTO `".$db->prefix."user` 
				(usergroupid, username, password, email, joindate, salt) VALUES (3, 
			'".bkstr($user['username'])."', 
			'".bkstr($user['password'])."', 
			'".bkstr($user['email'])."', 
			'".bkstr($user['joindate'])."', 
			'".bkstr($user['salt'])."'".
		")");
		
		$usernew = CMSSqlQuery::QueryGetUserInfoByUsername($db, $user['username']);
		$user["userid"] = $usernew["userid"];
		$user['activateid'] = cmsrand(0, 100000000);

		/* информация для активации мылом */
		$db->query_write("
			INSERT INTO `".$db->prefix."useractivate` 
				(userid, activateid, joindate) VALUES (
				'".bkint($user['userid'])."', 
				'".bkstr($user['activateid'])."', 
				'".bkstr($user['joindate'])."'
			)"
		);
	}
	
	public static function QueryRegUsernameExists(CMSDatabase $db, $username, $email){
		$email = strtolower($email);
		$username = htmlspecialchars_uni($username);
		
		$sql = "
			SELECT userid, username 
			FROM ".$db->prefix."user 
			WHERE username = '".bkstr($username)."' OR email = '".bkstr($email)."'
		";
		
		$row = $db->query_first($sql);
	
		if (empty($row)){
			return 0;
		}
		if ($username == $row['username']){
			return 1;
		}
		return 2;
	}
}

?>