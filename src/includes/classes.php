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

class AbricosList {

    /**
     * @var AbricosListConfig
     * @deprecated
     */
    private $config;

    /**
     * @var string
     * @deprecated
     */
    private $classConfig;

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

    public function ToJSON(){
        $list = array();
        $count = $this->Count();
        for ($i = 0; $i < $count; $i++){
            $list[] = $this->GetByIndex($i)->ToJSON();
        }

        $ret = new stdClass();
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

class AbricosModel extends AbricosItem {

    /**
     * @var AbricosApplication
     */
    public $app;

    /**
     * @var Ab_Module
     */
    protected $_structModule;

    /**
     * @var string
     */
    protected $_structName;

    protected $_data = array();

    /**
     * @var AbricosModelStructure|null
     */
    protected $_structure = null;

    public function __construct($d){
        unset($this->id); // hack for use method __get('id')

        if (is_string($this->_structModule)){
            $this->_structModule = Abricos::GetModule($this->_structModule);
        }

        if (!($this->_structModule instanceof Ab_Module)){
            throw new Exception('Module not found in AbricosModel');
        }

        if (empty($this->_structure) && !empty($this->_structModule) && !empty($this->_structName)){
            $this->_structure = AbricosModelManager::GetManager($this->_structModule)->GetStructure($this->_structName);
        }
        if (!($this->_structure instanceof AbricosModelStructure)){
            throw new Exception('Structure not found in AbricosModel');
        }
        $struct = $this->_structure;

        if (is_object($d)){
            $d = get_object_vars($d);
        }
        $this->id = isset($d[$struct->idField]) ? $d[$struct->idField] : 0;
        $this->Update($d);
    }

    public function Update($d){
        $struct = $this->_structure;
        $count = $struct->Count();

        for ($i = 0; $i < $count; $i++){
            $field = $struct->GetByIndex($i);
            $name = $field->name;

            if ($field->type === 'multiLang'){
                $this->__set($name, $d);
            } else {
                $val = null;
                if (isset($d[$name])){
                    $val = $d[$name];
                } else if (isset($field->dbField) && isset($d[$field->dbField])){
                    $val = $d[$field->dbField];
                }
                $this->__set($name, $val);
            }
        }
    }

    public function __set($name, $value){
        /** @var AbricosModelStructureField $field */
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
        } else if ($field->type === 'object'){
            if (empty($value)){
                unset($this->_data[$name]);
            } else if (is_array($value)){
                $this->_data[$name] = array_to_object($value);
            } else {
                $this->_data[$name] = $value;
            }
        } else if ($field->type === 'array'){
            if (empty($value)){
                unset($this->_data[$name]);
            } else if (is_array($value)){
                $this->_data[$name] = $value;
            } else if (is_object($value)){
                $this->_data[$name] = get_object_vars($value);
            } else if (isset($this->_data[$name])){
                $this->_data[$name] = $value;
            } else {
                $this->_data[$name] = $value;
            }
        } else if ($field->type === 'model'){
            if (empty($value) && !$field->notNULL){
                unset($this->_data[$name]);
            } else if ($value instanceof AbricosModel){
                $this->_data[$name] = $value;
            } else if (isset($this->_data[$name])){
                $this->_data[$name]->Update($value);
            } else {
                $manager = isset($field->typeModule) ?
                    AbricosModelManager::GetManager($field->typeModule) :
                    $this->_structure->manager;

                $this->_data[$name] = $manager->InstanceClass($field->typeClass, $value);
            }
        } else if ($field->type === 'modelList'
            || $field->type === 'list' // TODO: deprecated
        ){
            if (empty($value) && !$field->notNULL){
                unset($this->_data[$name]);
            } else if ($value instanceof AbricosModelList){
                $this->_data[$name] = $value;
            } else if (isset($this->_data[$name])){
                $this->_data[$name]->Update($value);
            } else {
                $manager = isset($field->typeModule) ?
                    AbricosModelManager::GetManager($field->typeModule) :
                    $this->_structure->manager;

                $this->_data[$name] = $manager->InstanceClass($field->typeClass, $value);
            }
        } else if ($field->type === 'string'){
            $value = $field->TypeVal($value);
            if (!is_null($value)){
                $this->_data[$name] = $value;
            }
        } else {
            $this->_data[$name] = $field->TypeVal($value);
        }
    }

    public function __get($name){
        if (isset($this->_data[$name])){
            /*
            if ($this->_data[$name] instanceof AbricosMultiLangValue){
                return $this->_data[$name]->Get();
            }
            /**/

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

        $useridField = $struct->Get('userid');
        $isPersonalAccess = false;
        if (!empty($useridField) && isset($this->_data['userid'])){
            $userid = $this->_data['userid'];
            if ($userid > 0 && intval($userid) === intval(Abricos::$user->id)){
                $isPersonalAccess = true;
            }
        }

        if (empty($this->app)){
            $moduleManager = $this->_structModule->GetManager();
        } else {
            $moduleManager = $this->app->manager;
        }

        $count = $struct->Count();
        for ($i = 0; $i < $count; $i++){
            $field = $struct->GetByIndex($i);
            if (!isset($this->_data[$field->name])){
                continue;
            }

            $pDefine = $field->personal;
            $pAccess = true;
            if ($pDefine){
                $pAccess = $isPersonalAccess;
            }

            $rDefine = is_string($field->rolefn);
            $rAccess = true;

            if ($rDefine){
                $rAccess = false;
                if (method_exists($moduleManager, $field->rolefn)){
                    $funcName = $field->rolefn;
                    if ($moduleManager->$funcName()){
                        $rAccess = true;
                    }
                }
            }

            if ((!$pAccess && !$rAccess) ||
                ($pDefine && !$pAccess && !$rDefine) ||
                ($rDefine && !$rAccess && !$pDefine)
            ){
                continue;
            }

            if ($field->type === 'multiLang'
                || $field->type === 'list' // TODO: deprecated in [Structure].json
                || $field->type === 'model'
                || $field->type === 'modelList'
            ){
                $value = $this->_data[$field->name]->ToJSON();
            } else {
                $value = $this->_data[$field->name];
            }
            if (empty($value)){
                continue;
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

    /**
     * @var AbricosApplication
     */
    public $app;

    /**
     * @var Ab_Module
     */
    protected $_structModule;

    /**
     * @var string
     */
    protected $_structName;

    /**
     * @var string
     */
    protected $_structData;

    /**
     * @var AbricosModelListStructure|null
     */
    protected $_structure = null;

    public function __construct($items = null){
        parent::__construct();

        if (is_string($this->_structModule)){
            $this->_structModule = Abricos::GetModule($this->_structModule);

            if (!($this->_structModule instanceof Ab_Module)){
                throw new Exception('Module not found in AbricosModelList');
            }

            $models = AbricosModelManager::GetManager($this->_structModule);

            if (empty($this->_structure) && !empty($this->_structModule) && !empty($this->_structName)){
                $this->_structure = $models->GetStructure($this->_structName);
            }

            if (!($this->_structure instanceof AbricosModelStructure)){
                throw new Exception('Structure not found in AbricosModelList');
            }

            if (isset($this->_structData)){
                $data = $models->GetData($this->_structData);

                if (is_object($data) && isset($data->items) && is_array($data->items)){
                    $this->Update($data->items);
                }
            }
        }
        $this->Update($items);
    }

    /**
     * @param array $data
     */
    public function Update($items){
        if (!is_array($items) || empty($this->_structure)){
            return;
        }

        $models = AbricosModelManager::GetManager($this->_structModule);
        $itemType = $this->_structure->itemType;
        for ($i = 0; $i < count($items); $i++){
            $item = $models->InstanceClass($itemType, $items[$i]);
            $this->Add($item);
        }
    }

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
            $name = $this->name;
            if (isset($d[$name])){
                $this->_data[Abricos::$LNG] = strval($d[$name]);
            } else {
                foreach (Abricos::$supportLanguageList as $lng){
                    $fieldName = AbricosMultiLangValue::FieldName($name, $lng);
                    $this->_data[$lng] = isset($d[$fieldName]) ? $d[$fieldName] : '';
                }
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
     * @var string Values: 'string|int|bool|double|date|multiLang|model|modelList|array|object'
     */
    public $type = 'string';

    /**
     * @var string
     */
    public $typeClass;

    /**
     * @var string
     */
    public $typeModule;

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

    /**
     * @var bool
     */
    public $personal;

    /**
     * @var string
     */
    public $rolefn = null;

    /**
     * @var string
     */
    public $valid;

    public $notNULL;

    /**
     * @param AbricosModelManager $manager
     * @param string $name
     * @param null $data
     */
    public function __construct($manager, $name, $data = null){
        $this->manager = $manager;
        $this->name = $this->id = $name;

        if (empty($data)){
            return;
        }
        if (isset($data->type)){
            $type = trim($data->type);
            $a = explode(':', $type);
            if (count($a) === 3){
                $type = trim($a[0]);
                $this->typeModule = trim($a[1]);
                $this->typeClass = trim($a[2]);
            } else if (count($a) === 2){
                $type = trim($a[0]);
                $this->typeClass = trim($a[1]);
            }

            switch ($type){
                case 'string':
                case 'int':
                case 'bool':
                case 'double':
                case 'date':
                case 'array':
                case 'object':
                case 'multiLang':
                case 'model':
                case 'modelList':
                case 'list': // TODO: deprecated
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
        if (isset($data->personal)){
            $this->personal = $data->personal;
        }
        if (isset($data->rolefn)){
            $this->rolefn = $data->rolefn;
        }
        if (isset($data->valid)){
            $this->valid = $data->valid;
        }
        if (isset($data->notNULL)){
            $this->notNULL = $data->notNULL;
        }
    }

    public function TypeVal($value){
        if ($this->type === 'string'){
            $value = strval($value);
            if (empty($this->valid)){
                return $value;
            }
            $a = explode(",", $this->valid);
            $count = count($a);
            for ($i = 0; $i < $count; $i++){
                if ($a[$i] === $value){
                    return $value;
                }
            }
            return null;
        }
        switch ($this->type){
            case 'bool':
                return !!$value;
            case 'int':
            case 'date':
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
        if (isset($this->typeModule)){
            $ret->type .= ':'.$this->typeModule;
        }
        if (isset($this->typeClass)){
            $ret->type .= ':'.$this->typeClass;
        }
        if (isset($this->default)){
            $ret->default = $this->default;
        }
        if (isset($this->json)){
            $ret->json = $this->json;
        }
        if (isset($this->valid)){
            $ret->valid = $this->valid;
        }
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
     * @var string
     */
    public $type = 'model';

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

    public function DataFix($data, $isArray){
        if (!$isArray && is_array($data)){
            $data = array_to_object($data);
        }
        if ($isArray && is_object($data)){
            $data = get_object_vars($data);
        }
        $count = $this->Count();
        for ($i = 0; $i < $count; $i++){
            $field = $this->GetByIndex($i);
            $name = $field->name;

            if ($isArray){
                if (!isset($data[$name])){
                    $data[$name] = null;
                }
                $data[$name] = $field->TypeVal($data[$name]);
            } else {
                if (!isset($data->$name)){
                    $data->$name = null;
                }
                $data->$name = $field->TypeVal($data->$name);
            }
        }
        return $data;
    }

    public function DataFixToObject($data){
        return $this->DataFix($data, false);
    }

    public function DataFixToArray($data){
        return $this->DataFix($data, true);
    }

    public function ToJSON(){
        $ret = parent::ToJSON();
        $ret->name = $this->name;
        $ret->fields = $ret->list;
        if ($this->idField !== 'id'){
            $ret->idField = $this->idField;
        }
        unset($ret->list);

        return $ret;
    }
}

class AbricosModelListStructure extends AbricosModelStructure {

    public $type = 'modelList';

    /**
     * @var string
     */
    public $itemType;

    public function __construct($manager, $name, $data = null){
        parent::__construct($manager, $name, $data);

        if (!isset($data->itemType)){
            throw new Exception("ItemType not set in ModelList Structure `$name`");
        }
        $this->itemType = $data->itemType;
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

    /**
     * @var array[string]
     */
    public $appExtends = array();

    public function __construct(Ab_Module $module){
        $this->module = $module;
    }

    /**
     * @param Ab_Module $module
     * @return AbricosModelManager
     */
    public static function GetManager($module){
        if (is_string($module)){
            $name = $module;

            $module = Abricos::GetModule($module);
            if (empty($module)){
                throw new Exception("Module `$name` not found in AbricosModelManager::GetManager");
            }
        }

        $modName = $module->name;
        if (!isset(AbricosModelManager::$_managers[$modName])){
            AbricosModelManager::$_managers[$modName] = new AbricosModelManager($module);
        }
        return AbricosModelManager::$_managers[$modName];
    }

    public function RegisterClass($structName, $className){
        $this->classes[$structName] = $className;
        for ($i = 0; $i < count($this->appExtends); $i++){
            $extModels = AbricosModelManager::GetManager($this->appExtends[$i]);
            $extModels->RegisterClass($structName, $className);
        }
    }

    public function InstanceClass($structName){
        if (!isset($this->classes[$structName])){
            $modName = $this->module->name;
            throw new Exception("Class $structName not registered in AbricosModelManager: module: $modName");
        }
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
            for ($i = 0; $i < count($this->appExtends); $i++){
                $moduleName = $this->appExtends[$i];
                $extModels = AbricosModelManager::GetManager($moduleName);
                $struct = $extModels->GetStructure($name);
                if ($struct){
                    return $this->structures[$name] = $struct;
                }
            }
            return null;
        }
        $json = file_get_contents($file);
        $data = json_decode($json);

        if (isset($data->type) && $data->type === 'modelList'){
            $struct = new AbricosModelListStructure($this, $name, $data);
        } else {
            $struct = new AbricosModelStructure($this, $name, $data);
        }
        $this->structures[$name] = $struct;
        return $struct;
    }

    public function GetData($name){
        $name = trim($name);
        $file = realpath(CWD."/modules/".$this->module->name."/data/".$name.".json");
        if (!$file){
            for ($i = 0; $i < count($this->appExtends); $i++){
                $file = realpath(CWD."/modules/".$this->appExtends[$i]."/data/".$name.".json");
                if ($file){
                    break;
                }
            }
            if (!$file){
                return null;
            }
        }
        $json = file_get_contents($file);
        $data = json_decode($json);
        return $data;
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

class AbricosResponse {
    const ERR_BAD_REQUEST = 400;
    const ERR_UNAUTHORIZED = 401;
    const ERR_FORBIDDEN = 403;
    const ERR_NOT_FOUND = 404;

    const ERR_SERVER_ERROR = 500;

    public static function IsError($response){
        if (is_integer($response)){
            return true;
        }
        return false;
    }
}

abstract class AbricosApplication {

    /**
     * @var Ab_ModuleManager
     */
    public $manager;

    /**
     * @var Ab_Database
     */
    public $db;

    /**
     * @var AbricosModelManager
     */
    public $models;

    /**
     * @param Ab_ModuleManager $manager
     * @param array $appExtends (optional)
     */
    public function __construct(Ab_ModuleManager $manager, $appExtends = array()){
        $this->manager = $manager;
        $this->db = $manager->db;
        $this->models = AbricosModelManager::GetManager($manager->module->name);
        $this->models->appExtends = $appExtends;
        $this->RegisterClasses();
    }

    protected abstract function GetClasses();

    protected function RegisterClasses(){
        $classes = $this->GetClasses();
        foreach ($classes as $key => $value){
            $this->models->RegisterClass($key, $value);
        }
    }

    public function InstanceClass($structName){
        $args = func_get_args();
        $p0 = isset($args[1]) ? $args[1] : null;
        $p1 = isset($args[2]) ? $args[2] : null;
        $p2 = isset($args[3]) ? $args[3] : null;

        $obj = $this->models->InstanceClass($structName, $p0, $p1, $p2);
        $obj->app = $this;
        return $obj;
    }

    protected abstract function GetStructures();

    public abstract function ResponseToJSON($d);

    public function AJAX($d){
        switch ($d->do){
            case "appStructure":
                return $this->AppStructureToJSON();
        }
        return $this->ResponseToJSON($d);
    }

    public function AppStructureToJSON(){
        $structures = $this->GetStructures();

        $res = $this->models->ToJSON($structures);
        if (empty($res)){
            return null;
        }

        $ret = new stdClass();
        $ret->appStructure = $res;

        return $ret;
    }

    protected function ResultToJSON($name, $res){
        $ret = new stdClass();

        if (is_integer($res)){
            $ret->err = $res;
            return $ret;
        }
        if (is_object($res) && method_exists($res, 'ToJSON')){
            $ret->$name = $res->ToJSON();
        } else {
            $ret->$name = $res;
        }

        return $ret;
    }

    protected function MergeObject($o1, $o2){
        foreach ($o2 as $key => $v2){
            if (isset($o1->$key) && is_array($o1->$key) && is_array($v2)){
                $v1 = &$o1->$key;
                for ($i = 0; $i < count($v2); $i++){
                    $v1[] = $v2[$i];
                }
                $o1->$key = $v1;
            } else if (isset($o1->$key) && is_object($o1->$key)
                && isset($o2->$key) && is_object($o2->$key)
            ){
                $this->MergeObject($o1->$key, $o2->$key);
            } else {
                $o1->$key = $v2;
            }
        }
    }

    protected function ImplodeJSON($jsons, $ret = null){
        if (empty($ret)){
            $ret = new stdClass();
        }
        if (!is_array($jsons)){
            $jsons = array($jsons);
        }
        foreach ($jsons as $json){
            $this->MergeObject($ret, $json);
        }
        return $ret;
    }

}

?>