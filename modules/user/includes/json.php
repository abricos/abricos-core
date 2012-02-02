<?php
/**
 * JSON данные на запросы стороних сервисов
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage User
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 * @ignore
 */

$brick = Brick::$builder->brick;

$p_jsonPassword = Abricos::CleanGPC('p', 'jsonpass', TYPE_STR);
$cfg = CMSRegistry::$instance->config['JsonDB'];
if (!$cfg['use']){ return; }
$jsonPassword = $cfg['password'];
if ($p_jsonPassword != $jsonPassword){
	sleep(2);
	return;
}

$userManager = Abricos::GetModule('user')->GetManager(); 
$p_do = Abricos::CleanGPC('p', 'do', TYPE_STR);

$result = "";
if ($p_do == "user"){
	$p_username	= trim(Abricos::CleanGPC('p', 'username', TYPE_STR));
	$userinfo = UserQuery::UserByName(Abricos::$db, $p_username);
	if (empty($userinfo)){ return; }
	$result = json_encode($userinfo);
}else if  ($p_do == "login"){
	$p_username	= trim(Abricos::CleanGPC('p', 'username', TYPE_STR));
	$p_password	= trim(Abricos::CleanGPC('p', 'password', TYPE_STR));
	
	$error = $userManager->Login($p_username, $p_password);
	if ($error > 0){
		sleep(1);
	}
	$info = array("error" => $error);
	// $info = array("error" => $error, "pass"=>$p_password, "user"=>$p_username);
	$result = json_encode($info);
}else if ($p_do == "userlist"){
	$rows = UserQueryExt::UserListAll(Abricos::$db);
	$list = array();
	while (($row = Abricos::$db->fetch_array($rows))){
		$r = array();
		$r['unm'] = $row['unm'];
		$r['eml'] = $row['eml'];
		$r['vst'] = $row['vst'];
		array_push($list, $r);
	}
	$result = json_encode($list);
}

$brick->param->var['body'] = $result; 

?>