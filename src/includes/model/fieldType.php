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
 * Class Ab_FieldType
 */
abstract class Ab_FieldType {

    /**
     * @var string
     */
    public $name;

    protected $fieldClass;

    public function Instance($id, $data = null){
        $field = new $this->fieldClass($this, $id);

        $this->Init($field, $data);

        return $field;
    }

    protected abstract function Init($field, $data);
}

class Ab_StringFieldType extends Ab_FieldType {

    public $name = 'string';

    protected $fieldClass = 'Ab_StringField';

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


class Ab_IntFieldType extends Ab_FieldType {
    public $name = 'int';

    protected $fieldClass = 'Ab_StringField';

    protected function Init($field, $data){

    }

}

class Ab_FieldTypeManager {
    private static $_types = array();

    public static function Add($name, $className){
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

Ab_FieldTypeManager::Add('int', 'Ab_IntFieldType');
Ab_FieldTypeManager::Add('string', 'Ab_StringFieldType');
