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
 * @ignore
 */
/*
$brick = Brick::$builder->brick;
$userManager = Brick::$user->GetManager(); 

$p_do = Abricos::CleanGPC('p', 'do', TYPE_STR);
$p_login = Abricos::CleanGPC('p', 'login', TYPE_STR);
$p_pass = Abricos::CleanGPC('p', 'password', TYPE_STR);
$p_passconf = Abricos::CleanGPC('p', 'passconf', TYPE_STR);
$p_email = Abricos::CleanGPC('p', 'email', TYPE_STR);
$p_emailconf = Abricos::CleanGPC('p', 'emailconf', TYPE_STR);

$form = $brick->param->var['regform'];

$err = 0;
if ($p_do == 'register'){
	
	if ($p_pass != $p_passconf){
		$err = 105; 
	}else if ($p_email != $p_emailconf){
		$err = 106; 
	}
	if ($err == 0){
		$err = $userManager->Register($p_login, $p_pass, $p_email);
	}
	if ($err == 0){
		$form = Brick::ReplaceVarByData($brick->param->var['regok'], array(
			"email" => $p_email
		));
	}
}
$form = Brick::ReplaceVarByData($form, array(
	"error" => $err == 0 ? "" : Brick::ReplaceVar($brick->param->var['err'], 'err', $brick->param->var['e'.$err])
));

$brick->content = Brick::ReplaceVarByData($brick->content, array(
	"result" => $form
));

/**/

?>