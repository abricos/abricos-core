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
 */
abstract class Ab_Field extends AbricosItem {

    /**
     * @var Ab_Field
     */
    public $type;

    protected $_data = array();

    public function __construct($type, $id){
        $this->type = $type;
        $this->id = $id;
    }

    public function __get($name){
        return isset($this->_data[$name]) ? $this->_data[$name] : null;
    }

    public function __set($name, $value){
        $this->_data[$name] = $value;
    }
}

/**
 * Class Ab_StringField
 *
 * @property array[string]|null $valid
 */
class Ab_StringField extends Ab_Field {
}

/**
 * Class Ab_IntField
 *
 * @property int $min
 * @property int $max
 */
class Ab_IntField extends Ab_Field {
}

class Ab_FieldList extends AbricosList {

    public function __construct($fields = null){
        parent::__construct();

        if (!isset($fields)){
            return;
        }

        foreach ($fields as $id => $data){
            $typeName = isset($data->type) ? $data->type : 'string';
            $type = Ab_FieldTypeManager::Get($typeName);
            if (empty($type)){
                continue;
            }
            $this->Add($type->Instance($id, $data));
        }
    }

}
