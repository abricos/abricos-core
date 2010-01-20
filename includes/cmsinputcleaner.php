<?php
/**
* @version $Id$
* @package Abricos
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

class CMSInputCleaner extends CMSBaseClass {
	public $shortvars = array();

	public $superglobal_lookup = array(
		'g' => '_GET',
		'p' => '_POST',
		'r' => '_REQUEST',
		'c' => '_COOKIE',
		's' => '_SERVER',
		'e' => '_ENV',
		'f' => '_FILES'
	);

	public $scriptpath = '';

	/**
	 * Enter description here...
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;

	/**
	 * Enter description here...
	 *
	 * @param CMSRegistry $registry
	 * @return CMSInputCleaner
	 */
	public function CMSInputCleaner(CMSRegistry $registry) {
		$this->registry = $registry;

		if (!is_array($GLOBALS)) {
			die('<strong>Fatal Error:</strong> Invalid URL.');
		}

		if (function_exists('get_magic_quotes_gpc') && -1 == version_compare(PHP_VERSION, '5.2.99')) {
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
			set_magic_quotes_runtime(0);
			@ini_set('magic_quotes_sybase', 0);
		}

		foreach (array('_GET', '_POST') AS $arrayname) {
			if (isset($GLOBALS["$arrayname"]['do'])){
				$GLOBALS["$arrayname"]['do'] = trim($GLOBALS["$arrayname"]['do']);
			}
			$this->convert_shortvars($GLOBALS["$arrayname"]);
		}

		if (@ini_get('register_globals') OR !@ini_get('gpc_order')){
			foreach ($this->superglobal_lookup AS $arrayname){
				// $registry->superglobal_size["$arrayname"] = sizeof($GLOBALS["$arrayname"]);

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

	function &clean_array(&$source, $variables) {
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
	*/
	function clean_array_gpc($source, $variables) {
		$sg =& $GLOBALS[$this->superglobal_lookup["$source"]];

		foreach ($variables AS $varname => $vartype) {
			if (!isset($this->registry->GPC["$varname"])){
				$this->registry->GPC["$varname"] =& $this->clean(
				$sg["$varname"],
				$vartype,
				isset($sg["$varname"])
				);
			}
		}
	}

	function &clean_gpc($source, $varname, $vartype = TYPE_NOCLEAN) 	{
		if (!isset($this->registry->GPC["$varname"])) {
			$sg =& $GLOBALS[$this->superglobal_lookup["$source"]];
			$this->registry->GPC["$varname"] =& $this->clean($sg["$varname"],	$vartype,isset($sg["$varname"]));
		}

		return $this->registry->GPC["$varname"];
	}

	function &clean(&$var, $vartype = TYPE_NOCLEAN, $exists = true)	{
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

	function &do_clean(&$data, $type) {
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
			//case TYPE_STRUTF:	$data = iconv("UTF-8", "Windows-1251", trim(strval($data))); break;
			case TYPE_STRUTF:	$data = trim(strval($data));                             break;
			
			case TYPE_FILE:
				{
					// perhaps redundant :p
					if (is_array($data))
					{
						if (is_array($data['name']))
						{
							$files = count($data['name']);
							for ($index = 0; $index < $files; $index++)
							{
								$data['name']["$index"] = trim(strval($data['name']["$index"]));
								$data['type']["$index"] = trim(strval($data['type']["$index"]));
								$data['tmp_name']["$index"] = trim(strval($data['tmp_name']["$index"]));
								$data['error']["$index"] = intval($data['error']["$index"]);
								$data['size']["$index"] = intval($data['size']["$index"]);
							}
						}
						else
						{
							$data['name'] = trim(strval($data['name']));
							$data['type'] = trim(strval($data['type']));
							$data['tmp_name'] = trim(strval($data['tmp_name']));
							$data['error'] = intval($data['error']);
							$data['size'] = intval($data['size']);
						}
					}
					else
					{
						$data = array(
						'name'     => '',
						'type'     => '',
						'tmp_name' => '',
						'error'    => 0,
						'size'     => 4, // UPLOAD_ERR_NO_FILE
						);
					}
					break;
				}
		}

		return $data;
	}

	function stripslashes_deep(&$value) {
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

	function convert_shortvars(&$array) {
		// extract long variable names from short variable names
		foreach ($this->shortvars AS $shortname => $longname) {
			if (isset($array["$shortname"]) AND !isset($array["$longname"])) {
				$array["$longname"] =& $array["$shortname"];
				$GLOBALS['_REQUEST']["$longname"] =& $array["$shortname"];
			}
		}
	}

	function strip_sessionhash(&$string) {
		$string = preg_replace('/(s|sessionhash)=[a-z0-9]{32}?&?/', '', $string);
		return $string;
	}

}

?>