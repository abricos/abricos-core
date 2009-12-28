<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

if (!Brick::$session->IsAdminMode()){	return;}


$modCatalog = Brick::$modules->GetModule('catalog');
$modMan = $modCatalog->currentModMan;
$modFM = Brick::$modules->GetModule('filemanager');

CMSQCatalog::PrefixSet(Brick::$db, $modMan->catinfo['dbprefix']);

$brick = Brick::$builder->brick;
$brick->param->var['url'] = Brick::$cms->adress->requestURI; 

$upload = $modFM->GetUpload();

$p_act = Brick::$cms->input->clean_gpc('p', 'act', TYPE_STR);
if ($p_act != "upload"){ return; }

$arr = array();
for ($i=0; $i<6; $i++){
	$p_file = Brick::$cms->input->clean_gpc('f', 'file'.$i, TYPE_FILE);
	$errornum = $upload->UploadFiles(0, $p_file, true);
	if (empty($errornum)){
		array_push($arr, $upload->lastLoadFileHash);
	}
}
if (empty($arr)){ return; }

// автоматическое создание превьюшек
if (!empty($modMan->fotoPreviewFormat)){
	foreach ($modMan->fotoPreviewFormat as $format){
		foreach ($arr as $hash){
			$upload->ImageConvert($hash, $format['w'], $format["h"], "");
		}
	}
}

$json = json_encode($arr); // массив идентификаторов загруженных файлов
$newarr = array();

$uploadId = $modCatalog->uploadId;
$eltypeid = $modCatalog->uploadElementTypeId;

if ($modCatalog->uploadStatus == 0){ 
	// Элемент в процессе добавления, поэтому формируем список загруженных файлов и 
	// складываем их в кеш
	CMSQCatalog::SessionAppend(Brick::$db, $uploadId, $json);
	$rows = CMSQCatalog::Session(Brick::$db, $uploadId);
	while (($row = Brick::$db->fetch_array($rows))){
		$tarr = json_decode($row['data']);
		foreach($tarr as $ta){ array_push($newarr, $ta); }
	}
} else {
	CMSQCatalog::FotoAppend(Brick::$db, $eltypeid, $uploadId, $arr);
	
	$rows = CMSQCatalog::FotoList(Brick::$db, $eltypeid, $uploadId);
	while (($row = Brick::$db->fetch_array($rows))){
		array_push($newarr, $row['fid']);
	}
}
$json = json_encode($newarr);

$brick->param->var['command'] =
	str_replace("#data#", $json, $brick->param->var['ok']); 

?>