<?php
/**
 * @version $Id: manager.php 183 2009-11-20 13:16:15Z roosit $
 * @package Abricos
 * @subpackage User
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

class FileManager {
	
	/**
	 * 
	 * @var CMSModuleFileManager
	 */
	public $module = null;
	
	/**
	 * Идентификатор последнего выгруженного файла
	 * 
	 * @var String
	 */
	public $lastUploadFileHash = '';
	
	private $_fileExtensionList = null;
	
	private $_userGroupSizeLimit = null;
	
	/**
	 * 
	 * @var CMSDatabase
	 */
	public $db = null;
	
	public $user = null;
	
	public function FileManager (CMSModuleFileManager $module){
		$this->module = $module;
		$this->db = $module->registry->db;
		
		$this->user = CMSRegistry::$instance->session->userinfo;
	}
	
	/**
	 * Получить менеджер загрузки
	 *
	 * @return CMSUpload
	 */
	public function GetUpload(){
		if (!empty($this->upload)){
			return $this->upload;
		}
		require_once CWD.'/modules/filemanager/includes/cmsupload.php';
		$this->upload = new CMSUpload($this->registry);
		return $this->upload;
	}
	
	public function IsAdminRole(){
		return $this->module->permission->CheckAction(FileManagerAction::FILES_ADMIN) > 0;
	}
	
	public function IsFileViewRole(){
		return $this->module->permission->CheckAction(FileManagerAction::FILES_VIEW) > 0;
	}
	
	public function IsFileUploadRole(){
		return $this->module->permission->CheckAction(FileManagerAction::FILES_UPLOAD) > 0;
	}
	
	public function IsAccessProfile($userid = 0){
		if ($userid == 0){
			$userid = $this->user['userid'];
		}
		if (($this->user['userid'] == $userid && $this->IsFileUploadRole())
			|| $this->IsAdminRole()){
			return true;
		}
		return false;
	}

	public function FileList($folderid){
		return $this->FileListByUser($this->user['userid'], $folderid);
	}
	
	public function FileListByUser($userid, $folderid){
		if (!$this->IsAccessProfile($userid)){
			return null;
		}
		return CMSQFileManager::FileList($this->db, $userid, $folderid, CMSQFileManager::FILEATTRIBUTE_NONE);
	}
	
	public function FolderList(){
		return $this->FolderListByUser($this->user['userid']);
	}
	
	public function FolderListByUser($userid){
		if (!$this->IsAccessProfile($userid)){
			return null;
		}
		return CMSQFileManager::FolderList($this->db, $userid); 
	}
	
	public function EditorList($filehash, $session){
		if (!$this->IsAccessProfile()){
			return null;
		}
		return CMSQFileManager::EditorList($this->db, $filehash, $session);
	}
	
	public function GetFileExtensionList(){
		if (!$this->IsFileUploadRole()){ return null; }
		
		if (!is_null($this->_fileExtensionList)){
			return $this->_fileExtensionList;
		}
		$list = array();
		
		$rows = CMSQFileManager::FileTypeList($this->db);
		while (($row = $this->db->fetch_array($rows))){	
			$list[$row['extension']] = $row; 
		}
		$this->_fileExtensionList = $list;
		return $list;
	}
	
	public function GetFreeSpace(){
		return $this->GetFreeSpaceByUser($this->user['userid']);
	}
	
	public function GetFreeSpaceByUser($userid){
		if (!$this->IsAccessProfile($userid)){
			return 0;
		}
		
		if (is_null($this->_userGroupSizeLimit)){
			$list = array();
			$rows = CMSQFileManager::UserGroupLimitList($this->db);
			while (($row = $this->db->fetch_array($rows))){	
				$list[$row['usergroupid']] = $row; 
			}
			$this->_userGroupSizeLimit = $list;
		}
		
		$fullsize = CMSQFileManager::FileUsedSpace($this->db, $userid);
		
		if ($userid != $this->user['userid']){
			$user = CMSQUser::UserById($this->db, $userid);
		}else{
			$user = $this->user;
		}
		
		$limit = intval($this->_userGroupSizeLimit[$user['usergroupid']]['flimit']);
		return $limit-$fullsize;
	}
	
	
	/**
	 * Выгрузка файлов в базу данных.
	 * Возвращает 0, если файл выгружен успешно, иначе номер ошибки:
	 * 1 - неизвестный тип файла,
	 * 2 - размер файла превышает допустимый,
	 * 3 - неизвестная ошибка сервера,
	 * 4 - размер картинки превышает допустимый,
	 * 5 - свободное место в профили закончилось,
	 * 6 - нет прав на выгрузку файла,
	 * 7 - файл с таким именем уже есть в этой папке
	 * 
	 * @param $fileinfo
	 * @param $system если true, файл является системным и виден всем администраторам 
	 */
	public function UploadFiles($folderid, $fileinfo){
		
		if (!$this->IsFileUploadRole()){
			return 6;
		}
		
		$filecount = count ($fileinfo['name']);

		if (empty($filecount)){ 
			return 0; 
		}
		
		$filename = trim($fileinfo['name']);
		
		$dbFileInfo = CMSQFileManager::FileInfoByName($this->db, $this->user['userid'], $folderid, $filename); 
		if (!empty($dbFileInfo)) {
			return 7;
		}
		$filelocation = trim($fileinfo['tmp_name']);
		$filesize = intval($fileinfo['size']);
		
		$pathinfo = pathinfo($filename);
		$extension = strtolower($pathinfo['extension']);
		
		if (!is_uploaded_file($filelocation)){ 
			return 3; 
		}
		
		return $this->UploadFile($folderid, $filelocation, $filename, $extension, $filesize);
	}
	
	public function UploadFile($folderid, $filelocation, $filename, $extension, $filesize, $atrribute = 0, 
			$ignoreImageSize = false){
		if (!$this->IsFileUploadRole()){
			return 6;
		}
		$userid = $this->user['userid'];
		
		$extensions = $this->GetFileExtensionList();
		
		$filetype = $extensions[$extension];
		
		if (empty($filetype)){ // ошибка: нет такого типа файла в разрешенных 
			return 1; 
		} 
		if ($filesize > $filetype['maxsize']){// ошибка: размер файла превышает допустимый 
			return 2; 
		} 
		// подсчет свободного места в профиле юзера
		$freespace = $this->GetFreeSpace();
		if ($freespace < $filesize){ // ошибка: превышена квота 
			return 5; 
		} 
		
		// TODO: Необходимо убрать библиотеку из ядра и разместить ее в этом модуле 
		// если картинка, проверка на допустимый размер
		$upload = $this->GetUploadLib($filelocation);
		
		$imgwidth = 0;
		$imgheight = 0;
		if ($upload->file_is_image ){
			if (!$ignoreImageSize){
				if ($filetype['maxwidth']>0 && $upload->image_src_x > $filetype['maxwidth']){
					return 4; // ошибка: размер картинки превышает допустимый
				}
				if ($filetype['maxheight']>0 && $upload->image_src_y > $filetype['maxheight']){
					return 4; // ошибка: размер картинки превышает допустимый
				}
			}
			$imgwidth = $upload->image_src_x;
			$imgheight = $upload->image_src_y;
		}
		$isimage = $upload->file_is_image ? 1 : 0;
		
		if (empty($filetype['mimetype'])){
			CMSQFileManager::FileTypeUpdateMime($this->registry->db, $filetype['filetypeid'], $upload->file_src_mime);
			$filetype['mimetype'] = $upload->file_src_mime;
		}
		
		if (!($filedata = @file_get_contents($filelocation))) { // ошибка: в чтении файла 
			return 3; 
		} 
		$filehash = CMSQFileManager::FileUpload(
			$this->db, $userid, $folderid, 
			$filename, $filedata, $filesize, $extension, 
			$isimage, $imgwidth, $imgheight, $atrribute
		);
		
		if (empty($filehash)){
			$this->db->ClearError();
			// файл не залез в оперативку, значит скидываю его в ФС
			
			$filehash = CMSQFileManager::FileUpload(
				$this->db, $userid, $folderid, $filename, '', $filesize, $extension, 
				$isimage, $imgwidth, $imgheight, $atrribute
			);
						
			if (empty($filehash)){
				return 3;
			}
			
			$fsFullPath = CMSQFileManager::FSPathCreate($this->db, $filehash);
			$dirPath = dirname($fsFullPath);
			mkdir($dirPath, 0777, true);
			
			rename($filelocation, $fsFullPath);
			
			echo($fsFullPath);
		}
		
		$this->lastUploadFileHash = $filehash;
		
		/*
		echo(substr($this->db->errorText, 0, 400));
		/*
		$filehash = CMSQFileManager::FileUpload(
				$this->db, $userid, $folderid, $filename, 
				'', $filesize, $extension, 
				$isimage, $imgwidth, $imgheight, 
				$atrribute
		);
		
		$size = $filesize;
		if (!($fp = fopen($filelocation, 'rb'))){ 
			return 3; 
		}
		$offset = 0;
		while( $size > 0 ) {
			$bytes = 65535;
			if ( $bytes > $size ) {
				$bytes = $size;
				$size = 0;
			} else {
				$size -= $bytes;
			}
			$filedata = fread($fp, $bytes);
			CMSQFileManager::FileUploadAppend($this->db, $filehash, $filedata, $offset, $bytes);
			$offset += $bytes;
		}
		
		$this->lastUploadFileHash = $filehash;
		
		// echo(substr($this->db->errorText, 0, 300));
		
		/*
		$size = filesize($filename);
		$fp = fopen($filename, ‘r’);
		/**/
		/*
		$filehash = "";
		$count = 1;
		$filedata = "";
		while (!feof($fp)){
			// 2097152
			$filedata = fread($fp, 4096);
			if (empty($filehash)){
				$filehash = CMSQFileManager::FileUpload(
					$this->db, $userid, $folderid, 
					$filename, $filedata, $filesize, $extension, 
					$isimage, $imgwidth, $imgheight, 
					$atrribute
				);
			}else{
				CMSQFileManager::FileUploadAppend($this->db, $filehash, $filedata);
			}
			// echo("write=".strlen($filedata)."\n");
		}
		fclose($fp);
		echo(substr($this->db->errorText, 0, 100));
		
		$this->lastUploadFileHash = $filehash;
		/**/
		
		return 0;
	}
	
	private function SaveTempFile($filehash, $imgname){
		// выгрузка картинки во временный файл для его обработки
		$pinfo = pathinfo($imgname);
		
		$file = CWD."/cache/".(md5(TIMENOW.$imgname)).".".$pinfo['extension'];
				
		if (!($handle = fopen($file, 'w'))){ return false; }
		$fileinfo = CMSQFileManager::FileData($this->db, $filehash);
		$count = 1;
		while (!empty($fileinfo['filedata']) && connection_status() == 0) {
			fwrite($handle, $fileinfo['filedata']);
			if (strlen($fileinfo['filedata']) == 2097152) {
				$startat = (2097152 * $count) + 1;
				$fileinfo = CMSQFileManager::FileData($this->db, $filehash, $startat);
				$count++;
			} else {
				$fileinfo['filedata'] = '';
			}
		}
		fclose($handle);
		
		return $file;
	}
	
	public function GetUploadLib($file){
		require_once CWD.'/modules/filemanager/lib/class.upload/class.upload.php';
		return new upload($file);
	}
	

	public function ImageConvert($p_filehash, $p_w, $p_h, $p_cnv){
		
		if (empty($p_w) && empty($p_h) && empty($p_cnv)){ return $p_filehash; }
		
		if (!$this->IsFileViewRole()){
			return $p_filehash;
		}
		
		// Запрос особого размера картинки
		$filehashdst = CMSQFileManager::ImagePreviewHash($this->db, $p_filehash, $p_w, $p_h, $p_cnv);
		
		if (!empty($filehashdst)){ return $filehashdst; }
		
		if (!$this->IsFileUploadRole()){
			return $p_filehash;
		}
		
		$image = CMSQFileManager::ImageExist($this->db, $p_filehash);
		if (empty($image)){ return $p_filehash; }// есть ли вообще такая картинка
		
		$imageName = $image['filename'];
		
		$dir = CWD."/cache";
		$pathinfo = pathinfo($imageName);
		
		$file = $this->SaveTempFile($p_filehash, $imageName);
		if (empty($file)){ return $p_filehash; }
		
		$upload = $this->GetUploadLib($file);
		$nameadd = array();
		
		if (!empty($p_w) || !empty($p_h)){
			array_push($nameadd, $p_w."x".$p_h);
			$upload->image_resize = true;
			if (empty($p_w)){
				$upload->image_ratio_x = true;
				$upload->image_y = $p_h;
			}else if (empty($p_h)){
				$upload->image_x = $p_w;
				$upload->image_ratio_y = true;
			}else{
				$upload->image_x = $p_w;
				$upload->image_y = $p_h;
			}
		}
					
		// необходимо ли конвертировать картинку
		if (!empty($p_cnv)){
			array_push($nameadd, $p_cnv);
			$upload->image_convert = $p_cnv;
		}
		
		$newfilename = str_replace(".".$pathinfo['extension'], "", $pathinfo['basename']);
		$newfilename = $newfilename."_".implode("_", $nameadd);
		$upload->file_new_name_body = translateruen($newfilename);
		
		$upload->process($dir);
		
		unlink($file);

		if (!file_exists($upload->file_dst_pathname)){ return $p_filehash; }
		
		$error = $this->UploadFile(
			$image['folderid'],
			$upload->file_dst_pathname, 
			$newfilename.".".$pathinfo['extension'],
			$upload->file_dst_name_ext, 
			filesize($upload->file_dst_pathname), 
			CMSQFileManager::FILEATTRIBUTE_HIDEN
		);

		if (!empty($error) || empty($this->lastUploadFileHash)){
			return $p_filehash;
		}
		CMSQFileManager::ImagePreviewAdd($this->db, $p_filehash, $this->lastUploadFileHash, $p_w, $p_h, $p_cnv);
		unlink($upload->file_dst_pathname);
		
		return $this->lastUploadFileHash;
	}
	
	public function GetFileInfo($p_filehash){
		if (!$this->IsFileViewRole()){
			return ;
		}
		return CMSQFileManager::FileInfo($this->db, $p_filehash);
	}
	
	public function GetFileData($p_filehash, $begin = 1, $end = 2097152){
		if (!$this->IsFileViewRole()){
			return ;
		}
		
		return CMSQFileManager::FileData($this->db, $p_filehash, $begin, $end);
	}
	
	public function FolderAppend($parentFolderId, $folderName, $folderPhrase = ''){
		if (!$this->IsFileUploadRole()){ return; }
		$userid = $this->user['userid'];
		return CMSQFileManager::FolderAdd($this->db, $parentFolderId, $userid, $folderName, $folderPhrase);
	}
	
	public function FolderAppendFromData($data){
		if (!$this->IsFileUploadRole()){ return; }

		$userid = $this->user['userid'];
		$name = translateruen($data->ph);
		return CMSQFileManager::FolderAdd($this->db, $data->pid, $userid, $name, $data->ph);
	}
	
	public function FolderChangePhrase($data){
		if (!$this->IsFileUploadRole()){ return; }
		
		$userid = $this->user['userid'];
		$finfo = CMSQFileManager::FolderInfo($this->db, $data->id);
		
		if (!$this->IsAccessProfile($finfo['uid'])){
			return null;
		}
		CMSQFileManager::FolderChangePhrase($this->db, $data->id, $data->ph);
	}

	public function FolderRemove($data){
		if (!$this->IsFileUploadRole()){ return; }
		
		$finfo = CMSQFileManager::FolderInfo($this->db, $data->id);
		
		if (!$this->IsAccessProfile($finfo['uid'])){
			return null;
		}
		CMSQFileManager::FolderRemove($this->db, $data->id);
	}
	
	public function FolderInfoByName($parentFolderId, $folderName){
		if (!$this->IsFileUploadRole()){ return; }
		
		$userid = $this->user['userid'];
		return CMSQFileManager::FolderInfoByName($this->db, $userid, $parentFolderId, $folderName);
	}
	
	public function FileRemove($filehash){
		if (!$this->IsFileUploadRole()){ return; }
		
		$finfo = CMSQFileManager::FileInfo($this->db, $filehash);
		
		if (!$this->IsAccessProfile($finfo['uid'])){
			return null;
		}
		CMSQFileManager::FilesDelete($this->db, array($filehash));
	}
	
	
	/**
	 * Сохранение изменений картинки в редакторе
	 * 
	 * @param $data данные по изменению
	 */
	public function ImageEditorSave($data){
		$filehash = $data->fh;
		$session = $data->session;
		// получить информацию редактируемой картинки
		$finfo = CMSQFileManager::FileInfo($this->db, $filehash);
		
		if (!$this->IsAccessProfile($finfo['uid'])){
			return null;
		}
		// картинка с последними изменения в редакторе
		$lastedit = CMSQFileManager::EditorInfo($this->db, $filehash, $session);
		
		if (empty($lastedit)){ 
			return; 
		}
		$userid = $this->user['userid'];
		CMSQFileManager::ImageEditorSave($this->db, $userid, $filehash, $lastedit, $data->copy);
	}	

	public function ImageChange($filehash, $tools, $d){
		// получить файл из БД
		$finfo = CMSQFileManager::FileInfo($this->db, $filehash);
		if (empty($finfo) || !$this->IsAccessProfile($finfo['uid'])){
			return -1;
		}
		
		$file = $this->SaveTempFile($filehash, $finfo['fn']);
		$dir = CWD."/cache";
		$upload = $this->GetUploadLib($file);
		
		switch($tools){
			case 'size':
				$upload->image_resize = true;
				if (empty($d['width'])){
					$upload->image_ratio_x = true;
					$upload->image_y = $d['height'];
				}else if (empty($d['height'])){
					$upload->image_x = $d['width'];
					$upload->image_ratio_y = true;
				}else{
					$upload->image_x = $d['width'];
					$upload->image_y = $d['height'];
				}
				break;
			case 'crop':
				$right = $finfo['w'] - $d['width'] - $d['left'];
				$bottom = $finfo['h'] - $d['height'] - $d['top'];
				$upload->image_crop = $d['top']." ".$right." ".$bottom." ".$d['left'];
				break;
			default:
				return -1;
		}
		
		$upload->file_new_name_body = translateruen($finfo['fn']);
					
		$upload->process($dir);
		unlink($file);

		if (!file_exists($upload->file_dst_pathname)){ 
			return -1; 
		}

		$pathinfo = pathinfo($finfo['fn']);
		
		$result = $this->UploadFile(
			$finfo['fdid'],
			$upload->file_dst_pathname,
			$pathinfo['basename'], 
			$upload->file_dst_name_ext, 
			filesize($upload->file_dst_pathname), 
			CMSQFileManager::FILEATTRIBUTE_TEMP
		);
		unlink($upload->file_dst_pathname);
		return $result;
	}
	
	/**
	 * Изменение картинки
	 * 
	 * @param $filehash идентификатор основной картинки
	 * @param $session текущая сессия редактора
	 * @param $data данные по изменению
	 */
	public function ImageEditorChange($filehash, $session, $data){
		
		// получить информацию редактируемой картинки
		$finfo = CMSQFileManager::FileInfo($this->db, $filehash);
		
		if (empty($finfo) || !$this->IsAccessProfile($finfo['uid'])){
			return -1;
		}
		
		// картинка с последними изменения в редакторе
		$lastedit = CMSQFileManager::EditorInfo($this->db, $filehash, $session);

		$fromfilehash = $filehash;
		
		if (!empty($lastedit)){
			$fromfilehash = $lastedit['fhdst'];
		}
		
		$d = array(
			"width" => $data->w, "height" => $data->h,
			"left" => $data->l, "top" => $data->t,
		);
		
		$result = $this->ImageChange($fromfilehash, $data->tools, $d);
		if ($result != 0){ return $fromfilehash; }
		
		$newfilehash = $this->lastUploadFileHash;
		$userid = $this->user['userid'];
		CMSQFileManager::EditorAppend($this->db, $userid, $filehash, $newfilehash, $data->l, $data->t, $data->w, $data->h, $data->tools, $session);
		
		return $newfilehash;
	}	
}

/**
 * Статичные функции запросов к базе данных
 * 
 * @package Abricos
 * @subpackage FileManager
 */
class CMSQFileManager {
	
	/**
	 * Атрибут файла: стандартный
	 */
	const FILEATTRIBUTE_NONE = 0;
	/**
	 * Атрибут файла: скрытый
	 */
	const FILEATTRIBUTE_HIDEN = 1;
	/**
	 * Атрибут файла: временный
	 */
	const FILEATTRIBUTE_TEMP = 2;
	
	public static function FileCopy(CMSDatabase $db, $filehash){
		$newfilehash = CMSQFileManager::GetFileHash($db);
		
		$sql = "
			INSERT INTO ".$db->prefix."fm_file 
				(userid, filehash, filename, title, filedata, filesize, extension, dateline, attribute, isimage, imgwidth, imgheight, folderid) 
				SELECT
					userid, 
					'".$newfilehash."',
					filename, title, filedata, filesize, extension, dateline, attribute, isimage, imgwidth, imgheight, folderid
				FROM ".$db->prefix."fm_file
				WHERE filehash=".bkstr($filehash)." 
		";
		$db->query_write($sql);
		
		return $newfilehash;
	}

	public static function ImageEditorSave(CMSDatabase $db, $userid, $filehash, $lastedit, $iscopy){
		
		$newfilehash = $lastedit['fhdst'];
		
		CMSQFileManager::FileSetAttribute($db, $newfilehash, CMSQFileManager::FILEATTRIBUTE_NONE);
		
		if (!$iscopy){
			CMSQFileManager::FileDelete($db, $filehash);
			$sql = "
				UPDATE ".$db->prefix."fm_file
				SET filehash='".bkint($filehash)."' 
				WHERE filehash='".bkstr($newfilehash)."'
				LIMIT 1
			";
			$db->query_write($sql);
		}
		
		$sql = "
			DELETE FROM ".$db->prefix."fm_editor
			WHERE userid=".bkint($userid)." 
		";
		$db->query_write($sql);

		$sql = "
			DELETE FROM ".$db->prefix."fm_file
			WHERE userid=".bkint($userid)." AND attribute=".CMSQFileManager::FILEATTRIBUTE_TEMP."
		";
		$db->query_write($sql);
	}
	
	public static function FileSetAttribute(CMSDatabase $db, $filehash, $attribute){
		$sql = "
			UPDATE ".$db->prefix."fm_file
			SET attribute='".bkint($attribute)."' 
			WHERE filehash='".bkstr($filehash)."'
		";
		$db->query_write($sql);
	}
	
	/**
	 * Добавление в редактор последние изменения картинки
	 */
	public static function EditorAppend(CMSDatabase $db, $userid, $filehashsrc, $filehashdst, $left, $top, $width, $height, $tools, $session){
		$sql = "
			INSERT INTO ".$db->prefix."fm_editor 
			(userid, filehashsrc, `left`, top, width, height, tools, filehashdst, dateline, session) VALUES
			(
				".bkint($userid).",
				'".bkstr($filehashsrc)."',
				".bkint($left).",
				".bkint($top).",
				".bkint($width).",
				".bkint($height).",
				'".bkstr($tools)."',
				'".bkstr($filehashdst)."',
				".TIMENOW.",
				".bkint($session)."
			)
		";
		$db->query_write($sql);
	}
	const EDITOR_FIELD = "
		editorid as id,
		filehashsrc as fhsrc,
		width as w,
		height as h,
		`left` as l,
		top as t,
		tools,
		filehashdst as fhdst,
		dateline as dl,
		session as ss
	";
	
	public static function EditorList(CMSDatabase $db, $filehash, $session){
		$sql = "
			SELECT
				".CMSQFileManager::EDITOR_FIELD."
			FROM ".$db->prefix."fm_editor
			WHERE filehashsrc='".bkstr($filehash)."' AND session='".bkstr($session)."'
			ORDER BY dateline DESC
		";
		return $db->query_read($sql);
	}
	
	/**
	 * Информация о последних изминениях картинки
	 */
	public static function EditorInfo(CMSDatabase $db, $filehash, $session){
		$sql = "
			SELECT
				".CMSQFileManager::EDITOR_FIELD."
			FROM ".$db->prefix."fm_editor
			WHERE filehashsrc='".bkstr($filehash)."' AND session='".bkstr($session)."'
			ORDER BY dateline DESC
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function FolderInfoByName(CMSDatabase $db, $userid, $parentFolderId, $folderName){
		$sql = "
			SELECT 
				folderid as id, 
				parentfolderid as pid, 
				name as fn, 
				phrase as ph,
				userid as uid
			FROM ".$db->prefix."fm_folder
			WHERE userid=".bkint($userid)." AND parentfolderid=".bkint($parentFolderId)." AND name='".bkstr($folderName)."' 
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function FolderInfo(CMSDatabase $db, $folderid){
		$sql = "
			SELECT 
				folderid as id, 
				parentfolderid as pid, 
				name as fn, 
				phrase as ph,
				userid as uid
			FROM ".$db->prefix."fm_folder
			WHERE folderid=".bkint($folderid)."
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function FolderRemove(CMSDatabase $db, $folderid){
		$rows = CMSQFileManager::FolderChildIdList($db, $folderid);
		while (($row = $db->fetch_array($rows))){
			CMSQFileManager::FolderRemove($db, $row['id']);
		}
		
		$rows = CMSQFileManager::FileListInFolder($db, $folderid);
		while (($row = $db->fetch_array($rows))){
			CMSQFileManager::FileDelete($db, $row['fh']);
		}
		$sql = "
			DELETE FROM ".$db->prefix."fm_folder
			WHERE folderid=".bkint($folderid)."
		";
		$db->query_write($sql);
	}
	
	/**
	 * Список дочерних папок в дирректории
	 */
	public static function FolderChildIdList(CMSDatabase $db, $folderid){
		$sql = "
			SELECT 
				folderid as id 
			FROM ".$db->prefix."fm_folder
			WHERE parentfolderid=".bkint($folderid)."
		";
		return $db->query_read($sql);
	}
	
	public static function FolderList(CMSDatabase $db, $userid){
		$sql = "
			SELECT 
				folderid as id, 
				parentfolderid as pid, 
				name as fn, 
				phrase as ph
			FROM ".$db->prefix."fm_folder
			WHERE userid=".bkint($userid)."
			ORDER BY phrase
		";
		return $db->query_read($sql);
	}
	
	public static function FolderChangePhrase(CMSDatabase $db, $folderid, $phrase){
		$sql = "
			UPDATE ".$db->prefix."fm_folder 
			SET phrase='".bkstr($phrase)."'
			WHERE folderid=".bkint($folderid)."  
			LIMIT 1
		";
		$db->query_write($sql);
	}
	
	public static function FolderAdd(CMSDatabase $db, $parentfolderid, $userid, $name, $phrase = ''){
		if (empty($phrase)){
			$phrase = $name;
		}
		if (empty($name)){
			return 0;
		}
		$parentfolderid = intval($parentfolderid);
		$sql = "
			SELECT folderid as id
			FROM ".$db->prefix."fm_folder
			WHERE parentfolderid=".bkint($parentfolderid)."
				AND userid=".bkint($userid)."
				AND name='".bkstr($name)."'
			LIMIT 1
		";
		$row = $db->query_first($sql);
		if (!empty($row)){
			return $row['id'];
		}
			
		$sql = "
			INSERT INTO ".$db->prefix."fm_folder
				(parentfolderid, userid, name, phrase, dateline)
			VALUES (
				".bkint($parentfolderid).",
				".bkint($userid).",
				'".bkstr($name)."',
				'".bkstr($phrase)."',
				".TIMENOW."
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
	public static function FileDelete(CMSDatabase $db, $fileid){
		CMSQFileManager::FilesDelete($db, array($fileid));
	}
	
	/**
	 * Удаление файлов и их превью
	 */
	public static function FilesDelete(CMSDatabase $db, $files){
		if (empty($files)){ return; }
		
		$where = array();
		$whereprev = array();
		foreach ($files as $filehash){
			array_push($whereprev, "filehashsrc='".bkstr($filehash)."'");
			array_push($where, "filehash='".bkstr($filehash)."'");
			
			$fsFile = CMSQFileManager::FSPathGet($db, $filehash);
			if (file_exists($fsFile)){
				@unlink($fsFile);
			}
		}
		$whprev = implode(" OR ", $whereprev);
		$sql = "
			SELECT filehashdst
			FROM ".$db->prefix."fm_imgprev
			WHERE ".$whprev."
		";
		$rows = $db->query_read($sql);
		while (($row = $db->fetch_array($rows))){
			array_push($where, "filehash='".bkstr($row['filehashdst'])."'");
		}
		
		$sql = "
			DELETE 
			FROM ".$db->prefix."fm_imgprev
			WHERE ".$whprev."
		";
		$db->query_write($sql);
		
		$wh = implode(" OR ", $where);
		$sql = "
			DELETE 
			FROM ".$db->prefix."fm_file
			WHERE ".$wh."
		";
		$db->query_write($sql);
	}

	public static function UserGroupLimitList(CMSDatabase $db){
		$sql = "
			SELECT *
			FROM ".$db->prefix."fm_usergrouplimit
		";
		return $db->query_read($sql);
	}
	
	/**
	 * Кол-во используемого пространства 
	 */
	public static function FileUsedSpace(CMSDatabase $db, $userid){
		$sql = "
			SELECT sum(filesize) as fullsize
			FROM ".$db->prefix."fm_file
			WHERE userid=".bkint($userid)."
			GROUP BY userid
			LIMIT 1
		";
		$row = $db->query_first($sql);
		return intval($row['fullsize']);
	}
	
	public static function ImagePreviewAdd(CMSDatabase $db, $filehashsrc, $filehashdst, $width, $height, $cnv){
		$sql = "
			INSERT INTO ".$db->prefix."fm_imgprev
			(filehashsrc, width, height, cnv, filehashdst) VALUES (
				'".bkstr($filehashsrc)."',
				".bkint($width).",
				".bkint($height).",
				'".bkstr($cnv)."',
				'".bkstr($filehashdst)."'
			)
		";
		$db->query_write($sql);
	}
	
	public static function ImagePreviewHash(CMSDatabase $db, $filehashsrc, $width, $height, $cnv){
		$sql = "
			SELECT filehashdst
			FROM ".$db->prefix."fm_imgprev
			WHERE 
				filehashsrc='".bkstr($filehashsrc)."' 
				AND width=".bkint($width)."
				AND height=".bkint($height)."
				AND cnv='".bkstr($cnv)."'
		";
		$row = $db->query_first($sql);
		if (empty($row)){ return ""; }
		return $row['filehashdst'];
	}
	
	public static function FileUpdateCounter(CMSDatabase $db, $filehash){
		$sql = "
			UPDATE ".$db->prefix."fm_file 
			SET counter=counter+1, lastget=".TIMENOW."
			WHERE filehash='".bkstr($filehash)."' 
			LIMIT 1
		";
		$db->query_write($sql);
	}
	
	public static function ImageExist(CMSDatabase $db, $filehash){
		$sql = "
			SELECT filename, folderid
			FROM ".$db->prefix."fm_file
			WHERE filehash = '".bkstr($filehash)."' AND isimage > 0
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function &FileData(CMSDatabase $db, $filehash, $begin = 1, $count = 2097152){
		$sql = "
			SELECT 
				fileid, 
				userid, 
				filehash, 
				filename, 
				filesize, 
				counter, 
				dateline, 
				extension, 
				SUBSTRING(filedata, ".bkint($begin).", ".bkint($count).") AS filedata,
				fsname, folderid
			FROM ".$db->prefix."fm_file
			WHERE filehash = '".bkstr($filehash)."'
			LIMIT 1
		";
		$row = $db->query_first($sql);
		
		$fsPath = CMSQFileManager::FSPathGetByEls($row['userid'], $row['folderid'], $row['fsname']);
		$row['fsname'] = '';
		
		if (!file_exists($fsPath)){
			return $row;
		}
		// $size = filesize($fsPath);
		
		$begin = $begin - 1;
		
		$fp = fopen($fsPath, 'r');
		fseek($fp, $begin);
		$row['filedata'] = fread($fp, $count); 
		fclose($fp);
		
		return $row;
	}
	
	const FILE_FIELD = "
		fileid as id, 
		filehash as fh, 
		filename as fn,
		title as tl, 
		filesize as fs, 
		dateline as d,
		attribute as a, 
		extension as ext, 
		isimage as img, 
		imgwidth as w, 
		imgheight as h,
		folderid as fdid,
		userid as uid
	";
	
	public static function FSPathCreate(CMSDatabase $db, $filehash){
		$finfo = CMSQFileManager::FileInfo($db, $filehash);
		if (empty($finfo)){ return; }
		
		$fsfn = CMSQFileManager::GenerateFileHash()."_".$filehash."_".$finfo['ext'];
		
		$sql = "
			UPDATE ".$db->prefix."fm_file
				SET fsname = '".$fsfn."'
			WHERE filehash='".bkstr($filehash)."'
		";
		$db->query_write($sql);
		
		return CMSQFileManager::FSPathGet($db, $filehash);
	}
	
	public static function FSPathGet(CMSDatabase $db, $filehash){
		$finfo = CMSQFileManager::FileInfo($db, $filehash, true);
		if (empty($finfo)){ return; }
		return CMSQFileManager::FSPathGetByInfo($db, $finfo);	
	}
	
	public static function FSPathGetByInfo(CMSDatabase $db, $fi){
		return CMSQFileManager::FSPathGetByEls($fi['uid'], $fi['fdid'], $fi['fsnm']);
	}
	
	public static function FSPathGetByEls($userid, $folderid, $fsname){
		if (empty($fsname)) { return ""; }
		return CWD."/modules/filemanager/upload/".$userid."/".$folderid."/".$fsname;
	}

	/**
	 * Получить информацию о файле
	 */
	public static function FileInfo(CMSDatabase $db, $filehash, $withFSName = false){
		$select = CMSQFileManager::FILE_FIELD;
		if ($withFSName){
			$select .= ",fsname as fsnm ";
		}
		$sql = "
			SELECT ".$select." 
			FROM ".$db->prefix."fm_file
			WHERE filehash = '".bkstr($filehash)."'
			LIMIT 1
		";
		return $db->query_first($sql);		
	}
	
	public static function FileInfoByName(CMSDatabase $db, $userid, $folderid, $filename){
		$sql = "
			SELECT
				".CMSQFileManager::FILE_FIELD." 
			FROM ".$db->prefix."fm_file
			WHERE
				userid=".bkint($userid)." 
				AND folderid=".bkint($folderid)." 
				AND filename='".bkstr($filename)."'
			LIMIT 1
		";
		return $db->query_first($sql);		
	}
	
	public static function FileListInFolder(CMSDatabase $db, $folderid){
		$sql = "
			SELECT 
				".CMSQFileManager::FILE_FIELD." 
			FROM ".$db->prefix."fm_file
			WHERE folderid=".bkint($folderid)."
		";
		return $db->query_read($sql);
	}
	
	public static function FileList(CMSDatabase $db, $userid, $folderId, $attribute = -1){
		$sql = "
			SELECT 
				".CMSQFileManager::FILE_FIELD." 
			FROM ".$db->prefix."fm_file
			WHERE userid = ".bkint($userid)."
			".($attribute>-1?" AND attribute=".$attribute:"")."
			AND folderid='".bkstr($folderId)."'
			ORDER BY filename, dateline
		";
		return $db->query_read($sql);
	}
	
	public static function FileTypeList(CMSDatabase $db){
		$sql = "
			SELECT * 
			FROM ".$db->prefix."fm_filetype
			ORDER BY extension
		";
		return $db->query_read($sql);
	}
	
	/**
	 * Генерация 8-и битного ключа
	 */
	public static function GenerateFileHash($i = 0){
		return substr(md5(time()+$i), 0, 8);
	}
	
	private static function FileHashCheck(CMSDatabase $db, $filehash){
		$row = $db->query_first("
			SELECT filehash
			FROM ".$db->prefix."fm_file
			WHERE filehash = '".bkstr($filehash)."'
			LIMIT 1
		");
		return !empty($row);
	}
	
	public static function GetFileHash(CMSDatabase $db){
		$i = 0;
		do{
			$filehash = CMSQFileManager::GenerateFileHash($i++);
		}while(CMSQFileManager::FileHashCheck($db, $filehash));
		
		return $filehash;
	}
	
	public static function FileUploadAppend(CMSDatabase $db, $filehash, $filedata, $offset, $bytes){
		echo("$offset, $bytes	\n");
		$sql = "
			UPDATE ".$db->prefix."fm_file
				SET filedata = INSERT('filedata', ".($offset+1).", ".$bytes.", '".addslashes($filedata)."')
			WHERE filehash='".$filehash."'
		";
		
		//INSERT(`data`, ".($offset+1).", ".$bytes.", ‘".mysql_real_escape_string($data)."‘)
		
		// mysql_query("UPDATE `files` SET `data` = INSERT(`data`, ".($offset+1).", ".$bytes.", ‘".mysql_real_escape_string($data)."‘) WHERE `id` = ‘".$file->id."‘");
		/*
		$sql = "
			UPDATE ".$db->prefix."fm_file
				SET filedata = CONCAT(filedata,'".mysql_escape_string($filedata)."')
			WHERE filehash='".$filehash."'
		";
		/**/
		$db->query_write($sql);
	}
	
	public static function FileUpload(CMSDatabase $db, $userid, $folderid, $filename, $filedata, $filesize, $extension, $isimage=0, $imgwidth=0, $imgheight=0, $attribute = 0){
		$filehash = CMSQFileManager::GetFileHash($db);
		$sql = "
			INSERT INTO ".$db->prefix."fm_file 
				(filehash, userid, filename, filedata, filesize, extension, isimage, imgwidth, imgheight, attribute, folderid, dateline ) VALUES (
				'".bkstr($filehash)."',
				'".bkint($userid)."',
				'".bkstr($filename)."',
				'".addslashes($filedata)."',
				'".bkint($filesize)."',
				'".bkstr($extension)."',
				'".bkstr($isimage)."',
				'".bkint($imgwidth)."',
				'".bkint($imgheight)."',
				'".bkstr($attribute)."',
				'".bkint($folderid)."',
				'".TIMENOW."'".
			")";
		$db->query_write($sql);
		if ($db->error){
			$db->close();
			$db->ClearError();
			$db->reConnect();
			return '';
		}
		return $filehash;
	}
	
	public static function FileTypeUpdateMime(CMSDatabase $db, $fileTypeId, $mimeType){
		$sql = "
			UPDATE ".$db->prefix."fm_filetype 
			SET mimetype = '".$mimeType."'
			WHERE filetypeid = ".bkint($fileTypeId)." 
			LIMIT 1
		";
		$db->query_write($sql);
	}
	
}

?>