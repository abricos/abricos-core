<?php
/**
 * @version $Id: manager.php 183 2009-11-20 13:16:15Z roosit $
 * @package Abricos
 * @subpackage Company
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

class CompanyManager {
	
	/**
	 * 
	 * @var CompanyModule
	 */
	public $module = null;
	
	/**
	 * 
	 * @var CMSDatabase
	 */
	public $db = null;
	
	public $user = null;
	
	public function CompanyManager(CompanyModule $module){
		
		$this->module = $module;
		$this->db = $module->registry->db;
		
		$this->user = $module->registry->session->userinfo;
	}
	
	public function IsAdminRole(){
		return $this->module->permission->CheckAction(CompanyAction::COMPANY_ADMIN) > 0;
	}
	
	public function IsViewRole(){
		return $this->module->permission->CheckAction(CompanyAction::COMPANY_VIEW) > 0;
	}

	private function GetCalendarManager(){
		$modCal = Brick::$modules->GetModule('calendar');
		if (empty($modCal)){ return null; } 
		return $modCal->GetManager();
	}
	
	public function DSProcess($name, $rows){
		switch ($name){
			case 'postlist':
				foreach ($rows->r as $r){
					if ($r->f == 'a'){ $this->PostAppend($r->d); }
					if ($r->f == 'u'){ $this->PostUpdate($r->d); }
				}
				break;
			case 'deptlist':
				foreach ($rows->r as $r){
					if ($r->f == 'a'){ $this->DeptAppend($r->d); }
					if ($r->f == 'u'){ $this->DeptUpdate($r->d); }
				}
				break;
			case 'employee':
				foreach ($rows->r as $r){
					if ($r->f == 'a'){ $this->EmployeeAppend($r->d); }
					if ($r->f == 'u'){ $this->EmployeeUpdate($r->d); }
				}
				break;
			case 'employeelist':
				foreach ($rows->r as $r){
					if ($r->f == 'd'){ $this->EmployeeRemove($r->d->id); }
				}
				break;
			case 'calperm':
				foreach ($rows->r as $r){
					if ($r->f == 'u'){ 
						$this->CalendarOptionsUpdate($rows->p->userid, $r->d); 
					}
				}
				break;
			case 'task':
				foreach ($rows->r as $r){
					if ($r->f == 'a'){ 
						$this->CalendarTaskAppend($r->d); 
					}
					if ($r->f == 'u'){ 
						$this->CalendarTaskUpdate($r->d); 
					}
					if ($r->f == 'd'){ 
						$this->CalendarTaskRemove($r->d->id); 
					}
				}
				break;
			case 'userconfig':
				foreach ($rows->r as $r){
					if ($r->f == 'u'){ 
						$this->UserConfigUpdate($r->d);
					}
					if ($r->f == 'a'){
						$this->UserConfigAppend($r->d);
					} 
				}
				break;
			default:
				$this->GetCalendarManager()->DSProcess($name, $rows);
				break;
		}
	}
	
	public function DSGetData($name, $rows){
		$p = $rows->p;
		switch ($name){
			case 'days':
				return $this->CalendarDays($p->uid, $p->days); 
			case 'employeelist':
				return $this->EmployeeList(); 
			case 'employee':
				if ($p->userid > 0){
					return $this->EpmloyeeByUserId($p->userid);
				}
				return $this->Employee($p->empid);
			case 'postlist':
				return $this->PostList(); 
			case 'calperm':
				return $this->CalendarPermission($p->userid); 
			case 'deptlist':
				return $this->DeptList(); 
			case 'userconfig':
				return $this->UserConfigList(); 
			default:
				return $this->GetCalendarManager()->DSGetData($name, $rows);
		}
		
		return null;
	}
	
	
	private function UserConfigCheckVarName($name){
		if (!$this->IsViewRole()){ return false; }
		switch($name){
			case "se-myfilter":
				return true;
		}
		return false;
	}
	
	private function UserConfigCheckAccess($id){
		$info = CMSQSys::UserConfigInfo($this->db, $id);
		if (empty($info) || $info['uid'] != $this->user['userid']){ 
			return false; 
		}
		return true;
	}
	
	public function UserConfigList(){
		if (!$this->IsViewRole()){ return null; }
		$modSys = Brick::$modules->GetModule('sys');
		return CMSQSys::UserConfigList($this->db, 'company', $this->user['userid']);
	}

	public function UserConfigAppend($d){
		if (!$this->UserConfigCheckVarName($d->nm)){
			return;
		}
		CMSQSys::UserConfigAppend($this->db, 'company', $this->user['userid'], $d->nm, $d->vl);
	}
	
	public function UserConfigUpdate($d){
		if (!$this->UserConfigCheckVarName($d->nm) || 
			!$this->UserConfigCheckAccess($d->id)){
			return;
		}
		CMSQSys::UserConfigUpdate($this->db, $d->id, $d->nm, $d->vl);
	}
	
	public function UserConfigRemove($id){
		 if (!$this->UserConfigCheckAccess($id)){ return; }
	}
	
	public function CalendarTaskAppend($d){
		if (!$this->IsViewRole()){ return null; }
		$calMan = $this->GetCalendarManager();
		$d->own = 'cmpn';
		$calMan->TaskAppend($d);
	}
	
	public function CalendarTaskUpdate($d){
		if (!$this->IsViewRole()){ return null; }
		$calMan = $this->GetCalendarManager();
		$calMan->TaskUpdate($d);
	}
	
	public function CalendarTaskRemove($taskid){
		if (!$this->IsViewRole()){ return null; }
		$calMan = $this->GetCalendarManager();
		$calMan->TaskRemove($taskid);
	}
	
	public function CalendarDays($userid, $data){
		if (!$this->IsViewRole()){ return null; }
		$this->GetCalendarManager();
		
		if ($this->user['userid'] == $userid){
			return CalendarQuery::Days($this->db, $userid, $data);
		}
			
		$cemp = CompanyQuery::EmployeeByUserId($this->db, $this->user['userid'], true);
		$emp = CompanyQuery::EmployeeByUserId($this->db, $userid, true);
		
		if (empty($cemp) || empty($emp) || $cemp['nop'] > 0 || $emp['nop'] > 0){
			return null;
		}
		if ($emp['lvl'] < $cemp['lvl']){
			if (!CompanyQuery::CalendarCheckAccess($this->db, $emp['id'], $cemp['id'])){
				return null;
			}
		} 
	
		return CompanyQuery::Days($this->db, $userid, $data);
	}
	
	public function CalendarOptionsUpdate($userid, $d){
		if (!$this->IsViewRole()){ return null; }
		if ($this->user['userid'] != $userid){ return null; }
		$empinfo = CompanyQuery::EmployeeByUserId($this->db, $userid, true);
		$curr = CompanyQuery::CalendarPermission($this->db, $userid, true);
		$calPermId = $curr['cpid'] * 1;
		
		// @TODO Необходимо организовать проверку входных данных
		if ($calPermId > 0){
			CompanyQuery::CalendarOptionsUpdate($this->db, $empinfo['id'], $d);
		}else{
			CompanyQuery::CalendarOptionsAppend($this->db, $empinfo['id'], $d);
		}
	}
	
	public function CalendarPermission($userid){
		if (!$this->IsViewRole()){ return null; }
		if ($this->user['userid'] != $userid){ return null; }
		return CompanyQuery::CalendarPermission($this->db, $userid);
	}
	
	public function EmployeeRemove($empid){
		if (!$this->IsAdminRole()){ return; }
		CompanyQuery::EmployeeRemove($this->db, $empid);
	}
	
	public function EmployeeUpdate($d){
		if (!$this->IsAdminRole()){ return; }
		CompanyQuery::EmployeeUpdate($this->db, $d);
	}
	
	public function EmployeeAppend($d){
		$ret = array();
		$ret['err'] = 101;
		if (!$this->IsAdminRole()){ return $ret; }
		$username = $d->unm;
		
		if (empty($username)){ return $ret; }
		$userManager = $this->module->registry->modules->GetModule('user')->GetUserManager();
		$user = CMSQUser::UserPrivateInfoByUserName($this->db, $username, true);
		if (empty($user)){
			$ret['err'] = $userManager->UserAppend($username, $d->upwd, $d->ueml);
			if ($ret['err'] > 0){ return $ret; }
			$user = CMSQUser::UserPrivateInfoByUserName($this->db, $username, true);
		}
		$exist = CompanyQuery::EmployeeByUserId($this->db, $user['id'], true);
		
		if (!empty($exist)){ // на эту учетку уже есть сотрудник
			$ret['err'] = 102;
			return $ret;
		}
		$d->uid = $user['id'];

		CompanyQuery::EmployeeAppend($this->db, $d);
		 
		$ret['err'] = 0;
		return $ret;
	}
	
	public function EpmloyeeByUserId($userid){
		if (!$this->IsViewRole()){ return null; }
		$empinfo = CompanyQuery::EmployeeByUserId($this->db, $userid, true);
		if ($this->IsAdminRole() || $userid == $this->user['userid']){
			return CompanyQuery::EmployeePrivateInfo($this->db, $empinfo['id']); 
		}
		return CompanyQuery::Employee($this->db, $empinfo['id']);
	}
	
	public function Employee($empid){
		if (!$this->IsViewRole()){ return null; }
		if ($this->IsAdminRole()){
			return CompanyQuery::EmployeePrivateInfo($this->db, $empid); 
		}
		return CompanyQuery::Employee($this->db, $empid);
	}
	
	public function EmployeeList(){
		if (!$this->IsViewRole()){ return null; }
		return CompanyQuery::EmployeeList($this->db);
	}
	
	public function PostList(){
		if (!$this->IsViewRole()){ return null; }
		return CompanyQuery::PostList($this->db);
	}
	
	public function PostAppend($data){
		if (!$this->IsAdminRole()){ return null; }
		CompanyQuery::PostAppend($this->db, $data);
	}

	public function PostUpdate($data){
		if (!$this->IsAdminRole()){ return null; }
		CompanyQuery::PostUpdate($this->db, $data);
	}

	public function DeptList(){
		if (!$this->IsViewRole()){ return null; }
		return CompanyQuery::DeptList($this->db);
	}
	
	public function DeptAppend($data){
		if (!$this->IsAdminRole()){ return null; }
		CompanyQuery::DeptAppend($this->db, $data);
	}

	public function DeptUpdate($data){
		if (!$this->IsAdminRole()){ return null; }
		CompanyQuery::DeptUpdate($this->db, $data);
	}
	
}

/**
 * Статичные функции запросов к базе данных
 * 
 * @package Abricos
 * @subpackage Company
 */
class CompanyQuery {
	
	public static function Days(CMSDatabase $db, $userid, $data){
		$sql = CalendarQuery::DaysSQL($db, $userid, $data);
		
		$sql .= " AND permlevel >= 1";
		
		return $db->query_read($sql);
	}

	public static function CalendarOptionsAppend(CMSDatabase $db, $empid, $d){
		if ($d->cfg == 'act'){
			$sql = "
				INSERT INTO ".$db->prefix."cmpn_calperm 
					(employeeid, options) VALUES (
					".bkint($empid).",
					'".bkstr($d->ops)."'
				)
			";
		}else{
			$sql = "
				INSERT INTO ".$db->prefix."cmpn_calperm 
					(employeeid, calin, calout) VALUES (
					".bkint($empid).",
					'".bkstr($d->cin)."',
					'".bkstr($d->cout)."'
				)
			";
		}
		$db->query_write($sql);
	}
	
	public static function CalendarOptionsUpdate(CMSDatabase $db, $empid, $d){
		$set = "";
		if ($d->act == 'cfg'){
			$set = "
				options='".bkstr($d->ops)."'
			";
		}else{
			$set = "
				calin='".bkstr($d->cin)."',
				calout='".bkstr($d->cout)."'
			";
		}
		$sql = "
			UPDATE ".$db->prefix."cmpn_calperm 
			SET ".$set."
			WHERE employeeid=".bkint($empid)."
		";
		$db->query_write($sql);
	}
	
	public static function CalendarPermission(CMSDatabase $db, $userid, $firstRow = false){
		$info = CompanyQuery::EmployeeByUserId($db, $userid, true);
		$sql = "
			(SELECT 
				e.employeeid as id,
				c.calpermid as cpid,
				c.calin as cin,
				c.calout as cout,
				c.options as ops
			FROM ".$db->prefix."cmpn_employee e
			LEFT JOIN ".$db->prefix."cmpn_calperm c ON e.employeeid = c.employeeid
			WHERE e.userid=".bkint($userid).")
			UNION
			(SELECT 
				e.employeeid as id,
				'' as cpid,
				'' as cin,
				'' as cout,
				'' as ops
			FROM ".$db->prefix."cmpn_employee e
			LEFT JOIN ".$db->prefix."cmpn_calperm c ON e.employeeid = c.employeeid
			WHERE c.calout REGEXP '#".$info['id']."[^0-9]?')
		";
		if ($firstRow){
			return $db->query_first($sql);
		}
		return $db->query_read($sql);
	}
	
	public static function CalendarCheckAccess(CMSDatabase $db, $empId, $getAccessEmpId){
		$sql = "
			SELECT
				e.employeeid as id
			FROM ".$db->prefix."cmpn_employee e
			LEFT JOIN ".$db->prefix."cmpn_calperm c ON e.employeeid = c.employeeid
			WHERE e.employeeid=".bkint($empId)." AND c.calout REGEXP '#".$getAccessEmpId."[^0-9]?'
		";
		$row = $db->query_first($sql);
		return !empty($row);
	}
	
	public static function EmployeeRemove(CMSDatabase $db, $empid){
		$sql = "
			UPDATE ".$db->prefix."cmpn_employee 
			SET
				deldate=".TIMENOW."
			WHERE employeeid=".bkint($empid)."
		";
		$db->query_write($sql);
	}
	
	public static function EmployeeUpdate(CMSDatabase $db, $d){
		$sql = "
			UPDATE ".$db->prefix."cmpn_employee 
			SET
				lastname='".bkstr($d->elnm)."',
				firstname='".bkstr($d->efnm)."',
				patronymic='".bkstr($d->epnc)."',
				postid=".bkint($d->postid).",
				deptid=".bkint($d->deptid).",
				room='".bkstr($d->rm)."',
				phones='".bkstr($d->phs)."'
			WHERE employeeid=".bkint($d->id)."
		";
		$db->query_write($sql);
	}
	
	public static function EmployeeAppend(CMSDatabase $db, $d){
		$sql = "
			INSERT INTO ".$db->prefix."cmpn_employee 
				(userid, lastname, firstname, patronymic, postid, deptid, room, phones, dateline) VALUES (
				".bkint($d->uid).",
				'".bkstr($d->elnm)."',
				'".bkstr($d->efnm)."',
				'".bkstr($d->epnc)."',
				".bkint($d->postid).",
				".bkint($d->deptid).",
				'".bkstr($d->rm)."',
				'".bkstr($d->phs)."',
				".TIMENOW."
			)
		";
		$db->query_write($sql);
	}
	
	public static function EmployeePrivateInfo(CMSDatabase $db, $empid){
		return CompanyQuery::Employee($db, $empid);
	}
	
	private static function EmployeeSQL(CMSDatabase $db){
		$sql = "
			SELECT 
				e.employeeid as id,
				e.userid as uid,
				u.username as unm,
				e.lastname as elnm,
				e.firstname as efnm,
				e.patronymic as epnc,
				e.postid as postid,
				e.deptid as deptid,
				e.room as rm,
				e.phones as phs,
				p.level as lvl,
				p.level IS NULL as nop
				FROM ".$db->prefix."cmpn_employee e
			LEFT JOIN ".$db->prefix."user u ON u.userid = e.userid
			LEFT JOIN ".$db->prefix."cmpn_post p ON e.postid = p.postid
		";
		return $sql;
	}

	public static function EmployeeByUserId(CMSDatabase $db, $userid, $retarray = false){
		$sql = CompanyQuery::EmployeeSQL($db);
		$sql .= "
			WHERE e.userid=".bkint($userid)."
			LIMIT 1
		";
		if ($retarray){
			return $db->query_first($sql);
		}
		return $db->query_read($sql);
	}
	
	public static function Employee(CMSDatabase $db, $empid){
		$sql = CompanyQuery::EmployeeSQL($db);
		$sql .= "
			WHERE e.employeeid=".bkint($empid)."
			LIMIT 1
		";
		return $db->query_read($sql);
	}
	
	public static function EmployeeList(CMSDatabase $db){
		$sql = "
			SELECT 
				e.employeeid as id,
				e.userid as uid,
				e.lastname as elnm,
				e.firstname as efnm,
				e.patronymic as epnc,
				e.room as rm,
				e.phones as phs,
				e.postid as ptid,
				e.deptid as dtid,
				p.level as lvl,
				p.level IS NULL as nop,
				IF(d.ord IS NULL, 99, d.ord) as ord
			FROM ".$db->prefix."cmpn_employee e
			LEFT JOIN ".$db->prefix."cmpn_post p ON e.postid = p.postid
			LEFT JOIN ".$db->prefix."cmpn_dept d ON e.deptid = d.deptid
			WHERE deldate=0
			ORDER BY ord, dtid, nop, lvl, elnm, efnm
		";
		return $db->query_read($sql);
	}
	
	public static function PostUpdate(CMSDatabase $db, $d){
		$sql = "
			UPDATE ".$db->prefix."cmpn_post
			SET 
				name='".bkstr($d->nm)."',
				level=".bkint($d->lvl)."
			WHERE postid=".bkint($d->id)."
		";
		$db->query_write($sql);
	}
	
	public static function PostAppend(CMSDatabase $db, $d){
		$sql = "
			INSERT INTO ".$db->prefix."cmpn_post (name, level) VALUES (
				'".bkstr($d->nm)."',
				".bkint($d->lvl)."
			)
		";
		$db->query_write($sql);
	}
	
	public static function PostList(CMSDatabase $db){
		$sql = "
			SELECT 
				postid as id,
				name as nm,
				level as lvl
			FROM ".$db->prefix."cmpn_post
			ORDER BY lvl
		";
		return $db->query_read($sql);
	}

	public static function DeptUpdate(CMSDatabase $db, $d){
		$sql = "
			UPDATE ".$db->prefix."cmpn_dept
			SET 
				name='".bkstr($d->nm)."',
				ord=".bkint($d->ord)."
			WHERE deptid=".bkint($d->id)."
		";
		$db->query_write($sql);
	}
	
	public static function DeptAppend(CMSDatabase $db, $d){
		$sql = "
			INSERT INTO ".$db->prefix."cmpn_dept (name, ord) VALUES (
				'".bkstr($d->nm)."',
				".bkint($d->ord)."
			)
		";
		$db->query_write($sql);
	}
	
	public static function DeptList(CMSDatabase $db){
		$sql = "
			SELECT 
				deptid as id,
				name as nm,
				ord
			FROM ".$db->prefix."cmpn_dept
			ORDER BY ord, nm
		";
		return $db->query_read($sql);
	}

}

?>