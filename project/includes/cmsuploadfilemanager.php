<?php
/**
* @version $Id: cmsuploadfilemanager.php 418 2008-10-20 14:33:59Z AKuzmin $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

class CMSUploadFileManager extends CMSBaseClass {
	
	public $fileinfo = null;
	
	private $filecount = 0;
	
	/**
	 * Enter description here...
	 *
	 * @var CMSRegistry
	 */
	private $registry = null;
	
	/**
	 * Enter description here...
	 *
	 * @var CMSDatabase
	 */
	private $db = null;
	
	public $usefiletype = array();
	
	/**
	 * Идентификатор последнего загруженного файла
	 *
	 * @var Integer
	 */
	public $uploadedFileId = 0;
	
	function __construct(){
		global $cms;
		$this->registry = &$cms;
		$this->db = &$cms->db;
		
		$sql = "select * from ".$this->db->prefix."filetype order by extension";
		$rows = $this->db->query_read($sql);
		while ($row = $this->db->fetch_array($rows)){	
			$this->usefiletype[$row['extension']] = $row;
		}
	}
	
	function SetUploadFileInfo($fileinfo){
		$this->fileinfo = $fileinfo;
		$this->filecount = count ($this->fileinfo['name']);
	}
	
	/**
	 * Загрузка файлов в БД
	 * Возвращает код ошибки:
	 *   0 - ошибки нет
	 *   1 - расширение файла нет в списке допустимых
	 *   2 - размер файла больше допустимого
	 *   3 - прочая ошибка
	 *
	 * @param integer $menuid
	 * @return возвращает код ошибки
	 */
	function UploadFiles($menuid){
		$this->uploadedFileId = 0;
		$userid = $this->registry->session->userinfo['userid'];
		
		if ($this->filecount != 1){
			return 0;
		}
		$filename = trim($this->fileinfo['name']);
			
		$filelocation = trim($this->fileinfo['tmp_name']);
		$filesize = intval($this->fileinfo['size']);
		
		$pathinfo = pathinfo($filename);
		$extension = strtolower($pathinfo['extension']);

		$filetype = $this->usefiletype[$extension];
			
		if (empty($filetype)){
			return 1;
		}
			
		if ($filesize > $filetype['maxsize']){
			return 2;
		}
			
		if (!is_uploaded_file($filelocation)){
			return 3;
		}
		if (!($filedata = @file_get_contents($filelocation))) {
			return 3;
		}
			
		// все ок, можно загружать в БД
		$sql = "INSERT INTO ".$this->db->prefix."file (userid, filename, filedata, filesize, extension, dateline) VALUES (".
			"'".$userid."',".
			"'".$filename."',".
			"'".addslashes($filedata)."',".
			"'".$filesize."',".
			"'".$extension."',".
			"'".TIMENOW."'".
			")";
		$this->db->query_write($sql);
		$row = $this->db->query_first("
		SELECT max(fileid) as fileid FROM ".$this->db->prefix."file LIMIT 1");
		$this->uploadedFileId = $row['fileid']; 

		return 0;
	}
	
	function DeleteFile($fileid){
		$sql = "delete from ".$this->db->prefix."file where fileid=".$fileid;
		$this->db->query_write($sql);
	}
	
	function AddUseFileType($extension, $maxsize){
		$extension = strtolower($extension);
	}
	
	/**
	 * Является ли файл картинкой
	 *
	 * @param Integer $fileid
	 * @return Boolean
	 */
	function TypeFileIsImage($fileid){
		$sql = "SELECT ".$this->db->prefix."file.fileid 
			FROM ".$this->db->prefix."file 
			LEFT JOIN ".$this->db->prefix."filetype ON ".$this->db->prefix."file.extension = ".$this->db->prefix."filetype.extension
			WHERE ".$this->db->prefix."filetype.mimetype	LIKE  '%Image%' LIMIT 1";
		$row = $this->db->query_first($sql);
		return !empty($row);
	}
}

?>