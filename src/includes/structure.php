<?php

class Ab_ModuleInfo extends AbricosItem {

    public $name;
    public $takelink;
    public $version;
    public $installDate;
    public $updateDate;

    /**
     * @var Ab_Module
     */
    public $instance = null;

    public function __construct($d) {
        $this->id = $this->name = strval($d['name']);
        $this->Update($d);
    }

    public function Update($d) {
        $this->takelink = strval($d['takelink']);
        $this->version = strval($d['version']);
        $this->installDate = intval($d['installdate']);
        $this->updateDate = intval($d['updatedate']);
    }

    /**
     * @return Ab_Module
     */
    public function GetInstance() {
        if (empty($this->instance)) {
            Abricos::GetModule($this->name);
        }
        return $this->instance;
    }

    private $_title = null;

    public function GetTitle() {
        if (!empty($this->_title)) {
            return $this->_title;
        }
        $this->_title = $this->name;

        $instance = $this->GetInstance();
        $i18n = $instance->GetI18n();
        if (!empty($i18n['title'])) {
            $this->_title = $i18n['title'];
        }
        return $this->_title;
    }

    private $_roles = null;

    public function GetRoles() {
        if (!empty($this->_roles)) {
            return $this->_roles;
        }
        $this->_roles = array();
        $instance = $this->GetInstance();
        if (empty($instance->permission)){
            return $this->_roles;
        }
        $roles = $instance->permission->GetRoles();

        $i18n = $instance->GetI18n();
        if (is_array($roles)){
            foreach ($roles as $action => $role){
                $this->_roles[$action] = $action;
                if (!empty($i18n['roles']) && !empty($i18n['roles'][$action])){
                    $this->_roles[$action] = $i18n['roles'][$action];
                }
            }
        }

        return $this->_roles;
    }

    public function ToAJAX() {
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
    public function GetByIndex($index) {
        return parent::GetByIndex($index);
    }

    /**
     * @param mixed $name
     * @return Ab_ModuleInfo
     */
    public function Get($name) {
        return parent::Get($name);
    }

}

?>