<?php
/**
 * Формирование базовых данных для работы системы BrickJSEngine
 *
 * @package Abricos
 * @link http://abricos.org
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @ignore
 */

$brick = Brick::$builder->brick;
$param = $brick->param;

$modSys = Abricos::GetModule('sys');

$param->var['lang'] = Abricos::$LNG;
$param->var['g'] = json_encode(Abricos::$user->info['group']);
$param->var['uid'] = intval(Abricos::$user->id);
$param->var['unm'] = Abricos::$user->login;
$param->var['fnm'] = Abricos::$user->info['firstname'];
$param->var['lnm'] = Abricos::$user->info['lastname'];

if (Abricos::$user->id > 0){
	$param->var['agr'] = intval(Abricos::$user->info['agreement']);
}
$param->var['s'] = Abricos::$user->session->key;

$template = Brick::$builder->phrase->Get('sys', 'style', 'default');
$param->var['ttname'] = $template;
$param->var['jsyui'] = Ab_CoreSystemModule::$YUIVersion;

if (CMSRegistry::$instance->modules->customTakelink){
	$modsinfo = CMSRegistry::$instance->modules->modulesInfo;
	$arr = array();
	foreach ($modsinfo as $key => $value){
		array_push($arr, "'".$key."'");
	}
	$param->var['enmod'] = implode($arr, ',');
}

if ($param->param['fullcssforie'] == 'true' && is_browser('ie')){
	$param->var['fullcssres'] = Brick::ReplaceVarByData($param->var['fullcsstpl'], $param->var);
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

$cKey = $param->var['jsv'] = md5($key.Abricos::$LNG);

if ($iscache){

	@unlink($cacheFile);

	$handle = fopen($cacheFile, 'w');
	if ($handle){
		fwrite($handle, "0.1,".TIMENOW.",".$cKey);
		fclose($handle);
	}
}

$langid = Abricos::$LNG;
if ($langid === 'ru'){
    $langid = 'ru-RU';
}

$brick->content = Brick::ReplaceVarByData($brick->content, array(
    "langid" => $langid
));

?>