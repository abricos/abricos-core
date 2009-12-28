<?php
/**
 * Формирование базовых данных для работы системы BrickJSEngine
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Sys
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
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

$template = Brick::$builder->phrase->Get('sys', 'style', 'default');
$param->var['ttname'] = $template;
$param->var['jsyui'] = CMSModuleSys::$YUIVersion;


if (CMSRegistry::$instance->modules->customTakelink){
	$modsinfo = CMSRegistry::$instance->modules->modulesInfo;
	$arr = array(); 
	foreach ($modsinfo as $key => $value){
		array_push($arr, "'".$key."'");
	}
	$param->var['enmod'] = implode($arr, ',');
}

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
		// если есть перегруженый шаблон, то чтение его версии
		$override = CWD."/tt/".$template."/override/".$entry."/js/".basename($file);
		
		if (file_exists($override)){
			$key += filemtime($override)+filesize($override)+11;
		}else{
			$key += filemtime($file)+filesize($file)+1;
		}
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

// js модули шаблона
$files = glob(CWD."/tt/".$template."/jsmod/*.js");
foreach ($files as $file){
	$key += filemtime($file)+filesize($file)+1;
}

$param->var['jsv'] = md5($key);

?>