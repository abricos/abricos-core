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
 * @property string $type
 * @property string $name
 * @property string $version
 */
abstract class Ab_Structure {

    protected $_type = 'undefined';

    protected $_version = '0.1.0';

    protected $_name;

    /**
     * @var Ab_Fields
     */
    public $fields;

    public function __construct($name, $data = null){
        $this->_name = $name;

        if (isset($data->version)){
            $this->_version = $data->version;
        }

        $dFields = isset($data->fields) ? $data->fields : null;

        $this->fields = new Ab_Fields($dFields);
    }

    public function __get($name){
        switch ($name){
            case 'type':
                return $this->_type;
            case 'name':
                return $this->_name;
            case 'version':
                return $this->_version;
        }
    }

    public function ToJSON(){
        $ret = new stdClass();
        $ret->type = $this->type;
        $ret->name = $this->name;
        $ret->version = $this->version;

        if ($this->fields->Count() > 0){
            $rFields = $this->fields->ToJSON();
            $ret->fields = $rFields->list;
        }

        return $ret;
    }
}

class Ab_StructureModel extends Ab_Structure {
    protected $_type = 'model';

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

final class Ab_ModuleStructures {

    /**
     * @var Ab_Module
     */
    public $module;

    private $_cache = array();

    public function __construct(Ab_Module $module){
        $this->module = $module;
    }

    /**
     * @param string $name Structure name
     *
     * @throws Exception
     *
     * @return Ab_Structure
     */
    public function Get($name){
        if (isset($this->_cache[$name])){
            return $this->_cache[$name];
        }

        $moduleName = $this->module->name;
        $file = realpath(CWD."/modules/".$moduleName."/model/".$name.".json");
        if (!$file){
            throw new Exception("Structure `$name` not found in `$moduleName` module");
        }

        $json = file_get_contents($file);
        $data = json_decode($json);

        if (!isset($data->type)){
            $data->type = 'model';
        }

        if (!isset(Ab_ModuleStructures::$_classes[$data->type])){
            throw new Exception("Structure type `$data->type` not registered");
        }

        $className = Ab_ModuleStructures::$_classes[$data->type];

        return $this->_cache[$name] = new $className($name, $data);
    }

    /*********************************************************/
    /*                    Static functions                   */
    /*********************************************************/

    private static $_classes = array(
        'model' => 'Ab_StructureModel',
        'modelList' => 'Ab_StructureModelList',
        'response' => 'Ab_StructureResponse',
    );

    public static function Register($type, $className){
        Ab_ModuleStructures::$_classes[$type] = $className;
    }
}

