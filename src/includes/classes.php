<?php

/**
 * @package Abricos
 * @subpackage Core
 * @link http://abricos.org
 * @author Alexander Kuzmin <roosit@abricos.org>
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

class AbricosListConfig {
    public $page = 1;
    public $limit = 0;

    private $_total = 0;

    public function __construct($d = null){
        if (!is_array($d)){
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

    public function GetFrom(){
        return ($this->page - 1) * $this->limit;
    }

    public function ToJSON(){
        $ret = new stdClass();
        $ret->page = $this->page;
        $ret->limit = $this->limit;
        $ret->total = $this->_total;
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

    /**
     * @var AbricosListConfig
     */
    public $config;

    public $classConfig = 'AbricosListConfig';

    protected $_list = array();
    protected $_map = array();
    protected $_ids = array();

    protected $isCheckDouble = false;

    public function __construct($config = null){
        $this->_list = array();
        $this->_map = array();
        if (empty($config)){
            $config = new $this->classConfig();
        }
        $this->config = $config;
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

    public function ToJSON(){
        $list = array();
        $count = $this->Count();
        for ($i = 0; $i < $count; $i++){
            $list[] = $this->GetByIndex($i)->ToAJAX();
        }

        $ret = new stdClass();
        $ret->list = $list;
        $ret->config = $this->config->ToAJAX();

        return $ret;
    }

    /**
     * @deprecated
     */
    public function ToAJAX(){
        return $this->ToJSON();
    }
}

class AbricosModel extends AbricosItem {

    protected $_structModule = null;
    protected $_structName = null;

    protected $_data = array();

    /**
     * @var AbricosModelStructure|null
     */
    protected $_structure = null;

    public function __construct($d){

        if (empty($this->_structure) && !empty($this->_structModule) && !empty($this->_structName)){
            $this->_structure = AbricosModelManager::GetManager($this->_structModule)->GetStructure($this->_structName);
        }

        $struct = $this->_structure;
        if (!empty($struct)){
            $this->id = isset($d[$struct->idField]) ? $d[$struct->idField] : 0;
            $this->Update($d);
        } else {
            parent::__construct($d);
        }
    }

    public function Update($d){
        $struct = $this->_structure;
        if (empty($struct)){
            $this->_data = $d;
            return;
        }

        $count = $struct->Count();
        for ($i = 0; $i < $count; $i++){
            $field = $struct->GetByIndex($i);
            if ($field->multiLang){
                $this->__set($field->name, $d);
            } else if (isset($d[$field->name])){
                $this->__set($field->name, $d[$field->name]);
            }
        }
    }

    public function __set($name, $value){
        $field = !empty($this->_structure) ? $this->_structure->Get($name) : null;
        if (empty($field)){
            $this->_data[$name] = $value;
            return;
        }
        if ($field->multiLang){
            if (isset($this->_data[$name])){
                $this->_data[$name]->Set($value);
            } else {
                $this->_data[$name] = new AbricosMultiLangValue($name, $value);
            }
        } else {
            $this->_data[$name] = $field->TypeVal($value);
        }
    }

    public function __get($name){
        if (isset($this->_data[$name])){
            if ($this->_data[$name] instanceof AbricosMultiLangValue){
                return $this->_data[$name]->Get();
            }
            return $this->_data[$name];
        }
        $field = !empty($this->_structure) ? $this->_structure->Get($name) : null;
        if (!empty($field) && isset($field->default)){
            return $field->default;
        }
        return null;
    }
}

class AbricosModelList extends AbricosList {

}

class AbricosMultiLangValue {
    public $name;
    protected $_data = array();
    private $_actualLang;

    public function __construct($name, $d){
        $this->name = $name;
        $this->Set($d);
    }

    public function Set($d){
        if (is_array($d)){
            foreach (Abricos::$supportLanguageList as $lng){
                $fieldName = AbricosMultiLangValue::FieldName($this->name, $lng);
                $this->_data[$lng] = isset($d[$fieldName]) ? $d[$fieldName] : '';
            }
        } else if (is_string($d)){
            $this->_data[Abricos::$LNG] = $d;
        }
        unset($this->_actualLang);
        $this->_UpdateActualLang();
    }

    // TODO: refactor: modify to static function
    private function _UpdateActualLang(){
        if (isset($this->_actualLang)){
            return;
        }
        $this->_actualLang = Abricos::$LNG;
        if (!isset($this->_data[$this->_actualLang])){
            $this->_data[$this->_actualLang] = '';
        }

        if (!empty($this->_data[$this->_actualLang])){
            return;
        }
        foreach (Abricos::$supportLanguageList as $lng){
            if ($this->_actualLang === $lng){
                continue;
            }
            if (isset($this->_data[$lng]) && !empty($this->_data[$lng])){
                $this->_actualLang = $lng;
                return;
            }
        }
    }

    public function Get(){
        $this->_UpdateActualLang();
        return $this->_data[$this->_actualLang];
    }

    public static function FieldName($name, $lng = ''){
        if (empty($lng)){
            $lng = Abricos::$LNG;
        }
        return $name."_".$lng;
    }

}

class AbricosModelStructureField extends AbricosItem {

    public $name;

    /**
     * This field is Multi-language
     *
     * @var bool
     */
    public $multiLang = false;

    /**
     * Field type
     *
     * @var string Values: 'string|int|bool|double'
     */
    public $type = 'string';

    /**
     * Default value
     *
     * @var mixed
     */
    public $default;

    public function __construct($name, $data = null){
        $this->name = $this->id = $name;

        if (empty($data)){
            return;
        }
        if (isset($data->multiLang)){
            $this->multiLang = intval($data->multiLang);
        }
        if (isset($data->type)){
            switch ($data->type){
                case 'string':
                case 'int':
                case 'bool':
                case 'double':
                    $this->type = $data->type;
                    break;
            }
        }
        if (isset($data->default)){
            $this->default = $this->TypeVal($data->default);
        }
    }

    public function TypeVal($value){
        switch ($this->type){
            case 'string':
                return strval($value);
            case 'bool':
                return boolval($value);
            case 'int':
                return intval($value);
            case 'double':
                return doubleval($value);
        }
        return $value;
    }
}

class AbricosModelStructure extends AbricosList {

    public $name;

    public $idField = 'id';

    public function __construct($name, $data = null){
        $this->name = $name;
        if (empty($data)){
            return;
        }

        if (isset($data->idField)){
            $this->idField = $data->idField;
        }

        if (isset($data->fields)){
            foreach ($data->fields as $fieldName => $value){
                $this->Add(new AbricosModelStructureField($fieldName, $value));
            }
        }
    }

    /**
     * @param $i
     * @return AbricosModelStructureField
     */
    public function GetByIndex($i){
        return parent::GetByIndex($i);
    }

    /**
     * @param mixed $name
     * @return AbricosModelStructureField
     */
    public function Get($name){
        return parent::Get($name);
    }
}

class AbricosModelManager {

    private static $_managers = array();

    /**
     * @var Ab_Module
     */
    public $module;

    public $structures = array();

    public function __construct(Ab_Module $module){
        $this->module = $module;
    }

    /**
     * @param Ab_Module $module
     * @return AbricosModelManager
     */
    public static function GetManager($module){
        if (is_string($module)){
            $module = Abricos::GetModule($module);
        }
        $modName = $module->name;
        if (!isset(AbricosModelManager::$_managers[$modName])){
            AbricosModelManager::$_managers[$modName] = new AbricosModelManager($module);
        }
        return AbricosModelManager::$_managers[$modName];
    }

    /**
     * @param $name
     * @return AbricosModelStructure|null
     */
    public function GetStructure($name){
        if (isset($this->structures[$name])){
            return $this->structures[$name];
        }
        $file = realpath(CWD."/modules/".$this->module->name."/model/".$name.".json");
        if (!$file){
            return null;
        }
        $json = file_get_contents($file);
        $data = json_decode($json);
        $struct = new AbricosModelStructure($name, $data);
        $this->structures[$name] = $struct;
        return $struct;
    }
}

?>