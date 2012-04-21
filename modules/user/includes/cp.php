<?php 
/**
 * Панель управления
 * 
 * Формирование списка модулей и их параметров
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage User
 * @copyright Copyright (C) 2008-2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 * @ignore
 */


$brick = Brick::$builder->brick;
$param = $brick->param;

if (Abricos::$user->id == 0){
 	return;
}
Abricos::GetModule('sys')->GetManager();
if (Ab_CoreSystemManager::$instance->IsAdminRole()){
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
	
$param->var['body'] = str_replace("#mlist#", json_encode($modcp), $param->var['cpbody']);
	

?>