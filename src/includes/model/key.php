<?php
/**
 * @package Abricos
 * @subpackage Core
 * @copyright 2008-2016 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @link http://abricos.org
 */

/**
 * Class Ab_Key
 */
class Ab_Key {

    /**
     * @var string
     */
    public $module;

    /**
     * @var string
     */
    public $name;

    public function __construct($module, $name){
        $this->module = trim($module);
        $this->name = trim($name);
    }

    public function ToString(){
        return $this->module.".".$this->name;
    }
}

class Ab_Keys {

    protected $_cache;

    public function __construct(){
        $this->_cache = array();
    }

    /**
     * @param string $module
     * @param null $name (optional)
     * @return Ab_Key
     */
    public function Get($module, $name = null){
        if ($module instanceof Ab_Key){
            return $module;
        }

        if (is_array($module)){
            $name = $module[1];
            $module = $module[0];
        } else if (empty($name)){
            $a = explode(".", $module);
            $module = $a[0];
            $name = $a[1];
        }

        if (isset($this->_cache[$module][$name])){
            return $this->_cache[$module][$name];
        }

        if (!isset($this->_cache[$module])){
            $this->_cache[$module] = array();
        }
        return $this->_cache[$module][$name] = new Ab_Key($module, $name);
    }
}
