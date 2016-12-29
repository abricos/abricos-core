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
 * Class Ab_Cache
 */
abstract class Ab_Cache {

    protected $_cache = array();

    public function CacheClear(){
        $this->_cache = array();
    }

    public function CacheExists(){
        $count = func_num_args();
        $cache = $this->_cache;
        for ($i = 0; $i < $count; $i++){
            $arg = func_get_arg($i);
            if (!isset($cache[$arg])){
                return false;
            }
            $cache = $cache[$arg];
        }

        return !empty($cache);
    }

    public final function Cache(){
        $count = func_num_args();
        $cache = $this->_cache;
        for ($i = 0; $i < $count; $i++){
            $arg = func_get_arg($i);
            if (!isset($cache[$arg])){
                return null;
            }
            $cache = $cache[$arg];
        }
        return $cache;
    }

    public final function SetCache(){
        $count = func_num_args();
        $cache = &$this->_cache;
        if ($count < 2){
            throw new Exception('Invalid param in SetCache');
        }

        for ($i = 0; $i < $count - 1; $i++){
            $arg = func_get_arg($i);
            if (!isset($cache[$arg])){
                $cache[$arg] = array();
            }
            $cache = &$cache[$arg];
        }
        $cache = func_get_arg($count - 1);
        return func_get_arg($count - 1);
    }
}
