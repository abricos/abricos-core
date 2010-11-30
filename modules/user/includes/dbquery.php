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
 * Внешнии запросы
 */
class UserQueryExt extends UserQuery {
	
	////////////////////////////////////////////////////////////////////
	//                      Запросы по пользователям                  //
	////////////////////////////////////////////////////////////////////
	
	public static function UserConfigList(CMSDatabase $db, $userid, $module){
		$sql = "
			SELECT
				userconfigid as id,
				optname as nm,
				optvalue as vl
			FROM ".$db->prefix."userconfig
			WHERE userid=".bkint($userid)." AND module='".bkstr($module)."'
		";
		return $db->query_read($sql);
	}
	
	public static function UserConfigInfo(CMSDatabase $db, $id){
		$sql = "
			SELECT
				userid as uid,
				optname as nm
			FROM ".$db->prefix."userconfig
			WHERE userconfigid=".bkint($id)."
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function UserConfigAppend(CMSDatabase $db, $userid, $module, $name, $value){
		$sql = "
			INSERT INTO ".$db->prefix."userconfig (module, userid, optname, optvalue) VALUES (
				'".bkstr($module)."',
				".bkint($userid).",
				'".bkstr($name)."',
				'".bkstr($value)."'
			)
		";
		$db->query_write($sql);
	}
	
	public static function UserConfigUpdate(CMSDatabase $db, $userid, $cfgid, $cfgval){
		$sql = "
			UPDATE ".$db->prefix."userconfig
			SET optvalue='".bkstr($cfgval)."'
			WHERE userid=".bkint($userid)." AND userconfigid=".bkint($cfgid)."
		";
		$db->query_write($sql);
	}
	
	public static function UserPrivateInfo(CMSDatabase $db, $userid, $retarray = false){
		$sql = "
			SELECT 
				userid as id, 
				username as unm,
				joindate as dl,
				lastvisit as vst,
				email as eml,
				'' as oldpass,
				'' as pass
			FROM ".$db->prefix."user
			WHERE userid='".bkint($userid)."'
			LIMIT 1
		";
		if (!$retarray)
			return $db->query_read($sql);
		else
			return $db->query_first($sql);
	}

	public static function UserPublicInfo(CMSDatabase $db, $userid, $retarray = false){
		$sql = "
			SELECT 
				userid as id, 
				username as unm,
				joindate as dl,
				lastvisit as vst
			FROM ".$db->prefix."user
			WHERE userid='".bkint($userid)."'
			LIMIT 1
		";
		if (!$retarray)
			return $db->query_read($sql);
		else
			return $db->query_first($sql);
	}
	
	
	public static function UserByEmail(CMSDatabase $db, $email){
		$email = strtolower(trim($email));
		$sql = "
			SELECT * 
			FROM ".$db->prefix."user
			WHERE email = '".bkstr($email)."'
		";
		return $db->query_first($sql);
	}
	
	
	/**
	 * Проверить наличие пользователя в базе по логину или эл. почте.
	 * Вернуть результат проверки:
	 * 0 - такого пользователя в базе нет,
	 * 1 - пользователь с таким логином уже зарегистрирован, 
	 * 2 - пользователь с таким email уже зарегистрирован
	 * 
	 * @param CMSDatabase $db
	 * @param String $username
	 * @param String $email
	 * @return Integer
	 */
	public static function UserExists(CMSDatabase $db, $username, $email){
		$email = strtolower($email);
		$username = htmlspecialchars_uni($username);
		
		$whereEMail = empty($email) ? "" : " OR email = '".bkstr($email)."'";
		
		$sql = "
			SELECT userid, username 
			FROM ".$db->prefix."user 
			WHERE username = '".bkstr($username)."' ".$whereEMail."
		";
		$row = $db->query_first($sql);
		
		if (empty($row)){ return 0; }
		if ($username == $row['username']){ return 1; }
		return 2;
	}
	
	
	/**
	 * Добавить пользователя в базу
	 *
	 * @param CMSDatabase $db
	 * @param Array $user данные пользователя
	 */
	public static function UserAppend(CMSDatabase $db, &$user, $groupid = User::UG_GUEST){
		
		$db->query_write("
			INSERT INTO `".$db->prefix."user` 
				(username, password, email, emailconfirm, joindate, salt) VALUES (
				'".bkstr($user['username'])."', 
				'".bkstr($user['password'])."', 
				'".bkstr($user['email'])."', 
				".($groupid == User::UG_GUEST ? 0 : 1).", 
				'".bkstr($user['joindate'])."', 
				'".bkstr($user['salt'])."'".
		")");
		$userid = $db->insert_id();
		
		UserQueryExt::UserGroupUpdate($db, $userid, array($groupid));
		
		if ($groupid != User::UG_GUEST){ return; }
		
		$usernew = UserQuery::User($db, $userid);
		
		$user["userid"] = $userid;
		$user['activateid'] = cmsrand(0, 100000000);
		$sql = "
			INSERT INTO `".$db->prefix."useractivate` 
				(userid, activateid, joindate) VALUES (
				'".bkint($userid)."', 
				'".bkstr($user['activateid'])."', 
				'".bkstr($user['joindate'])."'
		)";
		$db->query_write($sql);
	}
	
	/**
	 * Активация пользователя
	 *
	 * @param CMSDatabase $db
	 * @param Integer $userid
	 * @param Integer $activateId
	 * @return Integer ошибка: 
	 * 		0 - ошибки нет;
	 * 		1 - пользователь не найден;
	 * 		2 - пользователь уже активирован;
	 * 		3 - прочая ошибка
	 */
	public static function RegistrationActivate(CMSDatabase $db, $userid, $activateId){

		$actData = $db->query_first("
			SELECT * 
			FROM ".$db->prefix."useractivate 
			WHERE userid=".bkint($userid)." AND activateid=".bkint($activateId)."
			LIMIT 1
		");
		
		if (empty($actData) || $actData['activateid'] != $activateId){
			return 3;
		}
		$sql = "
			UPDATE ".$db->prefix."user
			SET emailconfirm=1 
			WHERE userid = ".bkint($userid)."
			LIMIT 1
		";
		$db->query_write($sql);
		UserQueryExt::UserGroupUpdate($db, $userid, array(User::UG_REGISTERED));
		
		$db->query_write("
			DELETE FROM ".$db->prefix."useractivate 
			WHERE useractivateid = ".bkint($actData['useractivateid'])."
		");
		
		return 0;
	}

	public static function UserUpdate(CMSDatabase $db, $userid, $data){
		$arr = array();
		foreach ($data as $key => $value){
			array_push($arr, $key."='".$value."'");
		}
		if (empty($arr)){ return; }
		
		$sql = "
			UPDATE ".$db->prefix."user
			SET ".implode(',', $arr)." 
			WHERE userid = ".bkint($userid)."
			LIMIT 1
		";
		$db->query_write($sql);
	}
	
	public static function UserGroupRemoveByKey(CMSDatabase $db, $userid, $key){
		$group = UserQueryExt::GroupByKey($db, $key, true);
		if (empty($group)){ return; }
		UserQueryExt::UserGroupRemove($db, $userid, $group['id']);
	}
	
	public static function UserGroupRemove(CMSDatabase $db, $userid, $groupid){
		$sql = "
			DELETE FROM `".$db->prefix."usergroup`
			WHERE userid=".bkint($userid)." AND groupid=".bkint($groupid)."
		";
		$db->query_write($sql);
	}
	
	public static function UserGroupAppendByKey(CMSDatabase $db, $userid, $key){
		$group = UserQueryExt::GroupByKey($db, $key, true);
		if (empty($group)){ return; }
		UserQueryExt::UserGroupAppend($db, $userid, $group['id']);
	}
	
	public static function UserGroupAppend(CMSDatabase $db, $userid, $groupid){
		$sql = "
			INSERT IGNORE INTO `".$db->prefix."usergroup` (`userid`, `groupid`) VALUES 
			(".bkint($userid).",".bkint($groupid).")
		";
		$db->query_write($sql);
	}
	
	public static function UserGroupUpdate(CMSDatabase $db, $userid, $groups){
		$sql = "
			DELETE FROM `".$db->prefix."usergroup`
			WHERE userid=".bkint($userid)."
		";
		$db->query_write($sql);
		
		$arr = array();
		foreach ($groups as $gp){
			array_push($arr, "(".bkint($userid).",".bkint($gp).")");
		}
		if (count($arr) < 1){ return; }
		
		$sql = "
			INSERT IGNORE INTO `".$db->prefix."usergroup` (`userid`, `groupid`) VALUES 
			".implode(',', $arr)."
		";
		$db->query_write($sql);
	}
	
	public static function UserGroupList(CMSDatabase $db, $page, $limit){
		$from = (($page-1)*$limit);
		$sql = "
			SELECT
				u.userid as uid, 
				ug.groupid as gid
			FROM (
				SELECT 
					userid
				FROM ".$db->prefix."user
				ORDER BY userid DESC
				LIMIT ".$from.",".bkint($limit)."
			) u
			LEFT JOIN ".$db->prefix."usergroup ug ON u.userid = ug.userid
		";
		return $db->query_read($sql);
	}

	public static function UserList(CMSDatabase $db, $page, $limit){
		$from = (($page-1)*$limit);
		$sql = "
			SELECT 
				userid as id, 
				username as unm,
				email as eml,
				joindate as dl,
				lastvisit as vst
			FROM ".$db->prefix."user
			ORDER BY userid DESC
			LIMIT ".$from.",".bkint($limit)."
		";
		return $db->query_read($sql);
	}
	
	public static function UserListAll(CMSDatabase $db){
		$sql = "
			SELECT 
				userid as id, 
				username as unm,
				email as eml,
				joindate as dl,
				lastvisit as vst
			FROM ".$db->prefix."user
		";
		return $db->query_read($sql); 		
	}
	
	public static function UserCount(CMSDatabase $db){
		$sql = "
			SELECT COUNT(userid) as cnt 
			FROM ".$db->prefix."user
			LIMIT 1
		";
		return $db->query_read($sql); 
	}
	
	public static function UserOnline(CMSDatabase $db){
		$sql = "
			SELECT count( * ) AS cnt
			FROM (
				SELECT idhash
				FROM ".$db->prefix."session
				WHERE lastactivity > ".(TIMENOW-60*5)."
				GROUP BY idhash
			)a		
		";
		return $db->query_read($sql);
	}
	
	/**
	 * Кол-во отправленых писем по восстановлению пароля юзеру
	 */
	public static function PasswordSendCount(CMSDatabase $db, $userid){
		$row = $db->query_first("
			SELECT counteml 
			FROM ".$db->prefix."userpwdreq
			WHERE userid='".bkint($userid)."'
			LIMIT 1
		");
		if (empty($row)){
			return 0;
		}
		return $row['counteml'];
	}
	
	public static function PasswordRequestCreate(CMSDatabase $db, $userid, $hash){
		$sql = "
			INSERT ".$db->prefix."userpwdreq (userid, hash, dateline, counteml) VALUES
			(
				".bkint($userid).",
				'".bkstr($hash)."',
				".TIMENOW.",
				1
			)
		";
		$db->query_write($sql);
	}
	
	public static function PasswordRequestCheck(CMSDatabase $db, $hash){
		$sql = "
			SELECT * 
			FROM ".$db->prefix."userpwdreq
			WHERE hash = '".bkstr($hash)."'
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function PasswordChange(CMSDatabase $db, $userid, $newpass){
		$db->query_write("
			UPDATE ".$db->prefix."user
			SET password = '".$newpass."'
			WHERE userid = ".bkint($userid)."
			LIMIT 1
		");
		
		$db->query_write("
			DELETE FROM ".$db->prefix."userpwdreq
			WHERE userid = ".bkint($userid)."
		");
	}
	
	
	////////////////////////////////////////////////////////////////////
	//                       Общедоступные запросы                    //
	////////////////////////////////////////////////////////////////////
	
	/**
	 * Получить список действий модуля
	 * 
	 * @param CMSDatabase $db
	 */
	public static function ModuleActionList(CMSDatabase $db, $modname = ''){
		$where = "";
		if (!empty($modname)){
			$where = "WHERE module='".bkstr($modname)."'";
		}
		$sql = "
			SELECT 
				modactionid as id,
				module as md,
				action as act 
			FROM ".$db->prefix."sys_modaction
			".$where."
			ORDER BY module, action
		";
		return $db->query_read($sql);
	}
	
	////////////////////////////////////////////////////////////////////
	//                       Административные запросы                 //
	////////////////////////////////////////////////////////////////////

	/**
	 * Список ролей (ID роли, ID действия, статус)
	 * 
	 * @param CMSDatabase $db
	 * @param integer $groupid если $usertype=0, то роль группы, иначе роль пользователя 
	 * @param integer $usertype 
	 */
	public static function RoleList(CMSDatabase $db, $groupid, $usertype = 0){
		$sql = "
			SELECT 
				roleid as id,
				modactionid as maid,
				status as st
			FROM ".$db->prefix."userrole
			WHERE userid=".bkint($groupid)." AND usertype=".bkint($usertype)."
		";
		return $db->query_read($sql);
	}
	
	public static function RoleAppend(CMSDatabase $db, $groupid, $d){
		$sql = "
			INSERT IGNORE INTO ".$db->prefix."userrole 
			(`modactionid`, `usertype`, `userid`, `status`) VALUES (
			'".$d->maid."', 
			0,
			".$groupid.",
			".$d->st."
		)";
		$db->query_write($sql);
	}
	
	public static function RoleRemove(CMSDatabase $db, $roleid){
		$sql = "
			DELETE FROM ".$db->prefix."userrole
			WHERE roleid=".bkint($roleid)."
		";
		$db->query_write($sql);
	}
	
	public static function PermissionInstall(CMSDatabase $db, AbricosPermission $permission){
		$modname = $permission->module->name;
		$actions = array();
		$rows = UserQueryExt::ModuleActionList($db, $modname);
		while (($row = $db->fetch_array($rows))){

			$find = false;
			foreach ($permission->defRoles as $role){
				if (intval($role->action) == intval($row['act'])){
					$find = true;
					break;
				}
			}
			if ($find){
				$actions[$row['act']] = $row;
			} else {
				// action был удален, надо его зачистить на в базе
				UserQueryExt::ModuleAction($db, $row['id']);
			}
		}
		
		$asql = array();
		foreach ($permission->defRoles as $role){
			if (!empty($actions[$role->action])){ continue; }
			array_push($asql, "('".$modname."', ".$role->action.")");
		}
		if (!empty($asql)){
			$sql = "INSERT IGNORE INTO ".$db->prefix."sys_modaction (`module`, `action`) VALUES ";
			$sql .= implode(",", $asql);
			$db->query_write($sql);
		}

		$rows = UserQueryExt::GroupList($db);
		$groups = array();
		while (($row = $db->fetch_array($rows))){
			if (empty($row['k'])){ continue; }
			$groups[$row['k']] = $row['id'];
		}
		
		$rows = UserQueryExt::ModuleActionList($db, $modname);
		while (($row = $db->fetch_array($rows))){
			
			foreach ($permission->defRoles as $role){
				if (intval($row['act']) != intval($role->action)){ continue; }
				$groupid = intval($groups[$role->groupkey]);
				if (empty($groupid)){
					
					$groupname = $permission->module->lang['groups'][$role->groupkey];
					if (empty($groupname)){
						$groupname = $role->groupkey;
					}
					
					$groupid = UserQueryExt::GroupAppend($db, $groupname, $role->groupkey);
					$groups[$role->groupkey] = $groupid;
				}
				
				$sql = "
					INSERT IGNORE INTO ".$db->prefix."userrole 
					(`modactionid`, `usertype`, `userid`, `status`) VALUES 
					('".$row['id']."', 0, ".$groupid.", ".$role->status.")
				";
				$db->query_write($sql);
			}
			
		}
	}
	
	public static function PermissionRemove(CMSDatabase $db, AbricosPermission $permission){
		$rows = $db->query_read("
			SELECT 
				modactionid as id,
				action
			FROM ".$db->prefix."sys_modaction
			WHERE module = '".$permission->module->name."'
		");
		while (($row = $db->fetch_array($rows))){
			$sql = "
				DELETE FROM ".$db->prefix."userrole
				WHERE modactionid=".bkint($row['id'])."
			";
			$db->query_write($sql);
		}
		$sql = "
			DELETE FROM ".$db->prefix."sys_modaction
			WHERE module = '".$permission->module->name."'
		";
		$db->query_write($sql);
	}
	
	public static function ModuleActionRemove(CMSDatabase $db, $modactionid){
		$sql = "
			DELETE FROM ".$db->prefix."userrole
			WHERE modactionid=".bkint($modactionid)."
		";
		$db->query_write($sql);
		
		$sql = "
			DELETE FROM ".$db->prefix."sys_modaction
			WHERE modactionid=".bkint($modactionid)."
		";
		$db->query_write($sql);
	}
	
	public static function GroupByKey(CMSDatabase $db, $key, $retarray = false){
		$sql = "
			SELECT 
				groupid as id, 
				groupname as nm,
				groupkey as k
			FROM ".$db->prefix."group
			WHERE groupkey='".bkstr($key)."'
			LIMIT 1
		";
		return $retarray ? $db->query_first($sql) : $db->query_read($sql);
	}
	
	public static function GroupList(CMSDatabase $db){
		$sql = "
			SELECT 
				groupid as id, 
				groupname as nm,
				groupkey as k
			FROM ".$db->prefix."group
		";
		return $db->query_read($sql);
	}

	public static function GroupCount(CMSDatabase $db){
		$sql = "
			SELECT COUNT(groupid) as cnt 
			FROM ".$db->prefix."group
			LIMIT 1
		";
		return $db->query_read($sql); 
	}
	
	public static function GroupAppend(CMSDatabase $db, $name, $key = ''){
		$sql = "
			INSERT INTO ".$db->prefix."group (`groupname`, `groupkey`) VALUES (
				'".bkstr($name)."',
				'".bkstr($key)."'
			)
		";
		$db->query_write($sql); 
		return $db->insert_id();
	}
	
	public static function GroupUpdate(CMSDatabase $db, $d){
		$sql = "
			UPDATE ".$db->prefix."group 
			SET groupname = '".bkstr($d->nm)."'
			WHERE groupid = ".bkint($d->id)."
		";
		$db->query_write($sql); 
	}
	
	public static function UserFieldList (CMSDatabase $db){
		$sql = "SHOW COLUMNS FROM ".$db->prefix."user";
		return $db->query_read($sql);
	}
	
}

?>