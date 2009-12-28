<?php
/**
 * Обработчик запросов клиента 
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage User
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$brick = Brick::$builder->brick;
$user = Brick::$session->userinfo;

$json = Brick::$input->clean_gpc('p', 'json', TYPE_STR);
if (empty($json)){ return; }

$obj = json_decode($json);
$result = new stdClass();
$result->type = $obj->type;
$errornum = 0;
$userManager = CMSRegistry::$instance->modules->GetModule('user')->GetUserManager(); 

if ($obj->type == "login"){
	$username = $obj->data->username;
	$result->data->username = $username;
	$errornum = $userManager->UserLogin($obj->data->username, $obj->data->password);
	if ($errornum == 0){
		// Авторизация прошла успешно, обновить информацию сессии
		$user = CMSQUser::UserPrivateInfoByUserName(Brick::$db, $username, true);
		Brick::$session->Login($user["id"]);  
	}
}else if ($obj->type == 'register'){
	
	$username = $result->data->username = $obj->data->username;
	$email = $result->data->email = $obj->data->email;
	$password = $obj->data->password;
	$errornum = $userManager->UserRegister($username, $password, $email, true);
	
}else if ($obj->type == "logout"){
	Brick::$session->Logout();
}else if ($obj->type == "pwdrestore"){
	$email = $result->data->email = $obj->data->email;
	$errornum = $userManager->UserPasswordRestore($email);
}

if ($errornum > 0){
	sleep(1);
}

$result->data->error = $errornum;
$brick->param->var['result'] = json_encode($result);

?>