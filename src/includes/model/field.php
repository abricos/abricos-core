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
        if (isset($data->notNULL) && $data->notNULL){
            $this->notNULL = true;
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
        $ret = new stdClass();

        $ret->name = $this->id;
        $ret->type = $this->type;

        $data = $this->_data;

        if (isset($data['json'])){
            $ret->json = $data['json'];
        }

        if (isset($data['notNULL'])){
            $ret->notNull = $data['notNULL'];
        }

        return $ret;
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
            $this->default = $data->default;
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
        $ret = parent::ToJSON();

        if (!empty($this->valid)){
            $ret->valid = implode(',', $this->valid);
        }

        return $ret;
    }
}

/**
 * Class Ab_FieldInt
 *
 * @property int $min
 * @property int $max
 */
class Ab_FieldInt extends Ab_Field {
    protected $_type = 'int';

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
                continue;
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

Ab_FieldsManager::Register('int', 'Ab_FieldInt');
Ab_FieldsManager::Register('string', 'Ab_FieldString');