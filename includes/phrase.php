<?php
/**
 * Фраза
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Core
 * @copyright Copyright (C) 2008-2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
class Ab_CorePhraseItem {
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
	
	public function Ab_CorePhraseItem($moduleName, $name, $value){
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
 * Загружает запрашиваемые фразы из базы. Если фраза в базе не найден, создает ее
 * из значения по умолчанию.
 *  
 * @package Abricos
 * @subpackage Core
 */
class Ab_CorePhrase {
	
	private static $_instance = null;
	
	/**
	 * @return Ab_CorePhrase
	 */
	public static function GetInstance(){
		if (is_null(Ab_CorePhrase::$_instance)){
			Ab_CorePhrase::$_instance = new Ab_CorePhrase();
		}
		return Ab_CorePhrase::$_instance;
	}
	
	/**
	 * Ядро
	 *
	 * @var Abricos
	 */
	public $registry = null;
	
	private $arr = array();
	
	/**
	 * Конструктор
	 */
	public function __construct(){
		$this->registry = Abricos::$instance;
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
		$rows = Ab_CoreQuery::PhraseListByModule($db, $module);
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
		$rows = Ab_CoreQuery::PhraseList($db, $list);
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
			$phrase = new Ab_CorePhraseItem($row['mnm'], $row['nm'], $row['ph']);
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
		
		$cfg = Abricos::$config['phrase'];
		if (!empty($cfg) && !empty($cfg[$modname]) && isset($cfg[$modname][$name])){
			return $cfg[$modname][$name];
		}
		
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
				$phrase = Ab_CoreQuery::Phrase($this->registry->db, $modname, $name);
			if (empty($phrase)){
				$item = new Ab_CorePhraseItem($modname, $name, $value);
				$item->isnew = true;
				$this->arr[$key] = $item;
			}else{
				$item = new Ab_CorePhraseItem($modname, $name, $phrase['ph']);
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
			Ab_CoreQuery::PhraseListAppend($this->registry->db, $arrnew);
		}
		if (!empty($arrupdate)){
			Ab_CoreQuery::PhraseListUpdate($this->registry->db, $arrupdate);
		}
	}
}

/**
 * Устарел, оставлен для совместимости
 * 
 * @package Abricos
 * @subpackage Deprecated
 * @deprecated устарел начиная с версии 0.5.5, необходимо использовать {@link Ab_CorePhraseItem}
 * @ignore
 */
final class CMSSysPhraseItem extends Ab_CorePhraseItem {
}

/**
 * Устарел, оставлен для совместимости
 * 
 * @package Abricos
 * @subpackage Deprecated
 * @deprecated устарел начиная с версии 0.5.5, необходимо использовать {@link Ab_CorePhrase}
 * @ignore
 */
final class CMSSysPhrase extends Ab_CorePhrase {
}

?>