<?php

/**
 * @package Abricos
 * @subpackage Core
 * @link http://abricos.org
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
class AbricosItem {
    public $id;

    public function __construct($d) {
        $this->id = intval($d['id']);
    }

    public function ToAJAX() {
        $ret = new stdClass();
        $ret->id = $this->id;
        return $ret;
    }
}

class AbricosList {

    /**
     * @var AbricosListConfig
     */
    public $config;

    public $classConfig = AbricosListConfig;

    protected $_list = array();
    protected $_map = array();
    protected $_ids = array();

    protected $isCheckDouble = false;

    public function __construct($config = null) {
        $this->_list = array();
        $this->_map = array();
        if (empty($config)) {
            $config = new $this->classConfig();
        }
        $this->config = $config;
    }

    public function Add($item) {
        if (empty($item)) {
            return;
        }

        if ($this->isCheckDouble) {
            $checkItem = $this->Get($item->id);
            if (!empty($checkItem)) {
                return;
            }
        }

        $index = count($this->_list);
        $this->_list[$index] = $item;
        $this->_map[$item->id] = $index;

        array_push($this->_ids, $item->id);
    }

    /**
     * Массив идентификаторов
     */
    public function Ids() {
        return $this->_ids;
    }

    public function Count() {
        return count($this->_list);
    }

    /**
     * @param integer $index
     * @return AbricosItem
     */
    public function GetByIndex($index) {
        return $this->_list[$index];
    }

    /**
     * @param integer $id
     * @return AbricosItem
     */
    public function Get($id) {
        $index = $this->_map[$id];
        return $this->_list[$index];
    }

    public function ToAJAX() {
        $list = array();
        $count = $this->Count();
        for ($i = 0; $i < $count; $i++) {
            array_push($list, $this->GetByIndex($i)->ToAJAX());
        }

        $ret = new stdClass();
        $ret->list = $list;
        $ret->config = $this->config->ToAJAX();

        return $ret;
    }
}

class AbricosListConfig {
    public $page = 1;
    public $limit = 0;

    private $_total = 0;

    public function __construct($d = null) {
        if (!is_array($d)) {
            return;
        }
        $this->page = max(intval($d['page']), 1);
        $this->limit = intval($d['limit']);
    }

    public function SetTotal($total){
        $this->_total = intval($total);
    }

    public function GetTotal(){
        return $this->_total;
    }

    public function ToAJAX() {
        $ret = new stdClass();
        $ret->page = $this->page;
        $ret->limit = $this->limit;
        $ret->total = $this->_total;
        return $ret;
    }

    public function GetFrom() {
        return ($this->page - 1) * $this->limit;
    }
}

?>