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
$ret->error = 0;
		
$ret->error = CMSSqlQueryUser::QueryRegUserActivate(Brick::$db, $p_userid, $p_actid); 
if ($ret->error == 0){
	$user = CMSQUser::UserById(Brick::$db, $p_userid);
	$ret->username = $user['username'];
}
$brick->param->var['result'] = json_encode($ret); 

?>