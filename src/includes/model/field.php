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
 * Class Ab_Field
 *
 * @property string $id Unique field ID (Field Name)
 * @property string $name (readonly) Field Name (alias of $id)
 * @property string $type (readonly)
 *
 * @property bool $notNULL
 */
abstract class Ab_Field extends AbricosItem {

    protected $_type;

    /**
     * @var string
     */
    public $dbField;

    /**
     * @var string
     */
    public $json;

    /**
     * @var string
     */
    public $rolefn;

    /**
     * @var mixed
     */
    public $default;

    public function __construct($id, $data = null){
        $this->id = $id;

        if (isset($data->dbField) && !empty($data->dbField)){
            $this->dbField = strval($data->dbField);
        }
        if (isset($data->json) && !empty($data->json)){
            $this->json = strval($data->json);
        }
        if (isset($data->rolefn) && !empty($data->rolefn)){
            $this->rolefn = strval($data->rolefn);
        }
        if (isset($data->notNULL)){
            $this->notNULL = !!$data->notNULL;
        }
        if (isset($data->default)){
            $this->default = $this->Convert($data->default);
        }
    }

    public function __get($name){
        switch ($name){
            case 'type':
                return $this->_type;
            case 'name':
                return $this->id;
        }
    }

    public function ToJSON(){
        $r = new stdClass();

        $r->name = $this->id;
        $r->type = $this->type;

        if (isset($this->json)){
            $r->json = $this->json;
        }

        if (isset($this->notNULL) && $this->notNULL){
            $r->notNull = !!$this->notNULL;
        }

        if (isset($this->default)){
            $r->default = $this->default;
        }

        return $r;
    }

    public function IsValid($value){
        return true;
    }

    public abstract function Convert($value);
}

/**
 * Class Ab_FieldString
 *
 * @property string $default
 * @property array $valid
 */
class Ab_FieldString extends Ab_Field {

    protected $_type = 'string';

    /**
     * @var array $valid
     */
    public $valid;

    public function __construct($id, $data){
        parent::__construct($id, $data);

        if (isset($data->valid)){
            if (is_array($data->valid)){
                $this->valid = $data->valid;
            } else {
                $this->valid = explode(',', $data->valid);
            }
        }
    }

    public function IsValid($value){
        if (!isset($this->valid)){
            return true;
        }

        $value = strval($value);

        $count = count($this->valid);
        for ($i = 0; $i < $count; $i++){
            if ($this->valid[$i] === $value){
                return true;
            }
        }
        return false;
    }

    public function Convert($value){
        return strval($value);
    }

    public function ToJSON(){
        $r = parent::ToJSON();

        if (isset($this->valid) && count($this->valid) > 0){
            $r->valid = $this->valid;
        }

        return $r;
    }
}

/**
 * Class Ab_FieldInt
 *
 * @property int $default
 */
class Ab_FieldInt extends Ab_Field {
    protected $_type = 'int';

    /**
     * @var int
     */
    public $min;

    /**
     * @var int
     */
    public $max;

    public function __construct($id, $data){
        parent::__construct($id, $data);

        if (isset($data->min)){
            $this->min = intval($data->min);
        }

        if (isset($data->max)){
            $this->max = intval($data->max);
        }
    }

    public function IsValid($value){
        if (!isset($this->min) && !isset($this->max)){
            return true;
        }

        $value = $this->Convert($value);

        if (isset($this->min) && $value < $this->min){
            return false;
        }

        if (isset($this->max) && $value > $this->max){
            return false;
        }

        return true;
    }

    public function Convert($value){
        return intval($value);
    }

    public function ToJSON(){
        $r = parent::ToJSON();

        if (isset($this->min)){
            $r->min = $this->min;
        }

        if (isset($this->max)){
            $r->max = $this->max;
        }
        return $r;
    }
}

/**
 * Class Ab_FieldBool
 *
 * @property bool|null $default
 */
class Ab_FieldBool extends Ab_Field {

    protected $_type = 'bool';

    public function Convert($value){
        return boolval($value);
    }
}

class Ab_FieldDouble extends Ab_FieldInt {

    protected $_type = 'double';

    public function Convert($value){
        return doubleval($value);
    }
}

class Ab_FieldDate extends Ab_FieldInt {
    protected $_type = 'date';
}

class Ab_FieldArray extends Ab_Field {
    protected $_type = 'array';

    public function Convert($value){
        return $value;
    }
}

class Ab_FieldObject extends Ab_Field {
    protected $_type = 'object';

    public function Convert($value){
        return $value;
    }
}

/**
 * Class Ab_FieldAppItem
 */
abstract class Ab_FieldAppItem extends Ab_Field {

    /**
     * @var string
     */
    public $module;

    /**
     * @var string
     */
    public $class;

    public function __construct($id, $data){
        parent::__construct($id, $data);

        if (isset($data->module)){
            $this->module = strval($data->module);
        }

        if (isset($data->class)){
            $this->class = strval($data->class);
        }
    }

    public function Convert($value){
        return $value;
    }

    public function ToJSON(){
        $r = parent::ToJSON();

        $r->module = $this->module;
        $r->class = $this->class;

        return $r;
    }
}

class Ab_FieldModel extends Ab_FieldAppItem {
    protected $_type = 'model';
}

class Ab_FieldModelList extends Ab_FieldAppItem {
    protected $_type = 'modelList';
}

/**
 * Class Ab_Fields
 *
 * @method Ab_Field Get($name)
 * @method Ab_Field GetByIndex($i)
 */
class Ab_Fields extends AbricosList {

    protected $_aliases = array();

    public function __construct($fields = null){
        parent::__construct();

        if (!isset($fields)){
            return;
        }

        foreach ($fields as $id => $data){
            $typeName = isset($data->type) ? $data->type : 'string';
            $fieldClass = Ab_FieldsManager::Get($typeName);

            if (empty($fieldClass)){
                $a = explode(':', $typeName);

                if (isset($a[0]) && (
                        $a[0] === 'model' ||
                        $a[0] === 'modelList'
                    )
                ){
                    $fieldClass = Ab_FieldsManager::Get($a[0]);

                    if (empty($fieldClass)){
                        continue;
                    }

                    if (count($a) === 2){
                        $data->class = $a[1];
                    } else if (count($a) === 3){
                        $data->module = $a[1];
                        $data->class = $a[2];
                    } else {
                        continue;
                    }
                } else {
                    continue;
                }
            }

            $field = new $fieldClass($id, $data);

            $this->Add($field);
        }
    }

}

class Ab_FieldsData {

    protected $_fields;

    protected $_data = array();

    public function __construct(Ab_Fields $fields){
        $this->_fields = $fields;
    }

    public function Get($name){
        if (isset($this->_data[$name])){
            return $this->_data[$name];
        }

        if (array_key_exists($name, $this->_data)){
            return $this->_data[$name];
        }

        $field = $this->_fields->Get($name);

        if (empty($field)){
            return null;
        }

        return $this->_data[$name] = $field->default;
    }

    public function Set($name, $value){
        $field = $this->_fields->Get($name);

        if (empty($field)){
            return null;
        }

        return $this->_data[$name] = $field->Convert($value);
    }

    public function Update($d){
        if (is_object($d)){
            $d = get_object_vars($d);
        }

        if (empty($d)){
            return;
        }

        foreach ($d as $name => $value){
            $this->Set($name, $value);
        }
    }

    public function Clean(){
        $this->_data = array();
    }
}

class Ab_FieldsManager {
    private static $_types = array();

    public static function Register($name, $className){
        if (isset(Ab_FieldsManager::$_types[$name])){
            throw new Exception('Type `'.$name.'` is registered');
        }
        return Ab_FieldsManager::$_types[$name] = $className;
    }

    /**
     * @param $name
     * @return Ab_FieldType|null
     */
    public static function Get($name){
        if (!isset(Ab_FieldsManager::$_types[$name])){
            return null;
        }
        return Ab_FieldsManager::$_types[$name];
    }
}

Ab_FieldsManager::Register('string', 'Ab_FieldString');
Ab_FieldsManager::Register('int', 'Ab_FieldInt');
Ab_FieldsManager::Register('bool', 'Ab_FieldBool');
Ab_FieldsManager::Register('double', 'Ab_FieldDouble');
Ab_FieldsManager::Register('date', 'Ab_FieldDate');
Ab_FieldsManager::Register('array', 'Ab_FieldArray');
Ab_FieldsManager::Register('object', 'Ab_FieldObject');
Ab_FieldsManager::Register('model', 'Ab_FieldModel');
Ab_FieldsManager::Register('modelList', 'Ab_FieldModelList');
