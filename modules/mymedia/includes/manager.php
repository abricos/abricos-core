<?php
/**
 * @version $Id: manager.php 183 2009-11-20 13:16:15Z roosit $
 * @package Abricos
 * @subpackage User
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

class MyMediaManager {
	
	/**
	 * 
	 * @var CMSModMyMedia
	 */
	public $module = null;
	
	/**
	 * 
	 * @var CMSDatabase
	 */
	public $db = null;
	
	public $user = null;
	
	public function MyMediaManager (CMSModMyMedia $module){
		
		$this->module = $module;
		$this->db = $module->registry->db;
		
		$this->user = $module->registry->session->userinfo;
	}
	
	public function IsAdminRole(){
		return $this->module->permission->CheckAction(MyMediaAction::MYMEDIA_ADMIN) > 0;
	}
	
	public function IsMyMediaAppendRole(){
		return $this->module->permission->CheckAction(MyMediaAction::MYMEDIA_APPEND) > 0;
	}
	
	public function IsMyMediaViewRole(){
		return $this->module->permission->CheckAction(MyMediaAction::MYMEDIA_VIEW) > 0;
	}
	
	public function IsProfileAccess($userid = 0){
		if ($userid == 0){
			$userid = $this->user['userid'];
		}
		if (($this->user['userid'] == $userid && $this->IsMyMediaAppendRole())
			|| $this->IsAdminRole()){
			return true;
		}
		return false;
	}

	public function AlbumList(){
		$userid = $this->user['userid'];
		return $this->AlbumListByUser($userid);
	}
	
	public function AlbumListByUser($userid){
		if (!$this->IsProfileAccess($userid)){ return null; }
		return CMSQMyMedia::AlbumList($this->db, $userid);
	}
	
	public function AlbumAppend($data){
		$userid = $this->user['userid'];
		if (!$this->IsProfileAccess($userid)){ return null; }
		// TODO: Необходимо обработать входные данные, вырезать теги и т.п.
		CMSQMyMedia::AlbumAppend($this->db, $userid, $data);
	}
	
	public function AlbumEdit($albumid){
		$userid = CMSQMyMedia::UserIdByAlbumId($this->db, $albumid); 
		
		if (!$this->IsProfileAccess($userid)){ 
			return null; 
		}
		return CMSQMyMedia::AlbumEdit($this->db, $albumid);
	}
	
	public function AlbumUpdate($data){
		$userid = CMSQMyMedia::UserIdByAlbumId($this->db, $data->id); 
		
		if (!$this->IsProfileAccess($userid)){ 
			return null; 
		}
		CMSQMyMedia::AlbumUpdate($this->db, $data);
	}
	
	public function AlbumView($albumid){
		if (!$this->IsMyMediaViewRole()){ return null; }
		return CMSQMyMedia::AlbumView($this->db, $albumid);
	}
	
	public function FileList($albumid){
		if (!$this->IsMyMediaViewRole()){ return null; }
		return CMSQMyMedia::FileList($this->db, $albumid);
	}
	
	public function FileRemove($fileid){
		$finfo = CMSQMyMedia::FileInfo($this->db, $fileid, true);
		if (!$this->IsProfileAccess($finfo['uid'])){ return null; }
		
		$fileManager = CMSRegistry::$instance->modules->GetModule('filemanager')->GetFileManager();
		$fileManager->FileRemove($finfo['fh']);
		
		CMSSqlQuery::ContentRemove($this->db, $finfo['ctid']);
		CMSQMyMedia::FileRemove($this->db, $fileid);
	}
	
}

/**
 * Статичные функции запросов к базе данных
 * 
 * @package Abricos
 * @subpackage MyMedia
 */
class CMSQMyMedia {
	
	public static function FileRemove(CMSDatabase $db, $fileid){
		$sql = "
			DELETE FROM ".$db->prefix."mm_file
			WHERE fileid=".$fileid."
		";
		$db->query_write($sql);
	}
	
	public static function FileAppend(CMSDatabase $db, $userid, $albumid, $filehash){
		$contentid = CMSSqlQuery::CreateContent($db, '', 'mymedia');
		$sql = "
			INSERT INTO ".$db->prefix."mm_file
			(
				userid, albumid, filehash, contentid
			) VALUES 
			(
				".bkint($userid).",
				".bkint($albumid).",
				'".bkstr($filehash)."',
				".bkint($contentid)."
			)
		";
		$db->query_write($sql);
	}
	
	public static function FileList(CMSDatabase $db, $albumid){
		$sql = "
			SELECT 
				a.fileid as id,
				a.albumid as aid,
				a.filehash as fh,
				a.contentid as ctid,
				f.filename as nm,
				f.dateline as dl,
				f.filesize as sz,
				f.imgwidth as iw,
				f.imgheight as ih
				FROM ".$db->prefix."mm_file a
			LEFT JOIN ".$db->prefix."fm_file f ON a.filehash = f.filehash
			WHERE albumid=".bkint($albumid)."
			
		";
		return $db->query_read($sql);
	}
	
	public static function FileInfo(CMSDatabase $db, $fileid, $retArray = true){
		$sql = "
			SELECT 
				a.fileid as id,
				a.userid as uid,
				a.albumid as aid,
				a.filehash as fh,
				a.contentid as ctid,
				f.filename as nm,
				f.dateline as dl,
				f.filesize as sz,
				f.imgwidth as iw,
				f.imgheight as ih
			FROM ".$db->prefix."mm_file a
			LEFT JOIN ".$db->prefix."fm_file f ON a.filehash = f.filehash
			WHERE a.fileid=".bkint($fileid)."
			LIMIT 1
		";
		if ($retArray){
			return $db->query_first($sql);
		}
		return $db->query_read($sql);
	}
	
	public static function AlbumView(CMSDatabase $db, $albumid){
		$sql = "
			SELECT 
				a.albumid as id,
				a.albumname as nm,
				a.albumdesc as dsc,
				a.dateline as dl,
				u.userid as uid,
				u.username as unm
			FROM ".$db->prefix."mm_album a
			LEFT JOIN ".$db->prefix."user u ON u.userid = a.userid
			WHERE albumid=".bkint($albumid)."
			LIMIT 1
		";
		return $db->query_read($sql);
	}
	
	public static function UserIdByAlbumId(CMSDatabase $db, $albumid){
		$sql = "
			SELECT 
				userid as uid
			FROM ".$db->prefix."mm_album
			WHERE albumid=".bkint($albumid)."
			LIMIT 1
		";
		$row = $db->query_first($sql);
		if (empty($row)){
			return 0;
		}
		return $row['uid'];
	}
	
	public static function AlbumEdit(CMSDatabase $db, $albumid){
		$sql = "
			SELECT 
				albumid as id,
				userid as uid,
				albumname as nm,
				albumdesc as dsc,
				dateline as dl
			FROM ".$db->prefix."mm_album
			WHERE albumid=".bkint($albumid)."
			LIMIT 1
		";
		return $db->query_read($sql);
	}
	
	public static function AlbumUpdate(CMSDatabase $db, $data){
		$sql = "
			UPDATE ".$db->prefix."mm_album
			SET 
				albumname = '".bkstr($data->nm)."',
				albumdesc = '".bkstr($data->dsc)."'
			WHERE albumid=".bkint($data->id)."
		";
		$db->query_write($sql);
	}
	
	public static function AlbumAppend(CMSDatabase $db, $userid, $data){
		$sql = "
			INSERT INTO ".$db->prefix."mm_album 
				(userid, albumname, albumdesc, dateline) VALUES (
				".$userid.",
				'".bkstr($data->nm)."',
				'".bkstr($data->dsc)."',
				".TIMENOW."
			)
		";
		$db->query_write($sql);
	}
	
	public static function AlbumList(CMSDatabase $db, $userid){
		$sql = "
			SELECT 
				albumid as id,
				albumname as nm,
				dateline as dl
			FROM ".$db->prefix."mm_album
			WHERE userid=".bkint($userid)."
			ORDER BY nm
		";
		return $db->query_read($sql);
	}
}

?>