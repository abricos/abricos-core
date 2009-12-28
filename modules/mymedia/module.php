<?php 
/**
 * Модуль MyMedia
 * 
 * @version $Id: module.php 96 2009-10-16 13:10:09Z roosit $
 * @package Abricos 
 * @subpackage MyMedia
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$mod = new CMSModMyMedia();

CMSRegistry::$instance->modules->Register($mod);

class CMSModMyMedia extends CMSModule {
	
	private $_myMediaManager = null;
	
	/**
	 * Конструктор
	 */
	public function __construct(){
		// Версия модуля
		$this->version = "0.1";
		
		// Название модуля
		$this->name = "mymedia";
		
		$this->takelink = "mymedia";
		
		$this->permission = new MyMediaPermission($this);
	}
	
	public function GetMyMediaManager(){
		if (is_null($this->_myMediaManager)){
			require_once CWD.'/modules/mymedia/includes/manager.php';
			$this->_myMediaManager = new MyMediaManager($this);
		}
		return $this->_myMediaManager;
	}
	
	public function GetContentName(){
		if ($this->permission->CheckAction(MyMediaAction::MYMEDIA_APPEND) < 1){
			return '';
		}
		$cname = '';
		
		if ($this->registry->adress->level >= 3 && 
			$this->registry->adress->dir[1] == 'upload'){
			$cname = 'upload';
		}
		
		return $cname;
	}
}

class MyMediaAction {
	const MYMEDIA_VIEW = 10;
	const MYMEDIA_APPEND = 30;
	const MYMEDIA_ADMIN = 50;
}

class MyMediaPermission extends CMSPermission {
	
	public function MyMediaPermission(CMSModMyMedia $module){
		
		$defRoles = array(
			new CMSRole(MyMediaAction::MYMEDIA_VIEW, 1, USERGROUPID_ALL),
			new CMSRole(MyMediaAction::MYMEDIA_APPEND, 1, USERGROUPID_REGISTERED),
			new CMSRole(MyMediaAction::MYMEDIA_ADMIN, 1, USERGROUPID_ADMINISTRATOR)
		);
		
		parent::CMSPermission($module, $defRoles);
	}
	
	public function GetRoles(){
		$roles = array();
		$roles[MyMediaAction::MYMEDIA_VIEW] = $this->CheckAction(MyMediaAction::MYMEDIA_VIEW);
		$roles[MyMediaAction::MYMEDIA_APPEND] = $this->CheckAction(MyMediaAction::MYMEDIA_APPEND);
		$roles[MyMediaAction::MYMEDIA_ADMIN] = $this->CheckAction(MyMediaAction::MYMEDIA_ADMIN);
		return $roles;
	}
}


?>