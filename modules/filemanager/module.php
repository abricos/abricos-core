<?php
/**
 * Модуль "Менеджер файлов"
 * 
 * @version $Id$
 * @package CMSBrick
 * @subpackage FileManager
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$mod = new CMSModuleFileManager();
CMSRegistry::$instance->modules->Register($mod);

/**
 * Модуль "Менеджер файлов"
 * 
 * @package CMSBrick
 * @subpackage FileManager
 */
class CMSModuleFileManager extends CMSModule {
	
	/**
	 * Менеджер загрузки файла на сервер
	 *
	 * @var CMSUpload
	 */
	private $upload;
	
	/**
	 * @var CMSFileManager
	 */
	private $fileManager = null;
	
	public function __construct(){
		$this->version = "1.0.2";
		
		$this->name = "filemanager";
		$this->takelink = "filemanager";
	}
	
	public function GetContentName(){
		$adress = $this->registry->adress;
		$cname = parent::GetContentName();
		
		if($adress->level > 2 && $adress->dir[1] == 'i'){
			$cname = 'file';
		}
		return $cname;
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
}

/**
 * Статичные функции работы с модулем
 * 
 * @package CMSBrick
 * @subpackage FileManager
 */
class CMSFileManagerMan {
	
	public static function IsAdmin(){ return CMSRegistry::$instance->session->IsAdminMode(); }
	public static function IsRegister(){ return CMSRegistry::$instance->session->IsRegistred(); }
	public static function GetUserid(){
		return CMSRegistry::$instance->session->userinfo['userid'];
	}
	
	public static function FolderChangePhrase($data){
		if (!CMSFileManagerMan::IsRegister()){ return; }
		$userid = CMSFileManagerMan::GetUserid();
		$finfo = CMSQFileManager::FolderInfo(Brick::$db, $data->id);
		if (!CMSFileManagerMan::IsAdmin() && $finfo['uid'] != $userid){ return; }
		CMSQFileManager::FolderChangePhrase(Brick::$db, $data->id, $data->ph);
	}

	public static function FolderRemove($data){
		if (!CMSFileManagerMan::IsRegister()){ return; }
		$userid = CMSFileManagerMan::GetUserid();
		$finfo = CMSQFileManager::FolderInfo(Brick::$db, $data->id);
		if (!CMSFileManagerMan::IsAdmin() && $finfo['uid'] != $userid){ return; }
		CMSQFileManager::FolderRemove(Brick::$db, $data->id);
	}
	
	public static function FolderAppend($data){
		if (!CMSFileManagerMan::IsRegister()){ return; }
		$userid = CMSFileManagerMan::GetUserid();
		$name = translateruen($data->ph);
		CMSQFileManager::FolderAdd(Brick::$db, $data->pid, $userid, $name, $data->ph);
	}
	
	public static function FileRemove($data){
		$filehash = $data->fh;
		$finfo = CMSQFileManager::FileInfo(Brick::$db, $filehash);
		if (empty($finfo)){ return ; }
		$userid = CMSRegistry::$instance->session->userinfo['userid'];
		 
		if (!CMSFileManagerMan::IsAdmin() && $userid != $finfo['uid']){
			return;
		}
		CMSQFileManager::FilesDelete(Brick::$db, array($filehash));
	}
	
	public static function FileCheckEditAccess($finfo){
		if (empty($finfo)){ return false; }
		$userid = CMSRegistry::$instance->session->userinfo['userid'];
		
		if (!CMSFileManagerMan::IsAdmin() && $userid != $finfo['uid']){ return false; }
		return true;
	}
	
	/**
	 * Изменение картинки
	 * 
	 * @param $filehash идентификатор основной картинки
	 * @param $session текущая сессия редактора
	 * @param $data данные по изменению
	 */
	public static function ImageChange($filehash, $session, $data){
		
		// получить информацию редактируемой картинки
		$finfo = CMSQFileManager::FileInfo(Brick::$db, $filehash);
		
		if (!CMSFileManagerMan::FileCheckEditAccess($finfo)){
			return $filehash;
		}
		
		// картинка с последними изменения в редакторе
		$lastedit = CMSQFileManager::EditorInfo(Brick::$db, $filehash, $session);

		$fromfilehash = $filehash;
		
		if (!empty($lastedit)){
			$fromfilehash = $lastedit['fhdst'];
		}
		
		$d = array(
			"width" => $data->w, "height" => $data->h,
			"left" => $data->l, "top" => $data->t,
		);
		
		$modFM = Brick::$modules->GetModule('filemanager');
		$cmsupload = $modFM->GetUpload();
		
		$result = $cmsupload->ImageChange($fromfilehash, $data->tools, $d);
		if ($result != 0){ return $fromfilehash; }
		
		$newfilehash = $cmsupload->lastLoadFileHash;
		$userid = CMSRegistry::$instance->session->userinfo['userid'];
		CMSQFileManager::EditorAppend(Brick::$db, $userid, $filehash, $newfilehash, $data->l, $data->t, $data->w, $data->h, $data->tools, $session);
		
		return $newfilehash;
	}
	
	public static function GetFiles(CMSDatabase $db, $userid, $folderid){
		return CMSQFileManager::FileList($db, $userid, $folderid, CMSQFileManager::FILEATTRIBUTE_NONE);
	}
	
	/**
	 * Сохранение изменений картинки в редакторе
	 * 
	 * @param $filehash идентификатор основной картинки
	 * @param $session текущая сессия редактора
	 * @param $data данные по изменению
	 */
	public static function ImageEditorSave($data){
		$filehash = $data->fh;
		$session = $data->session;
		// получить информацию редактируемой картинки
		$finfo = CMSQFileManager::FileInfo(Brick::$db, $filehash);
		
		if (!CMSFileManagerMan::FileCheckEditAccess($finfo)){
			return $filehash;
		}
		// картинка с последними изменения в редакторе
		$lastedit = CMSQFileManager::EditorInfo(Brick::$db, $filehash, $session);
		
		if (empty($lastedit)){ return; }
		$userid = CMSRegistry::$instance->session->userinfo['userid'];
		CMSQFileManager::ImageEditorSave(Brick::$db, $userid, $filehash, $lastedit, $data->copy);
	}
	
}

/**
 * Статичные функции запросов к базе данных
 * 
 * @package CMSBrick
 * @subpackage FileManager
 */
class CMSQFileManager extends CMSBaseClass {
	
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
	
	public static function FolderAdd(CMSDatabase $db, $parentfolderid, $userid, $name, $phrase){
		if (empty($name) || empty($phrase)){
			return;
		}
		if (!$parentfolderid){
			$parentfolderid = intval($parentfolderid);
			$sql = "
				SELECT folderid
				FROM ".$db->prefix."fm_folder
				WHERE parentfolderid=".bkint($parentfolderid)."
					AND userid=".bkint($userid)."
					AND name='".bkstr($name)."'
				LIMIT 1
			";
			$row = $db->query_first($sql);
			if (!empty($row)){
				return;
			}
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
	
	public static function &FileGet(CMSDatabase $db, $filehash, $begin = 1, $end = 2097152){
		$sql = "
			SELECT fileid, userid, filehash, filename, filesize, counter, dateline, extension, 
					SUBSTRING(filedata, ".bkint($begin).", ".bkint($end).") AS filedata  
			FROM ".$db->prefix."fm_file
			WHERE filehash = '".bkstr($filehash)."'
			LIMIT 1
		";
		return $db->query_first($sql);
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

	/**
	 * Получить информацию о файле
	 */
	public static function FileInfo(CMSDatabase $db, $filehash){
		$sql = "
			SELECT
				".CMSQFileManager::FILE_FIELD." 
			FROM ".$db->prefix."fm_file
			WHERE filehash = '".bkstr($filehash)."'
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