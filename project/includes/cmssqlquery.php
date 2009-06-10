<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

class CMSSqlQuery extends CMSBaseClass {
	
	private static $cache = array();
	
	public static function Module(CMSDatabase $db, $name){
		$sql = "
			SELECT *
			FROM ".$db->prefix."module 
			WHERE name='".bkstr($name)."'
		";
		return $db->query_first($sql);
	} 
	
	public static function ModuleUpdateVersion(CMSDatabase $db, CMSModule $module){
		$db->query_write("
			UPDATE ".$db->prefix."module 
				SET version='".bkstr($module->version)."'
			WHERE name='".bkstr($module->name)."'
		");
	}
	
	public static function ModuleAdd(CMSDatabase $db, CMSModule $module){
		$row = CMSSqlQuery::Module($db, $module->name);
		if (empty($row)){
			$sql = "
				INSERT INTO ".$db->prefix."module (name, version, takelink) VALUES(
					'".bkstr($module->name)."',
					'0.0.0',
					'".bkstr($module->takelink)."'
				)
			";
			$db->query_write($sql);
		}else{
			CMSSqlQuery::ModuleUpdateVersion($db, $module);
		}
	}
	
	/**
	 * Получить информацию из БД о имеющихся модулях
	 *
	 * @param CMSDatabase $db
	 * @return unknown
	 */
	public static function ModulesInfo(CMSDatabase $db){
		$sql = "
			SELECT * 
			FROM ".$db->prefix."module 
			ORDER BY modorder, name
		";
		$rows = $db->query_read($sql);
		return $rows;
	}
	
	public static function ModuleCreateTable(CMSDatabase $db){
		$db->query_write("
			CREATE TABLE IF NOT EXISTS `".$db->prefix."module` (
			  `moduleid` int(5) unsigned NOT NULL auto_increment,
			  `name` varchar(50) NOT NULL default '',
			  `version` varchar(20) NOT NULL default '0.0.0',
			  `disable` tinyint(1) unsigned NOT NULL default '0',
			  `modorder` int(5) NOT NULL default 0,
			  `takelink` varchar(50) NOT NULL default '',
			  PRIMARY KEY  (`moduleid`)
			) CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'"
		);
		$db->query_write("INSERT INTO cms_module (name, version, takelink) VALUES( 'sys', '0.0.0', '' )");
	}
	
	public static function MenuFromAdress(CMSDatabase $db, CMSAdress $addres){
		
		if (count($addres->dir) == 0){
			$row = $db->query_first("
				SELECT menuid
				FROM ".$db->prefix."menu
				where (link='/' or link='/index.html') and parentmenuid=0
			");
			if (empty($row)){
				return 0;
			}
			return $row['menuid'];
		}
		$arr = array();
		foreach ($addres->dir as $key => $value){
			array_push($arr, "name='".bkstr($value)."'");
		}
		return 0;
	}
	
	public static function SQLMenuList(CMSDatabase $db){
		return " 
			SELECT * 
  		FROM ".$db->prefix."menu
     	WHERE off = 0 AND deldate = 0
   		ORDER BY parentmenuid, menuorder
   	";
	}
	
	public static function MenuList(CMSDatabase $db){
		$sql = " 
			SELECT * 
  		FROM ".$db->prefix."menu
     	WHERE off = 0 AND deldate = 0
   		ORDER BY parentmenuid, menuorder
   	";
		return $db->query_read($sql);
	}

	public static function SQLGetPhrase(CMSDatabase $db, $phraseName){
		$sql = "
			SELECT * 
			FROM ".$db->prefix."phrase
			WHERE 
				name = '".bkstr($phraseName)."'
				AND lang = '".LNG."'
			LIMIT 1
		";
		return $sql;
	}
	
	public static function QueryGetPhrase(CMSDatabase $db, $phraseid){
		return $db->query_first("
			SELECT * 
			FROM ".$db->prefix."phrase
			WHERE phraseid = ".bkint($phraseid)."
			LIMIT 1
		");
	}
	
	public static function SQLGetAllPhrase(CMSDatabase $db){
		return "
			SELECT * FROM ".$db->prefix."phrase
			WHERE lang = '".LNG."'
			ORDER BY name
		";
	}
	
	public static function SQLPhrasesLoad(CMSDatabase $db, $array){
		$where = array();
		foreach($array as $name => $default){
			array_push($where, "name = '".bkstr($name)."'");
		}
		
		return "
			SELECT * FROM ".$db->prefix."phrase
			WHERE ".implode(" OR ", $where)."
				AND lang = '".LNG."'
		";
	}
	
	public static function QueryPhraseUpdateFromId(CMSDatabase $db, $phraseid, $phrase){
		$sql = "
				UPDATE ".$db->prefix."phrase 
					SET phrase ='".bkstr($phrase) ."' 
				WHERE  phraseid = ".bkint($phraseid)."
			";
		$db->query_write($sql);
	}
	
	public static function QueryPhraseUpdate(CMSDatabase $db, &$data){
		foreach($data as $key => &$value){
			if (!$value['update']){
				continue;
			}
			$sql = "
				UPDATE ".$db->prefix."phrase 
					SET phrase ='".bkstr($value['phrase'])."' 
				WHERE name = '".bkstr($key)."' AND lang='".LNG."'
			";
			$db->query_write($sql);
			$value['update'] = false;
		}
	}
	
	public static function QueryPhraseAddNew(CMSDatabase $db, &$data){
		$query = array();
		foreach($data as $key => &$value){
			if (!$value['new']){
				continue;
			}
			array_push($query, "('".$key."','".bkstr($value['phrase'])."','".LNG."')");
			$value['new'] = false;
		}
		if (empty($query)){
			return;
		}
		$sql = "INSERT INTO ".$db->prefix."phrase (name, phrase, lang) VALUES ".
			implode(',', $query);
		$db->query_write($sql);
	}
	
	public static function QueryGetUserInfoByUsername(CMSDatabase $db, $username){
		$username = htmlspecialchars_uni($username);
		$username = addslashes($username);
		$sql = "
			SELECT * 
			FROM ".$db->prefix."user 
			WHERE username = '".bkstr($username)."'
		";
		return $db->query_first($sql);
	}
	
	public static function SQLPageSelectFullData(CMSDatabase $db, $pagename, $menuid, $lang){
		$sql = "
			SELECT * 
			FROM ".$db->prefix."page
			LEFT JOIN ".$db->prefix."content ON ".$db->prefix."content.contentid = ".$db->prefix."page.contentid
			WHERE menuid =".bkint($menuid)."
				AND pagename = '".bkstr($pagename)."'
				AND lang = '".$lang."'
				AND ".$db->prefix."page.deldate = 0
			ORDER BY ".$db->prefix."page.dateline DESC
			LIMIT 1
		";
		return $sql;
	}
	
	public static function ClearCache(){
		CMSSqlQuery::$cache = array();
	}
	
	public static function QueryGetPageFullDataFromId(CMSDatabase $db, $pageid){
		$sql = CMSSqlQuery::SQLPageSelectFullDataFromId($db, $pageid);
		if (!empty(CMSSqlQuery::$cache[$sql])){
			return CMSSqlQuery::$cache[$sql];
		}
		CMSSqlQuery::$cache[$sql] = $row = $db->query_first($sql);
		return $row;
	}
	
	private static function SQLPageSelectFullDataFromId(CMSDatabase $db, $pageid){
		 return "SELECT * 
			FROM ".$db->prefix."page
			LEFT JOIN ".$db->prefix."content ON ".$db->prefix."content.contentid = ".$db->prefix."page.contentid
			WHERE pageid =".bkint($pageid)."
				AND ".$db->prefix."page.deldate = 0
			LIMIT 1";
	}
	
	public static function QueryPageGetContentId(CMSDatabase $db, $pageid){
		$row = $db->query_first("
			SELECT contentid 
			FROM ".$db->prefix."page
			WHERE pageid = ".bkint($pageid)."
			LIMIT 1
		");
		return $row['contentid'];
	}
	
	public static function ContentInfo(CMSDatabase $db, $contentid){
		$sql = "
			SELECT *
			FROM ".$db->prefix."content
			WHERE contentid='".bkint($contentid)."'
			LIMIT 1
		";
		return $db->query_first($sql);
	}

	public static function ContentUpdate(CMSDatabase $db, $contentid, $body){
		$sql = "
			UPDATE ".$db->prefix."content
			SET
				body='".bkstr($body)."',
				dateline='".TIMENOW."'
			WHERE contentid='".bkint($contentid)."'
		";
		$db->query_write($sql);
	}
	
	public static function ContentRemove(CMSDatabase $db, $contentid){
		$sql = "
			UPDATE ".$db->prefix."content
			SET deldate='".TIMENOW."'
			WHERE contentid='".bkint($contentid)."'
		";
		$db->query_write($sql);
	}
	
	public static function ContentRestore(CMSDatabase $db, $contentid){
		$sql = "
			UPDATE ".$db->prefix."content
			SET deldate=0
			WHERE contentid='".bkint($contentid)."'
		";
		$db->query_write($sql);
	}
	
	public static function CreateContent(CMSDatabase $db, $body, $modname){
		$db->query_write("
			INSERT INTO ".$db->prefix."content (body, dateline, modman) 
			VALUES ('".bkstr($body)."','".TIMENOW."', '".bkstr($modname)."')
		");
		return $db->insert_id();
	}
}

?>