<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

global $cms;
$mod = new CMSModCatalog();
$cms->modules->Register($mod);

class CMSModCatalog extends CMSModule {
	
	/**
	 * Upload Status: 0 - session, 1 - id
	 *
	 * @var integer
	 */
	public $uploadStatus = 0;
	/**
	 * Upload идентификатор
	 * в зависимости от типа содержит в себе либо идентификатор редактируемого элемента, 
	 * либо сессию добавляемого элемента
	 *
	 * @var mixed
	 */
	public $uploadId = '';
	
	public $uploadElementTypeId = 0;
	public $uploadElementId = 0;
	
	public $baseUrl = "";
	
	public $modManInfo = null;
	public $currentModMan = null;
	public $updateShemaModule = null;
	
	private $api = null;
	
	function __construct(){
		$this->version = "1.0.0"; 
		$this->name = "catalog";
		$this->takelink = "catalogbase";
	}
	
	public function GetAPI(){
		if (is_null($this->api)){
			require_once CWD.'/modules/catalog/includes/api.php';
			$this->api = new CMSCatalogAPI();
		}
		return $this->api;
	}
	
	public function GetContentName(){
		$cname = 'index';
		$adress = $this->registry->adress;
		
		if ($adress->level >= 2){
			
			$this->currentModMan = $this->registry->modules->GetModule($adress->dir[1]);
			
			CMSQCatalog::PrefixSet($this->registry->db, $this->currentModMan->catinfo['dbprefix']);
			
			$p = $adress->dir[2];
			if ($p == 'upload'){
				$cname = "upload";
				$this->uploadStatus = $adress->dir[3] == 'id' ? 1 : 0; 
				$this->uploadId = $adress->dir[4];
				$this->uploadElementTypeId = bkint($adress->dir[5]);
				// $this->uploadElementId = bkint($adress->dir[6]);
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
			CMSQCatalog::PrefixSet($this->registry->db, $obj->_ds->pfx);
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
	
	private function UpdateModMan(){
		if (is_null($this->modManInfo)){
			$db = $this->registry->db;
			$rows = CMSQCatalog::ModuleManagerList($db);
			while (($row = $db->fetch_array($rows))){
				$this->modManInfo[$row['nm']] = $row;
			}
		}
	}

	/**
	 * Регистрация модуля "паразита"
	 *
	 * @param CMSModule $modman
	 */
	public function Register(CMSModule $modman){
		$this->currentModMan = $modman;
		$this->UpdateModMan();
		if (empty($this->modManInfo[$modman->name])){
			CMSQCatalog::ModuleManagerAppend($this->registry->db,$modman);
			$this->modManInfo = null;
			$this->UpdateModMan();
		}
		// проверка версии
		$info = $this->modManInfo[$modman->name];

		$svers = $info['vs'];
		$cvers = $this->version;
		if (version_compare($svers, $cvers, "==")){return;}
		
		$this->updateShemaModule = new CMSModuleUpdShema($modman, $svers);
		
		require(CWD."/modules/catalog/includes/shema_mod.php");
		CMSQCatalog::ModuleManagerUpdate($this->registry->db, $info['id'], $this->version);
		$this->updateShemaModule = null;
	}
	
}

class CMSCatalogMan {
	
	
	/**
	 * Добавление фотографии к элементу каталога
	 * 
	 * @param int $elementId идентификатор свободного элемента 
	 * @param int $elTypeId тип элемента
	 * @param mixed $files - массив файлов (пути к файлам)
	 */
	public static function ImageUpload($elementId, $elTypeId, $files){
		
		$modCatalog = Brick::$modules->GetModule('catalog');
		$modMan = $modCatalog->currentModMan;
		$modFM = Brick::$modules->GetModule('filemanager');
		
		CMSQCatalog::PrefixSet(Brick::$db, $modMan->catinfo['dbprefix']);
		$upload = $modFM->GetUpload();
		
		$arr = array();
		foreach ($files as $file){
			if (!file_exists($file)){ continue; } 
			
			$filename = basename($file);
			$tarr = explode('.', $filename);
			$ext = $tarr[count($tarr)-1];
			
			$errornum = $upload->UploadSystemFile($file, $filename, $ext, filesize($file));
			if (empty($errornum)){
				array_push($arr, $upload->lastLoadFileHash);
			}
		}
		if (empty($arr)){ return; }
		
		$uploadId = $elementId;
		$eltypeid = $elTypeId;
		
		CMSQCatalog::FotoAppend(Brick::$db, $eltypeid, $uploadId, $arr);
	}
	
}


/**
 * Термины:
 * Element - свободный элемент (один и тот же элемент может содержаться в нескольких разделов каталога, поэтому элемент назвается свободным).
 * ElementType - тип свободного элемента. Для каждого типа элемента создается своя таблица хранения элементов.
 * ElementOption - опция свободного элемента
 * Catalog - раздел в каталоге.
 * CatalogElement - элемент в каталоге (в таблице element связывает раздел каталога со свободным элементом). 
 */
class CMSQCatalog {
	
	public static $PFX = "";
	public static function PrefixSet(CMSDatabase $db, $mmPrefix){
		CMSQCatalog::$PFX = $db->prefix."ctg_".$mmPrefix."_";
	}
	
	const OPTIONTYPE_BOOLEAN = 0;
	const OPTIONTYPE_NUMBER = 1;
	const OPTIONTYPE_DOUBLE = 2;
	const OPTIONTYPE_STRING = 3;
	const OPTIONTYPE_LIST = 4;
	const OPTIONTYPE_TABLE = 5;
	const OPTIONTYPE_MULTI = 6;
	const OPTIONTYPE_TEXT = 7;
	const OPTIONTYPE_DICT = 8;
	
	public static function SessionAppend(CMSDatabase $db, $sessionid, $data){
		$sql = "
			INSERT INTO ".CMSQCatalog::$PFX."session
			(session, data) VALUES (
				'".addslashes($sessionid)."',
				'".addslashes($data)."'
			)
		";
		$db->query_write($sql);
	}
	
	public static function SessionRemove(CMSDatabase $db, $sessionid){
		$sql = "
			DELETE FROM ".CMSQCatalog::$PFX."session
			WHERE session='".addslashes($sessionid)."'
		";
		$db->query_write($sql);
	}
	
	public static function Session(CMSDatabase $db, $sessionid){
		$sql = "
			SELECT *
			FROM ".CMSQCatalog::$PFX."session
			WHERE session = '".$sessionid."'
		";
		return $db->query_read($sql);
	}
	
	public static function Foto(CMSDatabase $db, $fotoid){
		$sql = "
			SELECT *
			FROM ".CMSQCatalog::$PFX."foto
			WHERE fotoid=".bkint($fotoid)."
			LIMIT 1
		";
		$db->query_write($sql);
	}
	
	/**
	 * Удаление фотографии
	 */
	public static function FotoRemove(CMSDatabase $db, $fotoid){
		$foto = CMSQCatalog::Foto($db, $fotoid);
		$sql = "
			DELETE FROM ".CMSQCatalog::$PFX."foto
			WHERE fotoid=".bkint($fotoid)."
		";
		$db->query_write($sql);
		
		CMSRegistry::$instance->modules->GetModule('filemanager');
		CMSQFileManager::FileDelete($db, $foto['fileid']);
	}

	/**
	 * Удаление всех фотографий элемента
	 */
	public static function FotoListRemove(CMSDatabase $db, $eltypeid, $elementid){
		$files = array();
		
		$rows = CMSQCatalog::FotoList($db, $eltypeid, $elementid);
		while (($row = $db->fetch_array($rows))){
			array_push($files, $row['fid']);
		}
		$sql = "
			DELETE FROM ".CMSQCatalog::$PFX."foto
			WHERE eltypeid=".intval($eltypeid)." AND elementid=".intval($elementid)."  
		";
		$db->query_write($sql);
		
		CMSRegistry::$instance->modules->GetModule('filemanager');
		CMSQFileManager::FilesDelete($db, $files);
	}
	
	public static function FotosSync(CMSDatabase $db, $eltypeid, $elementid, $sfids){
		$afotos = explode(",", $sfids);
		$rows = CMSQCatalog::FotoList($db, $eltypeid, $elementid);
		while (($row = $db->fetch_array($rows))){
			$find = false;
			foreach($afotos as $fid){
				if ($fid == $row['fid']){
					$find = true;
					break;
				}
			}
			if (!$find){
				CMSQCatalog::FotoRemove($db, $row['id']);
			}
		}
		
		/*
		$sql = "
			DELETE FROM ".CMSQCatalog::$PFX."foto
			WHERE eltypeid=".bkint($eltypeid)." AND elementid=".bkint($elementid)."
		";
		$db->query_write($sql);
		CMSQCatalog::FotoAppend($db, $eltypeid, $elementid, $afotos);
		/**/
	}
	
	public static function FotoAppend(CMSDatabase $db, $eltypeid, $elementid, $fileids){
		if (empty($fileids)){ return; }
		$arr = array();
		foreach ($fileids as $fileid){
			array_push($arr, "(
				".intval($eltypeid).",
				".intval($elementid).",
				'".addslashes($fileid)."'
			)");
		}
		
		$sql = "
			INSERT INTO ".CMSQCatalog::$PFX."foto
			(eltypeid, elementid, fileid) VALUES 
			".implode($arr, ',')."
		";
		$db->query_write($sql);
	}
	
	public static function FotoList(CMSDatabase $db, $eltypeid, $elementid) {
		$sql = "
			SELECT 
				fotoid as id,
				eltypeid as eltid,
				elementid as elid,
				fileid as fid,
				ord
			FROM ".CMSQCatalog::$PFX."foto
			WHERE eltypeid=".intval($eltypeid)." AND elementid=".intval($elementid)."
			ORDER BY fotoid 
		";
		return $db->query_read($sql);
	}
	
	public static function FotoFirst(CMSDatabase $db, $eltypeid, $elementid){
		$sql = "
			SELECT 
				fotoid as id,
				eltypeid as eltid,
				elementid as elid,
				fileid as fid,
				ord
			FROM ".CMSQCatalog::$PFX."foto
			WHERE eltypeid=".intval($eltypeid)." AND elementid=".intval($elementid)."
			ORDER BY fotoid
			LIMIT 1 
		";
		return $db->query_first($sql);
	}

	private static function ElementBuildVars(CMSDatabase $db, $data){
		$eltype = CMSQCatalog::ElementTypeById($db, $data->eltid);
		
		$rows = CMSQCatalog::ElementOptionListByType($db, $data->eltid);
		
		$ret = new stdClass();
		$ret->idfield = $eltype['nm']."id";
		$ret->table = CMSQCatalog::BuildElementTableName($eltype['nm']);
		
		$fields = array(); $values = array(); $elnamevals = array();
		// формирование списка полей и их значений
		while (($row = $db->fetch_array($rows))){
			$fdbname = "fld_".$row['nm'];
			switch ($row['fldtp']){
				case CMSQCatalog::OPTIONTYPE_BOOLEAN:
				case CMSQCatalog::OPTIONTYPE_NUMBER:
				case CMSQCatalog::OPTIONTYPE_LIST:
					array_push($fields, $fdbname);
					array_push($values, bkint($data->$fdbname));
					break;
				case CMSQCatalog::OPTIONTYPE_STRING:
				case CMSQCatalog::OPTIONTYPE_TEXT:
				case CMSQCatalog::OPTIONTYPE_DOUBLE:
					array_push($fields, $fdbname);
					array_push($values, "'".bkstr($data->$fdbname)."'");
					break;
				case CMSQCatalog::OPTIONTYPE_TABLE:
					$data->$fdbname = bkint($data->$fdbname);
					$fdbnamealt = $fdbname."-alt"; 
					if (empty($data->$fdbname) && !empty($data->$fdbnamealt)){
						$data->$fdbname = CMSQCatalog::ElementOptionFieldTableAppendValue($db, $eltype['nm'], $row['nm'], $data->$fdbnamealt);
					}
					array_push($fields, $fdbname);
					array_push($values, bkint($data->$fdbname));
					break;
			}
			if (!empty($row['ets'])){
				if($row['fldtp'] == CMSQCatalog::OPTIONTYPE_TABLE){
					$row = CMSQCatalog::ElementOptionFieldTableValue($db, $eltype['nm'],  $row['nm'], $data->$fdbname);
					array_push($elnamevals, $row['tl']);
				}else{
					array_push($elnamevals, $data->$fdbname);
				}
			}
		}
		$ret->fields = $fields;
		$ret->values = $values;
		$ret->stitle = "";
		$ret->sname = "";
		
		if (!empty($elnamevals)){
			$ret->stitle = implode(", ", $elnamevals);
			$ret->sname = translateruen($ret->stitle);
		}
		
		return $ret;
	}
	
	/**
	 * Добавить элемент в каталог:
	 * 1) добавить элемент в свою таблицу элементов (ctg_eltbl_[имя типа элемента]);
	 * 2) добавить элемент в таблицу элементов каталога (ctg_element)
	 *
	 * @param CMSDatabase $db
	 * @param object $data данные
	 */
	public static function CatalogElementAppend(CMSDatabase $db, $data){
		$dobj = CMSQCatalog::ElementBuildVars($db, $data);
		$sfields = ""; $svalues = ""; 
		$fields = $dobj->fields;
		$values = $dobj->values;
		
		if (!empty($fields)){
			$sfields = ",".implode(",", $fields);
			$svalues = ",".implode(",", $values);
		}
		$sql = "
			INSERT INTO `".$dobj->table."` 
			(dateline ".$sfields.") VALUES (
				".TIMENOW."
				".$svalues."
			)
		";
		$db->query_write($sql);
		$data->id = $db->insert_id();
		
		$sql = "
			INSERT INTO ".CMSQCatalog::$PFX."element
			(globalelementid, catalogid, eltypeid, title, name, dateline) VALUES (
				".bkint($data->id).",
				".bkint($data->catid).", 
				".bkint($data->eltid).", 
				'".bkstr($dobj->stitle)."', 
				'".bkstr($dobj->sname)."', 
				".TIMENOW." 
			)
		";
		$db->query_write($sql);
		$elementid = $db->insert_id();
		
		$rows = CMSQCatalog::CatalogElement($db, $elementid);
		while (($row = $db->fetch_array($rows))){
			$element = $row;
		}
		
		// добавление фото
		$rows = CMSQCatalog::Session($db, $data->session);
		$ids = array();
		while (($row = $db->fetch_array($rows))){
			$arr = json_decode($row['data']);
			foreach ($arr as $id){
				array_push($ids, $id);
			}
		}
		CMSQCatalog::SessionRemove($db, $data->session);
		CMSQCatalog::FotoAppend($db, $data->eltid, $element['elid'], $ids);
		
		CMSQCatalog::FotosSync($db, $data->eltid, $element['elid'], $data->fids);
		
		return $db->insert_id();
	}
	
	public static function CatalogElementSave(CMSDatabase $db, $data){
		$dobj = CMSQCatalog::ElementBuildVars($db, $data);
		$fields = $dobj->fields;
		$values = $dobj->values;
		
		$sset = "";
		if (!empty($fields)){
			$set = array();
			for ($i=0; $i<count($fields); $i++){
				array_push($set, $fields[$i]."=".$values[$i]);
			}
			$sset=",".implode(",", $set);
		}
		
		$sql = "
			UPDATE `".$dobj->table."` 
			SET upddate=".TIMENOW." ".$sset."
			WHERE ".$dobj->idfield."=".bkint($data->elid)." 
		";
		$db->query_write($sql);

		$sql = "
			UPDATE ".CMSQCatalog::$PFX."element
			SET
				name='".bkstr($dobj->sname)."',
				title='".bkstr($dobj->stitle)."'
			WHERE elementid=".bkint($data->id)." 
		";
		$db->query_write($sql);
		
		CMSQCatalog::FotosSync($db, $data->eltid, $data->elid, $data->fids);
	}
	
	/**
	 * Получить список элементов в каталоге
	 *
	 * @param CMSDatabase $db
	 * @param Integer $catalogId
	 * @return resource
	 */
	public static function CatalogElementList(CMSDatabase $db, $catalogId){
		$sql = "
			SELECT 
				elementid as id,
				globalelementid as elid,
				catalogid as catid,
				eltypeid as eltid,
				title as tl,
				name as nm,
				deldate as dd
			FROM ".CMSQCatalog::$PFX."element
			WHERE catalogid=".bkint($catalogId)."
			ORDER BY dateline DESC
		";
		return $db->query_read($sql);
	}
	
	/**
	 * Удалить элемент каталога из корзины
	 * @var int $elementId идентификатор элемента в таблице element
	 */
	public static function CatalogElementRestore(CMSDatabase $db, $elementId){
		$sql = "
			UPDATE ".CMSQCatalog::$PFX."element SET deldate=0 WHERE  elementid=".bkint($elementId)."
		";
		$db->query_write($sql);
	}
	
	/**
	 * Переместить все элементы каталога в корзину
	 */
	public static function CatalogElementRemoveAll(CMSDatabase $db, $catalogid){
		$sql = "
			UPDATE ".CMSQCatalog::$PFX."element
			SET deldate=".TIMENOW."
			WHERE  catalogid=".bkint($catalogid)."
		";
		$db->query_write($sql);
	}
	
	/**
	 * Переместить элемент каталога в корзину
	 * @var int $elementId идентификатор элемента в таблице element
	 */
	public static function CatalogElementRemove(CMSDatabase $db, $elementId){
		$sql = "
			UPDATE ".CMSQCatalog::$PFX."element
			SET deldate=".TIMENOW."
			WHERE  elementid=".bkint($elementId)."
		";
		$db->query_write($sql);
	}
	
	public static function CatalogElementRecycleClear(CMSDatabase $db){
		$sql = "
			SELECT a.globalelementid as elid, b.name as nm, a.eltypeid as eltid
			FROM ".CMSQCatalog::$PFX."element a
			LEFT JOIN ".CMSQCatalog::$PFX."eltype b ON a.eltypeid=b.eltypeid
			WHERE a.deldate>0
		";
		$rows = $db->query_read($sql);
		while (($row = $db->fetch_array($rows))){
			CMSQCatalog::FotoListRemove($db, $row['eltid'], $row['elid']);
			$elTableName = CMSQCatalog::BuildElementTableName($row['nm']);
			$sql = "
				DELETE FROM ".$elTableName."
				WHERE ".$row['nm']."id=".$row['elid']."
			";
			$db->query_write($sql);
		}
		$sql = "DELETE FROM ".CMSQCatalog::$PFX."element WHERE deldate>0";
		$db->query_write($sql);
	}

	/**
	 * Получить элемент каталога. 
	 * 
	 * @var int $elementId идентификатор элемента в таблице элементов каталога (element)
	 * @var int $elTypeId идентификатор типа элемента
	 */
	public static function CatalogElement(CMSDatabase $db, $elementId){
		$sql = "
			SELECT eltypeid as eltid
			FROM ".CMSQCatalog::$PFX."element
			WHERE elementid=".bkint($elementId)."
			LIMIT 1
		";
		$row = $db->query_first($sql);
		if (empty($row)){
			$sql = "
				SELECT 
					a.elementid as id,
					a.globalelementid as elid,
					a.catalogid as catid,
					a.eltypeid as eltid
				FROM ".CMSQCatalog::$PFX."element a
				WHERE elementid=0
				LIMIT 1
			";
			return $db->query_read($sql);
		}
		$elTypeId = $row['eltid'];
		
		$eltype = CMSQCatalog::ElementTypeById($db, $elTypeId);
		$elTableName = CMSQCatalog::BuildElementTableName($eltype['nm']);
		
		$rows = CMSQCatalog::ElementOptionListByType($db, $eltype['id']);
		$fields = array();
		while (($row = $db->fetch_array($rows))){
			array_push($fields, "b.fld_".$row['nm']);
		}
		$sfields = "";
		if (!empty($fields)){
			$sfields = ",".implode(",", $fields);
		}
		
		$fotosRows = CMSQCatalog::FotoList(Brick::$db, $elTypeId, $elementId);
		$fotoIds = array();
		while (($row = $db->fetch_array($fotosRows))){
			array_push($fotoIds, $row['fid']);
		}
		
		$sql = "
			SELECT 
				a.elementid as id,
				a.globalelementid as elid,
				a.catalogid as catid,
				a.eltypeid as eltid
				".$sfields.",
				'".implode(",", $fotoIds)."' as fids
			FROM ".CMSQCatalog::$PFX."element a
			LEFT JOIN ".$elTableName." b ON a.globalelementid=b.".$eltype['nm']."id
			WHERE elementid=".bkint($elementId)."
			LIMIT 1
		";
		return $db->query_read($sql);
	}
	
	/**
	 * Удаление каталога и его элементов
	 */
	public static function CatalogRemove(CMSDatabase $db, $catalogid){
		$catalog = CMSQCatalog::Catalog($db, $catalogid);
		if (empty($catalog)){ return; }
		
		$rows = CMSQCatalog::CatalogListByParentId($db, $catalogid);
		while (($row = $db->fetch_array($rows))){
			CMSQCatalog::CatalogRemove($db, $row['id']);
		}
		
		CMSQCatalog::CatalogElementRemoveAll($db, $catalogid);
		CMSQCatalog::CatalogElementRecycleClear($db);
		$sql = "
			DELETE FROM ".CMSQCatalog::$PFX."catalog
			WHERE catalogid=".bkint($catalogid)."
		";
		$db->query_write($sql);
	}
	
	public static function CatalogSave(CMSDatabase $db, $data){
		$sql = "
			UPDATE ".CMSQCatalog::$PFX."catalog
			SET 
				title='".bkstr($data->tl)."',
				name='".bkstr($data->nm)."', 
				descript='".bkstr($data->dsc)."'
			WHERE catalogid=".bkint($data->id)."
		";
		$db->query_write($sql);
	}
	
	public static function CatalogAppend(CMSDatabase $db, $data){
		$sql = "
			INSERT INTO ".CMSQCatalog::$PFX."catalog
			(parentcatalogid, title, name, descript) VALUES
			(
				'".bkint($data->pid)."',
				'".bkstr($data->tl)."',
				'".bkstr($data->nm)."',
				'".bkstr($data->dsc)."'
			)
		";
		$db->query_write($sql);
	}
	
	const FIELD_CATALOGLIST = "
		catalogid as id,
		parentcatalogid as pid,
		name as nm,
		title as tl,
		descript as dsc,
		dateline as dl,
		deldate as dd,
		level as lvl,
		ord as ord
	";
	
	public static function Catalog(CMSDatabase $db, $catalogid){
		$sql = "
			SELECT
				".CMSQCatalog::FIELD_CATALOGLIST." 
			FROM ".CMSQCatalog::$PFX."catalog
			WHERE catalogid=".bkint($catalogid)."
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function CatalogListByParentId(CMSDatabase $db, $parentCatalogId){
		$sql = "
			SELECT
				".CMSQCatalog::FIELD_CATALOGLIST." 
			FROM ".CMSQCatalog::$PFX."catalog
			WHERE parentcatalogid=".bkint($parentCatalogId)."
			ORDER BY title
		";
		return $db->query_read($sql);
	}
	
	public static function CatalogList(CMSDatabase $db){
		$sql = "
			SELECT
				".CMSQCatalog::FIELD_CATALOGLIST." 
			FROM ".CMSQCatalog::$PFX."catalog
			ORDER BY title
		";
		return $db->query_read($sql);
	}

	public static function CatalogConfigAppend(CMSDatabase $db, $obj){
		$sql = "
			INSERT INTO ".CMSQCatalog::$PFX."catalogcfg
			(level, leveltype, title, name, descript, status) VALUES
			(
				".bkint($obj->lvl).",
				".bkint($obj->lvltp).",
				'".bkstr($obj->tl)."',
				'".bkstr($obj->nm)."',
				'".bkstr($obj->dsc)."',
				".bkint($obj->st)."
			)
		";
		$db->query_write($sql);
	}
	
	public static function CatalogConfigUpdate(CMSDatabase $db, $obj){
		$sql = "
			UPDATE ".CMSQCatalog::$PFX."catalogcfg
			SET 
				leveltype=".bkint($obj->lvltp).",
				title='".bkstr($obj->tl)."',
				name='".bkstr($obj->nm)."',
				descript='".bkstr($obj->dsc)."',
				status=".bkint($obj->st)."
			WHERE level=".bkint($obj->lvl)."
		";
		$db->query_write($sql);
	}
	
	public static function CatalogConfigList(CMSDatabase $db){
		$sql = "
			SELECT 
				catalogcfgid as id,
				level as lvl,
				leveltype as lvltp,
				title as tl,
				name as nm, 
				descript as dsc,
				status as st
			FROM ".CMSQCatalog::$PFX."catalogcfg
			WHERE status=0
			ORDER BY level
		";
		return $db->query_read($sql);
	}
	
	public static function ElementOptGroupAppend(CMSDatabase $db, $elementTypeId, $title, $descript){
		$sql = "
			INSERT INTO ".CMSQCatalog::$PFX."eloptgroup
			(eltypeid, title, descript) VALUES (
				".bkint($elementTypeId).",
				'".bkstr($title)."',
				'".bkstr($descript)."'
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
	public static function ElementOptGroupList(CMSDatabase $db){
		$sql = "
			SELECT
				eloptgroupid as id,
				parenteloptgroupid as pid,
				eltypeid as elid,
				title as tl,
				descript as dsc
			FROM ".CMSQCatalog::$PFX."eloptgroup
		";
		return $db->query_read($sql);
	}
	
	/**
	 * Имена полей в запросах SELECT таблицы ctg_eloption
	 *
	 */
	const FIELD_ELEMENTOPTION = "
		eloptionid as id,
		eltypeid as eltid,
		eloptgroupid as grp,
		fieldtype as fldtp,
		param as prms,
		name as nm,
		title as tl,
		eltitlesource as ets,
		descript as dsc,
		ord as ord,
		disable as dsb,
		deldate as dd
	";
	
	public static function ElementOptionRemove(CMSDatabase $db, $id){
		$sql = "
			UPDATE ".CMSQCatalog::$PFX."eloption
			SET 
				deldate=".TIMENOW."
			WHERE eloptionid=".bkint($id)."
		";
		$db->query_write($sql);
	}

	public static function ElementOptionRestore(CMSDatabase $db, $id){
		$sql = "
			UPDATE ".CMSQCatalog::$PFX."eloption
			SET deldate=0
			WHERE eloptionid=".bkint($id)."
		";
		$db->query_write($sql);
	}
	
	public static function ElementOptionSave(CMSDatabase $db, $data){
		$sql = "
			UPDATE ".CMSQCatalog::$PFX."eloption
			SET 
				title='".bkstr($data->tl)."', 
				descript='".bkstr($data->dsc)."',
				param='".bkstr($data->prms)."',
				eltitlesource='".bkstr($data->ets)."'
			WHERE eloptionid=".bkint($data->id)."
		";
		$db->query_write($sql);
	}
	
	public static function ElementOptionRecycleClear(CMSDatabase $db){
		$sql = "
			SELECT
				a.fieldtype as fldtp,
				a.name as nm, 
				b.name as eltnm
			FROM ".CMSQCatalog::$PFX."eloption a
			LEFT JOIN ".CMSQCatalog::$PFX."eltype b ON a.eltypeid=b.eltypeid
			WHERE a.deldate>0 
		";
		$rows = $db->query_read($sql);
		while (($row = $db->fetch_array($rows))){
			if ($row['fldtp'] == CMSQCatalog::OPTIONTYPE_TABLE){
				$tablename = CMSQCatalog::BuilElementOptionFieldTable($row['eltnm'], $row['nm']);
				$db->query_write("DROP TABLE `".$tablename."`");
			}
			// удаление поля из таблицы элементов данного типа
			$sql = "
				ALTER TABLE `".CMSQCatalog::$PFX."eltbl_".$row['eltnm']."` DROP `fld_".$row['nm']."`
			";
			$db->query_write($sql);
		}
		$sql = "
			DELETE FROM ".CMSQCatalog::$PFX."eloption
			WHERE deldate>0
		";
		$db->query_write($sql);
	}
	
	public static function ElementOptionAppend(CMSDatabase $db, $data, $prms){
		$sql = "
			INSERT INTO ".CMSQCatalog::$PFX."eloption
			(eltypeid, eloptgroupid, fieldtype, param, name, title, eltitlesource, descript, dateline) VALUES
			(
				".bkint($data->eltid).",
				".bkint($data->grp).",
				".bkint($data->fldtp).",
				'".bkstr($data->prms)."',
				'".bkstr($data->nm)."',
				'".bkstr($data->tl)."',
				'".bkint($data->ets)."',
				'".bkstr($data->dsc)."', 
				".TIMENOW."
			)
		";
		$db->query_write($sql);

		$table = CMSQCatalog::$PFX."eltbl_".$data->eltypenm;
		$sql = "ALTER TABLE ".$table." ADD `fld_".$data->nm."` ";
		switch ($data->fldtp){
			case CMSQCatalog::OPTIONTYPE_BOOLEAN:
				$sql .= "INT(1) UNSIGNED NOT NULL DEFAULT '".$prms->def."'";
				break;
			case CMSQCatalog::OPTIONTYPE_NUMBER:
				$sql .= "INT(".$prms->size.") NOT NULL DEFAULT '".$prms->def."'";
				break;
			case CMSQCatalog::OPTIONTYPE_DOUBLE:
				$sql .= "DOUBLE(".$prms->size.") NOT NULL DEFAULT '".$prms->def."'";
				break;
			case CMSQCatalog::OPTIONTYPE_STRING:
				$sql .= "VARCHAR(".$prms->size.") NOT NULL DEFAULT '".bkstr($prms->def)."'";
				break;
			case CMSQCatalog::OPTIONTYPE_LIST:
				$sql .= "INT(4) NOT NULL DEFAULT '0'";
				break;
			case CMSQCatalog::OPTIONTYPE_TABLE:
				$sql .= "INT(10) UNSIGNED NOT NULL DEFAULT '0'";
				CMSQCatalog::ElementOptionFieldTableCreate($db, $data->eltypenm, $data->nm);
				break;
			case CMSQCatalog::OPTIONTYPE_MULTI:
				return;
			case CMSQCatalog::OPTIONTYPE_TEXT:
				$sql .= "TEXT NOT NULL ";
				break;
			default:
				return;
		}
		$sql .= " COMMENT '".bkstr($data->tl)."'";
		
		$db->query_write($sql);
	}
	
	public static function ElementOptionFieldTableCreate(CMSDatabase $db, $eltypename, $fieldname){
		$tablename = CMSQCatalog::BuilElementOptionFieldTable($eltypename, $fieldname); 
		$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
		$sql = "
			CREATE TABLE IF NOT EXISTS `".$tablename."` (
			  `".$fieldname."id` int(10) unsigned NOT NULL auto_increment,
			  `title` varchar(250) NOT NULL default '',
			  PRIMARY KEY  (`".$fieldname."id`)
		)".$charset;
		$db->query_write($sql);
	}
	
	public static function ElementOptionFieldTableAppendValue(CMSDatabase $db, $eltypename, $fieldname, $value){
		$tablename = CMSQCatalog::BuilElementOptionFieldTable($eltypename, $fieldname); 
		$sql = "INSERT INTO `".$tablename."` (title) VALUES ('".bkstr($value)."')";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
	public static function ElementOptionFieldTableValue(CMSDatabase $db, $eltypename, $fieldname, $id){
		$tablename = CMSQCatalog::BuilElementOptionFieldTable($eltypename, $fieldname);
		$sql = "
			SELECT 
				".$fieldname."id as id,
				title as tl
			FROM ".$tablename."
			WHERE ".$fieldname."id=".bkint($id)."
			LIMIT 1
		"; 
		return $db->query_first($sql); 
	}
	
	public static function ElementOptionFieldTableList(CMSDatabase $db, $eltypename, $fieldname){
		$tablename = CMSQCatalog::BuilElementOptionFieldTable($eltypename, $fieldname);
		$sql = "
			SELECT 
				".$fieldname."id as id,
				title as tl
			FROM ".$tablename."
			ORDER BY title
		"; 
		return $db->query_read($sql);
	}

	public static function ElementOptionByName(CMSDatabase $db, $elementTypeId, $name){
		$sql = "
			SELECT 
				".CMSQCatalog::FIELD_ELEMENTOPTION."
			FROM ".CMSQCatalog::$PFX."eloption
			WHERE name='".bkstr($name)."' AND eltypeid=".bkint($elementTypeId)."
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	/**
	 * Список опций элемента конкретного типа
	 *
	 * @param CMSDatabase $db
	 * @param integer $elTypeId идентификатор типа элемента
	 * @return resource
	 */
	public static function ElementOptionListByType(CMSDatabase $db, $elTypeId){
		$sql = "
			SELECT 
				".CMSQCatalog::FIELD_ELEMENTOPTION."
			FROM ".CMSQCatalog::$PFX."eloption
			WHERE eltypeid=".bkint($elTypeId)."
			ORDER BY eloptgroupid, ord
		";
		return $db->query_read($sql);
	}
	
	public static function ElementOptionList(CMSDatabase $db){
		$sql = "
			SELECT 
				".CMSQCatalog::FIELD_ELEMENTOPTION."
			FROM ".CMSQCatalog::$PFX."eloption
			ORDER BY eloptgroupid, ord
		";
		return $db->query_read($sql);
	}
	
	public static function TableList(CMSDatabase $db){
		$sql = "
			SHOW TABLES FROM ".$db->database."
		";
		return $db->query_read($sql);
	}
	
	/**
	 * Очистка корзины и удаление всех связанных с удаляемыми записями обьекты
	 *
	 * @param CMSDatabase $db
	 */
	public static function ElementTypeRecycleClear(CMSDatabase $db){
		$sql = "
			SELECT name as nm
			FROM ".CMSQCatalog::$PFX."eltype
			WHERE deldate>0
		";
		$rows = $db->query_read($sql);
		while (($row = $db->fetch_array($rows))){
			CMSQCatalog::ElementTypeTableRemove($db, $row['nm']);
		}
		$sql = "
			DELETE FROM ".CMSQCatalog::$PFX."eltype
			WHERE deldate>0
		";
		$db->query_write($sql);
	}

	/**
	 * Удаление записи типа элемента в корзину
	 *
	 * @param CMSDatabase $db
	 * @param Integer $id
	 */
	public static function ElementTypeRemove(CMSDatabase $db, $id){
		$sql = "
			UPDATE ".CMSQCatalog::$PFX."eltype
			SET deldate=".TIMENOW."
			WHERE eltypeid=".bkint($id)."
		";
		$db->query_write($sql);
	}
	
	public static function ElementTypeRestore(CMSDatabase $db, $id){
		$sql = "
			UPDATE ".CMSQCatalog::$PFX."eltype
			SET deldate=0
			WHERE eltypeid=".bkint($id)."
		";
		$db->query_write($sql);
	}
	
	public static function ElementTypeTableRemove(CMSDatabase $db, $name){
		$tablename = CMSQCatalog::BuildElementTableName($name);  
		$sql = "DROP TABLE `".$tablename."`";
		$db->query_write($sql);
	}
	
	public static function ElementTypeTableCreate(CMSDatabase $db, $name){
		$tablename = CMSQCatalog::BuildElementTableName($name);  
		$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";

		$sql = "
			CREATE TABLE IF NOT EXISTS `".$tablename."` (
			  `".$name."id` int(10) unsigned NOT NULL auto_increment,
			  `dateline` int(10) unsigned NOT NULL default '0' COMMENT 'дата добавления',
			  `upddate` int(10) unsigned NOT NULL default '0' COMMENT 'дата обновления',
			  `deldate` int(10) unsigned NOT NULL default '0' COMMENT 'дата удаления',
			  PRIMARY KEY  (`".$name."id`)
		)".$charset;
		$db->query_write($sql);
	}
	
	public static function ElementTypeTableFieldList(CMSDatabase $db, $name){
		$tablename = CMSQCatalog::BuildElementTableName($name); 
		$sql = "SHOW COLUMNS FROM ".$tablename;
		return $db->query_read($sql);
	}

	public static function ElementTypeAppend(CMSDatabase $db, $obj){
		$sql = "
			INSERT INTO ".CMSQCatalog::$PFX."eltype
			(name, title, descript, fotouse) VALUES
			(
				'".bkstr($obj->nm)."',
				'".bkstr($obj->tl)."',
				'".bkstr($obj->dsc)."',
				'".bkint($obj->foto)."'
			)
		";
		$db->query_write($sql);
	}
	
	public static function ElementTypeSave(CMSDatabase $db, $obj){
		$sql = "
			UPDATE ".CMSQCatalog::$PFX."eltype
				SET 
					title='".bkstr($obj->tl)."',
					descript='".bkstr($obj->dsc)."'
			WHERE eltypeid=".bkint($obj->id)."
		";
		$db->query_write($sql);
	}
	
	const FIELD_ELEMENTTYPE = "
		eltypeid as id,
		title as tl,
		name as nm,
		descript as dsc,
		fotouse as foto,
		deldate as dd
	";
	
	public static function ElementTypeById(CMSDatabase $db, $id){
		$sql = "
			SELECT
				".CMSQCatalog::FIELD_ELEMENTTYPE." 
			FROM ".CMSQCatalog::$PFX."eltype
			WHERE eltypeid=".bkint($id)."
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function ElementTypeByName(CMSDatabase $db, $name){
		$sql = "
			SELECT 
				".CMSQCatalog::FIELD_ELEMENTTYPE." 
			FROM ".CMSQCatalog::$PFX."eltype
			WHERE name='".bkstr($name)."'
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function ElementTypeList(CMSDatabase $db){
		$sql = "
			SELECT 
				".CMSQCatalog::FIELD_ELEMENTTYPE." 
			FROM ".CMSQCatalog::$PFX."eltype
		";
		return $db->query_read($sql);
	}
	
	public static function ModuleManagerUpdate(CMSDatabase $db, $modmanid, $version){
		$sql = "
			UPDATE ".$db->prefix."ctg_module
			SET
				version='".$version."'
			WHERE moduleid=".$modmanid."
		";
		$db->query_write($sql);
	}
	
	public static function ModuleManagerAppend(CMSDatabase $db, CMSModule $modman){
		$sql = "
			INSERT INTO ".$db->prefix."ctg_module
			(name, dbprefix, version) VALUES (
				'".$modman->name."',
				'".$modman->catinfo['dbprefix']."',
				'0.0.0'
			)
		";
		$db->query_write($sql);
	}
	
	public static function ModuleManagerList(CMSDatabase $db){
		$sql = "
			SELECT 
				moduleid as id,
				name as nm,
				dbprefix as pfx,
				version as vs
			FROM ".$db->prefix."ctg_module
		";
		return $db->query_read($sql);
	}
	public static function BuildDictionaryTable($dictionaryName){
		return CMSQCatalog::$PFX."dict_".$dictionaryName;
	}
	
	public static function BuildElementTableName($elementName){
		return CMSQCatalog::$PFX."eltbl_".$elementName;
	}
	
	public static function BuilElementOptionFieldTable($elementName, $fieldName){
		return CMSQCatalog::$PFX."eltbl_".$elementName."_fld_".$fieldName;
	}
	
	/*
	public static function DictionaryRecycleClear(CMSDatabase $db){
		$sql = "
			SELECT name as nm
			FROM ".CMSQCatalog::$PFX."dict
			WHERE deldate>0
		";
		$rows = $db->query_read($sql);
		while (($row = $db->fetch_array($rows))){
			CMSQCatalog::DictionaryTableRemove($db, $row['nm']);
		}
		$sql = "
			DELETE FROM ".CMSQCatalog::$PFX."dict
			WHERE deldate>0
		";
		$db->query_write($sql);
	}
	
	public static function DictionaryRestore(CMSDatabase $db, $id){
		$sql = "
			UPDATE ".CMSQCatalog::$PFX."dict
			SET deldate=0
			WHERE dictid=".bkint($id)."
		";
		$db->query_write($sql);
	}
	
	public static function DictionaryRemove(CMSDatabase $db, $id){
		$sql = "
			UPDATE ".CMSQCatalog::$PFX."dict
			SET deldate=".TIMENOW."
			WHERE dictid=".bkint($id)."
		";
		$db->query_write($sql);
	}
	
	public static function DictionarySave(CMSDatabase $db, $obj){
		$sql = "
			UPDATE ".CMSQCatalog::$PFX."dict
				SET 
					title='".bkstr($obj->tl)."',
					descript='".bkstr($obj->dsc)."'
			WHERE dictid=".bkint($obj->id)."
		";
		$db->query_write($sql);
	}
	
	private static function DictionaryTableName(CMSDatabase $db, $id){
		$row = CMSQCatalog::DictionaryById($db, $id);
		$ret = new stdClass();
		$ret->name = $row['nm'];
		$ret->table = CMSQCatalog::BuildDictionaryTable($row['nm']); 
		return $ret;
	}

	public static function DictionaryTableValueRecycleClear(CMSDatabase $db, $obj){
		$dict = CMSQCatalog::DictionaryTableName($db, $obj->dictid);
		$sql = "
			DELETE FROM ".$dict->table."
			WHERE deldate>0
		";
		$db->query_write($sql);
	}
	
	public static function DictionaryTableValueRemove(CMSDatabase $db, $obj){
		$dict = CMSQCatalog::DictionaryTableName($db, $obj->dictid);
		$sql = "
			UPDATE ".$dict->table." SET deldate=".TIMENOW."
			WHERE ".$dict->name."id=".bkint($obj->id)."
		";
		$db->query_write($sql);
	}

	public static function DictionaryTableValueRestore(CMSDatabase $db, $obj){
		$dict = CMSQCatalog::DictionaryTableName($db, $obj->dictid);
		$sql = "
			UPDATE ".$dict->table." SET deldate=0
			WHERE ".$dict->name."id=".bkint($obj->id)."
		";
		$db->query_write($sql);
	}
	
	public static function DictionaryTableValueAppend(CMSDatabase $db, $obj){
		$dict = CMSQCatalog::DictionaryTableName($db, $obj->dictid);
		$sql = "
			INSERT INTO ".$dict->table."
			(name, title) VALUES
			(
				'".bkstr($obj->nm)."',
				'".bkstr($obj->tl)."'
			)
		";
		$db->query_write($sql);
	}

	public static function DictionaryTableValueSave(CMSDatabase $db, $obj){
		$dict = CMSQCatalog::DictionaryTableName($db, $obj->dictid);
		
		$sql = "
			UPDATE ".$dict->table."
				SET 
					title='".bkstr($obj->tl)."',
					name='".bkstr($obj->nm)."'
			WHERE ".$dict->name."id=".bkint($obj->id)."
		";
		$db->query_write($sql);
	}
	
	public static function DictionaryTableValueList(CMSDatabase $db, $dictid){
		$dict = CMSQCatalog::DictionaryTableName($db, $dictid);
		
		$sql = "
			SELECT 
				".$dict->name."id as id,
				title as tl, 
				name as nm
			FROM ".$dict->table."
		";
		return $db->query_read($sql);
	}
	
	public static function DictionaryTableRemove(CMSDatabase $db, $name){
		$tablename = CMSQCatalog::BuildDictionaryTable($name); 
		$sql = "DROP TABLE `".$tablename."`";
		$db->query_write($sql);
	}
	
	public static function DictionaryTableCreate(CMSDatabase $db, $name){
		$tablename = CMSQCatalog::BuildDictionaryTable($name);
		$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";

		$sql = "
			CREATE TABLE IF NOT EXISTS `".$tablename."` (
			  `".$name."id` int(10) unsigned NOT NULL auto_increment,
			  `title` varchar(250) NOT NULL default '',
			  `name` varchar(250) NOT NULL default '',
			  `dateline` int(10) unsigned NOT NULL default '0' COMMENT 'дата добавления',
			  `upddate` int(10) unsigned NOT NULL default '0' COMMENT 'дата обновления',
			  `deldate` int(10) unsigned NOT NULL default '0' COMMENT 'дата удаления',
			  PRIMARY KEY  (`".$name."id`)
		)".$charset;
		$db->query_write($sql);
	}
	
	public static function DictionaryAppend(CMSDatabase $db, $obj){
		$sql = "
			INSERT INTO ".CMSQCatalog::$PFX."dict
			(name, title, descript) VALUES
			(
				'".bkstr($obj->nm)."',
				'".bkstr($obj->tl)."',
				'".bkstr($obj->dsc)."'
			)
		";
		$db->query_write($sql);
	}
	
	public static function DictionaryById(CMSDatabase $db, $id){
		$sql = "
			SELECT 
				dictid as id,
				title as tl, 
				name as nm,
				descript as dsc 
			FROM ".CMSQCatalog::$PFX."dict
			WHERE dictid='".bkint($id)."'
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function DictionaryByName(CMSDatabase $db, $name){
		$sql = "
			SELECT 
				dictid as id,
				title as tl, 
				name as nm,
				descript as dsc 
			FROM ".CMSQCatalog::$PFX."dict
			WHERE name='".bkstr($name)."'
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function DictionaryList(CMSDatabase $db){
		$sql = "
			SELECT 
				dictid as id,
				title as tl,
				descript as dsc,
				name as nm
			FROM ".CMSQCatalog::$PFX."dict
		";
		return $db->query_read($sql);
	}
	/**/

	
}

?>