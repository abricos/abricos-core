<?php
/**
 * Обработчик глобальных переменных для безопасного использования
 * 
 * Рекомендуется обращаться к переменным $_POST, $_GET, $_REQUEST и т.п. не 
 * на прямую, а через этот обработчик {@link Ab_CoreInputCleaner::clean_gpc()}. 
 * Это позволит обезопасить их от возможных атак.
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Core
 * @link http://abricos.org
 * @copyright Copyright (C) 2008-2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
class Ab_CoreInputCleaner {
	
	/**
	 * Get,Post,Cookie
	 *
	 * @var array
	 */
	public $GPC = array();
	
	private $shortvars = array();

	private $superglobal_lookup = array(
		'g' => '_GET',
		'p' => '_POST',
		'r' => '_REQUEST',
		'c' => '_COOKIE',
		's' => '_SERVER',
		'e' => '_ENV',
		'f' => '_FILES'
	);

	public function __construct() {
		if (!is_array($GLOBALS)) {
			die('<strong>Fatal Error:</strong> Invalid URL.');
		}
	
		if (function_exists('get_magic_quotes_gpc')) {
			if (get_magic_quotes_gpc()){
				$this->stripslashes_deep($_REQUEST);
				$this->stripslashes_deep($_GET);
				$this->stripslashes_deep($_POST);
				$this->stripslashes_deep($_COOKIE);
	
				if (is_array($_FILES)) {
					foreach ($_FILES AS $key => $val) {
						$_FILES["$key"]['tmp_name'] = str_replace('\\', '\\\\', $val['tmp_name']);
					}
					$this->stripslashes_deep($_FILES);
				}
			}
		}

		foreach (array('_GET', '_POST') AS $arrayname) {
			if (isset($GLOBALS["$arrayname"]['do'])){
				$GLOBALS["$arrayname"]['do'] = trim($GLOBALS["$arrayname"]['do']);
			}
			$this->convert_shortvars($GLOBALS["$arrayname"]);
		}

		if (@ini_get('register_globals') OR !@ini_get('gpc_order')){
			foreach ($this->superglobal_lookup AS $arrayname){

				foreach (array_keys($GLOBALS["$arrayname"]) AS $varname){
					if (!in_array($varname, $this->superglobal_lookup)){
						unset($GLOBALS["$varname"]);
					}
				}
			}
		}
		
		// deal with cookies that may conflict with _GET and _POST data, and create our own _REQUEST with no _COOKIE input
		foreach (array_keys($_COOKIE) AS $varname) {
			unset($_REQUEST["$varname"]);
			if (isset($_POST["$varname"])) {
				$_REQUEST["$varname"] =& $_POST["$varname"];
			} else if (isset($_GET["$varname"])) {
				$_REQUEST["$varname"] =& $_GET["$varname"];
			}
		}
	}

	/**
	 * 
	 * @ignore
	 */
	private function &clean_array(&$source, $variables) {
		$return = array();

		foreach ($variables AS $varname => $vartype) {
			$return["$varname"] =& $this->clean($source["$varname"], $vartype, isset($source["$varname"]));
		}
		return $return;
	}

	/**
	 * Makes GPC variables safe to use
	 *
	 * @param	string	Either, g, p, c, r or f (corresponding to get, post, cookie, request and files)
	 * @param	array	Array of variable names and types we want to extract from the source array
	 *
	 * @return	array
	 * @ignore
	 */
	private function clean_array_gpc($source, $variables) {
		$sg =& $GLOBALS[$this->superglobal_lookup["$source"]];

		foreach ($variables AS $varname => $vartype) {
			if (!isset($this->GPC["$varname"])){
				$this->GPC["$varname"] =& $this->clean(
				$sg["$varname"],
				$vartype,
				isset($sg["$varname"])
				);
			}
		}
	}

	/**
	 * Обработать глобальную переменную для безопасного использования
	 *   
	 * Например:
	 * <code>
	 * $p_act = Abricos::CleanGPC('p', 'act', TYPE_STR);
	 * </code>
	 * 
	 * @param string $source Тип глобальной переменной g, p, c, r or f (соответственно GET, POST, COOKIE, REQUEST и FILES)
	 * @param string $varname Имя переменной
	 * @param integer $vartype Тип переменной
	 */
	function &clean_gpc($source, $varname, $vartype = TYPE_NOCLEAN) 	{
		if (!isset($this->GPC["$varname"])) {
			$sg =& $GLOBALS[$this->superglobal_lookup["$source"]];
			$this->GPC["$varname"] =& $this->clean($sg["$varname"], $vartype, isset($sg["$varname"]));
		}

		return $this->GPC["$varname"];
	}

	/**
	 * 
	 * @ignore
	 */
	private function &clean(&$var, $vartype = TYPE_NOCLEAN, $exists = true)	{
		if ($exists) {
			if ($vartype < TYPE_CONVERT_SINGLE){
				$this->do_clean($var, $vartype);
			}else if (is_array($var)){
				if ($vartype >= TYPE_CONVERT_KEYS){
					$var = array_keys($var);
					$vartype -=  TYPE_CONVERT_KEYS;
				}else{
					$vartype -= TYPE_CONVERT_SINGLE;
				}
				foreach (array_keys($var) AS $key){
					$this->do_clean($var["$key"], $vartype);
				}
			}else{
				$var = array();
			}
			return $var;
		} else {
			if ($vartype < TYPE_CONVERT_SINGLE){
				switch ($vartype) {
					case TYPE_INT:
					case TYPE_UINT:
					case TYPE_NUM:
					case TYPE_UNUM:
					case TYPE_UNIXTIME:{ $var = 0; break; }
					case TYPE_STR:
					case TYPE_NOHTML:
					case TYPE_NOTRIM:{ $var = ''; break; }
					case TYPE_BOOL:{ $var = 0; break; }
					case TYPE_ARRAY:
					case TYPE_FILE:{ $var = array(); break; }
					case TYPE_NOCLEAN:{ $var = null; break; }
					default: { $var = null; }
				}
			} else {
				$var = array();
			}
			return $var;
		}
	}

	/**
	 * 
	 * @ignore
	 */
	private function &do_clean(&$data, $type) {
		static $booltypes = array('1', 'yes', 'y', 'true');
		switch ($type) {
			case TYPE_INT:    $data = intval($data);                                   break;
			case TYPE_UINT:   $data = ($data = intval($data)) < 0 ? 0 : $data;         break;
			case TYPE_NUM:    $data = strval($data) + 0;                               break;
			case TYPE_UNUM:   $data = strval($data);
											  ($data < 0) ? 0 : $data;                                 break;
			case TYPE_STR:    $data = trim(strval($data));                             break;
			case TYPE_NOTRIM: $data = strval($data);                                   break;
			case TYPE_NOHTML: $data = htmlspecialchars_uni(trim(strval($data)));       break;
			case TYPE_BOOL:   $data = in_array(strtolower($data), $booltypes) ? 1 : 0; break;
			case TYPE_ARRAY:  $data = (is_array($data)) ? $data : array();             break;
			case TYPE_STRUTF:	$data = trim(strval($data));                             break;
			
			case TYPE_FILE: {
				if (is_array($data)) {
					if (is_array($data['name'])) {
						$files = count($data['name']);
						for ($index = 0; $index < $files; $index++) {
							$data['name']["$index"] = trim(strval($data['name']["$index"]));
							$data['type']["$index"] = trim(strval($data['type']["$index"]));
							$data['tmp_name']["$index"] = trim(strval($data['tmp_name']["$index"]));
							$data['error']["$index"] = intval($data['error']["$index"]);
							$data['size']["$index"] = intval($data['size']["$index"]);
						}
					} else {
						$data['name'] = trim(strval($data['name']));
						$data['type'] = trim(strval($data['type']));
						$data['tmp_name'] = trim(strval($data['tmp_name']));
						$data['error'] = intval($data['error']);
						$data['size'] = intval($data['size']);
					}
				} else {
					$data = array (
						'name'     => '',
						'type'     => '',
						'tmp_name' => '',
						'error'    => 0,
						'size'     => 4
					);
				}
				break;
			}
		}
		return $data;
	}

	/**
	 * 
	 * @ignore
	 */
	private function stripslashes_deep(&$value) {
	    static $recursive_counter = 0;
	    if (++$recursive_counter > 1000) {
	        die('possible deep recursion attack');
	    }
		if (is_array($value)) {
			foreach ($value AS $key => $val)  {
				if (is_string($val)) {
					$value["$key"] = stripslashes($val);
				} else if (is_array($val)) {
					$this->stripslashes_deep($value["$key"]);
				}
			}
		}
    	$recursive_counter--;
	}

	/**
	 * 
	 * @ignore
	 */
	private function convert_shortvars(&$array) {
		// extract long variable names from short variable names
		foreach ($this->shortvars AS $shortname => $longname) {
			if (isset($array["$shortname"]) AND !isset($array["$longname"])) {
				$array["$longname"] =& $array["$shortname"];
				$GLOBALS['_REQUEST']["$longname"] =& $array["$shortname"];
			}
		}
	}

	/**
	 * 
	 * @ignore
	 */
	private function strip_sessionhash(&$string) {
		$string = preg_replace('/(s|sessionhash)=[a-z0-9]{32}?&?/', '', $string);
		return $string;
	}

}

define('TYPE_BOOL',     1);
define('TYPE_INT',      2);
define('TYPE_UINT',     3);
define('TYPE_NUM',      4);
define('TYPE_UNUM',     5);
define('TYPE_UNIXTIME', 6);
define('TYPE_STR',      7);
define('TYPE_NOTRIM',   8);
define('TYPE_NOHTML',   9);
define('TYPE_ARRAY',   10);
define('TYPE_FILE',    11);
define('TYPE_STRUTF',	12);

define('TYPE_ARRAY_BOOL',     101);
define('TYPE_ARRAY_INT',      102);
define('TYPE_ARRAY_UINT',     103);
define('TYPE_ARRAY_NUM',      104);
define('TYPE_ARRAY_UNUM',     105);
define('TYPE_ARRAY_UNIXTIME', 106);
define('TYPE_ARRAY_STR',      107);
define('TYPE_ARRAY_NOTRIM',   108);
define('TYPE_ARRAY_NOHTML',   109);
define('TYPE_ARRAY_ARRAY',    110);
define('TYPE_ARRAY_FILE',     11);  

define('TYPE_ARRAY_KEYS_INT', 202);

define('TYPE_CONVERT_SINGLE', 100); 
define('TYPE_CONVERT_KEYS',   200); 

?>