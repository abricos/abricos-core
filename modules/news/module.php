<?php 
/**
 * Модуль "Новости"
 * 
 * @version $Id$
 * @package Abricos * @subpackage News
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

CMSRegistry::$instance->modules->GetModule('comment');
$modNews = new CMSModuleNews();

CMSRegistry::$instance->modules->Register($modNews);

/**
 * Модуль "Новости" 
 * @package Abricos 
 * @subpackage News
 */
class CMSModuleNews extends CMSModule {
	
	/**
	 * Новость
	 *
	 * @var array
	 */
	public $data;
	
	/**
	 * Страница списка новостей
	 *
	 * @var int
	 */
	public $page = 1;
	
	/**
	 * Идентификатор просматриваемой новости
	 *
	 * @var int
	 */
	public $newsid = 0;
	
	public function CMSModuleNews(){
		$this->version = "0.2";
		$this->name = "news";
		$this->takelink = "news";
	}

	/**
	 * Получить имя кирпича контента
	 *
	 * @return string
	 */
	public function GetContentName(){
		$adress = $this->registry->adress;
		$cname = "index";
		
		//if ($adress->level)
		if($adress->level == 2){
			$tag = $adress->dir[1];
			if (substr($tag, 0, 4) == 'page'){
				$this->page = intval(substr($tag, 4, strlen($tag)-4));
			}else{
				$this->newsid = intval($tag);
				$row = CMSQNews::News($this->registry->db, $this->newsid, true);
				if (!empty($row) && ($row['dp'] > 0 || $this->registry->session->IsAdminMode())){
					$this->data = $row;
					$cname = "view";
				}else{
					$this->registry->SetPageStatus(PAGESTATUS_404);
				}
			}
		}
		return $cname;
	}
	
	public $ds = null;
	public function getDataSet(){
		if (is_null($this->ds)){
			$json = $this->registry->input->clean_gpc('p', 'json', TYPE_STR);
			if (empty($json)){ return; }
			$obj = json_decode($json);
			if (empty($obj->_ds)){ return; }
			$this->ds = $obj->_ds;
		}
		return $this->ds;
	}
	
	public function columnToObj($result){
		$arr = array();
		$db = $this->registry->db;
		$count = $db->num_fields($result);
		for ($i=0;$i<$count;$i++){
			array_push($arr, $db->field_name($result, $i));
		}
		return $arr;
	}
	
	public function rowToObj($row){
		$ret = new stdClass();
		$ret->d = $row;
		return $row;
	}
	
	public function &rowsToObj($rows){
		$arr = array();
		while (($row = $this->registry->db->fetch_array($rows))){
			array_push($arr, $this->rowToObj($row));
		}
		return $arr;
	}
	
	public function GetLink($newsid){
		return $this->registry->adress->host."/".$this->takelink."/".$newsid."/";
	}
	
	public function RssWrite(CMSRssWriter2_0 $writer){
		$rows = CMSQNews::NewsPublicList($this->registry->db, 1, 10);
		while (($row = $this->registry->db->fetch_array($rows))){
			$item = new CMSRssWriter2_0Item($row['tl'], $this->GetLink($row['id']), $row['intro']);
			$item->pubDate = $row['dp'];
			$writer->WriteItem($item);
		}
	}
	
	public function RssMetaLink(){
		return $this->registry->adress->host."/rss/news/";
	}
}

/**
 * Набор статичных функций запросов к базе данных 
 * @package Abricos
 * @subpackage News
 */
class CMSQNews {

	public static function NewsPublicCount(CMSDatabase $db, $retvalue = false){
		$sql = "
			SELECT count( newsid ) AS cnt
			FROM ".$db->prefix."ns_news
			WHERE deldate=0 AND published>0
			LIMIT 1 
		";
		if ($retvalue){
			$row= $db->query_first($sql);
			return $row['cnt'];
		}else{
			return $db->query_read($sql);
		}
	}
	
	public static function NewsPublicList(CMSDatabase $db, $page=1, $limit=10){
		$from = $limit * ($page - 1);
		$sql = "
			SELECT
				newsid as id,
				userid as uid,
				published as dp,
				intro,
				title as tl
			FROM ".$db->prefix."ns_news
			WHERE deldate=0 AND published>0
			ORDER BY published DESC 
			LIMIT ".$from.",".$limit."
		";
		return $db->query_read($sql);
	}
	
	/**
	 * Полный список новостей, содержит удаленные, черновики
	 *
	 * @param CMSDatabase $db
	 * @param integer $limit
	 * @param integer $page
	 * @return resource
	 */
	public static function NewsList(CMSDatabase $db, $page=1, $limit=10){
		$from = $limit * ($page - 1);
		$sql = "
			SELECT
				newsid as id,
				userid as uid,
				dateline as dl,
				dateedit as de,
				published as dp,
				deldate as dd,
				contentid as ctid,
				title as tl,
				imageid as img,
				source_name as srcnm,
				source_link as srclnk
			FROM ".$db->prefix."ns_news
			ORDER BY dl DESC 
			LIMIT ".$from.",".$limit."
		";
		return $db->query_read($sql);
	}
	
	public static function NewsCount(CMSDatabase $db){
		$sql = "
			SELECT count( newsid ) AS cnt
			FROM ".$db->prefix."ns_news
			LIMIT 1 
		";
		return $db->query_read($sql);
	}
	
	public static function NewsRemove(CMSDatabase $db, $newsid){
		$sql = "
			UPDATE ".$db->prefix."ns_news SET deldate=".TIMENOW."
			WHERE newsid=".bkint($newsid)."
		";
		$db->query_write($sql);
	}
	
	public static function NewsRestore(CMSDatabase $db, $newsid){
		$sql = "
			UPDATE ".$db->prefix."ns_news SET deldate=0
			WHERE newsid=".bkint($newsid)."
		";
		$db->query_write($sql);
	}
	
	public static function NewsRecycleClear(CMSDatabase $db){
		$sql = "
			DELETE FROM ".$db->prefix."ns_news
			WHERE deldate > 0
		";
		$db->query_write($sql);
	}
	
	public static function NewsPublish(CMSDatabase $db, $newsid){
		$sql = "
			UPDATE ".$db->prefix."ns_news
			SET published='".TIMENOW."'
			WHERE newsid=".bkint($newsid)."
		";
		$db->query_write($sql);
	}
	
	public static function NewsInfo(CMSDatabase $db, $newsid){
		$sql = "
			SELECT newsid, userid, contentid, dateline, dateedit, published, contentid
			FROM ".$db->prefix."ns_news 
			WHERE newsid=".bkint($newsid)."
		";
		return $db->query_first($sql);
	}
	
	public static function News(CMSDatabase $db, $newsid, $returnarray = false){
		$sql = "
			SELECT
				a.newsid as id,
				a.userid as uid,
				a.dateline as dl,
				a.dateedit as de,
				a.published as dp,
				a.deldate as dd,
				a.contentid as ctid,
				b.body as body,
				a.title as tl,
				a.intro,
				a.imageid as img,
				a.source_name as srcnm,
				a.source_link as srclnk
			FROM ".$db->prefix."ns_news a
			LEFT JOIN ".$db->prefix."content b ON a.contentid = b.contentid
			WHERE a.newsid = ".bkint($newsid)."
			LIMIT 1
		";
		if ($returnarray){
			return $db->query_first($sql);
		}else{
			return $db->query_read($sql);
		}
	}
	
	public static function NewsSave(CMSDatabase $db, $d){
		$sql = "
			UPDATE ".$db->prefix."content
			SET body='".bkstr($d->body)."'
			WHERE contentid=".bkint($d->ctid)."
		";
		$db->query_write($sql);
		$sql = "
			UPDATE ".$db->prefix."ns_news
			SET 
				dateedit=".TIMENOW.",
				published=".bkint($d->dp).",
				title='".bkstr($d->tl)."',
				intro='".bkstr($d->intro)."',
				imageid='".bkstr($d->img)."',
				source_name='".bkstr($d->srcnm)."',
				source_link='".bkstr($d->srclnk)."'
			WHERE newsid=".bkint($d->id)."
		";
		$db->query_write($sql);
	}
	
	public static function NewsAppend(CMSDatabase $db, $d){
		$contentid = CMSSqlQuery::CreateContent($db, $d->body, 'news');

		$sql = "
			INSERT INTO ".$db->prefix."ns_news 
			(
				userid, dateline, dateedit, published, 
				contentid, title, intro, imageid, source_name, source_link
			) VALUES 
			(
				".Brick::$session->userinfo['userid'].",
				".TIMENOW.",
				".TIMENOW.",
				'".bkint($d->dp)."',
				'".bkint($contentid)."',
				'".bkstr($d->tl)."',
				'".bkstr($d->intro)."',
				'".bkstr($d->img)."',
				'".bkstr($d->srcnm)."',
				'".bkstr($d->srclnk)."'
			)
		";
		$db->query_write($sql);
	}
	
}

?>