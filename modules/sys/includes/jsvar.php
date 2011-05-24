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

$param = Brick::$builder->brick->param;

$modSys = Brick::$modules->GetModule('sys');
$modUser = CMSRegistry::$instance->user; 
$user = $modUser->info;
$param->var['g'] = json_encode($user['group']);
$param->var['uid'] = $user['userid'];
$param->var['unm'] = $user['username'];
$param->var['s'] = $modUser->session->key;

$template = Brick::$builder->phrase->Get('sys', 'style', 'default');
$param->var['ttname'] = $template;
$param->var['jsyui'] = SystemModule::$YUIVersion;

if (CMSRegistry::$instance->modules->customTakelink){
	$modsinfo = CMSRegistry::$instance->modules->modulesInfo;
	$arr = array(); 
	foreach ($modsinfo as $key => $value){
		array_push($arr, "'".$key."'");
	}
	$param->var['enmod'] = implode($arr, ',');
}

$iscache = !CMSRegistry::$instance->config['Misc']['develop_mode'];
$cacheFile = CWD."/cache/jsvar";
if ($iscache && file_exists($cacheFile)){
	
	$handle = fopen($cacheFile, 'r');
	$fdata = '';
	if ($handle){
		$fdata = fread($handle, filesize($cacheFile));
		fclose($handle);
	} 
	$farr = explode(",", $fdata);
	$cVersion = $farr[0];
	$cTime = TIMENOW - intval($farr[1]);
	$cacheTime = 3*60;
	$cKey = $farr[2];
	if (count($farr) == 3 && $farr[0] == '0.1'){
		if ($cTime < $cacheTime){
			$param->var['jsv'] = $cKey;
			return;
		}
	}
}

$key = 0;
$dir = dir(CWD."/modules");
while (false !== ($entry = $dir->read())) {
	if ($entry == "." || $entry == ".." || empty($entry)){
		continue;
	}
	
	$jsdir = CWD."/modules/".$entry."/js";
	
	$files = globa($jsdir."/*.js");
	foreach ($files as $file){
		$key += filemtime($file)+filesize($file)+1;
	}

	$files = globa($jsdir."/*.htm");
	foreach ($files as $file){
		// если есть перегруженый шаблон, то чтение его версии
		$override = CWD."/tt/".$template."/override/".$entry."/js/".basename($file);
		
		if (file_exists($override)){
			$key += filemtime($override)+filesize($override)+11;
		}else{
			$key += filemtime($file)+filesize($file)+1;
		}
	}

	$files = globa($jsdir."/langs/*.js");
	foreach ($files as $file){
		$key += filemtime($file)+filesize($file)+1;
	}

	$files = globa($jsdir."/*.css");
	foreach ($files as $file){
		$key += filemtime($file)+filesize($file)+1;
	}
}

// js модули шаблона
$files = globa(CWD."/tt/".$template."/jsmod/*.js");
foreach ($files as $file){
	$key += filemtime($file)+filesize($file)+1;
}

$cKey = $param->var['jsv'] = md5($key);

if ($iscache){
	
	@unlink($cacheFile);
	
	$handle = fopen($cacheFile, 'w');
	if ($handle){
		fwrite($handle, "0.1,".TIMENOW.",".$cKey);
		fclose($handle);
	} 
}


?>