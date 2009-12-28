<?php 
/**
 * Модуль Calendar
 * 
 * @version $Id: module.php 96 2009-10-16 13:10:09Z roosit $
 * @package Abricos 
 * @subpackage MyMedia
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$mod = new CalendarModule();

CMSRegistry::$instance->modules->Register($mod);

class CalendarModule extends CMSModule {
	
	private $_manager = null;
	
	public function __construct(){
		// Версия модуля
		$this->version = "0.1.1";
		
		// Название модуля
		$this->name = "calendar";
		
		$this->permission = new CalendarPermission($this);
	}
	
	public function GetManager(){
		if (is_null($this->_manager)){
			require_once CWD.'/modules/calendar/includes/manager.php';
			$this->_manager = new CalendarManager($this);
		}
		return $this->_manager;
	}
	
}

class CalendarAction {
	const CALENDAR_VIEW = 10;
	const CALENDAR_CHANGE = 20;
	const CALENDAR_ADMIN = 50;
}

class CalendarPermission extends CMSPermission {

	public function CalendarPermission(CalendarModule $module){
		
		$defRoles = array(
			new CMSRole(CalendarAction::CALENDAR_VIEW, 1, USERGROUPID_REGISTERED),
			new CMSRole(CalendarAction::CALENDAR_CHANGE, 1, USERGROUPID_REGISTERED),
			new CMSRole(CalendarAction::CALENDAR_ADMIN, 1, USERGROUPID_ADMINISTRATOR)
		);
		
		parent::CMSPermission($module, $defRoles);
	}
	
	public function GetRoles(){
		$roles = array();
		$roles[CalendarAction::CALENDAR_VIEW] = $this->CheckAction(CalendarAction::CALENDAR_VIEW);
		$roles[CalendarAction::CALENDAR_CHANGE] = $this->CheckAction(CalendarAction::CALENDAR_CHANGE);
		$roles[CalendarAction::CALENDAR_ADMIN] = $this->CheckAction(CalendarAction::CALENDAR_ADMIN);
		return $roles;
	}
	
}

?>