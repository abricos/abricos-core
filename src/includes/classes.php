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

    /**
     * @var string
     * @deprecated
     */
    public $classConfig;
    // public $classConfig = 'AbricosListConfig';

    protected $_list = array();
    protected $_map = array();
    protected $_ids = array();

    protected $isCheckDouble = false;

    public function __construct($config = null){
        $this->_list = array();
        $this->_map = array();
        if (empty($config) && isset($this->classConfig)){
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

    public function ToJSON(){
        $list = array();
        $count = $this->Count();
        for ($i = 0; $i < $count; $i++){
            $list[] = $this->GetByIndex($i)->ToJSON();
        }

        $ret = new stdClass();
        $ret->list = $list;
        if (!empty($this->config)){
            $ret->config = $this->config->ToJSON();
        }

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
        if (!empty($this->config)){
            $ret->config = $this->config->ToAJAX();
        }

        return $ret;
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
        if (!($this->_structure instanceof AbricosModelStructure)){
            throw new Exception('Structure not found in AbricosModel');
        }
        $struct = $this->_structure;

        $this->id = isset($d[$struct->idField]) ? $d[$struct->idField] : 0;
        $this->Update($d);
    }

    public function Update($d){
        $struct = $this->_structure;
        $count = $struct->Count();

        for ($i = 0; $i < $count; $i++){
            $field = $struct->GetByIndex($i);


            if ($field->type === 'multiLang'){
                $this->__set($field->name, $d);
            } else {
                $val = null;
                if (isset($d[$field->name])){
                    $val = $d[$field->name];
                } else if (isset($field->dbField) && isset($d[$field->dbField])){
                    $val = $d[$field->dbField];
                }
                $this->__set($field->name, $val);
            }
        }
    }

    public function __set($name, $value){
        $field = !empty($this->_structure) ? $this->_structure->Get($name) : null;
        if (empty($field)){
            $this->_data[$name] = $value;
            return;
        }

        if ($field->type === 'multiLang'){
            if (isset($this->_data[$name])){
                $this->_data[$name]->Set($value);
            } else {
                $this->_data[$name] = new AbricosMultiLangValue($name, $value);
            }
        } else if ($field->type === 'model' || $field->type === 'modelList'){

            if (isset($this->_data[$name])){
                $this->_data[$name]->Update($value);
            } else {
                $this->_data[$name] = $this->_structure->manager->InstanceClass($field->typeClass, $value);
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

    public function ToJSON(){
        $ret = parent::ToJSON();

        $struct = $this->_structure;
        if (empty($struct)){
            return $ret;
        }

        $count = $struct->Count();
        for ($i = 0; $i < $count; $i++){
            $field = $struct->GetByIndex($i);
            if (!isset($this->_data[$field->name])){
                continue;
            }
            if ($field->type === 'multiLang'){
                $value = $this->_data[$field->name]->ToJSON();
            } else {
                $value = $this->_data[$field->name];
            }
            $jsonName = isset($field->json) ? $field->json : $field->name;
            $ret->$jsonName = $value;
        }

        return $ret;
    }

    public function ToArray($fieldName = ''){
        $struct = $this->_structure;
        if (empty($struct)){
            return array('id' => $this->id);
        }

        $ret = array();

        if (!empty($fieldName)){
            $field = $struct->Get($fieldName);
            $ret[$fieldName] = isset($this->_data[$fieldName])
                ? $this->_data[$fieldName]
                : $field->default;
            return $ret;
        }

        $count = $struct->Count();
        for ($i = 0; $i < $count; $i++){
            $field = $struct->GetByIndex($i);
            if (!isset($this->_data[$field->name])){
                continue;
            }
            if ($field->type === 'multiLang'){
                $value = $this->_data[$field->name]->ToArray();
            } else {
                $value = $this->_data[$field->name];
            }
            $ret[$field->name] = $value;
        }

        return $ret;
    }

}

class AbricosModelList extends AbricosList {

    public function ToArray($fieldName = ''){
        $ret = array();
        $count = $this->Count();
        for ($i = 0; $i < $count; $i++){
            /** @var AbricosModel $item */
            $item = $this->GetByIndex($i);

            if (empty($fieldName)){
                $ret[] = $item->ToArray();
            } else {
                $ret[] = $item->$fieldName;
            }
        }
        return $ret;
    }
}

class AbricosMultiLangValue {
    public $name;
    protected $_data = array();
    private $_actualLang;

    public function __construct($name, $d = ''){
        $this->name = $name;
        $this->Set($d);
    }

    public static function FieldName($name, $lng = ''){
        if (empty($lng)){
            $lng = Abricos::$LNG;
        }
        return $name."_".$lng;
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

    public function ToJSON(){
        return $this->_data;
    }

    public function ToArray(){
        return $this->_data;
    }

}

class AbricosModelStructureField extends AbricosItem {

    /**
     * @var AbricosModelManager
     */
    public $manager;

    /**
     * @var string
     */
    public $name;

    /**
     * Field type
     *
     * @var string Values: 'string|int|bool|double|multiLang'
     */
    public $type = 'string';

    /**
     * @var string
     */
    public $typeClass;

    /**
     * Default value
     *
     * @var mixed
     */
    public $default;

    /**
     * JSON name
     *
     * @var string
     */
    public $json;

    /**
     * @var string
     */
    public $dbField;

    public function __construct($manager, $name, $data = null){
        $this->manager = $manager;
        $this->name = $this->id = $name;

        if (empty($data)){
            return;
        }
        if (isset($data->type)){
            $type = trim($data->type);
            $a = explode(':', $type);
            if (count($a) === 2){
                $type = trim($a[0]);
                $this->typeClass = trim($a[1]);
            }

            switch ($type){
                case 'string':
                case 'int':
                case 'bool':
                case 'double':
                case 'array':
                case 'multiLang':
                case 'model':
                case 'modelList':
                    $this->type = $type;
                    break;
            }
        }
        if (isset($data->default)){
            $this->default = $this->TypeVal($data->default);
        }
        if (isset($data->dbField)){
            $this->dbField = $data->dbField;
        }
        if (isset($data->json)){
            $this->json = $data->json;
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

    public function ToJSON(){
        $ret = parent::ToJSON();
        unset($ret->id);
        $ret->name = $this->name;
        $ret->type = $this->type;
        if (isset($this->typeClass)){
            $ret->type .= ':'.$this->typeClass;
        }

        if (isset($this->default)){
            $ret->default = $this->default;
        }
        $ret->json = $this->json;

        return $ret;
    }
}

/**
 * Class AbricosModelStructure
 *
 * @method AbricosModelStructureField GetByIndex(int $i)
 * @method AbricosModelStructureField Get(string $name)
 */
class AbricosModelStructure extends AbricosList {

    /**
     * @var AbricosModelManager
     */
    public $manager;

    /**
     * @var string
     */
    public $name;

    /**
     * @var string
     */
    public $idField = 'id';

    /**
     * @param AbricosModelManager $manager
     * @param string $name
     * @param mixed $data
     */
    public function __construct($manager, $name, $data = null){
        $this->manager = $manager;

        $this->name = $name;

        if (empty($data)){
            return;
        }

        if (isset($data->idField)){
            $this->idField = $data->idField;
        }

        if (isset($data->fields)){
            foreach ($data->fields as $fieldName => $value){
                $this->Add(new AbricosModelStructureField($this->manager, $fieldName, $value));
            }
        }
    }

    public function ToJSON(){
        $ret = parent::ToJSON();
        $ret->name = $this->name;
        $ret->fields = $ret->list;
        unset($ret->list);

        return $ret;
    }
}

class AbricosModelManager {

    private static $_managers = array();

    /**
     * @var Ab_Module
     */
    public $module;

    protected $structures = array();

    protected $classes = array();

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

    public function RegisterClass($structName, $className){
        $this->classes[$structName] = $className;
    }

    public function InstanceClass($structName){
        $className = $this->classes[$structName];

        $args = func_get_args();
        $p0 = isset($args[1]) ? $args[1] : null;
        $p1 = isset($args[2]) ? $args[2] : null;
        $p2 = isset($args[3]) ? $args[3] : null;

        return new $className($p0, $p1, $p2);
    }

    /**
     * @param $name
     * @return AbricosModelStructure|null
     */
    public function GetStructure($name){
        $name = trim($name);
        if (isset($this->structures[$name])){
            return $this->structures[$name];
        }
        $file = realpath(CWD."/modules/".$this->module->name."/model/".$name.".json");
        if (!$file){
            return null;
        }
        $json = file_get_contents($file);
        $data = json_decode($json);
        $struct = new AbricosModelStructure($this, $name, $data);
        $this->structures[$name] = $struct;
        return $struct;
    }

    public function ToJSON($names){
        if (is_string($names)){
            $names = explode(",", $names);
        }
        $ret = new stdClass();
        $ret->structures = array();

        foreach ($names as $name){
            $struct = $this->GetStructure($name);
            if (empty($struct)){
                continue;
            }
            $ret->structures[] = $struct->ToJSON();
        }
        return $ret;
    }
}

?>