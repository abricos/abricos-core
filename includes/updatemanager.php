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
		$aSV = $this->ParseVersion($this->serverVersion);
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
		$aSV = $this->ParseVersion($this->serverVersion);
		$aNV = $this->ParseVersion($version);
		$cnt = count($aSV);
		for ($i=0;$i<$cnt;$i++){
			if ($aNV[$i] > $aSV[$i]){
				return true;
			}else if ($aNV[$i] < $aSV[$i]){
				return false;
			}
		}
		return false;
	}
	
	private function ParseVersion($version){
		$arr = explode(".", $version);
		$retarr = array();
		foreach ($arr as $s){
			array_push($retarr, $this->str2int($s));
		}
		$count = count($retarr);
		for ($i=$count;$i<7;$i++){
			array_push($retarr, 0);
		}
		return $retarr;
	}
	
	private function str2int($string, $concat = true) {
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


/* * * * * * * * * * * Устаревшии версии классов * * * * * * * * * * * */

/**
 * Устарел, оставлен для совместимости
 * 
 * @package Abricos
 * @subpackage Deprecated
 * @deprecated устарел начиная с версии 0.5.5, необходимо использовать {@link AbricosAdress}
 * @ignore
 */
class CMSUpdateManager  extends Ab_UpdateManager {
}
