<?php
/**
 * Модуль "Блог"
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Blog
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

CMSRegistry::$instance->modules->GetModule('comment');
$mod = new CMSModuleBlog();
CMSRegistry::$instance->modules->Register($mod);

/**
 * Модуль "Блог" 
 * @package Abricos
 * @subpackage Blog
 */
class CMSModuleBlog extends CMSModule {
	
	/**
	 * @var CMSModuleBlog
	 */
	public static $instance = null;
	
	public $topicid; 
	public $topicinfo;
	public $page = 1;
	public $baseUrl = "";
	public $category = "";
	public $tag = "";
	public $taglimit = 50;
	
	public function CMSModuleBlog(){
		// версия модуля
		$this->version = "0.4";
		// имя модуля 
		$this->name = "blog";

		$this->takelink = "blog";
		
		// если при сборке страницы будет использован данный модуль,
		// то будет подгружен стиль blog.css
		$this->defaultCSS = "blog.css";
		
		CMSModuleBlog::$instance = $this;
		
		$this->permission = new BlogPermission($this);
	}
	
	private function IsPage($p){
		if (substr($p, 0, 4) == 'page'){
			$c = strlen($p);
			if ($c<=4){ return -1; }
			return intval(substr($p, 4, $c-4));
		}
		return -1;
	}
	
	public function GetTopicLink($topic){
		return "/blog/".$topic['catnm']."/".$topic['topicid']."/";
	}
	
	public function GetContentName(){
		
		$adress = $this->registry->adress;
		$cname = '';
		$baseUrl = "/".$this->takelink."/";
		
		if ($adress->level == 1){
			$this->baseUrl = $baseUrl;
			$cname = 'index';
		}else if ($adress->level==2){
			$p = $adress->dir[1];
			
			if ($p == 'tag'){
				$cname = 'taglist';
				$this->taglimit = 0;
			}else{
				$numpage = $this->IsPage($p); 
				$cname = 'index';
				if ($numpage>-1){
					$this->baseUrl = $baseUrl;
					$this->page = $numpage;
				}else{
					$this->baseUrl = $baseUrl.$p."/";
					$this->category = $p;
				}
			}
		}else if ($adress->level >= 3){
			$p = $adress->dir[2];
			$p1 = $adress->dir[1];
			$baseUrl = $baseUrl.$adress->dir[1]."/";
			if ($p1 == 'tag'){
				$this->tag = $p;
				$cname = 'index';
				$this->baseUrl = $baseUrl.$adress->dir[2]."/";
				if ($adress->level > 3){
					$numpage = $this->IsPage($adress->dir[3]);
					if ($numpage > -1){
						$this->page = $numpage;
					}
				}
			}else{
				$numpage = $this->IsPage($p); 
				if ($numpage>-1){
					$cname = 'index';
					$this->baseUrl = $baseUrl;
					$this->page = $numpage;
					$this->category = $adress->dir[1];
				}else{
					$this->topicid = intval($adress->dir[2]);
					$this->topicinfo = CMSQBlog::TopicInfo($this->registry->db, $this->topicid);
					if (!empty($this->topicinfo)){
						Brick::$contentId = $this->topicinfo['contentid'];
						$cname = 'topic';
					}
				}
			}
		}
		if ($cname == ''){
			$this->registry->SetPageStatus(PAGESTATUS_404);
		}
		return $cname;
	}
	
	// Отправить подписчикам уведомление по почте 
	public function OnComment(){
		Brick::$builder->LoadBrickS('blog', 'cmtmailer', null);
	}
	
	public static function IsAdmin(){
		return CMSRegistry::$instance->session->IsAdminMode();
	}
	
	/**
	 * Получить список записей в блоге текущего пользователя
	 * 
	 * @param Integer $page 
	 * @param Integer $total
	 * @param Boolean $showRecycle Если True, показать удаленные записи
	 * @return Integer Указатель на список
	 */
	public static function TopicListByUser($page, $total, $showRecycle){
		if (!CMSModuleBlog::IsAdmin()) {return;}
		$userid = CMSRegistry::$instance->session->userinfo['userid']; 
		return CMSQBlog::TopicListByUserId(Brick::$db, $userid, $page, $total, $showRecycle);
	}
	
	/**
	 * Получить кол-во записей в блоге текущего пользователя
	 * 
	 * @param Boolean $showRecycle Если True, показать удаленные записи
	 * @return Integer Кол-во записей
	 */
	public static function TopicCountByUser($showRecycle){
		if (!CMSModuleBlog::IsAdmin()) {return;}
		$userid = CMSRegistry::$instance->session->userinfo['userid'];
		return CMSQBlog::TopicCountByUserId(Brick::$db, $userid, $showRecycle); 
	}
	
	/**
	 * Получить запись в блоге
	 * 
	 * @param Integer $topicId Идентификатор записи
	 * @return Array
	 */
	public static function Topic($topicId){
		$user = CMSRegistry::$instance->session->userinfo;
		$info = CMSQBlog::TopicInfo(Brick::$db, $topicId);
		
		if (!Brick::$session->IsAdminMode() && $info['userid'] != $user['userid']){
			return;
		}
		$topic = CMSQBlog::Topic(Brick::$db, $info['userid'], $topicId);
		
		$rows = CMSQBlog::Tags(Brick::$db, $topicId);
		$tags = array();
		while (($row = Brick::$db->fetch_array($rows))){
			array_push($tags, $row['ph']);
		}
		$topic['tags'] = implode(', ', $tags);
		
		return $topic;	
	}
	
	/**
	 * Создать запись в блоге.
	 * 
	 * @param Object $obj
	 */
	public static function TopicAppend($obj){
		if (!Brick::$session->IsAdminMode()){ return; }
		$user = CMSRegistry::$instance->session->userinfo;
		CMSModuleBlog::TopicCorrect($obj);
		
		$obj->uid = $user['userid'];
		$obj->dl = TIMENOW;
		$obj->id = CMSQBlog::TopicAppend(Brick::$db, $obj); 
		
		CMSModuleBlog::TopicTagsUpdate($obj);
	}
	
	public static function TopicUpdate($obj){
		if (!Brick::$session->IsAdminMode()){ return; }
		$user = CMSRegistry::$instance->session->userinfo;
		CMSModuleBlog::TopicCorrect($obj);
		
		$info = CMSQBlog::TopicInfo(Brick::$db, $obj->id);
		CMSQBlog::TopicSave(Brick::$db, $info, $obj);
		CMSModuleBlog::TopicTagsUpdate($obj);
	}
	
	private static function TopicCorrect($obj){
		$obj->nm = translateruen($obj->tl);
		
		if ($obj->st == 1 && empty($obj->dp)){
			$obj->dp = TIMENOW;
		}else if (empty($obj->st)){
			$obj->dp = 0;
		}
		$obj->de = TIMENOW;
	}
	
	private static function TopicTagsUpdate($obj){
		$tagarr = array();
		$tags = explode(",", $obj->tags);
		foreach ($tags as $t){
			$t = trim($t);
			if (empty($t)){ continue; }
			$tagarr[$t]['phrase'] = $t;
			$tagarr[$t]['name'] = translateruen($t);
		}
		CMSQBlog::TagSetId(Brick::$db, $tagarr);
		CMSQBlog::TagUpdate(Brick::$db, $obj->id, $tagarr);
	}
	
	public static function CategoryAppend($obj){
		if (!Brick::$session->IsAdminMode()){ return; }
		if (empty($obj->nm) || empty($obj->ph)){ return; }
		CMSQBlog::CategoryAdd(Brick::$db, $obj);
	}
}

class BlogAction {
	const BLOG_VIEW = 10;
	const TOPIC_WRITE = 20;
	const BLOG_ADMIN = 50;
}

class BlogPermission extends CMSPermission {
	
	public function BlogPermission(CMSModuleBlog $module){
		
		$defRoles = array(
			new CMSRole(BlogAction::BLOG_VIEW, 1, USERGROUPID_ALL),
			new CMSRole(BlogAction::TOPIC_WRITE, 1, USERGROUPID_MODERATOR),
			new CMSRole(BlogAction::BLOG_ADMIN, 1, USERGROUPID_ADMINISTRATOR)
		);
		
		parent::CMSPermission($module, $defRoles);
	}
	
	public function GetRoles(){
		$roles = array();
		$roles[BlogAction::BLOG_VIEW] = $this->CheckAction(BlogAction::BLOG_VIEW);
		$roles[BlogAction::TOPIC_WRITE] = $this->CheckAction(BlogAction::TOPIC_WRITE);
		$roles[BlogAction::BLOG_ADMIN] = $this->CheckAction(BlogAction::BLOG_ADMIN);
		return $roles;
	}
}

/**
 * Набор статичных функция запросов к базе данных 
 * @package Abricos 
 * @subpackage Blog
 */
class CMSQBlog extends CMSBaseClass {
	
	private static function GetPageWhere(CMSDatabase $db, $category, $tagid, $from, $count){
		$where = "";
		$lj = "";
		if (!empty($category)){
			$where = " AND b.name='".bkstr($category)."'";
		}else if(!empty($tagid)){
			$lj = "LEFT JOIN ".$db->prefix."bg_toptag t ON t.topicid = a.topicid ";
			$where = " AND t.tagid='".bkstr($tagid)."'";
		}
		return array(
			$lj,
			"WHERE a.deldate = 0 and a.status = 1 ".$where, 
			"LIMIT ".$from.",".bkint($count)
		);
	}
	
	public static function PageTopicCount(CMSDatabase $db, $category, $tagid){
		$w = CMSQBlog::GetPageWhere($db, $category, $tagid, 0, 0);
		$sql = "
			SELECT count(a.topicid) as cnt
			FROM ".$db->prefix."bg_topic a
			LEFT JOIN ".$db->prefix."bg_cat b ON a.catid = b.catid
			".$w[0]."
			".$w[1]."
			LIMIT 1
		";
		
		$row = $db->query_first($sql);
		return $row['cnt'];
	}
	
	public static function PageTopicIds(CMSDatabase $db, $category, $tagid, $from, $count){
		$w = CMSQBlog::GetPageWhere($db, $category, $tagid, $from, $count);
		if (!empty($category)){
			$w[0] = "LEFT JOIN ".$db->prefix."bg_cat b ON a.catid = b.catid";
		}
		$sql = "
			SELECT a.topicid as id
			FROM ".$db->prefix."bg_topic a
			".$w[0]."
			".$w[1]."
			ORDER BY a.datepub DESC
			".$w[2]."
		";
		return $db->query_read($sql);
	}
	
	public static function Page(CMSDatabase $db, $category, $tagid, $from, $count){
		$w = CMSQBlog::GetPageWhere($db, $category, $tagid, $from, $count);
		
		$sql = "
			SELECT
				a.topicid as id, 
				a.name as nm,
				a.title as tl,
				a.contentid as ctid,
				a.intro,
				length(cc.body) as lenbd,
				a.userid as uid,
				a.dateline as dl,
				a.dateedit as de,
				a.datepub as dp,
				a.status as st,
				a.deldate as dd, 
				b.catid as catid,
				b.phrase as catph,
				b.name as catnm,
				c.username as unm
			FROM ".$db->prefix."bg_topic a
			LEFT JOIN ".$db->prefix."bg_cat b ON a.catid = b.catid
			LEFT JOIN ".$db->prefix."content cc ON a.contentid = cc.contentid
			LEFT JOIN ".$db->prefix."user c ON a.userid = c.userid
			".$w[0]."
			".$w[1]."
			ORDER BY a.datepub DESC
			".$w[2]."
		";
		return $db->query_read($sql);
	}
	
	public static function CatBlock(CMSDatabase $db){
		$sql = "
			SELECT a.catid as id, a.name as nm, a.phrase as ph, count(b.catid) as cnt
			FROM ".$db->prefix."bg_cat a
			LEFT JOIN ".$db->prefix."bg_topic b ON a.catid = b.catid
			WHERE b.deldate = 0 and b.status = 1  
			GROUP BY b.catid
			ORDER BY cnt DESC
		";
		return $db->query_read($sql);
	}
	
	public static function CategoryById(CMSDatabase $db, $categoryId, $retArray = true){
		$sql = "
			SELECT 
				a.catid as id,
				a.phrase as ph,
				a.name as nm
			FROM ".$db->prefix."bg_cat a
			WHERE a.catid='".bkstr($categoryId)."'
			LIMIT 1
		";
		if ($retArray){
			return $db->query_first($sql);
		}else{
			return $db->query_read($sql);
		}
	}
	
	public static function CategoryByName(CMSDatabase $db, $category, $retArray = true){
		$sql = "
			SELECT *
			FROM ".$db->prefix."bg_cat a
			WHERE a.name='".bkstr($category)."'
			LIMIT 1
		";
		if ($retArray){
			return $db->query_first($sql);
		}else{
			return $db->query_read($sql);
		}
	}
	
	public static function CategoryCheck(CMSDatabase $db, $data){
		$sql = "
			SELECT * 
			FROM ".$db->prefix."bg_cat
			WHERE name='".bkstr($data['name'])."'
		";
		return $db->query_first($sql);
	}
	
	public static function CategoryAdd(CMSDatabase $db, $obj){
		$sql = "
			INSERT INTO ".$db->prefix."bg_cat 
				(parentcatid, name, phrase) VALUES
				(
					0,
					'".bkstr($obj->nm)."',
					'".bkstr($obj->ph)."'
				)
		";
		$db->query_write($sql);
	}
	
	public static function CategoryRemove(CMSDatabase $db, $catid){
		$sql = "
			DELETE FROM ".$db->prefix."bg_cat
			WHERE catid=".bkint($catid)." 
		";
		$db->query_write($sql);
	}

	public static function CategoryListCountTopic(CMSDatabase $db){
		$sql = "
			SELECT catid as id, COUNT(*) as cnt
			FROM ".$db->prefix."bg_topic
			WHERE deldate=0  
			GROUP BY catid
		";
		return $db->query_read($sql);
	}
	
	public static function CategoryList(CMSDatabase $db){
		
		$sql = "
			SELECT 
				catid as id, 
				parentcatid as pid, 
				name as nm, 
				phrase as ph
			FROM ".$db->prefix."bg_cat
			ORDER BY ph
		";
		
		return $db->query_read($sql);
	}
	
	public static function CommentOnlineList(CMSDatabase $db, $limit=12){
		$sql = "
			SELECT 
				c.contentid, 
				u.userid as uid, 
				u.username as unm, 
				c.body, 
				c.dateline as dl, 
				ct.phrase as catph, 
				ct.name as catnm,
				t.topicid, 
				t.title,
				a.cnt
			FROM (
				SELECT contentid, max( dateline ) AS dl, count(contentid) as cnt
				FROM ".$db->prefix."cmt_comment
				GROUP BY contentid
				ORDER BY dl DESC
				LIMIT ".$limit."
			)a
			LEFT JOIN ".$db->prefix."cmt_comment c ON a.contentid = c.contentid AND c.dateline = a.dl
			LEFT JOIN ".$db->prefix."user u ON c.userid = u.userid
			LEFT JOIN ".$db->prefix."bg_topic t ON c.contentid = t.contentid
			LEFT JOIN ".$db->prefix."bg_cat ct ON t.catid = ct.catid
			WHERE t.deldate = 0 and t.status = 1
			ORDER BY dl DESC  
		";
		 // echo($sql);
		return $db->query_read($sql);
	}

	public static function CommentTopicCount(CMSDatabase $db, $ids){
		if (empty($ids)){
			return null;
		}
		$where = array();
		foreach ($ids as $id){
			array_push($where, "a.topicid=".bkint($id));
		}
		$sql = "
			SELECT count(a.contentid) as cnt, contentid
			FROM ".$db->prefix."cmt_comment a
			group by a.contentid
		";
		return $db->query_read($sql);
	}
	
	public static function TagAC(CMSDatabase $db, $query){
		$sql = "
			SELECT phrase as ph
			FROM ".$db->prefix."bg_tag
			WHERE phrase LIKE '".$query."%'
			GROUP BY phrase
			ORDER BY phrase
		";
		return $db->query_read($sql);
	}
	
	public static function Tag(CMSDatabase $db, $tagname){
		$sql = "
			SELECT *
			FROM ".$db->prefix."bg_tag
			WHERE name='".bkstr($tagname)."'
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function Tags(CMSDatabase $db, $topicid){
		$sql = "
			SELECT b.tagid as id, b.phrase as ph, b.name as nm 
			FROM ".$db->prefix."bg_toptag a
			LEFT JOIN ".$db->prefix."bg_tag b ON a.tagid = b.tagid
			WHERE a.topicid=".bkint($topicid)."
		";
		return $db->query_read($sql);
	}
	
	public static function TagList(CMSDatabase $db){
		$sql = "
			SELECT a.tagid as id, sum(a.cnt) as cnt, b.name AS nm, b.phrase AS ph
			FROM (
				SELECT tagid, count( tagid ) AS cnt
				FROM ".$db->prefix."bg_toptag
				GROUP BY tagid
				ORDER BY cnt DESC
			) a
			LEFT JOIN ".$db->prefix."bg_tag b ON b.tagid = a.tagid
			WHERE b.name != ''
			GROUP BY nm
			ORDER BY cnt DESC	
		";	 
		return $db->query_write($sql);
		
	}
	
	public static function TagBlock(CMSDatabase $db, $limit = 30){
		/*
		$sql = "
			SELECT a.tagid AS id, b.name as nm, b.phrase as ph, count( a.tagid ) AS cnt
			FROM ".$db->prefix."bg_toptag a
			LEFT JOIN ".$db->prefix."bg_tag b ON a.tagid = b.tagid
			WHERE b.name != ''
			GROUP BY a.tagid
			ORDER BY ph
			LIMIT ".$limit."
		";
		/**/
		$slimit = $limit == 0 ? "" : "LIMIT ".$limit;
		
		$sql = "
			SELECT a.tagid as id, sum(a.cnt) as cnt, b.name AS nm, b.phrase AS ph
			FROM (
				SELECT tagid, count( tagid ) AS cnt
				FROM ".$db->prefix."bg_toptag
				GROUP BY tagid
				ORDER BY cnt DESC
				".$slimit."
			) a
			LEFT JOIN ".$db->prefix."bg_tag b ON b.tagid = a.tagid
			WHERE b.name != ''
			GROUP BY nm
			ORDER BY ph	
		";	 
		return $db->query_write($sql);
	}
	
	public static function TagTopicList(CMSDatabase $db, $ids){
		if (empty($ids)){
			return null;
		}
		$where = array();
		foreach ($ids as $id){
			array_push($where, "a.topicid=".bkint($id));
		}
		$sql = "
			SELECT a.topicid, a.tagid, b.name, b.phrase
			FROM ".$db->prefix."bg_toptag a
			LEFT JOIN ".$db->prefix."bg_tag b ON a.tagid = b.tagid
			WHERE (".implode(" OR ", $where).") AND b.name != ''
		";
		return $db->query_read($sql);
	}
	
	public static function TagUpdate(CMSDatabase $db, $topicid, &$tags){
		$sql = "
			DELETE FROM ".$db->prefix."bg_toptag
			WHERE topicid=".$topicid."
		";
		$db->query_write($sql);
		
		foreach ($tags as $t => $v){
			$sql = "
				INSERT INTO ".$db->prefix."bg_toptag
				(topicid, tagid) VALUES
				('".bkstr($topicid)."','".bkstr($v['id'])."')
			";
			$db->query_write($sql);
		}
	}
	
	public static function TagSetId(CMSDatabase $db, &$tags){
		if (empty($tags)){
			return;
		}
		$where = array();
		foreach ($tags as $t => $v){
			array_push($where, "phrase='".bkstr($v['phrase'])."'");
		}
		$sql = "
			SELECT tagid, phrase
			FROM ".$db->prefix."bg_tag
			WHERE ".implode(' OR ', $where)."
		";
		$rows = $db->query_read($sql);
		while (($row = $db->fetch_array($rows))){
			$key = $row['phrase'];
			if (!empty($tags[$key])){
				$tags[$row['phrase']]['id'] = $row['tagid'];
			}
		}
		foreach ($tags as $t => &$v){
			if (!empty($v['id'])){
				continue;
			}
			$sql = "
				INSERT INTO ".$db->prefix."bg_tag
				(name, phrase) VALUES
				('".bkstr($v['name'])."','".bkstr($v['phrase'])."')
			";
			$db->query_write($sql);
			$tags[$t]['id'] = $db->insert_id();
		}
	}
	
	
	public static function TopicRecycleClear(CMSDatabase $db, $userid){
		$sql = "
			SELECT contentid
			FROM ".$db->prefix."bg_topic
			WHERE userid=".$userid." AND deldate>0
		";
		$rows = $db->query_read($sql);
		$where = array();
		
		while (($row = $db->fetch_array($rows))){
			array_push($where, "contentid=".bkint($row['contentid']));
		}
		if (count($where) == 0){
			return;
		}
		$sql = "
			DELETE FROM ".$db->prefix."content
			WHERE ".implode(" OR ", $where)."
		";
		$db->query_write($sql);
		
		$sql = "
			DELETE FROM ".$db->prefix."bg_topic
			WHERE userid=".bkint($userid)." AND deldate>0
		";
		$db->query_write($sql);
	}
	
	public static function TopicPublish(CMSDatabase $db, $topicid){
		$sql = "
			UPDATE ".$db->prefix."bg_topic
			SET datepub=".TIMENOW.", status=1
			WHERE topicid=".bkint($topicid)." AND status=0
		";
		$db->query_write($sql);
	}
	
	public static function TopicRestore(CMSDatabase $db, $topicid){
		$info = CMSQBlog::TopicInfo($db, $topicid);
		CMSSqlQuery::ContentRestore($db, $info['contentid']);
		
		$sql = "
			UPDATE ".$db->prefix."bg_topic
			SET deldate=0
			WHERE topicid=".bkint($topicid)."
		";
		$db->query_write($sql);
	}
	
	public static function TopicRemove(CMSDatabase $db, $topicid){
		
		$info = CMSQBlog::TopicInfo($db, $topicid);
		CMSSqlQuery::ContentRemove($db, $info['contentid']);
		
		$sql = "
			UPDATE ".$db->prefix."bg_topic
			SET deldate=".TIMENOW."
			WHERE topicid=".bkint($topicid)."
		";
		$db->query_write($sql);
	}
	
	public static function TopicInfo(CMSDatabase $db, $topicid, $contentid = 0){
		if ($contentid > 0){
			$where = "WHERE contentid=".bkint($contentid);
		}else{
			$where = "WHERE topicid=".bkint($topicid);
		}
		$sql = "
			SELECT 
				a.topicid, 
				a.contentid, 
				a.userid, 
				a.status, 
				a.datepub, a.catid, a.title, d.phrase as catph, d.name as catnm
			FROM ".$db->prefix."bg_topic a
			LEFT JOIN ".$db->prefix."bg_cat d ON a.catid = d.catid
				".$where."
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	
	public static function Topic(CMSDatabase $db, $userid, $topicid){
		$sql = "
			SELECT
				a.topicid as id, 
				a.metadesc as mtd,
				a.metakeys as mtk,
				a.name as nm,
				a.title as tl,
				a.catid as catid,
				d.phrase as catph,
				d.name as catnm,
				a.contentid as ctid,
				a.intro,
				b.body,
				a.userid as uid,
				c.username as unm,
				a.dateline as dl,
				a.dateedit as de,
				a.datepub as dp,
				a.status as st,
				a.deldate as dd,
				c.userid as uid, 
				c.username as unm
			FROM ".$db->prefix."bg_topic a
			LEFT JOIN ".$db->prefix."content b ON a.contentid = b.contentid
			LEFT JOIN ".$db->prefix."user c ON a.userid = c.userid
			LEFT JOIN ".$db->prefix."bg_cat d ON a.catid = d.catid
			WHERE a.userid=".bkint($userid)." AND a.topicid=".bkint($topicid)."
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	private static function TopicListWhereByUserId($userid, $showRecycle = false){
		$where = array();
		if (!empty($userid)){
			array_push($where, "a.userid=".bkint($userid));
		}
		if ($showRecycle){
			array_push($where, "a.deldate=0");
		}
		
		$swhere = implode(" AND ", $where);
		if (!empty($swhere)){
			$swhere = "WHERE ".$swhere;
		}
		return $swhere;
	}
	
	public static function TopicCountByUserId(CMSDatabase $db, $userid, $showRecycle){
		$swhere = CMSQBlog::TopicListWhereByUserId($userid, $showRecycle);
		$sql = "
			SELECT count(topicid) as cnt
			FROM ".$db->prefix."bg_topic a
			".$swhere."
		";
		$row = $db->query_first($sql);
		return $row['cnt'];
	}
	
	public static function TopicListByUserId(CMSDatabase $db, $userid, $page, $total, $showRecycle){
		$swhere = CMSQBlog::TopicListWhereByUserId($userid, $showRecycle);
		$from = (($page-1)*10);
		$sql = "
			SELECT 
				a.topicid as id,
				a.title as tl,
				b.phrase as cat,
				b.name as catnm,
				a.userid as uid,
				a.dateline as dl,
				a.dateedit as de,
				a.datepub as dp,
				a.status as st,
				a.deldate as dd,
				u.userid as uid,
				u.username as unm
			FROM ".$db->prefix."bg_topic a
			LEFT JOIN ".$db->prefix."bg_cat b ON a.catid = b.catid
			LEFT JOIN ".$db->prefix."user u ON a.userid = u.userid
			".$swhere."
			ORDER BY dl DESC 
			LIMIT ".$from.",".bkint($total)."
		";
		return $db->query_read($sql);
	}
	
	public static function TopicAppend(CMSDatabase $db, $obj){
		$contentid = CMSSqlQuery::CreateContent($db, $obj->body, 'blog');
		
		$sql = "
			INSERT INTO ".$db->prefix."bg_topic
			(metadesc, metakeys, name, title, catid, intro, contentid, userid, dateline, dateedit, datepub, status) VALUES
			(
				'".bkstr($obj->mtd)."',
				'".bkstr($obj->mtk)."',
				'".bkstr($obj->nm)."',
				'".bkstr($obj->tl)."',
				'".bkint($obj->catid)."',
				'".bkstr($obj->intro)."',
				".bkint($contentid).",
				".bkint($obj->uid).",
				".bkint($obj->dl).",
				".bkint($obj->de).",
				".bkint($obj->dp).",
				".bkint($obj->st)."
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}

	public static function TopicSave(CMSDatabase $db, $topinfo, $obj){
		$sql = "
			UPDATE ".$db->prefix."content
			SET body='".bkstr($obj->body)."'
			WHERE contentid=".bkint($topinfo['contentid'])."
		";
		$db->query_write($sql);
		
		$sql = "
			UPDATE ".$db->prefix."bg_topic SET
				name='".bkstr($obj->nm)."',
				title='".bkstr($obj->tl)."',
				catid='".bkint($obj->catid)."',
				intro='".bkstr($obj->intro)."',
				dateedit=".bkint($obj->de).",
				metadesc='".bkstr($obj->mtd)."',
				metakeys='".bkstr($obj->mtk)."'
			WHERE topicid=".bkint($obj->id)."
		";
		$db->query_write($sql);
	}
}
?>