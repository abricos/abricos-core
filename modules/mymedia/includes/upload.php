<?php
/**
 * @version $Id: upload.php 162 2009-11-09 13:58:51Z roosit $
 * @package Abricos
 * @subpackage FileManager
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

// загрузчик файла
// возвращает код ошибки:
// 0 - ошибки нет, загрузка прошла успешно
// 101 - Менеджер файлов не установлен
// 102 - Нет доступа на выгрузку файла, запретил Менеджер Файлов
// 103 - Нет доступа на выгрузку файла, запретил MyMedia
// 104 - Альбом, в который происходит загрузка, не принадлежит юзеру
// 105 - Ошибка в создании папок в менеджере файлов

$modFM = Brick::$modules->GetModule('filemanager');

if (empty($modFM)){
	print('101'); exit;
}

$fileManager = $modFM->GetFileManager();

if (!$fileManager->IsFileUploadRole()){
	print('102'); exit; 
}

$modMM = Brick::$modules->GetModule('mymedia');

$myMediaManager = $modMM->GetMyMediaManager();

if (!$myMediaManager->IsMyMediaAppendRole()){
	print('103'); exit; 
}

$user = Brick::$cms->session->userinfo;

$albumid = Brick::$cms->adress->dir[2];
$albumUserid = CMSQMyMedia::UserIdByAlbumId(Brick::$db, $albumid);

if ($albumUserid != $user['userid']){
	print('104'); exit;
}

$folderMyMedia = $fileManager->FolderAppend(0, 'mymedia');
if (empty($folderMyMedia)){
	print('105'); exit;
}
$folderAlbumId = $fileManager->FolderAppend($folderMyMedia, $albumid);

if (empty($folderAlbumId)){
	print('105'); exit;
}

$p_file = Brick::$input->clean_gpc('f', 'Filedata', TYPE_FILE);
$filename = trim($p_file['name']);
$pathinfo = pathinfo($filename);
$extension = strtolower($pathinfo['extension']);

$errornum = $fileManager->UploadFiles($folderAlbumId, $p_file);

if ($errornum == 2 || $errornum == 4){
	
	// если картинка слишком большая, то необходимо попробовать ее сжать
	$extensions = $fileManager->GetFileExtensionList();
	$filetype = $extensions[$extension];
	
	$file = $p_file['tmp_name'];

	$upload = $fileManager->GetUploadLib($file);

	if (!$upload->file_is_image){
		print($errornum); exit;
	}
	$w = 0; $h = 0;
	$upload->image_resize = true;
	if ($upload->image_src_y > $upload->image_src_x){
		$upload->image_y = $filetype['maxwidth'];
		$upload->image_ratio_x = true;
	} else {
		$upload->image_x = $filetype['maxwidth'];
		$upload->image_ratio_y = true;
	}
	
	$upload->file_new_name_body = 'img_'.substr(md5(time()+$i), 0, 8).'.'.$extension;
	$upload->process(CWD."/cache");
	
	$errornum = $fileManager->UploadFile($folderAlbumId, 
		$upload->file_dst_pathname, 
		trim($p_file['name']), 
		$extension, 
		filesize($upload->file_dst_pathname),
		0, 
		true
	);
	@unlink($upload->file_dst_pathname);
}

if ($errornum == 0){
	$fh = $fileManager->lastUploadFileHash;
	CMSQMyMedia::FileAppend(Brick::$db, $user['userid'], $albumid, $fh);
}

print($errornum); exit;

?>