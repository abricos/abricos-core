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
 * Class Ab_ModuleInfo
 */
class Ab_ModuleInfo extends AbricosItem {

    public $name;
    public $takelink;
    public $version;
    public $installDate;
    public $updateDate;

    /**
     * @var array
     */
    public $languageVersion;

    /**
     * @var Ab_Module
     */
    public $instance = null;

    public function __construct($d){
        $this->id = $this->name = strval($d['name']);
        $this->Update($d);
    }

    public function Update($d){
        $lngId = 'language_'.Abricos::$LNG;
        $d = array_merge(array(
            'takelink' => '',
            'version' => '',
            'installdate' => 0,
            'updatedate' => 0,
            $lngId => ''
        ), $d);
        $this->takelink = strval($d['takelink']);
        $this->version = strval($d['version']);
        $this->installDate = intval($d['installdate']);
        $this->updateDate = intval($d['updatedate']);
        $this->languageVersion = $d[$lngId];
    }

    /**
     * @return Ab_Module
     */
    public function GetInstance(){
        if (empty($this->instance)){
            Abricos::GetModule($this->name);
        }
        return $this->instance;
    }

    private $_title = null;

    public function GetTitle(){
        if (!empty($this->_title)){
            return $this->_title;
        }
        $this->_title = $this->name;

        $instance = $this->GetInstance();
        $i18n = $instance->I18n();
        $title = $i18n->Translate('title');

        $this->_title = !empty($title) ? $title : $this->name;

        return $this->_title;
    }

    private $_roles = null;

    public function GetRoles(){
        if (!empty($this->_roles)){
            return $this->_roles;
        }
        $this->_roles = array();
        $instance = $this->GetInstance();
        if (empty($instance->permission)){
            return $this->_roles;
        }
        $roles = $instance->permission->GetRoles();

        if (is_array($roles)){
            $i18n = $instance->I18n();
            foreach ($roles as $action => $role){
                $title = $i18n->Translate('roles.'.$action);
                $this->_roles[$action] = !empty($title) ? $title : $action;
            }
        }

        return $this->_roles;
    }

    public function ToAJAX(){
        $ret = parent::ToAJAX();
        $ret->title = $this->GetTitle();
        $ret->name = $this->name;
        $ret->takelink = $this->takelink;
        $ret->version = $this->version;
        $ret->installdate = $this->installDate;
        $ret->updatedate = $this->updateDate;
        $ret->roles = $this->GetRoles();

        return $ret;
    }

}

class Ab_ModuleInfoList extends AbricosList {

    /**
     * @param int $index
     * @return Ab_ModuleInfo
     */
    public function GetByIndex($index){
        return parent::GetByIndex($index);
    }

    /**
     * @param mixed $name
     * @return Ab_ModuleInfo
     */
    public function Get($name){
        return parent::Get($name);
    }
}
