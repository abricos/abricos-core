<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage User
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

/**
 * Менеджер управления пользователями
 * @package Abricos
 * @subpackage User
 */
class UserManager {
	
	/**
	 * Ядро
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	/**
	 * Сессия пользователя
	 *
	 * @var CMSSysSession
	 */
	public $session = null;
	
	/**
	 * База данных
	 *
	 * @var CMSDatabase
	 */
	public $db = null;
	
	/**
	 * Модуль
	 * 
	 * @var CMSModuleUser
	 */
	public $module = null;
	
	public $user = null;
	
	public function UserManager(CMSModuleUser $module){
		$this->module = $module;
		$this->registry = $module->registry;
		$this->session = $module->registry->session;
		$this->user = $this->session->userinfo;
		$this->db = $module->registry->db;
	}
	
	public function IsRegister(){
		return $this->session->IsRegistred();
	}
	
	public function IsAdminRole(){
		return $this->module->permission->CheckAction(UserAction::USER_ADMIN) > 0;
	}
	
	public function ChangeProfile($d){
		if (!$this->IsRegister()){ return; }
		
		$user = CMSQUser::UserById($this->db, $d->id);
		if (empty($user)){ return; }
		
		if (!$this->IsAdminRole()){
			if ($user['userid'] != $this->user['userid']){
				return;
			}
		}
		
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
		
		if ($this->IsAdminRole()){
			// смена емайл
			$data['email'] = $d->eml;
			$data['usergroupid'] = $d->ugp;
		}else{
			if ($this->session->userinfo['userid'] != $d->id){
				// haker?
				return;
			}
		}
		$data['realname'] = $d->rnm;
		$data['sex'] = $d->sex;
		$data['birthday'] = $d->bday;
		$data['homepagename'] = $d->hpnm;
		$data['homepage'] = $d->hp;
		$data['icq'] = $d->icq;
		$data['skype'] = $d->skype;
		CMSQUser::UserSave($this->db, $d->id, $data);
	}
	
	/**
	 * Добавить пользователя в базу без подверждения email
	 *  
	 * @param string $username
	 * @param string $password
	 * @param string $email
	 * @return Integer
	 */
	public function UserAppend($username, $password, $email){
		if (!$this->UserVerifyName($username)){
			return 3;
		}else{
			$retcode = CMSQUser::UserExists($this->db, $username, $email);
			if ($retcode > 0){ return $retcode; }
		}

		$salt = $this->UserCreateSalt();
		
		$user = array();
		$user["username"] = $username;
		$user["joindate"] = TIMENOW;
		$user["salt"] = $salt;
		$user["password"] = $this->UserPasswordCrypt($password, $salt);
		$user["email"] = $email;
		
		// Добавление юзера в базу
		CMSQUser::UserAdd($this->db, $user, USERGROUPID_REGISTERED);
	}
	
	/**
	 * Зарегистрировать пользователя, в случае неудачи вернуть
	 * номер ошибки:
	 * 0 - ошибки нет, пользователь успешно зарегистрирован,
	 * 1 - пользователь с таким логином уже зарегистрирован, 
	 * 2 - пользователь с таким email уже зарегистрирован
	 * 3 - ошибка в имени пользователя,
	 * 
	 * @param String $username
	 * @param String $password
	 * @param String $email
	 * @param Boolean $sendMail
	 * @return Integer
	 */
	public function UserRegister($username, $password, $email, $sendMail = true){
		
		if (!$this->UserVerifyName($username)){
			return 3;
		}else{
			$retcode = CMSQUser::UserExists($this->db, $username, $email);
			if ($retcode > 0){ return $retcode; }
		}

		$salt = $this->UserCreateSalt();
		
		$user = array();
		$user["username"] = $username;
		$user["joindate"] = TIMENOW;
		$user["salt"] = $salt;
		$user["password"] = $this->UserPasswordCrypt($password, $salt);
		$user["email"] = $email;
		
		// Добавление юзера в базу
		CMSQUser::UserAdd($this->db, $user);
		
		if (!$sendMail){ return 0; }
			
		$host = $_SERVER['HTTP_HOST'] ? $_SERVER['HTTP_HOST'] : $_ENV['HTTP_HOST'];
		$link = "http://".$host."/user/activate/".$user["userid"]."/".$user["activateid"];
		
		$sitename = Brick::$builder->phrase->Get('sys', 'site_name');
		$subject = Brick::$builder->phrase->Get('user', 'reg_mailconf_subj'); 
		$message = sprintf(nl2br(Brick::$builder->phrase->Get('user', 'reg_mailconf')), $user['username'], $link, $sitename);
		
		CMSModuleSys::Notification($email, $subject, $message);
		
		return 0;
	}
	
	/**
	 * Проверить данные авторизации и вернуть номер ошибки: 
	 * 0 - нет ошибки,
	 * 1 - ошибка в имени пользователя, 
	 * 2 - неверное имя пользователя или пароль, 
	 * 3 - не заполнены обязательные поля, 
	 * 4 - пользователь заблокирован,
	 * 5 - пользователь не прошел верификацию email
	 * 
	 * @param String $username
	 * @param String $password
	 * @return Integer
	 */
	public function UserLogin($username, $password){
		$username = trim($username);
		$password = trim($password);
		
		if (empty($username) || empty($password)){ return 3; }
	
		if (!$this->UserVerifyName($username)){ return 1; }
		
		$user = CMSSqlQuery::QueryGetUserInfoByUsername($this->db, $username);
		if (empty($user)){ return 2; }
		if ($user['usergroupid'] == 1){ return 4; }
		if ($user['usergroupid'] < 4){ return 5; }
		$passcrypt = $this->UserPasswordCrypt($password, $user["salt"]);
		if ($passcrypt != $user["password"]){ return 2; }
		return 0;
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
	public function UserPasswordRestore($email){
		$user = CMSSqlQueryUser::UserByEMail($this->db, $email);
		if (empty($user)){ return 1; } // пользователь не найден
		
		$countsend = CMSSqlQueryUser::PwdCountSend($this->db, $user['userid']);
		if ($countsend > 0){ return 2; } // письмо уже отправлено
			
		$hash = md5(microtime());
		CMSSqlQueryUser::PwdReqCreate($this->db, $user['userid'], $hash);
				
		$host = $_SERVER['HTTP_HOST'] ? $_SERVER['HTTP_HOST'] : $_ENV['HTTP_HOST'];
		$link = "http://".$host."/user/recpwd/".$hash;
	
		$sitename = Brick::$builder->phrase->Get('sys', 'site_name');
		
		$subject = sprintf(Brick::$builder->phrase->Get('user', 'pwd_mail_subj'), $sitename);
		$message = sprintf(nl2br(Brick::$builder->phrase->Get('user', 'pwd_mail')), $email, $link, $user['username'], $sitename);
		
		CMSModuleSys::Notification($email, $subject, $message);
		
		return 0;
	}
	
	public function UserCreateSalt() {
		$length = 3;
		$salt = '';
		for ($i = 0; $i < $length; $i++) {
			$salt .= chr(rand(32, 126));
		}
		return $salt;
	} 
	
	public function UserVerifyName(&$username) {
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

	public function UserPasswordCrypt($password, $salt){
		return md5(md5($password).$salt);
	}
	
	
	/**
	 * Получить список модулей
	 */
	public function ModuleList(){
		if (!$this->IsAdminRole()){ return null; }
		
		$this->registry->modules->RegisterAllModule();
		$modules = $this->registry->modules->GetModules();
		$ret = array();
		foreach ($modules as $name => $mod){
			if ($name == 'user' || $name == 'ajax'){ continue; }
			array_push($ret, array(
				"id" => $name,
				"nm" => $name,
				"vs" => $mod->version,
				"rv" => $mod->revision
			));
		}
		return $ret;
	}
	
	/**
	 * Получить полную информацию о пользователе.
	 * Информация доступна владельцу и администратору.
	 *
	 * @param Integer $userid
	 * @return resource
	 */
	public function UserInfo($userid, $username){
		if ($this->IsAdminRole() || $userid == $this->session->userinfo['userid']){
			return CMSQUser::UserPrivateInfo($this->db, $userid);
		}else{
			return CMSQUser::UserPublicInfo($this->db, $username);
		}
	}
	
	public function UserList($page, $limit){
		if (!$this->IsAdminRole()){ return null; }
		return CMSQUser::UserList($this->db, $page, $limit);
	}
	
	public function UserCount(){
		if (!$this->IsAdminRole()){ return null; }
		return CMSQUser::UserCount($this->db);
	}
	
}

?>