<?php
/**
 * Системные SQL запросы 
 * 
 * @package Abricos
 * @subpackage Core
 * @link http://abricos.org
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
class Ab_CoreQuery {
	
	public static function ContentInfo(Ab_Database $db, $contentid){
		$sql = "
			SELECT *
			FROM ".$db->prefix."content
			WHERE contentid='".bkint($contentid)."'
			LIMIT 1
		";
		return $db->query_first($sql);
	}

	public static function ContentUpdate(Ab_Database $db, $contentid, $body){
		$sql = "
			UPDATE ".$db->prefix."content
			SET
				body='".bkstr($body)."',
				dateline='".TIMENOW."'
			WHERE contentid='".bkint($contentid)."'
		";
		$db->query_write($sql);
	}
	
	public static function ContentRemove(Ab_Database $db, $contentid){
		$sql = "
			UPDATE ".$db->prefix."content
			SET deldate='".TIMENOW."'
			WHERE contentid='".bkint($contentid)."'
		";
		$db->query_write($sql);
	}
	
	public static function ContentRestore(Ab_Database $db, $contentid){
		$sql = "
			UPDATE ".$db->prefix."content
			SET deldate=0
			WHERE contentid='".bkint($contentid)."'
		";
		$db->query_write($sql);
	}
	
	public static function ContentAppend(Ab_Database $db, $body, $modname){
		$db->query_write("
			INSERT INTO ".$db->prefix."content (body, dateline, modman) 
			VALUES ('".bkstr($body)."','".TIMENOW."', '".bkstr($modname)."')
		");
		return $db->insert_id();
	}
	
	public static function CreateContent(Ab_Database $db, $body, $modname){
		return Ab_CoreQuery::ContentAppend($db, $body, $modname);
	}
	
	/**
	 * Информация о модулях
	 *
	 * @param Ab_Database $db
	 * @return integer указатель на результат запроса
	 */
	public static function ModuleList(Ab_Database $db){
		$sql = "
			SELECT * 
			FROM ".$db->prefix."module 
			ORDER BY modorder, name
		";
		return $db->query_read($sql);
	}
	
	public static function ModuleByName(Ab_Database $db, $name){
		$sql = "
			SELECT *
			FROM ".$db->prefix."module 
			WHERE name='".bkstr($name)."'
			LIMIT 1
		";
		return $db->query_first($sql);
	} 
	
	
	public static function ModuleCreateTable(Ab_Database $db){
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
	
	public static function ModuleAppend(Ab_Database $db, Ab_Module $module){
		$row = Ab_CoreQuery::ModuleByName($db, $module->name);
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
			Ab_CoreQuery::ModuleUpdateVersion($db, $module);
		}
	}
	
	public static function ModuleUpdateVersion(Ab_Database $db, Ab_Module $module){
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
	 * @param Ab_Database $db
	 * @return result
	 */
	public static function BrickListCustom(Ab_Database $db){
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
	 * @param Ab_Database $db
	 */
	public static function BrickParamListCustom(Ab_Database $db){
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
	
	public static function BrickParamRemove(Ab_Database $db, $id){
		Ab_CoreQuery::CacheClear($db);
		$sql = "
			DELETE FROM ".$db->prefix."sys_brickparam
			WHERE brickparamid=".bkint($id)."
		";
		$db->query_write($sql);
	}
	
	public static function BrickParamSave(Ab_Database $db, $data){
		Ab_CoreQuery::CacheClear($db);
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
	
	public static function BrickParamAppend(Ab_Database $db, $data){
		Ab_CoreQuery::CacheClear($db);
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
	
	public static function BrickParamClearList(Ab_Database $db, $brickid){
		$brickid = bkint($brickid);
		$sql = "
			DELETE FROM  ".$db->prefix."sys_brickparam
			WHERE brickid=".bkint($brickid)."
		";
		$db->query_write($sql);
	}
	
	public static function BrickParamAppendFromParser(Ab_Database $db, $brickid, $param){
		Ab_CoreQuery::CacheClear($db);
		$brickid = bkint($brickid);
		Ab_CoreQuery::BrickParamClearList($db, $brickid);
		
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
	
	public static function BrickParamList(Ab_Database $db, $brickid){
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
	
	public static function BrickRecycleClear(Ab_Database $db){
		$sql = "
			SELECT brickid as id 
			FROM ".$db->prefix."sys_brick
			WHERE deldate>0
		";
		$rows = $db->query_read($sql);
		while (($row = $db->fetch_array($rows))){
			Ab_CoreQuery::BrickParamClearList($db, $row['id']);
		}
		$sql = "
			DELETE FROM ".$db->prefix."sys_brick
			WHERE deldate>0
		";
		$db->query_write($sql);
	}
	
	public static function BrickRestore(Ab_Database $db, $brickid){
		Ab_CoreQuery::CacheClear($db);
		$sql = "
			UPDATE ".$db->prefix."sys_brick
			SET deldate=0
			WHERE brickid=".bkint($brickid)."
		";
		$db->query_write($sql);
	}
	
	public static function BrickRemove(Ab_Database $db, $brickid){
		Ab_CoreQuery::CacheClear($db);
		$sql = "
			UPDATE ".$db->prefix."sys_brick
			SET deldate=".TIMENOW."
			WHERE brickid=".bkint($brickid)."
		";
		$db->query_write($sql);
	}
	
	public static function BrickSave(Ab_Database $db, $data){
		Ab_CoreQuery::CacheClear($db);
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
	
	public static function BrickById(Ab_Database $db, $brickid, $comment = false){
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
	
	public static function BrickList(Ab_Database $db, $type, $withrc = 'no'){
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

	public static function BrickAppendFromParser(Ab_Database $db, $owner, $name, $body, $type, $hash){
		Ab_CoreQuery::CacheClear($db);
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
	
	public static function BrickSaveFromParser(Ab_Database $db, $brickid, $body, $paramhash){
		Ab_CoreQuery::CacheClear($db);
		$sql = "
			UPDATE  ".$db->prefix."sys_brick
			SET 
				body='".bkstr($body)."',
				hash='".bkstr($paramhash)."'
			WHERE brickid=".bkint($brickid)."
		";
		$db->query_read($sql);
	}
	
	public static function BrickListFromParser(Ab_Database $db, $type){
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
	
	public static function CacheClear(Ab_Database $db){
		$sql = "TRUNCATE TABLE ".$db->prefix."sys_cache";
		$db->query_write($sql);
	}
	
	public static function CacheUpdate(Ab_Database $db, $cacheid, $body){
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
	
	public static function CacheAppend(Ab_Database $db, $modname, $brickname, $body){
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
	
	public static function Cache(Ab_Database $db, $modname, $brickname){
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

	public static function Phrase(Ab_Database $db, $modname, $name){
		$sql = "
			SELECT
				".Ab_CoreQuery::FIELDS_PHRASE." 
			FROM ".$db->prefix."sys_phrase
			WHERE module='".bkstr($modname)."' AND name='".bkstr($name)."' AND language='".bkstr(Abricos::$LNG)."'
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function PhraseListUpdate(Ab_Database $db, $phrases){
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
	
	public static function PhraseListAppend(Ab_Database $db, $phrases){
		$ins = array();
		foreach ($phrases as $phrase){
			array_push($ins, "(
				'".bkstr($phrase->module)."',
				'".bkstr($phrase->name)."',
				'".bkstr($phrase->value)."',
				'".bkstr(Abricos::$LNG)."'
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
	
	public static function PhraseListByModule(Ab_Database $db, $module='sys'){
		$sql = "
			SELECT
				".Ab_CoreQuery::FIELDS_PHRASE."
			FROM ".$db->prefix."sys_phrase
			WHERE module='".bkstr($module)."' AND language='".bkstr(Abricos::$LNG)."'
		";
		return $db->query_read($sql);
	}
	
	public static function PhraseList(Ab_Database $db, $list){
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
			WHERE (".implode(" OR ", $where).") AND language='".bkstr(Abricos::$LNG)."' 
		";
		return $db->query_read($sql);
	}
	
	public static function UpdateToAbricosPackage(Ab_Database $db){
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

/**
 * Устарел, оставлен для совместимости
 * 
 * @package Abricos
 * @subpackage Deprecated
 * @deprecated устарел начиная с версии 0.5.5, необходимо использовать {@link Ab_CoreQuery}
 * @ignore
 */
final class CoreQuery extends Ab_CoreQuery {
}

?>