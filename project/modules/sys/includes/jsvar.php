<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/


$brick = Brick::$builder->brick;
$db = Brick::$db;
$param = $brick->param;

$modSys = Brick::$modules->GetModule('sys');
$user = Brick::$session->userinfo;

$param->var['g'] = $user['usergroupid'];
$param->var['uid'] = $user['userid'];
$param->var['unm'] = $user['username'];
$param->var['s'] = Brick::$session->sessionHash;
$param->var['ttname'] = Brick::$builder->phrase->Get('sys', 'style', 'default');

$key = 0;
$dir = dir(CWD."/modules");
while (false !== ($entry = $dir->read())) {
	if ($entry == "." || $entry == ".." || empty($entry)){
		continue;
	}
	
	$jsdir = CWD."/modules/".$entry."/js";
	
	$files = glob($jsdir."/*.js");
	foreach ($files as $file){
		$key += filemtime($file)+filesize($file)+1;
	}

	$files = glob($jsdir."/*.htm");
	foreach ($files as $file){
		$key += filemtime($file)+filesize($file)+1;
	}

	$files = glob($jsdir."/langs/*.js");
	foreach ($files as $file){
		$key += filemtime($file)+filesize($file)+1;
	}

	$files = glob($jsdir."/*.css");
	foreach ($files as $file){
		$key += filemtime($file)+filesize($file)+1;
	}
}

$param->var['jsv'] = md5($key);

?>