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
$userManager = $userMod->GetManager(); 

$p_login = Brick::$input->clean_gpc('p', 'login', TYPE_STR);
$p_pass = Brick::$input->clean_gpc('p', 'password', TYPE_STR);

$err = 0;
if (!empty($p_login) || !empty($p_pass)){
	$err = $userManager->Login($p_login, $p_pass);
	if ($err == 0){
		header('Location: /');
	}
}
if ($err == 0){
	$brick->param->var['err'] = '';
}else{
	$brick->param->var['err'] = Brick::ReplaceVar($brick->param->var['err'], 'err', $brick->param->var['e'.$err]);
}

?>