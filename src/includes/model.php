<?php
/**
 * @package Abricos
 * @subpackage Core
 * @copyright 2008-2016 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @link http://abricos.org
 */

require_once 'structure.php';

class AbricosStructureData extends AbricosItem {

    protected $_data = array();

    /**
     * @var AbricosStructure
     */
    protected $_structure;

    public function __construct($structure, $d){
        if (!($structure instanceof AbricosStructure)){
            throw new Exception('Structure not found in AbricosStructureData');
        }
        $this->_structure = $structure;

        if (is_object($d)){
            $d = get_object_vars($d);
        }

        if (isset($structure->idField)){
            unset($this->id); // hack for use method __get('id')
            $this->id = isset($d[$structure->idField]) ? $d[$structure->idField] : 0;
        }

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
        $field = $this->_structure->Get($name);

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

    public function __isset($name){
        return isset($this->_data[$name]);
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

        $moduleManager = $struct->manager->module->GetManager();

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
}

class AbricosModel extends AbricosStructureData {

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

    public function __construct($d){
        if (is_string($this->_structModule)){
            $this->_structModule = Abricos::GetModule($this->_structModule);
        }

        if (!($this->_structModule instanceof Ab_Module)){
            throw new Exception('Module not found in AbricosModel');
        }

        $moduleManager = AbricosModelManager::GetManager($this->_structModule);
        $structure = $moduleManager->GetStructure($this->_structName);

        parent::__construct($structure, $d);
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

    public function __construct($items = null, $options = null){
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

    protected function OptionsNormalize($options = null){

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

/**
 * Class AbricosResponse
 */
class AbricosResponse extends AbricosModel {
    const ERR_BAD_REQUEST = 400;
    const ERR_UNAUTHORIZED = 401;
    const ERR_FORBIDDEN = 403;
    const ERR_NOT_FOUND = 404;
    const ERR_SERVER_ERROR = 500;

    /**
     * @var AbricosStructureData
     */
    public $vars;


    /**
     * Error code
     * @var int
     */
    public $error = 0;

    /**
     * Detail code
     * @var int
     */
    public $code = 0;

    /**
     * @var AbricosResponseStructureCodeList
     */
    public $codes;

    /**
     * Source data
     * @var object
     */
    public $srcData;

    public function __construct($varsData, $d){
        parent::__construct($d);

        $this->srcData = $varsData;

        /** @var AbricosResponseStructure $structure */
        $structure = $this->_structure;

        if (!($structure instanceof AbricosResponseStructure)){
            throw new Exception(
                'Structure must be AbricosResponseStructure '.
                '(module: '.$this->_structModule->name.", name=".$this->_structName.")"
            );
        }

        $this->codes = $structure->codes;

        $this->vars = new AbricosStructureData($structure->vars, $varsData);
    }

    public static function IsError($response){
        if ($response instanceof AbricosResponse){
            return $response->error > 0;
        }

        if (is_integer($response)){
            return true;
        }
        return false;
    }

    public function SetError($error, $code = 0){
        $this->error = $error;
        if (!empty($code)){
            $this->code = intval($code);
        }
        return $this;
    }

    public function AddCode(){
        $count = func_num_args();
        for ($i = 0; $i < $count; $i++){
            $this->code |= intval(func_get_arg($i));
        }
    }

    public function IsSetCode($code){
        return $code & $this->code;
    }

    public function ToJSON(){
        $ret = parent::ToJSON();
        unset($ret->id);
        if ($this->code > 0){
            $ret->code = $this->code;
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
     * @param Ab_Module $module|string
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
        } else if (isset($data->type) && $data->type === 'response'){
            $struct = new AbricosResponseStructure($this, $name, $data);
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
