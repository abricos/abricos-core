<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage Sys
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

/**
 * Элементы фразы
 * @package Abricos
 * @subpackage Sys
 */
class CMSSysPhraseItem {
	public $module = "";
	public $name = "";
	public $value = "";
	
	/**
	 * Идентификатор фразы в таблице БД
	 * @var integer
	 */
	public $id = "";
	
	/**
	 * Флаг определяющий является ли фраза новой
	 * @var bool
	 */
	public $isnew = false;
	
	/**
	 * Флаг определяющий была ли изменена фраза
	 * @var bool
	 */
	public $isupdate = false;
	
	public function CMSSysPhraseItem($moduleName, $name, $value){
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
 * Менеджер управления фразами
 * 
 * Задача класса загружать запрашиваемые фразы. Если фразы в базе 
 * не найдены, то создание их и сохранение со значениями по умолчанию 
 * @package Abricos
 * @subpackage Sys
 */
class CMSSysPhrase {
	
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
		$rows = CoreQuery::PhraseListByModule($db, $module);
		$this->_preload($rows);
		$this->Save();
	}
	
	/**
	 * Пакетная загрузка фраз. Если фразы не нейдены в базе, то создание их со значениями
	 * по умолчанию и сохранение
	 *
	 * @param array $list список фраз
	 */
	public function Preload($list){
		$db = $this->registry->db;
		$rows = CoreQuery::PhraseList($db, $list);
		$this->_preload($rows);
		foreach ($list as $key=>$value){
			$sa = explode(":", $key);
			if (count($sa) != 2){ continue; }
			$this->Get($sa[0], $sa[1], $value, false);
		}
		$this->Save();
	}
	
	private function _preload($rows){
		$db = $this->registry->db;
		while (($row = $db->fetch_array($rows))){
			$key = $row['mnm'].":".$row['nm'];
			$phrase = new CMSSysPhraseItem($row['mnm'], $row['nm'], $row['ph']);
			$phrase->id = $row['id'];
			$this->arr[$key] = $phrase;
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
	public function Get($modname, $name, $value = "", $checkindb = true){
		$phrase = $this->GetPhraseItem($modname, $name, $value, $checkindb);
		return $phrase->value;
	}
	
	/**
	 * Получить фразу
	 * 
	 * @var string $modname имя модуля
	 * @var string $name имя фразы
	 * @var string $value значение по умолчанию 
	 * @var string $checkindb если true, то загружать фразу из БД
	 */
	private function GetPhraseItem($modname, $name, $value = "", $checkindb = true){
		$key = $modname.":".$name;
		if (empty($this->arr[$key])){
			$phrase = null;
			// возможно эта фраза не была выбрана из БД, проверочный запрос
			if ($checkindb)
				$phrase = CoreQuery::Phrase($this->registry->db, $modname, $name);
			if (empty($phrase)){
				$item = new CMSSysPhraseItem($modname, $name, $value);
				$item->isnew = true;
				$this->arr[$key] = $item;
			}else{
				$item = new CMSSysPhraseItem($modname, $name, $phrase['ph']);
				$item->id = $phrase['id'];
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
			CoreQuery::PhraseListAppend($this->registry->db, $arrnew);
		}
		if (!empty($arrupdate)){
			CoreQuery::PhraseListUpdate($this->registry->db, $arrupdate);
		}
	}
}

?>