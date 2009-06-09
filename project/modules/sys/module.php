<?php
/**
* @version $Id: module.php 776 2009-04-29 10:21:54Z AKuzmin $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

global $cms;

$mod = new CMSModuleSys();
$cms->modules->Register($mod);

/**
 * Системный модуль отображения страниц сайта из БД.
 * Управление меню сайта и т.п.
 *
 */
class CMSModuleSys extends CMSModule {
	
	/**
	 * @var CMSMenuManager
	 */
	private $menu;
	
	/**
	 * Идентификатор страницы в БД
	 *
	 * @var Integer
	 */
	public $pageId = 0;
	
	/**
	 * Идентификатор раздела к которому принадлежит страница
	 *
	 * @var Integer
	 */
	public $menuId = 0;
	
	/**
	 * Адрес, на основе которого собрано меню.
	 * 
	 * @var CMSAdress
	 */
	public $adress = null;
	
	/**
	 * Сессия пользователя
	 *
	 * @var CMSSysSession
	 */
	public $session = null;
		
	public function __construct(){
		$this->version = "1.0.2";
		$this->name = "sys";
	}
	
	public function Init(){
		require_once CWD.'/modules/sys/includes/session.php';
		require_once CWD.'/modules/sys/includes/phrase.php';
		require_once CWD.'/modules/sys/includes/brickmanager.php';
		require_once CWD.'/modules/sys/includes/brickreader.php';
		
		$this->session = new CMSSysSession($this->registry);
	}
	
	/**
	 * Сборка вывода клиенту
	 */
	public function BuildOutput(){
		// Определить модуль управления выводом
		$cms = $this->registry;
		$adress = $this->registry->adress;
		$modules = $this->registry->modules;
		
		$modman = $this;
		if ($adress->level > 0){
			foreach ($modules->modulesInfo as $key => $info){
				if ($adress->dir[0] != $info['takelink']){ continue; }
				$modman = $modules->RegisterByName($key);
				if (empty($modman)){
					$this->registry->SetPageStatus(PAGESTATUS_500);
				}
				break;
			}
		}
		
		Brick::$modman = $modman;
		
		// имя кирпича
		$contentName = $modman->GetContentName();
		
		if ($this->registry->pageStatus != PAGESTATUS_OK){
			Brick::$modman = $modman = $this;
			$contentName = $this->GetContentName();
			header("HTTP/1.1 404 Not Found");
		}
		
		$bm = new CMSSysBrickManager($this->registry);
		
		Brick::$db = $this->registry->db;
		Brick::$input = $this->registry->input;
		Brick::$modules = $this->registry->modules;
		Brick::$cms = $this->registry;
		Brick::$session = $this->session;
		Brick::$builder = new CMSSysBrickBuilder($this->registry);
		
		$brick = $bm->BuildOutput($modman->name, $contentName, CMSQSys::BRICKTYPE_CONTENT);
		
		// Любая сборка страницы начинается с кирпича BRICKTYPE_CONTENT
		// и обязательно содержит в себе шаблон, в который он будет входить.
		// Необходимо для дальнейшей компиляции страницы подчинить кирпич-контент 
		// в кирпич-шаблон и определить его как последний собираемый кирпич
		$newChildren = array();
		$template = null;
		foreach ($brick->child as $childbrick){
			if ($childbrick->type == CMSQSys::BRICKTYPE_TEMPLATE){
				$template = $childbrick;
			}else{
				array_push($newChildren, $childbrick);
			}
		}
		
		Brick::$builder->template = $template;
		
		$brick->child = $newChildren;
		array_push($template->child, $brick);

		Brick::$builder->Compile($template);
	}
	
	public function GetContentName(){
		switch($this->registry->pageStatus){
			case PAGESTATUS_404:
				return '404';
			case PAGESTATUS_500:
				return '500';
		}
		return 'index'; 
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
	
	private $brickReader = null;
	
	public function getBrickReader(){
		if (is_null($this->brickReader)){
			require_once CWD.'/modules/sys/includes/brickreader.php';
			$this->brickReader = new CMSSysBrickReader($this->registry);
		}
		return $this->brickReader;
	}
}

class CMSQSys {
	
	const BRICKTYPE_BRICK = 0;
	const BRICKTYPE_TEMPLATE = 1;
	const BRICKTYPE_CONTENT = 2;
	
	const BRICKPRM_VAR = 0;
	const BRICKPRM_GLOBALVAR = 1;
	const BRICKPRM_MODULE = 2;
	const BRICKPRM_TEMPLATE = 3;
	const BRICKPRM_PHRASE = 4;
	const BRICKPRM_SCRIPT = 5;
	const BRICKPRM_JSMOD = 6;
	const BRICKPRM_JSFILE = 7;
	const BRICKPRM_CSS = 8;
	const BRICKPRM_PARAM = 9;
	
	const FIELDS_PHRASE = "
		phraseid as id,
		module as mnm,
		name as nm,
		phrase as ph
	";
	
	public static function Phrase(CMSDatabase $db, $modname, $name){
		$sql = "
			SELECT
				".CMSQSys::FIELDS_PHRASE." 
			FROM ".$db->prefix."sys_phrase
			WHERE module='".bkstr($modname)."' AND name='".bkstr($name)."' AND language='".LNG."'
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function PhraseListUpdate(CMSDatabase $db, $phrases){
		foreach ($phrases as $phrase){
			$sql = "
				UPDATE ".$db->prefix."sys_phrase 
				SET 
					module='".bkstr($phrase->module)."',
					name='".bkstr($phrase->name)."',
					phrase='".bkstr($phrase->value)."'
				WHERE phraseid=".bkint($phrase->id)."
			";
			$db->query_write($sql);
		}
	}
	
	public static function PhraseListAppend(CMSDatabase $db, $phrases){
		$ins = array();
		foreach ($phrases as $phrase){
			array_push($ins, "(
				'".bkstr($phrase->module)."',
				'".bkstr($phrase->name)."',
				'".bkstr($phrase->value)."',
					'".LNG."'
				)"
			);
		}
		if (empty($ins)){ return; }
		
		$sql = "
			INSERT INTO ".$db->prefix."sys_phrase (module, name, phrase, language) VALUES
			".implode(",", $ins)."
		";
		$db->query_write($sql);
	}
	
	public static function PhraseListByModule(CMSDatabase $db, $module='sys'){
		$sql = "
			SELECT
				".CMSQSys::FIELDS_PHRASE."
			FROM ".$db->prefix."sys_phrase
			WHERE module='".bkstr($module)."' AND language='".LNG."'
		";
		return $db->query_read($sql);
	}
	
	public static function PhraseList(CMSDatabase $db, $list){
		$where = array();
		foreach ($list as $key => $value){
			$sa = explode(":", $key);
			if (count($sa) == 2){
				array_push($where, "(module='".bkstr($sa[0])."' AND name='".bkstr($sa[1])."')");
			}
		}
		if (empty($where)){ return null; }
		$sql = "
			SELECT 
				phraseid as id,
				module as mnm,
				name as nm,
				phrase as ph
			FROM ".$db->prefix."sys_phrase
			WHERE (".implode(" OR ", $where).") AND language='".LNG."' 
		";
		return $db->query_read($sql);
	}
	
	public static function CacheClear(CMSDatabase $db){
		$sql = "TRUNCATE TABLE ".$db->prefix."sys_cache";
		$db->query_write($sql);
	}
	
	public static function CacheUpdate(CMSDatabase $db, $cacheid, $body){
		$sql = "
			UPDATE ".$db->prefix."sys_cache
			SET
				body='".bkstr($body)."',
				upddate=".TIMENOW."
			WHERE cacheid=".bkint($cacheid)."
			LIMIT 1
		";
		$db->query_write($sql, true);
	}
	
	public static function CacheAppend(CMSDatabase $db, $modname, $brickname, $body){
		$sql = "
			INSERT INTO ".$db->prefix."sys_cache
			(module, name, body, upddate) VALUES (
				'".bkstr($modname)."',
				'".bkstr($brickname)."',
				'".bkstr($body)."',
				'".TIMENOW."'
			)
		";
		$db->query_write($sql);
	}
	
	public static function Cache(CMSDatabase $db, $modname, $brickname){
		$sql = "
			SELECT 
				cacheid as id,
				body as bd,
				upddate as ud
			FROM ".$db->prefix."sys_cache
			WHERE module='".$modname."' AND name='".$brickname."'
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function BrickParamRemove(CMSDatabase $db, $id){
		CMSQSys::CacheClear($db);
		$sql = "
			DELETE FROM ".$db->prefix."sys_brickparam
			WHERE brickparamid=".bkint($id)."
		";
		$db->query_write($sql);
	}
	
	public static function BrickParamSave(CMSDatabase $db, $data){
		CMSQSys::CacheClear($db);
		$sql = "
			UPDATE ".$db->prefix."sys_brickparam
			SET
				name='".bkstr($data->nm)."',
				paramvalue='".bkstr($data->v)."',
				upddate=".TIMENOW."
			WHERE brickparamid=".bkint($data->id)."
		";
		$db->query_write($sql);
	}
	
	public static function BrickParamAppend(CMSDatabase $db, $data){
		CMSQSys::CacheClear($db);
		$sql = "
			INSERT INTO ".$db->prefix."sys_brickparam
			(paramtype, name, paramvalue, brickid, upddate) VALUES
			(
				".bkint($data->tp).",
				'".bkstr($data->nm)."',
				'".bkstr($data->v)."',
				".bkint($data->bkid).",
				".TIMENOW."
			)
		";
		$db->query_write($sql);
	}
	
	public static function BrickParamClearList(CMSDatabase $db, $brickid){
		$brickid = bkint($brickid);
		$sql = "
			DELETE FROM  ".$db->prefix."sys_brickparam
			WHERE brickid=".bkint($brickid)."
		";
		$db->query_write($sql);
	}
	
	public static function BrickParamAppendFromParser(CMSDatabase $db, $brickid, $param){
		CMSQSys::CacheClear($db);
		$brickid = bkint($brickid);
		CMSQSys::BrickParamClearList($db, $brickid);
		
		$insert = array();
		foreach($param->var as $key => $value){
			array_push($insert, "(".CMSQSys::BRICKPRM_VAR.", '".bkstr($key)."', '".bkstr($value)."', ".$brickid.")");
		}
		foreach($param->gvar as $key => $value){
			array_push($insert, "(".CMSQSys::BRICKPRM_GLOBALVAR.", '".bkstr($key)."', '".bkstr($value)."', ".$brickid.")");
		}
		foreach($param->module as $key => $value){
			foreach ($value as $brick){
				array_push($insert, "(".CMSQSys::BRICKPRM_MODULE.", '".bkstr($key)."', '".bkstr($brick)."', ".$brickid.")");
			}
		}
		if (!empty($param->template)){
			array_push($insert, "(".CMSQSys::BRICKPRM_TEMPLATE.", '".bkstr($param->template['name'])."', '".bkstr($param->template['owner'])."', ".$brickid.")");
		}
		foreach($param->phrase as $key => $value){		// фразы
			array_push($insert, "(".CMSQSys::BRICKPRM_PHRASE.", '".bkstr($key)."', '".bkstr($value)."', ".$brickid.")");
		}
		foreach($param->script as $value){	// скрипты
			array_push($insert, "(".CMSQSys::BRICKPRM_SCRIPT.", '', '".bkstr($value)."', ".$brickid.")");
		}
		foreach($param->jsmod as $key => $value){ // JavaScript модули
			foreach ($value as $brick){
				array_push($insert,"(".CMSQSys::BRICKPRM_JSMOD.",'".bkstr($key)."','".bkstr($brick)."',".$brickid.")");
			}
		}
		foreach($param->jsfile as $value){	// JavaScript файлы
			array_push($insert, "(".CMSQSys::BRICKPRM_JSFILE.", '', '".bkstr($value)."', ".$brickid.")");
		}
		foreach($param->css as $value){	// CSS файлы
			array_push($insert, "(".CMSQSys::BRICKPRM_CSS.", '', '".bkstr($value)."', ".$brickid.")");
		}
		
		if (empty($insert)){ return; }
		$sql = "
			INSERT INTO ".$db->prefix."sys_brickparam
			(paramtype, name, paramvalue, brickid) VALUES
			".implode(",", $insert)."
		";
		$db->query_write($sql);
	}
	
	public static function BrickParamList(CMSDatabase $db, $brickid){
		$sql = "
			SELECT
				brickparamid as id, 
				paramtype as tp,
				name as nm,
				paramvalue as v
			FROM ".$db->prefix."sys_brickparam
			WHERE brickid=".bkint($brickid)."
		";
		return $db->query_read($sql);
	}
	
	/**
	 * Получить параметры всех модифицированных кирпичей и просто модифицированных параметов
	 *
	 * @param CMSDatabase $db
	 */
	public static function BrickParamListCustom(CMSDatabase $db){
		$sql = "
			SELECT 
				a.brickparamid as id,
				a.brickid as bkid,
				a.paramtype as tp,
				a.name as nm,
				a.paramvalue as v,
				b.owner as bown,
				b.name as bnm,
				b.bricktype as btp
			FROM ".$db->prefix."sys_brickparam a
			LEFT JOIN ".$db->prefix."sys_brick b ON a.brickid=b.brickid
			WHERE (a.upddate>0 OR b.upddate>0) AND b.deldate=0
		";
		return $db->query_read($sql);
	}
	
	public static function BrickRecycleClear(CMSDatabase $db){
		$sql = "
			SELECT brickid as id 
			FROM ".$db->prefix."sys_brick
			WHERE deldate>0
		";
		$rows = $db->query_read($sql);
		while (($row = $db->fetch_array($rows))){
			CMSQSys::BrickParamClearList($db, $row['id']);
		}
		$sql = "
			DELETE FROM ".$db->prefix."sys_brick
			WHERE deldate>0
		";
		$db->query_write($sql);
	}
	
	public static function BrickRestore(CMSDatabase $db, $brickid){
		CMSQSys::CacheClear($db);
		$sql = "
			UPDATE ".$db->prefix."sys_brick
			SET deldate=0
			WHERE brickid=".bkint($brickid)."
		";
		$db->query_write($sql);
	}
	
	public static function BrickRemove(CMSDatabase $db, $brickid){
		CMSQSys::CacheClear($db);
		$sql = "
			UPDATE ".$db->prefix."sys_brick
			SET deldate=".TIMENOW."
			WHERE brickid=".bkint($brickid)."
		";
		$db->query_write($sql);
	}
	
	public static function BrickSave(CMSDatabase $db, $data){
		CMSQSys::CacheClear($db);
		$sql = "
			UPDATE ".$db->prefix."sys_brick
			SET 
				body='".bkstr($data->bd)."',
				comments='".bkstr($data->cmt)."',
				upddate=".TIMENOW."
			WHERE brickid=".bkint($data->id)."
		";
		$db->query_write($sql);
	}
	
	public static function BrickById(CMSDatabase $db, $brickid, $comment = false){
		$cmt = ",IFNULL(comments,'') as cmt";
		if (!$comment){
			$cmt = "";
		}
		
		$sql = "
			SELECT 
				brickid as id,
				bricktype as tp,
				owner as own,
				name as nm,
				body as bd
				".$cmt."
			FROM ".$db->prefix."sys_brick
			WHERE brickid=".bkint($brickid)."
		";
		return $db->query_read($sql);
	}
	
	public static function BrickList(CMSDatabase $db, $type, $withrc = 'no'){
		$sql = "
			SELECT 
				brickid as id,
				bricktype as tp,
				owner as own,
				name as nm,
				IFNULL(comments,'') as cmt,
				deldate as dd,
				upddate as ud
			FROM ".$db->prefix."sys_brick
			WHERE bricktype=".bkint($type)." ".($withrc == 'yes' ? "": " AND deldate>0")."
			ORDER BY bricktype, owner, name
		";
		return $db->query_read($sql);
	}

	/**
	 * Список кирпичей измененные администратором
	 *
	 * @param CMSDatabase $db
	 * @return result
	 */
	public static function BrickListCustom(CMSDatabase $db){
		$sql = "
			SELECT 
				brickid as id,
				owner as own,
				name as nm,
				bricktype as tp,
				body as bd
			FROM ".$db->prefix."sys_brick
			WHERE deldate=0 AND upddate>0
		";
		return $db->query_read($sql);
	}

	public static function BrickAppendFromParser(CMSDatabase $db, $owner, $name, $body, $type, $hash){
		CMSQSys::CacheClear($db);
		$sql = "
			INSERT INTO ".$db->prefix."sys_brick
			(owner, name, body, bricktype, dateline, hash) VALUES
			(
				'".bkstr($owner)."',
				'".bkstr($name)."',
				'".bkstr($body)."',
				'".bkint($type)."',
				".TIMENOW.",
				'".bkstr($hash)."'
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
	public static function BrickSaveFromParser(CMSDatabase $db, $brickid, $body, $paramhash){
		CMSQSys::CacheClear($db);
		$sql = "
			UPDATE  ".$db->prefix."sys_brick
			SET 
				body='".bkstr($body)."',
				hash='".bkstr($paramhash)."'
			WHERE brickid=".bkint($brickid)."
		";
		$db->query_read($sql);
	}
	
	public static function BrickListFromParser(CMSDatabase $db, $type){
		$sql = "
			SELECT 
				brickid as id,
				owner as own,
				name as nm,
				deldate as dd,
				upddate as ud,
				hash as hh
			FROM ".$db->prefix."sys_brick
			WHERE bricktype=".bkint($type)." AND deldate=0
		";
		return $db->query_read($sql);
	}
	
	public static function Session(CMSSysSession $sm){
		$db = $sm->registry->db;
		return $sm->registry->db->query_first("
			SELECT *
			FROM ".$db->prefix."session
			WHERE 
				sessionhash='".bkstr($sm->sessionHash)."'
				AND lastactivity > ".(TIMENOW - $sm->cookieTimeOut)."
				AND idhash='".bkstr($sm->sessionIdHash)."'
			LIMIT 1
		");
	}
	
	public static function SessionAppend(CMSSysSession $sm){
		$db = $sm->registry->db;
		
		$sm->registry->db->query_write("
			DELETE FROM ".$db->prefix."session 
			WHERE lastactivity < ".(TIMENOW - $sm->cookieTimeOut)."
		", true);
		
		$sm->registry->db->query_write("
			INSERT INTO ".$db->prefix."session (sessionhash, idhash, lastactivity)
			VALUES (
				'".bkstr($sm->sessionHash)."', 
				'".bkstr($sm->sessionIdHash)."',
				".TIMENOW."
			)
		", true);
		return CMSQSys::Session($sm);
	}
	
	public static function SessionUserLastActiveUpdate(CMSSysSession $sm){
		$db = $sm->registry->db;
		$sm->registry->db->query_write("
			UPDATE ".$db->prefix."session
			SET lastactivity=".TIMENOW."
			WHERE sessionhash='".bkstr($sm->sessionHash)."' 
			LIMIT 1 
		", true);
	}
	
	public static function SessionUserUpdate(CMSSysSession $sm, $userid){
		$db = $sm->registry->db;
		$sm->registry->db->query_write("
			UPDATE ".$db->prefix."session
			SET userid=".bkint($userid)."
			WHERE sessionhash='".bkstr($sm->sessionHash)."' 
			LIMIT 1 
		", true);
		return CMSQSys::Session($sm);
	}
	
	
	public static function UserUpdateActive(CMSDatabase $db, $userid){
		$sql = "
			UPDATE ".$db->prefix."user
			SET lastvisit='".TIMENOW."'
			WHERE userid='".bkint($userid)."'
			LIMIT 1
		";
		$db->query_write($sql, true);
	}
	
	public static function UserById(CMSDatabase $db, $userid){
		return $db->query_first("
			SELECT * 
			FROM ".$db->prefix."user 
			WHERE userid=".bkint($userid)."
			LIMIT 1"
		);
	}
	
	public static function MenuJSON(CMSDatabase $db, $recycler = false){
		$where = $recycler ? "WHERE deldate>0":"WHERE deldate=0";
		return $db->query_read("
			SELECT 
				menuid as id,
				parentmenuid as pid,
				name as nm,
				link as lnk,
				phrase as ph,
				title as ttl,
				menuorder as ord,
				level as lvl,
				off,
				dateline as d,
				deldate as dd
			FROM ".$db->prefix."menu
			".$where."
			ORDER BY ord
		");
	}
}


class CMSSqlQuerySys extends CMSBaseClass {
	
	public static function MenuChangeOrder(CMSDatabase $db, $id, $neword){
		$sql = "
			UPDATE ".$db->prefix."menu
			SET menuorder=".bkint($neword)."
			WHERE menuid=".bkint($id)."
		";
		$db->query_write($sql);
	}
	
	public static function MenuMove(CMSDatabase $db, $id, $pid){
		$sql = "
			UPDATE ".$db->prefix."menu
			SET parentmenuid=".bkint($pid)."
			WHERE menuid=".bkint($id)."
		";
		$db->query_write($sql);
	}
	
	public static function MenuListJSON(CMSDatabase $db, $recycler = false){
		$where = $recycler ? "WHERE deldate>0":"WHERE deldate=0";
		return $db->query_read("
			SELECT 
				menuid as id,
				parentmenuid as pid,
				name as nm,
				link as lnk,
				phrase as ph,
				title as ttl,
				menuorder as ord,
				level as lvl,
				off,
				dateline as d,
				deldate as dd
			FROM ".$db->prefix."menu
			".$where."
			ORDER BY ord
		");
	}
	
}


class CMSMenuItem extends CMSBaseClass {
	/**
	 * Идентификатор группы
	 *
	 * @var unknown_type
	 */
	public $id = 0;
	
	/**
	 * Переменные строки меню:
	 * menuid - идентификатор меню в БД
	 * parentmenuid - идентификатор родительского меню
	 * istopic - является ли меню разделом, если нет, то линком
	 * fulllink - ссылка
	 * menuindex - порядковый номер расположения в области видимости
	 * ismodule = TRUE - пункт меню создано из модуля
	 * 
	 * @var array
	 */
	public $vars = array();
	
	/**
	 * Дочернии группы
	 *
	 * @var array
	 */
	public $items = array();
	
	/**
	 * Флаг текущей группы
	 *
	 * @var boolean
	 */
	public $flag_current = false;
	
	/**
	 * Родитель
	 *
	 * @var CMSMenuItem
	 */
	public $parent = null;
	
	/**
	 * Уровень
	 *
	 * @var integer
	 */
	public $level = 0;
	
}

class CMSMenuManager extends CMSMenuItem {
	
	/**
	 * массив записей меню.
	 *
	 * @var unknown_type
	 */
	public $table = array();
	
	public $currentMenuId = 0;
	
	/**
	 * Главный класс управление движком
	 *
	 * @var CMSRegistry
	 */
	public $registry; 
	
	private $tmpCurrentmenuId;
	
	/**
	 * Адрес на основе которого построено меню
	 *
	 * @var CMSAdress
	 */
	public $adress;
	
	function __construct(CMSRegistry $registry){
		$this->registry = $registry;
		$this->flag_current = true;
		$this->vars['fulllink'] = "/";
		
		if (!empty($this->registry->adress->lastRAdress)){
			$this->adress = $this->registry->adress->lastRAdress;
			/**
			 * Сбор меню необходимо сделать на основе реального запрашиваемого
			 * адреса (не тот что идет по аякс)
			 */
			$this->registry->modules->checkManagesModule = false;	
		}else{
			$this->adress =$this->registry->adress; 
		}
		$this->Build();
	}
	
	function Build(){
		$rows = CMSSqlQuery::MenuList($this->registry->db);

		$managesModule = $this->registry->modules->GetModTakeLink(false);
		$mmMenuId = 0;
		
		$tmp_arr = array();	
		while ($row = $this->registry->db->fetch_array($rows)){
			$rowid = $row['menuid'].$row['name'];
			$parentMenuId = intval($row["parentmenuid"]); 
			if (!empty($managesModule) 
				&& empty($parentMenuId)
				&& $managesModule->takelink == $row['name']){
				$mmMenuId = $row["menuid"];
				$row["ismodule"] = true;
			}
			$tmp_arr[$rowid] = $row;
		}
		
		/**
		 * Если страница формируется под управлением модуля, то запрос на 
		 * формирование меню раздела этого модуля
		 */
		if (!empty($managesModule)){
			$managesModule->OnCreateUserSubMenu($tmp_arr, $mmMenuId);
		}
		
		/** 
		 * Если есть доступ к админке (зарегистрирован модуль администратора) - 
		 * дополнение структуры меню 
		 */
		$modadmin = $this->registry->modules->GetModule('admin');
		if (!empty($modadmin) && $this->registry->session->IsAdminMode()){
			$row = $modadmin->GetMenuItemRow();
			$tmp_arr[$row['menuid'].$row['name']] = $row;
		}
		$this->build_structure_item($this, $tmp_arr, 0, 0);
	}

	private function build_structure_item(CMSMenuItem &$menuItem, $tmp_arr, $parent_id, $level){
		$menuItem->level = $level;
	
		$menuId = intval($menuItem->vars['menuid']);
		
		$this->table[$menuId] = $menuItem;

		foreach ($tmp_arr as $key => $value){
			if ($parent_id != $value['parentmenuid']){
				continue;
			}
		
			$child = new CMSMenuItem();
			$menuItem->items[$key] = $child;
			$child->vars = $value;
			$child->parent = $menuItem;
			$child->vars['phrase'] = (empty($value['phrase']) ? $value['name'] : $value['phrase']);
			$child->vars['menuindex'] = count($menuItem->items);
		
			if (empty($value['link'])){
				$child->vars['istopic'] = true;
				$child->vars['fulllink'] = $menuItem->vars['fulllink'].$value['name']."/";
			}else{
				$child->vars['istopic'] = false;
				if (substr($value['link'],strlen($value['link'])-1) == "/"){
					$value['link'] .= "index.html";
					// $value['link'] .= "";
				}
				$child->vars['fulllink'] = $value['link'];
			}
			if ($menuItem->flag_current){
				if ($this->adress->dir[$level] == $value['name'] && !empty($value['name'])){
					$child->flag_current = true;
					$this->currentMenuId = $value['menuid'];
				}else if (!$child->vars['istopic'] && $this->adress->requestURINonParam == $value['link']){
					$child->flag_current = true;
				}
			}
			
			$this->build_structure_item($child, $tmp_arr, $value['menuid'], $level+1);
		}
	}
}


?>