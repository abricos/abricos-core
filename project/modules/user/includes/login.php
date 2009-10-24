<?php
/**
 * Авторизация пользователя 
 * 
 * @version $Id$
 * @package CMSBrick
 * @subpackage User
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$brick = Brick::$builder->brick;
$db = Brick::$db;
$param = $brick->param;

$user = Brick::$session->userinfo;

$cms = Brick::$cms;
$in = Brick::$input;
$p_do = $in->clean_gpc('g', 'do', TYPE_STR);

$errornum = 0;

if ($p_do == "pwdchange"){
	if (!Brick::$session->IsRegistred()){
		return;
	}
	$p_password			= $in->clean_gpc('p', 'password',		TYPE_STR);
	$p_passwordconfirm	= $in->clean_gpc('p', 'passwordconfirm',TYPE_STR);
	
	if (empty($p_password) || empty($p_passwordconfirm)){ 
		$errornum = 3;	
	}else if ($errornum == 0 && $p_password != $p_passwordconfirm){
		$errornum = 6;
	}else if (strlen($p_password) < 4){
		$errornum = 7;
	}else{
		$newpass = CMSModuleUser::UserPasswordCrypt($p_password, $user['salt']);
		CMSSqlQueryUser::PwdUserChange($db, $user['userid'], $newpass);
		$param->var['msg'] = $param->var['msg1'];
	}
	$param->var['type'] = 'pwd';
	
}else if ($p_do == "login"){
	$p_username	= trim(Brick::$input->clean_gpc('p', 'username', TYPE_STR));
	$p_password	= trim(Brick::$input->clean_gpc('p', 'password', TYPE_STR));
	
	if (empty($p_username) || empty($p_password)){ $errornum = 3;	}

	if ($errornum == 0 && !CMSModuleUser::UserVerifyName($p_username)){
		$errornum = 1;
	}
	
	if ($errornum == 0){
		$user = CMSSqlQuery::QueryGetUserInfoByUsername($db, $p_username);
		if (empty($user)){
			$errornum = 2;
		}else{
			$passcrypt = CMSModuleUser::UserPasswordCrypt($p_password, $user["salt"]);
			if ($passcrypt != $user["password"]){
				$errornum = 2;
			}
		}
	}
	
	if ($errornum == 0 && $user["usergroupid"] == 1){	// пользователь заблокирован
		$errornum = 5;
	}
	if ($errornum == 0 && $user["usergroupid"] == 3){// пользователь неактивирован
		$errornum = 4;
	}
	
	if ($errornum > 0){
		sleep(1);
	}else{
		Brick::$session->Login($user["userid"]); // Авторизация прошла успешно, Обновить информацию в сессии 
	}
	$param->var['type'] = 'login';
}else if ($p_do == "logout"){
	Brick::$session->Logout();
	$param->var['type'] = 'logout';
}

if ($errornum > 0){
	$param->var['error'] = $param->var['error'.$errornum];
	sleep(1);
}

?>