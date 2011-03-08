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
$userManager = Brick::$user->GetManager(); 

$p_do = Brick::$input->clean_gpc('p', 'do', TYPE_STR);
$p_login = Brick::$input->clean_gpc('p', 'login', TYPE_STR);
$p_pass = Brick::$input->clean_gpc('p', 'password', TYPE_STR);
$p_passconf = Brick::$input->clean_gpc('p', 'passconf', TYPE_STR);
$p_email = Brick::$input->clean_gpc('p', 'email', TYPE_STR);
$p_emailconf = Brick::$input->clean_gpc('p', 'emailconf', TYPE_STR);

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

?>