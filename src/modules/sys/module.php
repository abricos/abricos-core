<?php

/**
 * Системный модуль
 *
 * @package Abricos
 * @subpackage Core
 * @link http://abricos.org
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
class Ab_CoreSystemModule extends Ab_Module {

    // TODO: remove
    private $adress = null;

    public static $YUIVersion = "3.14.0";

    private $_manager = null;

    public function __construct() {
        $this->version = "0.5.6";
        $this->name = "sys";

        $this->permission = new Ab_CoreSystemPermission($this);
    }

    /**
     * Получить менеджер
     *
     * @return Ab_CoreSystemManager
     */
    public function GetManager() {
        if (is_null($this->_manager)) {
            require_once 'includes/manager.php';
            $this->_manager = new Ab_CoreSystemManager($this);
        }
        return $this->_manager;
    }

    public function GetContentName() {
        switch (Abricos::$pageStatus) {
            case PAGESTATUS_404:
                return '404';
            case PAGESTATUS_500:
                return '500';
        }
        // системный модуль не отдает контент
        return '404';
    }

    public function Bos_IsMenu(){
        return true;
    }

    ////////////////////////////////////////////////////////////////////
    // TODO: remove
    ////////////////////////////////////////////////////////////////////
    private $brickReader = null;

    public function getBrickReader() {
        if (is_null($this->brickReader)) {
            $this->brickReader = new Ab_CoreBrickReader();
        }
        return $this->brickReader;
    }

    public $ds = null;
    // TODO: remove
    public function getDataSet() {
        if (is_null($this->ds)) {
            $json = Abricos::CleanGPC('p', 'json', TYPE_STR);
            if (empty($json)) {
                return;
            }
            $obj = json_decode($json);
            if (empty($obj->_ds)) {
                return;
            }
            $this->ds = $obj->_ds;
        }
        return $this->ds;
    }

    public function columnToObj($result) {
        $arr = array();
        $db = Abricos::$db;
        $count = $db->num_fields($result);
        for ($i = 0; $i < $count; $i++) {
            array_push($arr, $db->field_name($result, $i));
        }
        return $arr;
    }

    public function rowToObj($row) {
        $ret = new stdClass();
        $ret->d = $row;
        return $row;
    }

    public function &rowsToObj($rows) {
        $arr = array();
        while (($row = Abricos::$db->fetch_array($rows))) {
            array_push($arr, $this->rowToObj($row));
        }
        return $arr;
    }
}

/**
 * Права (идентификаторы действий) пользователя системного модуля
 *
 * @package Abricos
 * @subpackage Core
 */
class Ab_CoreSystemAction {
    /**
     * Администратор
     *
     * @var integer
     */
    const ADMIN = 50;
}

/**
 * Права пользователей системного модуля
 *
 * @package Abricos
 * @subpackage Core
 */
class Ab_CoreSystemPermission extends Ab_UserPermission {

    public function __construct(Ab_CoreSystemModule $module) {
        $defRoles = array(new Ab_UserRole(Ab_CoreSystemAction::ADMIN, Ab_UserGroup::ADMIN));
        parent::__construct($module, $defRoles);
    }

    /**
     * Получить роли
     */
    public function GetRoles() {
        return array(Ab_CoreSystemAction::ADMIN => $this->CheckAction(Ab_CoreSystemAction::ADMIN));
    }
}

Abricos::ModuleRegister(new Ab_CoreSystemModule())

?>