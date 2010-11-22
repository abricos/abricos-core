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
$userMod = Brick::$user;
$user = $userMod->info;

$json = Brick::$input->clean_gpc('p', 'json', TYPE_STR);
if (empty($json)){ return; }

$obj = json_decode($json);
$result = new stdClass();
$result->type = $obj->type;
$errornum = 0;
$userManager = $userMod->GetManager(); 

if ($obj->type == "logout"){
	$userManager->Logout();
}else if ($obj->type == "pwdrestore"){
	$email = $result->data->email = $obj->data->email;
	$errornum = $userManager->PasswordRestore($email);
}

if ($errornum > 0){
	sleep(1);
}

$result->data->error = $errornum;
$brick->param->var['result'] = json_encode($result);

?>