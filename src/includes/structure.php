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

    private $_title = null;

    public function GetTitle() {
        if (!empty($this->_title)) {
            return $this->_title;
        }
        $this->_title = $this->name;

        if (empty($this->instance)) {
            Abricos::GetModule($this->name);
        }
        $i18n = $this->instance->GetI18n();
        if (!empty($i18n['title'])) {
            $this->_title = $i18n['title'];
        }
        return $this->_title;
    }

    public function ToAJAX() {
        $ret = parent::ToAJAX();
        $ret->title = $this->GetTitle();
        $ret->name = $this->name;
        $ret->takelink = $this->takelink;
        $ret->version = $this->version;
        $ret->installdate = $this->installDate;
        $ret->updatedate = $this->updateDate;
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