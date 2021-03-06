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
 * Системный модуль
 */
class SystemModule extends Ab_Module {

    /**
     * @var SystemModule
     */
    public static $instance;

    public static $YUIVersion = "3.14.0";

    private $_manager = null;

    public function __construct(){
        SystemModule::$instance = $this;
        $this->version = "0.5.7";
        $this->name = "sys";

        $this->permission = new Ab_CoreSystemPermission($this);
    }

    /**
     * Получить менеджер
     *
     * @return SystemManager
     */
    public function GetManager(){
        if (is_null($this->_manager)){
            require_once 'includes/manager.php';
            $this->_manager = new SystemManager($this);
        }
        return $this->_manager;
    }

    public function GetContentName(){
        switch (Abricos::$pageStatus){
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

    public function Bos_IsSummary(){
        return true;
    }

    ////////////////////////////////////////////////////////////////////
    // TODO: remove
    ////////////////////////////////////////////////////////////////////
    private $brickReader = null;

    public function getBrickReader(){
        if (is_null($this->brickReader)){
            $this->brickReader = new Ab_CoreBrickReader();
        }
        return $this->brickReader;
    }

    public $ds = null;

    // TODO: remove
    public function getDataSet(){
        if (is_null($this->ds)){
            $json = Abricos::CleanGPC('p', 'json', TYPE_STR);
            if (empty($json)){
                return;
            }
            $obj = json_decode($json);
            if (empty($obj->_ds)){
                return;
            }
            $this->ds = $obj->_ds;
        }
        return $this->ds;
    }

    public function columnToObj($result){
        $arr = array();
        $db = Abricos::$db;
        $count = $db->num_fields($result);
        for ($i = 0; $i < $count; $i++){
            $arr[] = $db->field_name($result, $i);
        }
        return $arr;
    }

    public function rowToObj($row){
        $ret = new stdClass();
        $ret->d = $row;
        return $row;
    }

    public function &rowsToObj($rows){
        $arr = array();
        while (($row = Abricos::$db->fetch_array($rows))){
            $arr[] = $this->rowToObj($row);
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

    public function __construct(SystemModule $module){
        $defRoles = array(
            new Ab_UserRole(Ab_CoreSystemAction::ADMIN, Ab_UserGroup::ADMIN)
        );
        parent::__construct($module, $defRoles);
    }

    /**
     * Получить роли
     */
    public function GetRoles(){
        return array(
            Ab_CoreSystemAction::ADMIN => $this->CheckAction(Ab_CoreSystemAction::ADMIN)
        );
    }
}

Abricos::ModuleRegister(new SystemModule());
