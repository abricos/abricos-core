<?php
/**
 * Управление ролями пользователя в модуле
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Core
 * @category UserPermission
 * @copyright Copyright (C) 2008-2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
abstract class Ab_UserPermission {
	
	private static $permission = null;
	
	/**
	 * Модуль
	 * 
	 * @var Ab_Module
	 */
	public $module = null;
	public $defRoles = null;
	
	public function __construct(Ab_Module $module, $defRoles = array()){
		$this->module = $module;
		$this->defRoles = $defRoles;
	}

	/**
	 * @return UserManager
	 */
	public function GetUserManager(){
		return Abricos::GetModule('user')->GetManager();
	}
	
	/**
	 * Установить роли
	 */
	public function Install(){
		$this->GetUserManager();
		UserQueryExt::PermissionInstall(Abricos::$db, $this);
	}
	
	/**
	 * Переустановить роли
	 */
	public function Reinstall(){
		$this->GetUserManager();
		UserQueryExt::PermissionRemove(Abricos::$db, $this);
		UserQueryExt::PermissionInstall(Abricos::$db, $this);
	}
	
	/**
	 * Абстрактный метод. Запрос ролей по умолчанию
	 */
	public function GetRoles(){
		return null;
	}

	/**
	 * Проверить роль текущего пользователя
	 * 
	 * @param integer $action идентификатор действия в текущем модуле
	 */
	public function CheckAction($action){
		if (is_null(Ab_UserPermission::$permission)){
			$this->LoadRoles();
		}
		
		// Суперадмину можно все
		if (Abricos::$user->IsSuperAdmin()){ return 1; }
		
		$mname = $this->module->name;
		if (isset(Ab_UserPermission::$permission[$mname][$action])){
			return Ab_UserPermission::$permission[$mname][$action];
		}
		return -1;
	}
	
	private function LoadRoles(){
		$modUser = Abricos::GetModule('user');
		$db = Abricos::$db;
		
		$rows = UserQuery::UserRole($db, $modUser->info);
		$perm = array();
		while (($row = $db->fetch_array($rows))){
			$mod = $row['md'];
			if (!$perm[$mod]){
				$perm[$mod] = array();
			}
			$perm[$mod][$row['act']] = $row['st'];
		}
		Ab_UserPermission::$permission = $perm;
	}
}

/**
 * Роль пользователя
 * 
 * В основном используется для объявления ролей пользователя по умолчанию 
 * в модуле. См. {@link Ab_UserPermission}
 */
class Ab_UserRole {

	/**
	 * Действие
	 * @var integer
	 */
	public $action = 0;

	/**
	 * Статус: -1 - не определена, 0-запретить, 1-разрешить.
	 *
	 * @var Integer
	 */
	public $status = 0;

	/**
	 * Идентификатор группы пользователя
	 * @var string
	 */
	public $groupkey = "";

	public function __construct($action, $groupkey, $status = 1){
		$this->action = $action;
		$this->groupkey = $groupkey;
		$this->status = $status;
	}
}

/**
 * Системные группы пользователей 
 */
class Ab_UserGroup {

	/**
	 * Гость
	 * @var string
	 */
	const GUEST = 'guest';

	/**
	 * Авторизованный пользователь
	 * @var string
	 */
	const REGISTERED = 'register';

	/**
	 * Администратор
	 * @var string
	 */
	const ADMIN = 'admin';
}

/* * * * * * * * * * * Устаревшии версии классов * * * * * * * * * * * */

/**
* Устаревший. Оставлен для совместимости.
 * @package Abricos
 * @subpackage Deprecated
 * @deprecated устарел начиная с версии 0.5.5, необходимо использовать {@link Ab_UserPermission}
 * @ignore
*/
abstract class CMSPermission extends Ab_UserPermission {
	
	// потдержка предыдущих версий ядра
	public function CMSPermission(Ab_Module $module, $defRoles = array()){
		
		$old = $defRoles;
		$defRoles = array();
		
		foreach ($old as $role){
			$groupkey = '';
			switch ($role->userid){
			case User::UG_GUEST: $groupkey = Ab_UserGroup::GUEST; break;
			case User::UG_REGISTERED: $groupkey = Ab_UserGroup::REGISTERED; break;
			case User::UG_ADMIN: $groupkey = Ab_UserGroup::ADMIN; break;
			}
			if (empty($groupkey)){ continue; }
			
			array_push($defRoles, new Ab_UserRole($role->action, $groupkey, $role->status));
		}
		
		parent::__construct($module, $defRoles);
	}
}

/**
 * Устаревший. Оставлен для совместимости.
 * @package Abricos
 * @subpackage Deprecated
 * @deprecated устарел начиная с версии 0.5.5, необходимо использовать {@link Ab_UserRole}
 * @ignore
 */
class CMSRole {
	
	/**
	 * Действие
	 * @var integer
	 */
	public $action = 0;
	
	/**
	 * Статус: 0-запретить, 1-разрешить.
	 * 
	 * @var Integer
	 */
	public $status = 0;

	/**
	 * Идентификатор группы/пользователя
	 * 
	 * @var integer
	 */
	public $userid = 0;
	
	/**
	 * Статус идентификатор $userid: 0-группа, 1-пользователь
	 * @var integer
	 */
	public $usertype = 0;
	
	public function CMSRole($action, $status = 0, $groupid = 0){
		$this->action = $action;
		$this->status = $status;
		$this->userid = $groupid;
	}
}
?>