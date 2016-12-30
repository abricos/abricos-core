<?php
/**
 * @package Abricos
 * @subpackage Core
 * @copyright 2008-2016 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @link http://abricos.org
 */

return;

/**
 * Class Ab_FieldType
 *
 * @property string $name
 * @property string $fieldClass
 */
abstract class Ab_FieldType {

    protected $_name = 'undefined';

    protected $_fieldClass;

    public function __get($name){
        switch ($name){
            case 'name':
                return $this->_name;
            case 'fieldClass':
                return $this->_fieldClass;
        }
    }

    /**
     * Create field on this type
     *
     * @param string $id
     * @param null $data
     * @return mixed
     */
    public function Instance($id, $data = null){
        $field = new $this->fieldClass($this, $id);

        $this->Init($field, $data);

        return $field;
    }

    protected abstract function Init($field, $data);
}

class Ab_FieldTypeString extends Ab_FieldType {

    protected $_name = 'string';

    protected $fieldClass = 'Ab_FieldString';

    protected function Init($field, $data){
        if (isset($data->valid)){
            if (is_array($data->valid)){
                $field->valid = $data->valid;
            } else {
                $field->valid = explode(",", $data->valid);
            }
        }
    }
}


class Ab_FieldTypeInt extends Ab_FieldType {
    public $name = 'int';

    protected $fieldClass = 'Ab_FieldString';

    protected function Init($field, $data){

    }
}

class Ab_FieldTypeManager {

    private static $_types = array();

    public static function Register($name, $className){
        if (isset(Ab_FieldTypeManager::$_types[$name])){
            throw new Exception('Type `'.$name.'` is added');
        }
        return Ab_FieldTypeManager::$_types[$name] = new $className();
    }

    /**
     * @param $name
     * @return Ab_FieldType|null
     */
    public static function Get($name){
        if (!isset(Ab_FieldTypeManager::$_types[$name])){
            return null;
        }
        return Ab_FieldTypeManager::$_types[$name];
    }
}

Ab_FieldTypeManager::Register('int', 'Ab_FieldTypeInt');
Ab_FieldTypeManager::Register('string', 'Ab_FieldTypeString');