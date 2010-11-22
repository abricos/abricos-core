<?php
/**
 * Активация пользователя
 * 
 * URL по типу http://mysite.com/user/activate/{userid}/{activeid}, где:
 * {userid} - идентификатор пользователя;
 * {activeid} - идентификатор активации.
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
$p_userid = bkint($adress->dir[2]);
$p_actid =  bkint($adress->dir[3]);

$userManager = CMSRegistry::$instance->user->GetManager(); 

$result = $userManager->RegistrationActivate($p_userid, $p_actid);

if ($result->error > 0){
	$brick->param->var['result'] = Brick::ReplaceVarByData($brick->param->var['err'], array(
		"err" => $brick->param->var['err'.$result->error]
	)); 
}else{
	$brick->param->var['result'] = Brick::ReplaceVarByData($brick->param->var['ok'], array(
		"unm" => $result->username
	)); 
}


?>