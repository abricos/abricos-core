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
     * @var Ab_Key
     */
    public $key;

    /**
     * @var string
     */
    public $module;

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

    /**
     * @var bool
     */
    public $personal;

    public function __construct(Ab_Key $key, $id, $data = null){
        $this->key = $key;
        $this->id = $id;

        if (isset($data->module)){
            $this->module = strval($data->module);
        }
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
        if (isset($data->personal)){
            $this->personal = !!$data->personal;
        }
        if (isset($data->default)){
            $this->default = $this->AttrConvert($data->default);
        }

        $this->OnInit($data);
    }

    protected function OnInit($data){
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

        if (isset($this->module)){
            $r->module = $this->module;
        }

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

    public function AttrInit(){
        $attr = new Ab_Attr($this);
        return $attr;
    }

    public abstract function AttrConvert($value);

    public function AttrIsValid($value){
        return true;
    }
}

/**
 * Class Ab_FieldString
 *
 * @property string $default
 * @property array $valid
 */
class Ab_FieldString extends Ab_Field {

    /**
     * @var Ab_UserText
     */
    private static $_utm;

    /**
     * @var Ab_UserText
     */
    private static $_utmf;

    protected $_type = 'string';

    /**
     * @var array $valid
     */
    public $valid;

    public $parse;

    public function OnInit($data){
        if (isset($data->valid)){
            if (is_array($data->valid)){
                $this->valid = $data->valid;
            } else {
                $this->valid = explode(',', $data->valid);
            }
        }
        if (isset($data->parse)){
            $this->parse = strval($data->parse);
        }
    }

    public function AttrIsValid($value){
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

    public function AttrConvert($value){
        $value = strval($value);

        if ($this->parse === 'standard'){
            if (empty(Ab_FieldString::$_utm)){
                Ab_FieldString::$_utm = Abricos::TextParser();
            }
            $value = Ab_FieldString::$_utm->Parser($value);
        } else if ($this->parse === 'full'){
            if (empty(Ab_FieldString::$_utmf)){
                Ab_FieldString::$_utmf = Abricos::TextParser(true);
            }
            $value = Ab_FieldString::$_utmf->Parser($value);
        }

        return $value;
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

    public function OnInit($data){
        if (isset($data->min)){
            $this->min = intval($data->min);
        }

        if (isset($data->max)){
            $this->max = intval($data->max);
        }
    }

    public function AttrIsValid($value){
        if (!isset($this->min) && !isset($this->max)){
            return true;
        }

        $value = $this->AttrConvert($value);

        if (isset($this->min) && $value < $this->min){
            return false;
        }

        if (isset($this->max) && $value > $this->max){
            return false;
        }

        return true;
    }

    public function AttrConvert($value){
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

    public function AttrConvert($value){
        return boolval($value);
    }
}

class Ab_FieldDouble extends Ab_FieldInt {

    protected $_type = 'double';

    public function AttrConvert($value){
        return doubleval($value);
    }
}

class Ab_FieldDate extends Ab_FieldInt {
    protected $_type = 'date';
}

class Ab_FieldArray extends Ab_Field {
    protected $_type = 'array';

    public function AttrConvert($value){
        return $value;
    }
}

class Ab_FieldObject extends Ab_Field {
    protected $_type = 'object';

    public function AttrConvert($value){
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
    public $class;

    public function OnInit($data){
        if (isset($data->class)){
            $this->class = strval($data->class);
        }
    }

    public function AttrConvert($value){
        return $value;
    }

    public function ToJSON(){
        $r = parent::ToJSON();

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
 * @method Ab_Field GetByIndex($i)
 */
class Ab_Fields extends AbricosList {

    private $_aliases = array();

    public function __construct(Ab_Key $key, $fields = null){
        parent::__construct();

        if (!isset($fields)){
            return;
        }

        foreach ($fields as $id => $data){
            $typeName = isset($data->type) ? $data->type : 'string';
            $fieldClass = Ab_FieldsManager::GetType($typeName);

            if (empty($fieldClass)){
                $a = explode(':', $typeName);

                if (isset($a[0]) && (
                        $a[0] === 'model' ||
                        $a[0] === 'modelList'
                    )
                ){
                    $fieldClass = Ab_FieldsManager::GetType($a[0]);

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

            $field = new $fieldClass($key, $id, $data);

            $this->Add($field);
        }
    }

    /**
     * @param Ab_Field $item
     */
    public function Add($item){
        parent::Add($item);
        if ($item->dbField){
            $this->_aliases[$item->dbField] = $item->name;
        }
    }

    /**
     * @param string $id
     * @return Ab_Field
     */
    public function Get($id){
        if (isset($this->_aliases[$id])){
            $id = $this->_aliases[$id];
        }

        return parent::Get($id);
    }
}

class Ab_FieldsManager {

    /**
     * @var string[]
     */
    private static $_types = array(
        'string' => 'Ab_FieldString',
        'int' => 'Ab_FieldInt',
        'bool' => 'Ab_FieldBool',
        'double' => 'Ab_FieldDouble',
        'date' => 'Ab_FieldDate',
        'array' => 'Ab_FieldArray',
        'object' => 'Ab_FieldObject',
        'model' => 'Ab_FieldModel',
        'modelList' => 'Ab_FieldModelList'
    );

    public static function Register($key, $className){
        if (isset(Ab_FieldsManager::$_types[$key])){
            throw new Exception('Field type `'.$key.'` is registered');
        }
        return Ab_FieldsManager::$_types[$key] = $className;
    }

    /**
     * Get FieldType class name
     *
     * @param $key
     * @return string|null
     */
    public static function GetType($key){
        if (!isset(Ab_FieldsManager::$_types[$key])){
            return null;
        }
        return Ab_FieldsManager::$_types[$key];
    }
}
