<?php
/**
 * Модуль "Менеджер файлов"
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage FileManager
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$mod = new CMSModuleFileManager();
CMSRegistry::$instance->modules->Register($mod);

/**
 * Модуль "Менеджер файлов"
 * 
 * @package Abricos
 * @subpackage FileManager
 */
class CMSModuleFileManager extends CMSModule {
	
	/**
	 * @var FileManager
	 */
	private $_fileManager = null;
	
	public function __construct(){
		$this->version = "0.3";
		
		$this->name = "filemanager";
		$this->takelink = "filemanager";
		
		$this->permission = new FileManagerPermission($this);
	}
	
	public function GetContentName(){
		$adress = $this->registry->adress;
		$cname = parent::GetContentName();
		
		if($adress->level > 2 && $adress->dir[1] == 'i'){
			$cname = 'file';
		}
		return $cname;
	}
	
	/**
	 * Получить менеджер
	 *
	 * @return FileManager
	 */
	public function GetFileManager(){
		if (is_null($this->_fileManager)){
			require_once CWD.'/modules/filemanager/includes/manager.php';
			$this->_fileManager = new FileManager($this);
		}
		return $this->_fileManager;
	}
}

class FileManagerAction {
	const FILES_VIEW = 10;
	const FILES_UPLOAD = 30;
	const FILES_ADMIN = 50;
}

class FileManagerPermission extends CMSPermission {
	
	public function FileManagerPermission(CMSModuleFileManager $module){
		
		$defRoles = array(
			new CMSRole(FileManagerAction::FILES_VIEW, 1, USERGROUPID_ALL),
			new CMSRole(FileManagerAction::FILES_UPLOAD, 1, USERGROUPID_MODERATOR),
			new CMSRole(FileManagerAction::FILES_ADMIN, 1, USERGROUPID_ADMINISTRATOR)
		);
		
		parent::CMSPermission($module, $defRoles);
	}
	
	public function GetRoles(){
		$roles = array();
		$roles[FileManagerAction::FILES_VIEW] = $this->CheckAction(FileManagerAction::FILES_VIEW);
		$roles[FileManagerAction::FILES_UPLOAD] = $this->CheckAction(FileManagerAction::FILES_UPLOAD);
		$roles[FileManagerAction::FILES_ADMIN] = $this->CheckAction(FileManagerAction::FILES_ADMIN);
		return $roles;
	}
}


?>