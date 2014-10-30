<?php
/**
 * Менеджер обновлений модуля
 * 
 * Когда происходит инсталяция или измнение версии модуля, вызывается 
 * скрипт модуля includes/shema.php.
 * В этот момент экземпляр класса менеджера обновлений 
 * {@link Ab_UpdateManager}::{@link Ab_UpdateManager::$current $current}
 * настроен на работу именно с этим модулем. 
 * Это делает удобным процесс сопровождение новых версий модуля.
 * 
 * @example modules/example/includes/shema.php
 * @version $Id$
 * @package Abricos
 * @subpackage Core
 * @link http://abricos.org
 * @copyright Copyright (C) 2008-2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
class Ab_UpdateManager {
	
	/**
	 * В момент инсталяции/обновления модуля содержит экземляр менеджера 
	 * обновлений для этого модуля
	 * 
	 * @var Ab_UpdateManager
	 */
	public static $current = null;
	
	public static $isCoreInstall = false; 
	
	/**
	 * Текущий модуль
	 *
	 * @var Ab_Module
	 */
	public $module;
	
	/**
	 * Версия модуля установленного на сервере
	 * 
	 * Строка будет пустой, если модуль до этого момента небыл установлен на сервер
	 * 
	 * @var string 
	 */
	public $serverVersion = "";
	
	
	/**
	 * Информация о модуле установленного на сервере
	 * 
	 * @var array
	 */
	public $modinfo;
	
	private $_isInstall = null;
	
	/**
	 * Конструктор
	 * 
	 * @param Ab_Module $module
	 * @param Array $info
	 * @ignore
	 */
	public function __construct($module, $info){
		$this->module = $module;
		$this->modinfo = $info;
		$this->serverVersion = $info['version'];
	}
	
	/**
	 * Проверка на необходимость выполнение инсталляции этой версии модуля
	 * 
	 * Например:
	 * <code>
	 * if ( Abricos::$instance->modules->updateManager->isInstall()){
	 *  ...
	 * }
	 * </code>
	 * 
	 * @return boolean true - модуль будет инсталирован в платформу Абрикос, false - обновлен до текущей версии
	 */
	public function isInstall(){
		if (!is_null($this->_isInstall)){ return $this->_isInstall; }
		$aSV = Ab_UpdateManager::ParseVersion($this->serverVersion);
		$cnt = count($aSV);
		for ($i=0;$i<$cnt;$i++){
			if ($aSV[$i]>0){
				$this->_isInstall = false;
				return false;
			}
		}
		$this->_isInstall = true;
		return true;
	}
	
	/**
	 * Является ли запрашиваемая версия $version больше версии модуля установленного на сервере 
	 *  
	 * Например:
	 * <code>
	 * if (Abricos::$instance->modules->updateManager->isUpdate('0.2.7')){
	 *  ...
	 * }
	 * </code>
	 * 
	 * @param string $version
	 * @return Boolean
	 */
	public function isUpdate($version){
		$cmp = Ab_UpdateManager::CompareVersion($this->serverVersion, $version);
		return $cmp > 0;
	}
	
	/**
	 * Сравнить версии
	 * 
	 * @param string $version1
	 * @param string $version2
	 * 
	 * @return integer Если $version1<$version2 вернет -1, $version1>$version2 вернет 1, $version1==$version2 вернет 0 
	 */
	public static function CompareVersion($version1, $version2){
		$av1 = Ab_UpdateManager::ParseVersion($version1);
		$av2 = Ab_UpdateManager::ParseVersion($version2);
		$cnt = max(count($av1), count($av2));
		for ($i=0;$i<$cnt;$i++){
			if ($av2[$i] > $av1[$i]){
				return 1;
			}else if ($av2[$i] < $av1[$i]){
				return -1;
			}
		}
		return 0;
	}
	
	public static function ParseVersion($version){
		$arr = explode(".", $version);
		$retarr = array();
		foreach ($arr as $s){
			array_push($retarr,  Ab_UpdateManager::str2int($s));
		}
		$count = count($retarr);
		for ($i=$count;$i<7;$i++){
			array_push($retarr, 0);
		}
		return $retarr;
	}
	
	private static function str2int($string, $concat = true) {
		$length = strlen($string);   
		for ($i = 0, $int = '', $concat_flag = true; $i < $length; $i++) {
			if (is_numeric($string[$i]) && $concat_flag) {
				$int .= $string[$i];
			} elseif(!$concat && $concat_flag && strlen($int) > 0) {
				$concat_flag = false;
			}       
		}
		return (int) $int;
	}
}
