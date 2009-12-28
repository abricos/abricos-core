<?php
/**
 * Модуль "Комментарии"
 * 
 * @version $Id$
 * @package CMSBrick
 * @subpackage Comment
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$cms = CMSRegistry::$instance;

$modComment = new CMSModuleComment();
$cms->modules->Register($modComment);

/**
 * Модуль "Комментарии"
 * @package CMSBrick
 * @subpackage Comment
 */
class CMSModuleComment extends CMSModule{
	
	public $commentData = null;
	
	function __construct(){
		$this->version = "1.0.2";
		$this->name = "comment";
		$this->defaultCSS = "comment.css";
	}
	
	private $_manager = null;
	public function GetManager(){
		if (is_null($this->_manager)){
			require_once CWD.'/modules/comment/includes/manager.php';
			$this->_manager = new CMSCommentManager($this->registry);
		}
		return $this->_manager;
	}
	
}

/**
 * Статичные функции запросов к базе данных
 * @package CMSBrick
 * @subpackage Comment
 */
class CMSQComt{
	
	const STATUS_OK = 0;
	const STATUSS_SPAM = 1;
	
	public static function SpamSet(CMSDatabase $db, $obj){
		$sql = "
			UPDATE ".$db->prefix."cmt_comment
			SET status='".bkstr($obj->st)."'
			WHERE commentid='".bkint($obj->id)."'
			LIMIT 1
		";
		$db->query_write($sql);
	}
	
	public static function AdmListCount(CMSDatabase $db){
		$sql = "
			SELECT count(commentid) as cnt 
			FROM ".$db->prefix."cmt_comment
		";
		$row = $db->query_first($sql);
		return $row['cnt'];
	}
	
	public static function AdmList(CMSDatabase $db, $page){
		$from = (($page-1)*15);
		$sql = "
			SELECT 
				a.commentid as id, 
				a.parentcommentid as pid, 
				a.dateline as dl, 
				a.dateedit as de, 
				a.body as bd, 
				a.status as st, 
				u.userid as uid, 
				u.username as unm,
				u.usergroupid as ugp
			FROM ".$db->prefix."cmt_comment a
			LEFT JOIN ".$db->prefix."user u ON u.userid = a.userid
			ORDER BY a.dateline DESC
			LIMIT ".$from.",15
		";
		return $db->query_read($sql);
	}
	
	public static function Append(CMSDatabase $db, $contentid, $d){
		$sql = "
			INSERT INTO ".$db->prefix."cmt_comment (
				contentid, 
				parentcommentid, 
				userid, 
				dateline,
				dateedit, 
				body
			)
			VALUES (
			".bkint($contentid).",
			".bkint($d->pid).",
			".bkint($d->uid).",
			".TIMENOW.",
			".TIMENOW.",
			'".bkstr($d->bd)."'
		)";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
	public static function Comments(CMSDatabase $db, $contentId, $lastid = 0){
		$sql = "
			SELECT 
				a.commentid as id, 
				a.parentcommentid as pid, 
				a.dateedit as de,
				IF(a.status=".CMSQComt::STATUSS_SPAM.", '', a.body) as bd, 
				a.status as st, 
				u.userid as uid, 
				u.username as unm
			FROM ".$db->prefix."cmt_comment a
			LEFT JOIN ".$db->prefix."user u ON u.userid = a.userid
			WHERE a.contentid =".bkint($contentId)." AND a.commentid > ".bkint($lastid)."
			ORDER BY a.dateline
		";
		return $db->query_read($sql);
	}
}
?>