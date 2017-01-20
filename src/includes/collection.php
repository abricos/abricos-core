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
 * Class AbricosItem
 */
class AbricosItem {
    public $id;

    public function __construct($d){
        $this->id = isset($d['id']) ? $d['id'] : '';
    }

    public function ToJSON(){
        $ret = new stdClass();
        $ret->id = $this->id;
        return $ret;
    }

    /**
     * @deprecated
     */
    public function ToAJAX(){
        return $this->ToJSON();
    }
}

class AbricosList {

    protected $_list = array();
    protected $_map = array();
    protected $_ids = array();

    protected $isCheckDouble = false;

    public function __construct(){
        $this->_list = array();
        $this->_map = array();
    }

    public function Add($item){
        if (empty($item)){
            return;
        }

        if ($this->isCheckDouble){
            $checkItem = $this->Get($item->id);
            if (!empty($checkItem)){
                return;
            }
        }

        $index = count($this->_list);
        $this->_list[$index] = $item;
        $this->_map[$item->id] = $index;

        $this->_ids[] = $item->id;
    }

    /**
     * Массив идентификаторов
     */
    public function Ids(){
        return $this->_ids;
    }

    public function Count(){
        return count($this->_list);
    }

    /**
     * @param integer $index
     * @return AbricosItem
     */
    public function GetByIndex($index){
        return $this->_list[$index];
    }

    /**
     * @param mixed $id
     * @return AbricosItem || null
     */
    public function Get($id){
        if (!array_key_exists($id, $this->_map)){
            return null;
        }
        $index = $this->_map[$id];
        return $this->_list[$index];
    }

    public function GetBy($name, $value){
        $count = $this->Count();
        for ($i = 0; $i < $count; $i++){
            $item = $this->GetByIndex($i);
            if (isset($item->$name) && $item->$name === $value){
                return $item;
            }
        }
        return null;
    }

    /**
     * @param object|null $ret
     * @return object
     */
    public function ToJSON(){

        if (func_num_args() === 0){
            $ret = new stdClass();
        }else{
            $ret = func_get_arg(0);
        }

        $list = array();
        $count = $this->Count();
        for ($i = 0; $i < $count; $i++){
            $list[] = $this->GetByIndex($i)->ToJSON();
        }

        $ret->list = $list;

        return $ret;
    }

    /**
     * @deprecated
     */
    public function ToAJAX(){
        $list = array();
        $count = $this->Count();
        for ($i = 0; $i < $count; $i++){
            $list[] = $this->GetByIndex($i)->ToAJAX();
        }

        $ret = new stdClass();
        $ret->list = $list;

        return $ret;
    }
}
