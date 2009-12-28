<?php 
/**
 * Модуль "Компания"
 * 
 * @version $Id: module.php 96 2009-10-16 13:10:09Z roosit $
 * @package Abricos 
 * @subpackage Company
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$mod = new CompanyModule();

CMSRegistry::$instance->modules->Register($mod);

class CompanyModule extends CMSModule {
	
	private $_companyManager = null;
	
	public function __construct(){
		// Версия модуля
		$this->version = "0.1.2";
		
		// Название модуля
		$this->name = "company";
		
		$this->permission = new CompanyPermission($this);
	}
	
	public function GetCompanyManager(){
		if (is_null($this->_companyManager)){
			require_once CWD.'/modules/company/includes/manager.php';
			$this->_companyManager = new CompanyManager($this);
		}
		return $this->_companyManager;
	}
}

class CompanyAction {
	const COMPANY_VIEW = 10;
	const COMPANY_ADMIN = 50;
}

class CompanyPermission extends CMSPermission {
	
	public function CompanyPermission(CompanyModule $module){
		
		$defRoles = array(
			new CMSRole(CompanyAction::COMPANY_VIEW, 1, USERGROUPID_REGISTERED),
			new CMSRole(CompanyAction::COMPANY_ADMIN, 1, USERGROUPID_ADMINISTRATOR)
		);
		
		parent::CMSPermission($module, $defRoles);
	}
	
	public function GetRoles(){
		$roles = array();
		$roles[CompanyAction::COMPANY_VIEW] = $this->CheckAction(CompanyAction::COMPANY_VIEW);
		$roles[CompanyAction::COMPANY_ADMIN] = $this->CheckAction(CompanyAction::COMPANY_ADMIN);
		return $roles;
	}
}


?>