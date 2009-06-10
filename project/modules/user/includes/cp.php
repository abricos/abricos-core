<?php 
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

$brick = Brick::$builder->brick;
$param = $brick->param;

if (!Brick::$session->IsRegistred()){
	$param->var['body'] = $param->var['accden'];
	Brick::$builder->AddJSModule('user', "guest.js");  	
 	return;
}

if (Brick::$session->IsAdminMode()){
	Brick::$modules->RegisterAllModule();
}

// Формирование списка модулей и их параметров
$modules=array();
foreach(Brick::$modules->modulesInfo as $key => $value){
	$modules[$key] = '';
}
	
$modcp = array();
	
$dir = dir(CWD."/modules");
while (false !== ($entry = $dir->read())) {
	if ($entry == "." || $entry == ".." || empty($entry)){ continue; }
	if ($entry == 'admin'){
		continue;
	}
		
	$cpfile = CWD."/modules/".$entry."/js/cp.js";
	
	if (!file_exists($cpfile)){
		continue;
	}
		
	// параметры
	$prm = new stdClass();
	$modcp[$entry] = $prm;
}
	
$param->var['body'] = 
	str_replace("#mlist#", json_encode($modcp), $param->var['cpbody']);
	
/**/

?>