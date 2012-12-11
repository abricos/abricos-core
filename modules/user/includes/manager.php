<?php
/**
 * @version $Id$
 * @package Abricos
 * @copyright Copyright (C) 2008-2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

require_once 'dbquery.php';

/**
 * Менеджер управления пользователями
 * @package Abricos
 */
class UserManager extends Ab_ModuleManager {
	
	/**
	 * Модуль
	 * 
	 * @var User
	 */
	public $module = null;
	
	private $_disableRoles = false;
	
	public function __construct(User $module){
		parent::__construct($module);
	}
	
	/**
	 * Отключить проверку всех ролей в текущей сессии пользователя
	 */
	public function DisableRoles(){
		$this->_disableRoles = true;
	}
	
	/**
	 * Включить проверку всех ролей в текущей сессии пользователя (по умолчанию - включено)
	 */
	public function EnableRoles(){
		$this->_disableRoles = false;
	}

	/**
	 * Имеет ли пользователь доступ к административным функциям.
	 * 
	 * @return boolean
	 */
	public function IsAdminRole(){
		if ($this->_disableRoles){ return true; }
		return $this->IsRoleEnable(UserAction::USER_ADMIN);
	}
	
	/**
	 * Имеет ли пользователь полный доступ к профилю пользователя 
	 * 
	 * @param integer $userid 
	 * @return boolean
	 */
	public function IsChangeUserRole($userid){
		return $this->userid == $userid || $this->IsAdminRole();
	}
	
	public function AJAX($d){
		switch($d->do){
			case "login":
				return $this->Login($d->username, $d->password, $d->autologin);
			case "loginext":
				return $this->LoginExt($d->username, $d->password, $d->autologin);

			case "termsofuse": return $this->TermsOfUse();
			case "termsofuseagreement": return $this->TermsOfUseAgreement();
				
			case "register":
				return $this->Register($d->username, $d->password, $d->email, true);
			case "user":
				return $this->UserInfo($d->userid);
			case "usersave":
				return $this->UserUpdate($d);
			case "passwordchange":
				return $this->UserPasswordChange($d->userid, $d->pass, $d->passold);
			case "useremailconfirm":
				return $this->RegistrationActivate($d->userid, $d->actcode);
			case "useremailcnfsend":
				return $this->ConfirmEmailSendAgain($d->userid);
		}
		return -1;
	}
	
	private $_newGroupId = 0;
	
	public function DSProcess($name, $rows){
		$p = $rows->p;
		$db = $this->db;
		if ($this->IsAdminRole()){
			switch ($name){
				case 'grouplist':
					foreach ($rows->r as $r){
						if ($r->f == 'a'){ 
							$this->_newGroupId = UserQueryExt::GroupAppend($db, $r->d->nm); 
						}
						if ($r->f == 'u'){ 
							UserQueryExt::GroupUpdate($this->db, $r->d);
						}
					}
					return;
				case 'rolelist':
					foreach ($rows->r as $r){
						if ($r->f == 'a'){
							if (intval($p->groupid) == 0 && intval($this->_newGroupId) > 0){
								$p->groupid = $this->_newGroupId;
							} 
							UserQueryExt::RoleAppend($db, $p->groupid, $r->d);
						}
						if ($r->f == 'd'){ 
							UserQueryExt::RoleRemove($this->db, $r->d->id);
						}
					}
					return;
			}
		}
	}
	
	public function DSGetData($name, $rows){
		$p = $rows->p;
		$db = $this->db;

		// Запросы доступные всем
		switch ($name){
			/////// Пользователь //////
			case 'user':
				return array($this->UserInfo($p->userid));
			
			case 'permission':
				return $this->Permission();
		}
		
		// Запросы уровня администратора
		if ($this->IsAdminRole()){
			switch ($name){

				/////// Постраничный список пользователей //////
				case 'userlist': return $this->UserList($p->page, $p->limit, $p->filter);
				case 'usercount': return $this->UserCount($p->filter);
				case 'usergrouplist': return $this->UserGroupList($p->page, $p->limit, $p->filter);
					
				/////// Постраничный список групп //////
				case 'grouplist':
					return UserQueryExt::GroupList($db);
				case 'groupcount':
					return UserQueryExt::GroupCount($db);
	
				/////// Роли //////
				case 'rolelist':
					return UserQueryExt::RoleList($db, $p->groupid); 
				case 'modactionlist':
					return UserQueryExt::ModuleActionList($this->db);
			}
		}
		
		return null;
	}

	
	////////////////////////////////////////////////////////////////////
	//                       Общедоступные запросы                    //
	////////////////////////////////////////////////////////////////////
	
	public function Permission(){
		$rows = array();
		CMSRegistry::$instance->modules->RegisterAllModule();
		$mods = CMSRegistry::$instance->modules->GetModules();
		foreach ($mods as $modname => $module){
			if (is_null($module->permission)){
				continue;
			}
			$roles = $module->permission->GetRoles();
			if (is_null($roles)){ continue; }
			array_push($rows, array(
				"nm" => $modname,
				"roles" => $roles
			));
		}
		return $rows;
	}
	
	////////////////////////////////////////////////////////////////////
	//                      Административные функции                  //
	////////////////////////////////////////////////////////////////////
	
	public function UserList($page = 1, $limit = 15, $filter = ''){
		if (!$this->IsAdminRole()){
			return null;
		}
		
		$modAntibot = Abricos::GetModule('antibot');
		return UserQueryExt::UserList($this->db, $page, $limit, $filter, !empty($modAntibot));
	}
	
	public function UserCount($filter = ''){
		if (!$this->IsAdminRole()){
			return null;
		}
		
		$modAntibot = Abricos::GetModule('antibot');
		return UserQueryExt::UserCount($this->db, $filter, !empty($modAntibot));
	}
	
	public function UserGroupList($page = 1, $limit = 15, $filter = ''){
		if (!$this->IsAdminRole()){
			return null;
		}
		
		$modAntibot = Abricos::GetModule('antibot');
		return UserQueryExt::UserGroupList($this->db, $page, $limit, $filter, !empty($modAntibot));
	}
	
	public function UserInfo($userid){
		if (!$this->IsChangeUserRole($userid)){
			$user = UserQueryExt::UserPublicInfo($this->db, $userid, true); 
		}else{
			$user = UserQueryExt::UserPrivateInfo($this->db, $userid, true);
		}
		if (empty($user)){ return array('id' => $userid); }
		$groups = UserQuery::GroupByUserId($this->db, $userid);
		$user['gp'] = implode(",", $groups); 
		
		return $user;
	}
	
	public function UserUpdate($d){
		
		if (!$this->IsChangeUserRole($d->userid)){ 
			// haker?
			return -1;
		}
		
		if ($d->userid == 0){
			if (!$this->IsAdminRole()){
				return -1;
			}
			// зарегистрировать пользователя
			$err = $this->Register($d->unm, $d->pass, $d->eml, false, false);
			if ($err > 0){ 
				return $err;
			}
			$user = UserQueryExt::UserByName($this->db, $d->unm);
			$d->userid = $user['userid'];
		} else {
		
			$user = UserQuery::User($this->db, $d->userid, true);
			
			// данные для внесения в бд
			$data = array();
	
			// смена пароля
			if (!empty($d->pass)){
				if ($this->IsAdminRole()){
					$data['password'] = $this->UserPasswordCrypt($d->pass, $user['salt']);
				}else{
					$passcrypt = $this->UserPasswordCrypt($d->oldpass, $user["salt"]);
					if ($passcrypt == $user["password"]){ 
						$data['password'] = $this->UserPasswordCrypt($d->pass, $user['salt']);
					}
				}
			}
			
			// смена емайл
			if ($this->IsAdminRole()){
				$data['email'] = $d->eml;
			}
			
			UserQueryExt::UserUpdate($this->db, $d->userid, $data);
		}
		if (!$this->IsAdminRole()){ return; }
		UserQueryExt::UserGroupUpdate($this->db, $d->userid, explode(',', $d->gp));
		return 0;
	}
	
	public function UserPasswordChange($userid, $newpassword, $oldpassword = ''){
		if (!$this->IsChangeUserRole($userid)){ 
			return 1; // нет доступа на изменение пароля
		}
		
		$user = UserQuery::User($this->db, $userid, true);

		// данные для внесения в бд
		$data = array();

		if ($this->IsAdminRole()){
			// отключено
			$data['password'] = $this->UserPasswordCrypt($newpassword, $user['salt']);
		}else{
			
			// смена пароля
			if (empty($newpassword) || strlen($newpassword) < 4){
				return 2; // короткий пароль
			}
			if ($newpassword == $user['username']){
				return 3; // пароль совпадает с логином
			}
			
			$passcrypt = $this->UserPasswordCrypt($oldpassword, $user["salt"]);
			if ($passcrypt == $user["password"]){ 
				$data['password'] = $this->UserPasswordCrypt($newpassword, $user['salt']);
			}else{
				return 4; // старый пароль ошибочный
			}
		}
			
		UserQueryExt::UserUpdate($this->db, $userid, $data);
		
		return 0;
	}
	
	
	////////////////////////////////////////////////////////////////////
	//      	Функции: регистрации/авторизации пользователя     	  //
	////////////////////////////////////////////////////////////////////
	
	private $_usercache = null;
	
	/**
	 * Проверить данные авторизации и вернуть номер ошибки: 
	 * 0 - нет ошибки,
	 * 1 - ошибка в имени пользователя, 
	 * 2 - неверное имя пользователя или пароль, 
	 * 3 - не заполнены обязательные поля, 
	 * 4 - пользователь заблокирован,
	 * 5 - пользователь не прошел верификацию email
	 * 
	 * @param String $username имя пользователя или емайл
	 * @param String $password пароль
	 * @return Integer
	 */
	public function Login($username, $password, $autologin = false){
		$username = trim($username);
		$password = trim($password);
		
		if (empty($username) || empty($password)){ return 3; }
	
		// if (!$this->UserVerifyName($username)){ return 1; }
		
		$user = UserQuery::UserByName($this->db, $username, true);
		
		if (empty($user)){ return 2; }
		$this->_usercache = $user;

		if ($user['emailconfirm'] < 1) { return 5; }
		
		$passcrypt = $this->UserPasswordCrypt($password, $user["salt"]);
		if ($passcrypt != $user["password"]){ return 2; }
		
		$this->LoginMethod($user);
		
		return 0;
	}
	
	public function LoginMethod($user, $autologin = false){
		$session = $this->module->session;
		$session->Set('userid', $user['userid']);
		
		$guserid = $session->Get('guserid');
		$session->Set('guserid', $user['userid']);
		
		// зашел тот же человек, но под другой учеткой
		if ($guserid > 0 && $guserid != $user['userid']){
			UserQueryExt::UserDoubleLogAppend($this->db, $guserid, $user['userid'], $_SERVER['REMOTE_ADDR']);
		}
		
		if ($autologin){
			// установить куки для автологина
			$privateKey = $this->module->GetSessionPrivateKey();
			$sessionKey = md5(TIMENOW.$privateKey.cmsrand(1, 1000000));
			setcookie($session->cookieName, $sessionKey, TIMENOW + $session->sessionTimeOut, $session->sessionPath);
			UserQuery::SessionAppend($this->db, $user['userid'], $sessionKey, $privateKey);
		}
		
		// Удалить пользователей не прошедших верификацию email (редкая операция)
		UserQueryExt::RegistrationActivateClear($this->db);
		
		$this->UserDomainUpdate($user['userid']);
	}
	
	public function LoginExt($username, $password, $autologin = false){
		$ret = new stdClass();
		$ret->error = $this->Login($username, $password, $autologin);
		
		$user = $this->_usercache;
		if (is_null($user) || empty($user)){
			return $ret;
		}
		
		$ret->user = array(
			"id" => $user['userid'],
			"agr" => $user['agreement']
		);
		
		return $ret;
	}
	
	public function Logout(){
		$session = $this->module->session;
		$sessionKey = Abricos::CleanGPC('c', $session->cookieName, TYPE_STR);
		setcookie($session->cookieName, '', TIMENOW, $session->sessionPath);
		UserQuery::SessionRemove($this->db, $sessionKey);
		$this->module->session->Drop('userid');
		$this->module->info = array(
			"userid"	=>	0,
			"group"		=> array(1),
			"username"	=> "Guest"
		);
	}
	
	
	public function UserVerifyName($username) {
		$username = strtolower(trim($username));
		
		$length = strlen($username);
		if ($length == 0) {
			return false;
		} else if ($length < 3) {
			return false;
		} else if ($length > 50) {
			return false;
		}else if ( preg_match("/^[^a-z]{1}|[^a-z0-9_.-]+/i", $username) ){
			return false;
		} 
		// $username = htmlspecialchars_uni($username);
		return true;
	}

	public function UserPasswordCrypt($password, $salt){
		return md5(md5($password).$salt);
	}
	
	public function UserCreateSalt() {
		$salt = '';
		for ($i = 0; $i < 3; $i++) {
			$salt .= chr(rand(32, 126));
		}
		return $salt;
	}

	public static function EmailValidate($address) {
		if (function_exists('filter_var')) { //Introduced in PHP 5.2
			if(filter_var($address, FILTER_VALIDATE_EMAIL) === FALSE) {
				return false;
			} else {
				return true;
			}
		} else {
			return preg_match('/^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9_](?:[a-zA-Z0-9_\-](?!\.)){0,61}[a-zA-Z0-9_-]?\.)+[a-zA-Z0-9_](?:[a-zA-Z0-9_\-](?!$)){0,61}[a-zA-Z0-9_]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/', $address);
		}
	}
	
	
	public function RegisterCheck($username, $email, $checkMail = true){
		if ($checkMail && !UserManager::EmailValidate($email)){
			return 4;
		}
		if (!$this->UserVerifyName($username)){
			return 3;
		}else{
			$retcode = UserQueryExt::UserExists($this->db, $username, $email);
			if ($retcode > 0){ return $retcode; }
		}
		
		return 0;		
	}
	
	public function UserDomainUpdate($userid = 0){
		// если в конфиге домен не определен, то нечего обновлять
		if (empty(Abricos::$DOMAIN)){ 
			return; 
		}
		if ($userid == 0){
			$userid = $this->userid;
		}
		
		UserQueryExt::UserDomainUpdate($this->db, $userid, Abricos::$DOMAIN);
	}
	
	/**
	 * Зарегистрировать пользователя, в случае неудачи вернуть номер ошибки:
	 * 0 - ошибки нет, пользователь успешно зарегистрирован,
	 * 1 - пользователь с таким логином уже зарегистрирован, 
	 * 2 - пользователь с таким email уже зарегистрирован
	 * 3 - ошибка в имени пользователя,
	 * 4 - ошибка в emial
	 * 
	 * @param String $username
	 * @param String $password
	 * @param String $email
	 * @param Boolean $sendMail
	 * @return Integer
	 */
	public function Register($username, $password, $email, $sendMail = true, $checkMail = true){
		$retcode = $this->RegisterCheck($username, $email, $checkMail);
		if ($retcode > 0){ return $retcode; }

		$salt = $this->UserCreateSalt();
		
		$user = array();
		$user["username"] = $username;
		$user["joindate"] = TIMENOW;
		$user["salt"] = $salt;
		$user["password"] = $this->UserPasswordCrypt($password, $salt);
		$user["email"] = $email;
		
		// Добавление пользователя в базу
		if ($this->IsAdminRole()){
			UserQueryExt::UserAppend($this->db, $user, User::UG_REGISTERED);
		}else{
			$userid = UserQueryExt::UserAppend($this->db, $user, User::UG_GUEST, $_SERVER['REMOTE_ADDR'], true);
			Abricos::$user->AntibotUserDataUpdate($userid);
			$this->UserDomainUpdate($userid);
		}
		
		if (!$sendMail){ 
			return 0; 
		}
		
		$this->ConfirmEmailSend($user);
			
		return 0;
	}
	
	private function ConfirmEmailSend($user){
		$host = $_SERVER['HTTP_HOST'] ? $_SERVER['HTTP_HOST'] : $_ENV['HTTP_HOST'];
		$link = "http://".$host."/user/activate/".$user["userid"]."/".$user["activateid"];
		
		$brick = Brick::$builder->LoadBrickS('user', 'templates', null, null);
		
		$subject = $brick->param->var['reg_mailconf_subj'];
		$body = nl2br(Brick::ReplaceVarByData($brick->param->var['reg_mailconf'], array(
			"actcode" => $user["activateid"],
			"username" => $user['username'],
			"link" => $link,
			"sitename" => Brick::$builder->phrase->Get('sys', 'site_name')
		)));
		
		$this->core->GetNotification()->SendMail($user["email"], $subject, $body);
	}
	
	public function ConfirmEmailSendAgain($userid){
		if (!$this->IsAdminRole()){
			return;
		}
		$user = UserQueryExt::User($this->db, $userid);
		$actinfo = UserQueryExt::RegistrationActivateInfo($this->db, $userid);
		$user['activateid'] = $actinfo['activateid'];
		$this->ConfirmEmailSend($user);
	}
	
	/**
	 * Активировать нового пользователя. Возврашает объект в котором св-во error содержит 
	 * код ошибки:
	 * 0 - ошбики нет,
	 * 1 - пользователь не найден,
	 * 2 - пользователь уже активирован 
	 * 
	 * @param integer $userid идентификатор пользователя
	 * @param integer $activeid код активации
	 * @return stdClass
	 */
	public function RegistrationActivate($userid, $activeid = 0){
		
		if (empty($userid)){
			$row = UserQueryExt::RegistrationActivateInfoByCode($this->db, $activeid);
			if (empty($row)){
				sleep(1);
			}else{
				$userid = $row['userid'];
			}
		}
		
		$ret = new stdClass();
		$ret->error = 0;
		$user = UserQuery::User($this->db, $userid);
		if (empty($user)){
			$ret->error = 1;
		}else if ($user['emailconfirm'] == 1){
			$ret->error = 2;
		}else{
			$ret->username = $user['username'];
			
			if ($activeid == 0){
				if (!$this->IsAdminRole()){
					return null;
				}
				$row = UserQueryExt::RegistrationActivateInfo($this->db, $userid);
				$activeid = $row['activateid'];
			}
					
			$ret->error = UserQueryExt::RegistrationActivate($this->db, $userid, $activeid);
			if ($this->IsAdminRole()){
				$ret->user = $this->UserInfo($userid);
			}
		}
		return $ret;
	}
	
	/**
	 * Запросить систему восстановить пароль и вернуть номер ошибки:
	 * 0 - нет ошибки,
	 * 1 - пользователь не найден,
	 * 2 - письмо подверждения восстановить пароль уже отправлено
	 * 
	 * @param string $email E-mail пользователя
	 * @return Integer
	 */
	public function PasswordRestore($email){
		$user = UserQueryExt::UserByEmail($this->db, $email);
		if (empty($user)){ return 1; } // пользователь не найден
		
		$sendcount = UserQueryExt::PasswordSendCount($this->db, $user['userid']);
		if ($sendcount > 0){ return 2; } // письмо уже отправлено
			
		$hash = md5(microtime());
		UserQueryExt::PasswordRequestCreate($this->db, $user['userid'], $hash);
				
		$host = $_SERVER['HTTP_HOST'] ? $_SERVER['HTTP_HOST'] : $_ENV['HTTP_HOST'];
		$link = "http://".$host."/user/recpwd/".$hash;
	
		$sitename = Brick::$builder->phrase->Get('sys', 'site_name');
		
		$brick = Brick::$builder->LoadBrickS('user', 'templates', null, null);
		
		$subject = Brick::ReplaceVarByData($brick->param->var['pwd_mail_subj'], array(
			"sitename" => $sitename
		));
		$body = nl2br(Brick::ReplaceVarByData($brick->param->var['pwd_mail'], array(
			"email"=> $email,
			"link" => $link,
			"username" => $user['username'],
			"sitename" => $sitename
		)));
		
		$this->core->GetNotification()->SendMail($email, $subject, $body);
		
		return 0;
	}
	
	public function TermsOfUse(){
		$brick = Brick::$builder->LoadBrickS('user', 'termsofuse', null, null);
		
	 	$ret = new stdClass();
	 	$ret->text = $brick->content;
		return $ret;
	}
	
	public function TermsOfUseAgreement(){
		if ($this->userid == 0){ return false; }
		
		UserQueryExt::TermsOfUseAgreement($this->db, $this->userid);
		return true;
	}
	
	public function PasswordRequestCheck($hash){
		$ret = new stdClass();
		$ret->error = 0;
		
		$pwdreq = UserQueryExt::PasswordRequestCheck($this->db, $hash);
		if (empty($pwdreq)){
			$ret->error = 1; 
			sleep(1);
			return $ret;
		}
		$userid = $pwdreq['userid'];
		$user = UserQuery::User($this->db, $userid);
		$ret->email = $user['email'];

		$newpass = cmsrand(100000, 999999);
		$passcrypt = $this->UserPasswordCrypt($newpass, $user['salt']);
		UserQueryExt::PasswordChange($this->db, $userid, $passcrypt);

		$ph = Brick::$builder->phrase;
		$sitename = $ph->Get('sys', 'site_name');
		
		$brick = Brick::$builder->LoadBrickS('user', 'templates', null, null);
		
		$subject = $brick->param->var['pwdres_changemail_subj'];
		$subject = str_replace("%1", $sitename, $subject);
		
		$message = nl2br($brick->param->var['pwdres_changemail']);
		$message = str_replace("%1", $user['username'], $message);
		$message = str_replace("%2", $newpass, $message);
		$message = str_replace("%3", $sitename, $message);
		
		$this->core->GetNotification()->SendMail($user['email'], $subject, $message);
		
		return $ret;
	}
	
	public function UserConfigList($userid, $modname){
		if (!$this->IsChangeUserRole($userid)){ return null; }
		
		return UserQueryExt::UserConfigList($this->db, $userid, $modname);
	}
	
	public function UserConfigValueSave($userid, $modname, $varname, $value){
		if (!$this->IsChangeUserRole($userid)){ return null; }
		UserQueryExt::UserConfigSave($this->db, $userid, $modname, $varname, $value);
	}

	/**
	 * @deprecated
	 */
	public function UserConfigAppend($userid, $modname, $cfgname, $cfgval){
		if (!$this->IsChangeUserRole($userid)){ return null; }
		
		UserQueryExt::UserConfigAppend($this->db, $userid, $modname, $cfgname, $cfgval);
	}

	/**
	 * @deprecated
	 */
	public function UserConfigUpdate($userid, $cfgid, $cfgval){
		if (!$this->IsChangeUserRole($userid)){ return null; }
		
		UserQueryExt::UserConfigUpdate($this->db, $userid, $cfgid, $cfgval);
	}
	
	private $_userFields = null;
	public function UserFieldList(){
		if (!is_null($this->_userFields)){ return $this->_userFields; }
		$rows = UserQueryExt::UserFieldList($this->db);  
		$cols = array();
		while (($row = $this->db->fetch_array($rows))){
			$cols[$row['Field']] = $row; 
		}
		$this->_userFields = $cols;
		return $this->_userFields;
	}
	
	public function UserFieldCacheClear(){
		$this->_userFields = null;
	}
	
	public function UserField($fieldName){
		$fields = $this->UserFieldList();
		return $fields[$fieldName];
	}
	
	public function UserFieldCheck($fieldName){
		$field = $this->UserField($fieldName);
		return !empty($field);
	}
	
}

?>