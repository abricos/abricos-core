<?php
/**
 * Управление ролями пользователя в модуле
 * 
 * @package Abricos
 * @subpackage Core
 * @category UserPermission
 * @copyright Copyright (C) 2008-2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
abstract class Ab_UserPermission {
	
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
		UserQuery::PermissionInstall(Abricos::$db, $this);
	}
	
	/**
	 * Переустановить роли
	 */
	public function Reinstall(){
		$this->GetUserManager();
		UserQuery::PermissionRemove(Abricos::$db, $this);
		UserQuery::PermissionInstall(Abricos::$db, $this);
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
        return Abricos::$user->GetActionRole($this->module->name, $action);
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

?>