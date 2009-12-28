<?php
/**
* @version $Id: cmsmodulemanager.php 180 2009-11-18 07:18:48Z roosit $
* @package Abricos
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

abstract class CMSPermission {
	
	private static $permission = null;
	
	/**
	 * Модуль
	 * 
	 * @var CMSModule
	 */
	public $module = null;
	public $defRoles = null;
	
	private $cache = array();
	
	public function CMSPermission(CMSModule $module, $defRoles = array()){
		$this->module = $module;
		$this->defRoles = $defRoles;
	}
	
	public function InstallDefault(){
		CMSQSys::PermissionInstall($this);
	}
	
	public function GetRoles(){
		return null;
	}
	
	public function CheckAction($action){
		$user = CMSRegistry::$instance->session->userinfo;
		
		if (is_null(CMSPermission::$permission)){
			$this->LoadRoles($user);
		}
		
		if (isset($this->cache[$action])){
			return $this->cache[$action];
		}
		
		$roles = CMSPermission::$permission[$this->module->name];
		if (empty($roles)){
			$this->cache[$action] = -1;
			return -1;
		}
		foreach ($roles as $role){
			foreach ($role->actions as $act){
				if ($act == $action){
					$this->cache[$action] = $role->status;
					return $role->status;
				}
			}
		}
		$this->cache[$action] = -1;
		return -1;
	}
	
	private function LoadRoles($user){
		$db = CMSRegistry::$instance->db;
		$rows = CMSQSys::PermissionLoadRoles($user);
		$perm = array();
		
		while (($row = $db->fetch_array($rows))){
			$role = new CMSRole($row['act'], $row['st']);
			$role->ParseSubject($row['sbj']);
			$mod = $row['md'];
			if (!$perm[$mod]){
				$perm[$mod] = array();
			}
			$perm[$mod][$row['id']] = $role;
		}
		CMSPermission::$permission = $perm;
	}
}

class CMSRole {
	
	public $globalUserGroup = -1;
	public $userGroups = array();
	public $users = array();
	
	public $actions = array();
	
	/**
	 * Статус: 0-запретить, 1-разрешить.
	 * 
	 * @var Integer
	 */
	public $status = 0;
	
	public function CMSRole($actions, $status = 0, $globalUserGroup = -1, $userGroups = array(), $users = array()){
		$this->SetActions($actions);
		$this->status = $status;
		
		$this->SetGlobalUserGroup($globalUserGroup);
		$this->SetUserGroups($userGroups);
		$this->SetUsers($users);
	}
	
	public function SetActions($actions){
		if (is_string($actions)){
			$actions = explode(',', $actions);
		}
		$this->actions = is_array($actions) ? $actions : array($actions);
	}
	
	public function ParseSubject($subject){
		$arr = explode(',', $subject);
		$globalUserGroup = -1;
		$userGroups = array();
		$users = array();
		foreach ($arr as $s){
			switch($s[0]){
				case '#':
					$globalUserGroup = intval(str_replace('#', '', $s));
					break;
				case '@':
					array_push($userGroups, intval(str_replace('@', '', $s)));
					break;
				case '@':
					array_push($users, intval(str_replace('$', '', $s)));
					break;
			}
		}
		$this->SetGlobalUserGroup($globalUserGroup);
		$this->SetUserGroups($userGroups);
		$this->SetUsers($users);
	}
	
	public function SetGlobalUserGroup($globalUserGroup){
		$this->globalUserGroup = $globalUserGroup;
	}
	
	public function SetUserGroups($userGroups){
		$this->userGroups = $userGroups;
	}
	
	public function SetUsers($users){
		$this->users = $users;
	}
	
	public function SubjectToString(){
		
		// Префиксы: 
		// # - глобальная группа пользователей,
		// @ - группа пользователей созданная администратором сайта,
		// $ - идентификатор пользователя
		
		$arr = array();
		if ($this->globalUserGroup > -1){
			/*
			for ($i=$this->globalUserGroup;$i<=USERGROUPID_SUPERADMINISTRATOR;$i++){
				array_push($arr, "#".$i);
			}
			/**/
			array_push($arr, "#".$this->globalUserGroup);
		}
		foreach ($this->userGroups as $group){
			array_push($arr, "@".$group);
		}
		foreach ($this->users as $userid){
			array_push($arr, "$".$userid);
		}
		return implode(",", $arr);
	}
	
	public function ActionToString(){
		return implode(",", $this->actions);
	}
	
}

?>