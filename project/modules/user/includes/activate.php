<?php
/**
* @version $Id: activate.php 774 2009-04-28 11:39:40Z AKuzmin $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/*
 * Активация пользователя
 * URL по типу http://mysite.com/user/activate/{userid}/{activeid}, где:
 * {userid} - идентификатор пользователя;
 * {activeid} - идентификатор активации.
 * 
 */
$brick = Brick::$builder->brick;
$adress = Brick::$cms->adress;
$p_userid = bkint($adress->dir[2]);
$p_actid =  bkint($adress->dir[3]);
$ret->error = 0;
		
$ret->error = CMSSqlQueryUser::QueryRegUserActivate(Brick::$db, $p_userid, $p_actid); 
if ($ret->error == 0){
	$user = CMSSqlQuery::QueryGetUserInfo(Brick::$db, $p_userid);
	$ret->unm = $user['username'];
}
$brick->param->var['result'] = json_encode($ret); 

?>