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
 * @property string $type
 *
 * @property string|null $dbField
 * @property string|null $json
 * @property string|null $rolefn
 *
 * @property bool $notNULL
 */
abstract class Ab_Field extends AbricosItem {

    protected $_type;

    protected $_data = array();

    public function __construct($id, $data = null){
        $this->id = $id;

        if (isset($data->dbField)){
            $this->dbField = $data->dbField;
        }
        if (isset($data->json)){
            $this->json = $data->json;
        }
        if (isset($data->rolefn)){
            $this->rolefn = $data->rolefn;
        }
        if (isset($data->notNULL)){
            $this->notNULL = !!$data->notNULL;
        }
    }

    public function __get($name){
        $pName = "_".$name;
        if (property_exists($this, $pName)){
            return $this->$pName;
        }
        return isset($this->_data[$name]) ? $this->_data[$name] : null;
    }

    public function __set($name, $value){
        $pName = "_".$name;
        if (property_exists($this, $pName)){
            return;
        }

        $this->_data[$name] = $value;
    }

    public function ToJSON(){
        $r = new stdClass();

        $r->name = $this->id;
        $r->type = $this->type;

        $data = $this->_data;

        if (isset($data['json'])){
            $r->json = $data['json'];
        }

        if (isset($data['notNULL'])){
            $r->notNull = $data['notNULL'];
        }

        return $r;
    }
}

/**
 * Class Ab_FieldString
 *
 * @property string|null $default
 * @property array|null $valid
 */
class Ab_FieldString extends Ab_Field {

    protected $_type = 'string';

    public function __construct($id, $data){
        parent::__construct($id, $data);

        if (isset($data->default)){
            $this->default = strval($data->default);
        }

        if (isset($data->valid)){
            if (is_array($data->valid)){
                $this->valid = $data->valid;
            } else {
                $this->valid = explode(',', $data->valid);
            }
        }
    }

    public function ToJSON(){
        $r = parent::ToJSON();

        $d = $this->_data;

        if (isset($d['valid'])){
            $r->valid = implode(',', $d['valid']);
        }

        if (isset($d['default'])){
            $r->default = $d['default'];
        }

        return $r;
    }
}

/**
 * Class Ab_FieldInt
 *
 * @property int|null $default
 * @property int|null $min
 * @property int|null $max
 */
class Ab_FieldInt extends Ab_Field {
    protected $_type = 'int';

    public function __construct($id, $data){
        parent::__construct($id, $data);

        if (isset($data->default)){
            $this->default = intval($data->default);
        }

        if (isset($data->min)){
            $this->min = intval($data->min);
        }

        if (isset($data->max)){
            $this->max = intval($data->max);
        }
    }

    public function ToJSON(){
        $r = parent::ToJSON();

        $d = $this->_data;

        if (isset($d['default'])){
            $r->default = $d['default'];
        }

        if (isset($d['min'])){
            $r->min = $d['min'];
        }

        if (isset($d['max'])){
            $r->max = $d['max'];
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

    public function __construct($id, $data){
        parent::__construct($id, $data);

        if (isset($data->default)){
            $this->default = boolval($data->default);
        }
    }

    public function ToJSON(){
        $r = parent::ToJSON();
        $d = $this->_data;

        if (isset($d['default'])){
            $r->default = !!$d['default'];
        }

        return $r;
    }
}

class Ab_FieldDouble extends Ab_Field {

    protected $_type = 'double';

    public function __construct($id, $data){
        parent::__construct($id, $data);

        if (isset($data->default)){
            $this->default = doubleval($data->default);
        }
    }

    public function ToJSON(){
        $r = parent::ToJSON();
        $d = $this->_data;

        if (isset($d['default'])){
            $r->default = $d['default'];
        }

        return $r;
    }
}

class Ab_FieldDate extends Ab_Field {

    protected $_type = 'date';

    public function __construct($id, $data){
        parent::__construct($id, $data);

        if (isset($data->default)){
            $this->default = intval($data->default);
        }
    }

    public function ToJSON(){
        $r = parent::ToJSON();
        $d = $this->_data;

        if (isset($d['default'])){
            $r->default = $d['default'];
        }

        return $r;
    }
}

class Ab_FieldArray extends Ab_Field {

    protected $_type = 'array';

    public function __construct($id, $data){
        parent::__construct($id, $data);

        if (isset($data->default)){
            $this->default = $data->default;
        }
    }

    public function ToJSON(){
        $r = parent::ToJSON();
        $d = $this->_data;

        if (isset($d['default'])){
            $r->default = $d['default'];
        }

        return $r;
    }
}

class Ab_FieldObject extends Ab_Field {

    protected $_type = 'object';

    public function __construct($id, $data){
        parent::__construct($id, $data);

        if (isset($data->default)){
            $this->default = $data->default;
        }
    }

    public function ToJSON(){
        $r = parent::ToJSON();
        $d = $this->_data;

        if (isset($d['default'])){
            $r->default = $d['default'];
        }

        return $r;
    }
}

/**
 * Class Ab_FieldAppItem
 *
 * @property string $module
 * @property string $class
 */
abstract class Ab_FieldAppItem extends Ab_Field {
    public function __construct($id, $data){
        parent::__construct($id, $data);

        if (isset($data->module)){
            $this->module = $data->module;
        }

        if (isset($data->class)){
            $this->class = $data->class;
        }
    }

    public function ToJSON(){
        $r = parent::ToJSON();
        $d = $this->_data;

        if (isset($d['module'])){
            $r->module = $d['module'];
        }

        if (isset($d['class'])){
            $r->class = $d['class'];
        }

        return $r;
    }
}

class Ab_FieldModel extends Ab_FieldAppItem {
    protected $_type = 'model';
}

class Ab_FieldModelList extends Ab_FieldAppItem {
    protected $_type = 'modelList';
}

class Ab_Fields extends AbricosList {

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
