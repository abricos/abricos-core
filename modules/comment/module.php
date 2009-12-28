<?php
/**
 * Модуль "Комментарии"
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Comment
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$cms = CMSRegistry::$instance;

$modComment = new CMSModuleComment();
$cms->modules->Register($modComment);

/**
 * Модуль "Комментарии"
 * @package Abricos
 * @subpackage Comment
 */
class CMSModuleComment extends CMSModule{
	
	/**
	 * Экземпляр класса
	 * 
	 * @var CMSModuleComment
	 */
	public $instance = null;
	
	public $commentData = null;
	
	/**
	 * 
	 * @var CMSDatabase
	 */
	public $db = null;
	
	function __construct(){
		$this->version = "0.3";
		$this->name = "comment";
		$this->defaultCSS = "comment.css";
		
		$this->permission = new CommentPermission($this);
		$this->db = CMSRegistry::$instance->db;
	}
	
	public function IsAdminRole(){
		return $this->permission->CheckAction(CommentAction::COMMENTS_ADMIN) > 0;
	}
	
	public function IsWriteRole(){
		return $this->permission->CheckAction(CommentAction::COMMENT_WRITE) > 0;
	}
	
	public function IsViewRole(){
		return $this->permission->CheckAction(CommentAction::COMMENTS_VIEW) > 0;
	}
	
	/**
	 * Вернуть указатель на полный список комментариев.
	 * 
	 * @param Integer $page
	 * @param Integer $limit
	 * @return Integer
	 */
	public function FullList($page, $limit){
		if (!$this->IsAdminRole()){ return null; }
		return CMSQComment::FullList($this->db, $page, $limit);
	}

	public function FullListCount(){
		if (!$this->IsAdminRole()){ return null; }
		return CMSQComment::FullListCount($this->db);
	}

	public function ChangeStatus($commentId, $newStatus){
		if (!$this->IsAdminRole()){ return null; }
		CMSQComment::SpamSet($this->db, $commentId, $newStatus);
	}
	
	/**
	 * Добавить комментарий
	 * 
	 * @param integer $contentid идентификатор страницы
	 * @param object $d данные комментария
	 */
	public function Append($contentid, $d){
		if (!$this->IsWriteRole()){ return null; }
		
		$utmanager = CMSRegistry::$instance->GetUserTextManager();
		
		$d->bd = $utmanager->Parser($d->bd);
		if (empty($d->bd)){ return; }
		$d->uid = CMSRegistry::$instance->session->userinfo['userid']; 
		$d->id = CMSQComment::Append($this->db, $contentid, $d);
		$d->cid = $contentid;

		// отправка уведомления 
		$contentinfo = CMSSqlQuery::ContentInfo($this->db, $contentid);
		if (!empty($contentinfo)){
			$module = Brick::$modules->GetModule('comment');
			$module->commentData = $d;
			
			$module = Brick::$modules->GetModule($contentinfo['modman']);
			$module->OnComment();
		}
	}
	
	public function Preview($d){
		$utmanager = $this->registry->GetUserTextManager(); 
		$d->bd = $utmanager->Parser($d->bd);
		$row = array();
		$row['id'] = 1;
		$row['bd'] = $d->bd;
		$arr = array();
		array_push($arr, $row);
		return $arr;
	}
	
	
	public function Comments($contentId, $lastid = 0){
		if (!$this->IsViewRole()){ return null; }
		return CMSQComment::Comments($this->db, $contentId, $lastid);
	}
}

class CommentAction {
	const COMMENTS_VIEW = 10;
	const COMMENT_WRITE = 20; 
	const COMMENTS_ADMIN = 50;
}

class CommentPermission extends CMSPermission {
	
	public function CommentPermission(CMSModuleComment $module){
		
		$defRoles = array(
			new CMSRole(CommentAction::COMMENTS_VIEW, 1, USERGROUPID_ALL),
			new CMSRole(CommentAction::COMMENT_WRITE, 1, USERGROUPID_REGISTERED),
			new CMSRole(CommentAction::COMMENTS_ADMIN, 1, USERGROUPID_ADMINISTRATOR)
		);
		
		parent::CMSPermission($module, $defRoles);
	}
	
	public function GetRoles(){
		$roles = array();
		$roles[CommentAction::COMMENTS_VIEW] = $this->CheckAction(CommentAction::COMMENTS_VIEW);
		$roles[CommentAction::COMMENT_WRITE] = $this->CheckAction(CommentAction::COMMENT_WRITE);
		$roles[CommentAction::COMMENTS_ADMIN] = $this->CheckAction(CommentAction::COMMENTS_ADMIN);
		return $roles;
	}
}


/**
 * Статичные функции запросов к базе данных
 * @package Abricos 
 * @subpackage Comment
 */
class CMSQComment{
	
	const STATUS_OK = 0;
	const STATUSS_SPAM = 1;
	
	public static function SpamSet(CMSDatabase $db, $commentId, $newStatus){
		$sql = "
			UPDATE ".$db->prefix."cmt_comment
			SET status='".bkstr($newStatus)."'
			WHERE commentid='".bkint($commentId)."'
			LIMIT 1
		";
		$db->query_write($sql);
	}
	
	public static function FullListCount(CMSDatabase $db){
		$sql = "
			SELECT count(commentid) as cnt 
			FROM ".$db->prefix."cmt_comment
		";
		return $db->query_read($sql);
	}
	
	public static function FullList(CMSDatabase $db, $page, $limit){
		$from = (($page-1)*$limit);
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
			LIMIT ".$from.",".bkint($limit)."
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
				IF(a.status=".CMSQComment::STATUSS_SPAM.", '', a.body) as bd, 
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