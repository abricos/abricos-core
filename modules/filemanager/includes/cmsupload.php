<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage FileManager
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

/**
 * Загрузчик файлов в базу данных
 * 
 * @package CMSBrick
 * @subpackage FileManager
 */
class CMSUpload {
	
	/**
	 * Ядро
	 * @var CMSRegistry
	 */
	public $registry = null;
	public $fileType = array();
	public $userGroupLimit = array();
	public $lastLoadFileHash = "";
	
	public function CMSUpload(CMSRegistry $registry){
		$this->registry = $registry;
		
		$rows = CMSQFileManager::FileTypeList($this->registry->db);
		while (($row = $this->registry->db->fetch_array($rows))){	
			$this->fileType[$row['extension']] = $row; 
		}
		$rows = CMSQFileManager::UserGroupLimitList($this->registry->db);
		while (($row = $this->registry->db->fetch_array($rows))){	
			$this->userGroupLimit[$row['usergroupid']] = $row; 
		}
	}
	
	/**
	 * Загрузка файла в базу
	 * @param $fileinfo
	 * @param $system если true, файл является системным и виден всем администраторам 
	 */
	public function UploadFiles($folderid, $fileinfo, $system=false){
		$filecount = count ($fileinfo['name']);

		if (empty($filecount)){ return 0; }
		
		$filename = trim($fileinfo['name']);
		$filelocation = trim($fileinfo['tmp_name']);
		$filesize = intval($fileinfo['size']);
		
		$pathinfo = pathinfo($filename);
		$extension = strtolower($pathinfo['extension']);
		
		if (!is_uploaded_file($filelocation)){ return 3; }
		
		if ($system){
			return $this->UploadSystemFile($filelocation, $filename, $extension, $filesize);
		} else {
			return $this->UploadFile($folderid, $filelocation, $filename, $extension, $filesize);
		}
	}
	
	public function UploadSystemFile($filelocation, $filename, $extension, $filesize, $atrribute = 0){
		
		if (!($filedata = @file_get_contents($filelocation))) {
			return 3;
		}
		
		// если картинка, проверка на допустимый размер
		require_once (CWD.'/includes/upload/class.upload.php');
		$upload = new upload($filelocation);
		
		$imgwidth = 0;
		$imgheight = 0;
		if ($upload->file_is_image){
			$imgwidth = $upload->image_src_x;
			$imgheight = $upload->image_src_y;
		}
		
		$isimage = $upload->file_is_image ? 1 : 0;
		
		// все ок, можно загружать в БД
		$this->lastLoadFileHash = CMSQFileManager::FileUpload(
			$this->registry->db, 0, 0, $filename, 
			$filedata, $filesize, $extension, 
			$isimage, $imgwidth, $imgheight, $atrribute
		);

		return 0;
	}
	
	public function UploadFile($folderid, $filelocation, $filename, $extension, $filesize, $atrribute = 0){
		$userid = $this->registry->session->userinfo['userid'];
		
		$filetype = $this->fileType[$extension];
		
		if (empty($filetype)){ return 1; } // ошибка: нет такого типа файла в разрешенных
		if ($filesize > $filetype['maxsize']){ return 2; } // ошибка: размер файла превышает допустимый
		if (!($filedata = @file_get_contents($filelocation))) { return 3; } // ошибка: в чтении файла
		
		// подсчет свободного места в профиле юзера
		$freespace = $this->GetFreeSpace();
		if ($freespace<$filesize){ return 5; } // ошибка: превышена квота

		// если картинка, проверка на допустимый размер
		require_once CWD.'/includes/upload/class.upload.php';
		$upload = new upload($filelocation);
		
		$imgwidth = 0;
		$imgheight = 0;
		if ($upload->file_is_image){
			if ($filetype['maxwidth']>0 && $upload->image_src_x > $filetype['maxwidth']){
				return 4; // ошибка: размер картинки превышает допустимый
			}
			if ($filetype['maxheight']>0 && $upload->image_src_y > $filetype['maxheight']){
				return 4; // ошибка: размер картинки превышает допустимый
			}
			$imgwidth = $upload->image_src_x;
			$imgheight = $upload->image_src_y;
		}
		$isimage = $upload->file_is_image ? 1 : 0;
		
		if (empty($filetype['mimetype'])){
			CMSQFileManager::FileTypeUpdateMime($this->registry->db, $filetype['filetypeid'], $upload->file_src_mime);
			$filetype['mimetype'] = $upload->file_src_mime;
		}
		
		// все ок, можно загружать в БД
		$this->lastLoadFileHash = CMSQFileManager::FileUpload(
			$this->registry->db, $userid, $folderid, 
			$filename, $filedata, $filesize, $extension, 
			$isimage, $imgwidth, $imgheight, 
			$atrribute
		);
		return 0;
	}
	
	public function GetFreeSpace(){
		$user = &$this->registry->session->userinfo;
		$fullsize = CMSQFileManager::FileUsedSpace($this->registry->db, $user['userid']);
		$limit = intval($this->userGroupLimit[$user['usergroupid']]['flimit']);
		return $limit-$fullsize;
	}
	
	public function ImageChange($filehash, $tools, $d){
		if (!$this->registry->session->IsRegistred()){ return; }
		
		// получить файл из БД
		$finfo = CMSQFileManager::FileInfo($this->registry->db, $filehash);
		if (empty($finfo)){ return -1; }

		// if ($finfo['w'] == $width && $finfo['h'] == $height){ return -1; }
		
		$file = $this->SaveTempFile($filehash, $finfo['fn']);
		$dir = CWD."/temp";
		require_once CWD.'/includes/upload/class.upload.php';
		$upload = new upload($file);
		
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

		if (!file_exists($upload->file_dst_pathname)){ return -1; }

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
	
	public function ImageConvert($p_filehash, $p_w, $p_h, $p_cnv){
		
		if (empty($p_w) && empty($p_h) && empty($p_cnv)){ return $p_filehash; }
		
		// Запрос особого размера картинки
		$filehashdst = CMSQFileManager::ImagePreviewHash($this->registry->db, $p_filehash, $p_w, $p_h, $p_cnv);
		
		if (!empty($filehashdst)){ return $filehashdst; }
		if (!$this->registry->session->IsRegistred()){ return $p_filehash; }
		
		$image = CMSQFileManager::ImageExist($this->registry->db, $p_filehash);
		$imageName = $image['filename'];
		if (empty($image)){ return $p_filehash; }// есть ли вообще такая картинка
		
		$dir = CWD."/temp";
		$pathinfo = pathinfo($imageName);
		
		$file = $this->SaveTempFile($p_filehash, $imageName);
		if (empty($file)){ return $p_filehash; }
		
		require_once CWD.'/includes/upload/class.upload.php';
		$upload = new upload($file);
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
		if (!empty($error) || empty($this->lastLoadFileHash)){
			return $p_filehash;
		}
		CMSQFileManager::ImagePreviewAdd($this->registry->db, $p_filehash, $this->lastLoadFileHash, $p_w, $p_h, $p_cnv);
		unlink($upload->file_dst_pathname);
		
		return $this->lastLoadFileHash;
	}
	
	private function SaveTempFile($filehash, $imgname){
		// выгрузка картинки во временный файл для его обработки
		$pinfo = pathinfo($imgname);
		
		$file = CWD."/temp/".(md5(TIMENOW.$imgname)).".".$pinfo['extension'];
				
		if (!($handle = fopen($file, 'w'))){ return false; }
		$fileinfo = CMSQFileManager::FileGet($this->registry->db, $filehash);
		$count = 1;
		while (!empty($fileinfo['filedata']) AND connection_status() == 0) {
			fwrite($handle, $fileinfo['filedata']);
			if (strlen($fileinfo['filedata']) == 2097152) {
				$startat = (2097152 * $count) + 1;
				$fileinfo = CMSQFileManager::FileGet($this->registry->db, $filehash, $startat);
				$count++;
			} else {
				$fileinfo['filedata'] = '';
			}
		}
		fclose($handle);
		
		return $file;
	}
	
}

?>