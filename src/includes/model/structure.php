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
 * Class Ab_StructureBase
 *
 * @property Ab_Key $key
 * @property string $type
 * @property string $version
 */
abstract class Ab_Structure {

    protected $_type = 'undefined';

    protected $_version = '0.2.0';

    protected $_key;

    /**
     * @var Ab_Fields
     */
    public $fields;

    /**
     * @var Ab_Fields
     */
    public $args;

    /**
     * @var Ab_Codes
     */
    public $codes;

    public function __construct(Ab_Key $key, $data = null){
        $this->_key = $key;

        if (isset($data->version)){
            $this->_version = $data->version;
        }

        $this->fields = new Ab_Fields($key, isset($data->fields) ? $data->fields : null);

        if (isset($data->args)){
            $this->args = new Ab_Fields($key, isset($data->args) ? $data->args : null);
        }

        if (isset($data->codes)){
            $this->codes = new Ab_Codes(isset($data->codes) ? $data->codes : null);
        }
    }

    public function __get($name){
        switch ($name){
            case 'key':
                return $this->_key;
            case 'type':
                return $this->_type;
            case 'version':
                return $this->_version;
        }
    }

    public function ToJSON(){
        $ret = new stdClass();
        $ret->name = $this->_key->name;
        $ret->type = $this->type;
        $ret->version = $this->version;

        if ($this->fields->Count() > 0){
            $rList = $this->fields->ToJSON();
            $ret->fields = $rList->list;
        }

        if (isset($this->args) && $this->args->Count() > 0){
            $rList = $this->args->ToJSON();
            $ret->args = $rList->list;
        }

        if (isset($this->codes) && $this->codes->Count() > 0){
            $rList = $this->codes->ToJSON();
            $ret->codes = $rList->list;
        }

        return $ret;
    }
}

class Ab_StructureModel extends Ab_Structure {
    protected $_type = 'model';

    /**
     * @var string
     */
    public $idField = 'id';

    public function __construct($name, $data){
        parent::__construct($name, $data);

        if (isset($data->idField)){
            $this->idField = $data->idField;
        }
    }

    public function ToJSON(){
        $ret = parent::ToJSON();
        if ($this->idField !== 'id'){
            $ret->idField = $this->idField;
        }
        return $ret;
    }
}

class Ab_StructureModelList extends Ab_Structure {
    protected $_type = 'modelList';

    public $itemType;

    public function __construct($name, $data){
        parent::__construct($name, $data);

        $this->itemType = $data->itemType;
    }

}

class Ab_Structures extends Ab_Cache {

    private static $_types = array(
        'model' => 'Ab_StructureModel',
        'modelList' => 'Ab_StructureModelList'
    );

    public static function Register($type, $className){
        if (isset(Ab_Structures::$_types[$type])){
            throw new Exception('Structure type `'.$type.'` is registered');
        }
        Ab_Structures::$_types[$type] = $className;
    }

    protected $_keys;

    public function __construct(){
        $this->_keys = new Ab_Keys();
    }

    /**
     * @param Ab_Key|string|array $module
     * @param string $name (optional)
     * @throws Exception
     * @return Ab_Structure
     */
    public function Get($module, $name = null){
        $key = $this->_keys->Get($module, $name);

        if ($struct = $this->Cache($key->module, $key->name)){
            return $struct;
        }

        $file = realpath(CWD."/modules/".$key->module."/model/".$key->name.".json");
        if (!$file){
            throw new Exception("Structure `$key->name` not found in `$key->module` module");
        }

        $json = file_get_contents($file);
        $data = json_decode($json);

        if (!isset($data->type)){
            $data->type = 'model';
        }

        if (!isset(Ab_Structures::$_types[$data->type])){
            throw new Exception("Structure type `$data->type` is not registered");
        }

        $className = Ab_Structures::$_types[$data->type];

        $struct = new $className($key, $data);
        $this->SetCache($key->module, $key->name, $struct);

        return $struct;
    }
}

