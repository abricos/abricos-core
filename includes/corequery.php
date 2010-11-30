<?php
/**
* @version $Id$
* @package Abricos
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/


class CoreQuery {
	
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
	
	public static function ContentAppend(CMSDatabase $db, $body, $modname){
		$db->query_write("
			INSERT INTO ".$db->prefix."content (body, dateline, modman) 
			VALUES ('".bkstr($body)."','".TIMENOW."', '".bkstr($modname)."')
		");
		return $db->insert_id();
	}
	
	public static function CreateContent(CMSDatabase $db, $body, $modname){
		return CoreQuery::ContentAppend($db, $body, $modname);
	}
	
	/**
	 * Информация о модулях
	 *
	 * @param CMSDatabase $db
	 * @return integer указатель на результат запроса
	 */
	public static function ModuleList(CMSDatabase $db){
		$sql = "
			SELECT * 
			FROM ".$db->prefix."module 
			ORDER BY modorder, name
		";
		return $db->query_read($sql);
	}
	
	public static function ModuleByName(CMSDatabase $db, $name){
		$sql = "
			SELECT *
			FROM ".$db->prefix."module 
			WHERE name='".bkstr($name)."'
			LIMIT 1
		";
		return $db->query_first($sql);
	} 
	
	
	public static function ModuleCreateTable(CMSDatabase $db){
		$db->query_write("
			CREATE TABLE IF NOT EXISTS `".$db->prefix."module` (
			  `moduleid` int(5) unsigned NOT NULL auto_increment,
			  `name` varchar(50) NOT NULL default '',
			  `version` varchar(20) NOT NULL default '0.0',
			  `disable` tinyint(1) unsigned NOT NULL default '0',
			  `modorder` int(5) NOT NULL default 0,
			  `takelink` varchar(50) NOT NULL default '',
			  `installdate` int(10) unsigned NOT NULL default 0,
			  `updatedate` int(10) unsigned NOT NULL default 0,
			  PRIMARY KEY  (`moduleid`)
			) CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'"
		);
	}
	
	public static function ModuleAppend(CMSDatabase $db, CMSModule $module){
		$row = CoreQuery::ModuleByName($db, $module->name);
		if (empty($row)){
			$sql = "
				INSERT INTO ".$db->prefix."module (name, version, takelink, installdate) VALUES(
					'".bkstr($module->name)."',
					'0.0',
					'".bkstr($module->takelink)."',
					".TIMENOW."
				)
			";
			$db->query_write($sql);
		}else{
			CoreQuery::ModuleUpdateVersion($db, $module);
		}
	}
	
	public static function ModuleUpdateVersion(CMSDatabase $db, CMSModule $module){
		$db->query_write("
			UPDATE ".$db->prefix."module 
				SET 
					version='".bkstr($module->version)."',
					updatedate=".TIMENOW."
			WHERE name='".bkstr($module->name)."'
		");
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
	
	public static function BrickParamRemove(CMSDatabase $db, $id){
		CoreQuery::CacheClear($db);
		$sql = "
			DELETE FROM ".$db->prefix."sys_brickparam
			WHERE brickparamid=".bkint($id)."
		";
		$db->query_write($sql);
	}
	
	public static function BrickParamSave(CMSDatabase $db, $data){
		CoreQuery::CacheClear($db);
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
		CoreQuery::CacheClear($db);
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
		CoreQuery::CacheClear($db);
		$brickid = bkint($brickid);
		CoreQuery::BrickParamClearList($db, $brickid);
		
		$insert = array();
		foreach($param->var as $key => $value){
			array_push($insert, "(".Brick::BRICKPRM_VAR.", '".bkstr($key)."', '".bkstr($value)."', ".$brickid.")");
		}
		foreach($param->gvar as $key => $value){
			array_push($insert, "(".Brick::BRICKPRM_GLOBALVAR.", '".bkstr($key)."', '".bkstr($value)."', ".$brickid.")");
		}
		foreach($param->module as $key => $value){
			foreach ($value as $obj){
				$arr = array($obj->name);
				if (is_array($obj->param)){
					foreach ($obj->param as $pname => $pvalue){
						array_push($arr, $pname.'='.$pvalue);
					}
				}
				array_push($insert, "(".Brick::BRICKPRM_MODULE.", '".bkstr($key)."', '".bkstr(implode("|", $arr))."', ".$brickid.")");
			}
		}
		if (!empty($param->template)){
			array_push($insert, "(".Brick::BRICKPRM_TEMPLATE.", '".bkstr($param->template['name'])."', '".bkstr($param->template['owner'])."', ".$brickid.")");
		}
		foreach($param->phrase as $key => $value){		// фразы
			array_push($insert, "(".Brick::BRICKPRM_PHRASE.", '".bkstr($key)."', '".bkstr($value)."', ".$brickid.")");
		}
		foreach($param->script as $value){	// скрипты
			array_push($insert, "(".Brick::BRICKPRM_SCRIPT.", '', '".bkstr($value)."', ".$brickid.")");
		}
		foreach($param->jsmod as $key => $value){ // JavaScript модули
			foreach ($value as $brick){
				array_push($insert,"(".Brick::BRICKPRM_JSMOD.",'".bkstr($key)."','".bkstr($brick)."',".$brickid.")");
			}
		}
		foreach($param->jsfile as $value){	// JavaScript файлы
			array_push($insert, "(".Brick::BRICKPRM_JSFILE.", '', '".bkstr($value)."', ".$brickid.")");
		}
		foreach($param->css as $value){	// CSS файлы
			array_push($insert, "(".Brick::BRICKPRM_CSS.", '', '".bkstr($value)."', ".$brickid.")");
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
	
	public static function BrickRecycleClear(CMSDatabase $db){
		$sql = "
			SELECT brickid as id 
			FROM ".$db->prefix."sys_brick
			WHERE deldate>0
		";
		$rows = $db->query_read($sql);
		while (($row = $db->fetch_array($rows))){
			CoreQuery::BrickParamClearList($db, $row['id']);
		}
		$sql = "
			DELETE FROM ".$db->prefix."sys_brick
			WHERE deldate>0
		";
		$db->query_write($sql);
	}
	
	public static function BrickRestore(CMSDatabase $db, $brickid){
		CoreQuery::CacheClear($db);
		$sql = "
			UPDATE ".$db->prefix."sys_brick
			SET deldate=0
			WHERE brickid=".bkint($brickid)."
		";
		$db->query_write($sql);
	}
	
	public static function BrickRemove(CMSDatabase $db, $brickid){
		CoreQuery::CacheClear($db);
		$sql = "
			UPDATE ".$db->prefix."sys_brick
			SET deldate=".TIMENOW."
			WHERE brickid=".bkint($brickid)."
		";
		$db->query_write($sql);
	}
	
	public static function BrickSave(CMSDatabase $db, $data){
		CoreQuery::CacheClear($db);
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

	public static function BrickAppendFromParser(CMSDatabase $db, $owner, $name, $body, $type, $hash){
		CoreQuery::CacheClear($db);
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
		CoreQuery::CacheClear($db);
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
	
	const FIELDS_PHRASE = "
		phraseid as id,
		module as mnm,
		name as nm,
		phrase as ph
	";

	public static function Phrase(CMSDatabase $db, $modname, $name){
		$sql = "
			SELECT
				".CoreQuery::FIELDS_PHRASE." 
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
				".CoreQuery::FIELDS_PHRASE."
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
	
	public static function UpdateToAbricosPackage(CMSDatabase $db){
		$db->query_write("
			ALTER TABLE `".$db->prefix."module` 
				ADD `installdate` int(10) unsigned NOT NULL default 0 AFTER `takelink`,
				ADD `updatedate` int(10) unsigned NOT NULL default 0 AFTER `installdate`
		");

		$db->query_write("
			UPDATE ".$db->prefix."module 
				SET installdate=".TIMENOW."
			WHERE name='sys'
		");
	}
}
?>