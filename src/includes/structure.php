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

    public function Update($d){
        $this->takelink = strval($d['takelink']);
        $this->version = strval($d['version']);
        $this->installDate = intval($d['installdate']);
        $this->updateDate = intval($d['updatedate']);
    }

    public function ToAJAX(){
        $ret = parent::ToAJAX();
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

?>