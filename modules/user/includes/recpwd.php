<?php
/**
 * Восстановление пароля пользователя
 * 
 * URL по типу http://mysite.com/user/recpwd/{hash}, где:
 * {hash} - идентификатор восстановления пароля.
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage User
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$brick = Brick::$builder->brick;

$adress = Brick::$cms->adress;
$p_hash = bkstr($adress->dir[2]);

$userManager = CMSRegistry::$instance->user->GetManager(); 

$ret = $userManager->PasswordRequestCheck($p_hash);
if ($ret->error > 0){
	$brick->param->var['result'] = $brick->param->var['err'];
}else{
	$brick->param->var['result'] = Brick::ReplaceVarByData($brick->param->var['ok'], array(
		"email" => $ret->email
	));
}


?>