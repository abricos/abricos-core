<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

class CMSSysPhraseItem {
	public $module = "";
	public $name = "";
	public $value = "";
	
	/**
	 * Идентификатор фразы в БД
	 *
	 * @var integer
	 */
	public $id = "";
	
	public $isnew = false;
	public $isupdate = false;
	
	public function __construct($moduleName, $name, $value){
		$this->module = $moduleName;
		$this->name = $name;
		$this->value = $value;
	}
	
	public function &GetArray(){
		$ret = array();
		$ret['id'] = $this->id;
		$ret['mnm'] = $this->module;
		$ret['nm'] = $this->name;
		$ret['ph'] = $this->value;
		return $ret;
	}
}

/**
 * Менеджер управления фразами.
 */
class CMSSysPhrase extends CMSBaseClass {
	
	/**
	 * Ядро
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	private $arr = array();
	
	/**
	 * Конструктор
	 *
	 * @param CMSRegistry $registry ядро движка
	 * @param mixed $list
	 */
	public function __construct(CMSRegistry $registry){
		$this->registry = $registry;
	}
	
	/**
	 * Возвращает массив загруженных фраз модуля
	 *
	 * @param string $module название модуля
	 */
	public function &GetArray($module){
		$ret = array();
		foreach ($this->arr as $phrase){
			if ($phrase->module != $module){
				continue;
			}
			array_push($ret, $phrase->GetArray());
		}
		return $ret;
	}
	
	/**
	 * Пакетная загрузка фраз по имени модуля
	 *
	 * @param string $module имя модуля
	 */
	public function PreloadByModule($module){
		$db = $this->registry->db;
		$rows = CMSQSys::PhraseListByModule($db, $module);
		$this->_preload($rows);
	}
	
	/**
	 * Пакетная загрузка фраз
	 *
	 * @param array $list
	 */
	public function Preload($list){
		$db = $this->registry->db;
		$rows = CMSQSys::PhraseList($db, $list);
		$this->_preload($rows);
	}
	
	private function _preload($rows){
		// сохранение текущих фраз
		$this->Save();
		
		$db = $this->registry->db;
		while (($row = $db->fetch_array($rows))){
			$key = $row['mnm'].":".$row['nm'];
			if (empty($this->arr[$key])){
				$phrase = new CMSSysPhraseItem($row['mnm'], $row['nm'], $row['ph']);
				$phrase->id = $row['id'];
				$this->arr[$key] = $phrase;
			}
		}
	}

	/**
	 * Получить фразу.
	 * Если фразы в базе нет, то она будет создана со значением $value
	 *
	 * @param string $modname
	 * @param string $name
	 * @param string $value 
	 */
	public function Get($modname, $name, $value = ""){
		$phrase = $this->GetPhraseItem($modname, $name, $value);
		return $phrase->value;
	}
	
	private function GetPhraseItem($modname, $name, $value = ""){
		$key = $modname.":".$name;
		if (empty($this->arr[$key])){
			// возможно эта фраза не была выбрана из БД, проверочный запрос
			$phrase = CMSQSys::Phrase($this->registry->db, $modname, $name);
			if (empty($phrase)){
				$item = new CMSSysPhraseItem($modname, $name, $value);
				$item->isnew = true;
				$this->arr[$key] = $item;
			}else{
				$item = new CMSSysPhraseItem($modname, $name, $phrase['ph']);
				$item->id = $row['id'];
				$this->arr[$key] = $item;
			}
		}
		return $this->arr[$key];
	}
	
	public function Set($modname, $name, $value){
		$phrase = $this->GetPhraseItem($modname, $name, $value);
		if ($phrase->value != $value){
			$phrase->value = $value;
			$phrase->isupdate = true;
		}
	}
	
	/**
	 * Сохранение фраз в базу
	 *
	 */
	public function Save(){
		$arrnew = array();
		$arrupdate = array();
		foreach ($this->arr as $phrase){
			if ($phrase->isnew){
				array_push($arrnew, $phrase);
			}else if ($phrase->isupdate){
				array_push($arrupdate, $phrase);
			}
			$phrase->isnew = false;
			$phrase->isupdate = false;
		}
		if (!empty($arrnew)){
			CMSQSys::PhraseListAppend($this->registry->db, $arrnew);
		}
		if (!empty($arrupdate)){
			CMSQSys::PhraseListUpdate($this->registry->db, $arrupdate);
		}
	}
}

?>