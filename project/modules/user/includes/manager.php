<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage User
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

/**
 * Менеджер управления пользователями
 * @package CMSBrick
 * @subpackage User
 */
class CMSUserManager {
	
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
	
	public function CMSUserManager(CMSRegistry $registry){
		$this->registry = $registry;
		$this->session = $registry->session;
		$this->db = $registry->db;
	}
	
	public function IsAdministrator(){
		return $this->session->IsAdminMode();
	}
	
	public function IsRegister(){
		return $this->session->IsRegistred();
	}
	
	/**
	 * Получить список модулей
	 */
	public function ModuleList(){
		if (!$this->IsAdministrator()){ return null; }
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
		if ($this->IsAdministrator() || $userid == $this->session->userinfo['userid']){
			return CMSQUser::UserPrivateInfo($this->db, $userid);
		}else{
			return CMSQUser::UserPublicInfo($this->db, $username);
		}
	}
	
	public function UserList($page, $limit){
		if (!$this->IsAdministrator()){ return null; }
		return CMSQUser::UserList($this->db, $page, $limit);
	}
	
	public function UserCount(){
		if (!$this->IsAdministrator()){ return null; }
		return CMSQUser::UserCount($this->db);
	}
	
	public function UserSave($d){
		if (!$this->IsRegister()){ return; }
		$user = CMSQUser::UserById($this->db, $d->id);
		if (empty($user)){ return; }
		
		// данные для внесения в бд
		$data = array();

		// смена пароля
		if (!empty($d->pass)){
			$data['password'] = CMSModuleUser::UserPasswordCrypt($d->pass, $user['salt']);
		}
		
		if ($this->IsAdministrator()){
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
}

?>