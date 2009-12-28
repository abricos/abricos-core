<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage FileManager
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

// TODO Необходимо предоставить возможность администратору разрешать загружать файлы пользователям
if (!Brick::$session->IsAdminMode()){	return;}

$back = Brick::$builder->brick;

$modFM = Brick::$modules->GetModule('filemanager');
$upload = $modFM->GetUpload();
$folderid = Brick::$input->clean_gpc('g', 'folderid', TYPE_STR);
$brick->param->var['fid'] = $folderid;
// формирование списка разрешенных типов файлов и их макс. размеры
$t = $brick->param->var["ftypelsti"];
$text = "";

foreach ($upload->fileType as $key => $value){
	$trow = $t;
	$trow = str_replace('#1', $key, $trow);
	$trow = str_replace('#2', round(($value['maxsize']/1024))." Kb", $trow);
	$imgSize = "";
	if (!empty($value['maxwidth'])){
		$imgSize = $value['maxwidth']."x".$value['maxheight'];
	}
	$trow = str_replace('#3', $imgSize, $trow);
	$text = $text.$trow;
}
$brick->param->var['ftypelst'] = $text;

$freeSpace = $upload->GetFreeSpace();
$brick->param->var['freespace'] = (round($freeSpace/1024/1024))." mb";

$p_do = Brick::$input->clean_gpc('g', 'do', TYPE_STR);
if ($p_do == "upload"){
	$p_file = Brick::$input->clean_gpc('f', 'uploadfile', TYPE_FILE);
	$errornum = $upload->UploadFiles($folderid, $p_file);
	if ($errornum > 0){
		$errorText = 
			str_replace("#1",
				$brick->param->var['err'.$errornum],
				$brick->param->var['errt']
			);
		$errorText = str_replace("#2",	$p_file['name'], $errorText);
		$brick->param->var['err'] = $errorText; 
	}else{
		$brick->param->var['onload'] = str_replace("#fid#", $folderid, $brick->param->var['onloads']); 
	}
}

?>