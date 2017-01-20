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
 * Class Ab_Attr
 */
class Ab_Attr {

    /**
     * @var Ab_Field
     */
    public $field;

    /**
     * @var mixed
     */
    public $value;

    /**
     * @var bool
     */
    public $isInit = false;

    public function __construct($field){
        $this->field = $field;
    }

    public function Set($value){
        $value = $this->field->AttrConvert($value);
        if (!$this->field->AttrIsValid($value)){
            return false;
        }
        $this->isInit = true;
        $this->value = $value;
        return true;
    }

    public function Get(){
        if (!$this->isInit){
            $this->Set($this->field->default);
        }

        return $this->value;
    }

    public function ToJSON(){
        if (!$this->isInit){
            return null;
        }
        return $this->value;
    }
}

class Ab_Attrs {

    protected $_fields;

    /**
     * @var Ab_Attr[]
     */
    protected $_attrs = array();

    /**
     * @var Ab_Key
     */
    public $key;

    public function __construct($key, Ab_Fields $fields){
        $this->key = $key;
        $this->_fields = $fields;
    }

    /**
     * @param string $name
     * @return Ab_Attr|null
     */
    protected function GetAttr($name){
        if (isset($this->_attrs[$name])){
            return $this->_attrs[$name];
        }

        $field = $this->_fields->Get($name);

        if (empty($field)){
            return null;
        }

        if (isset($this->_attrs[$field->name])){
            return $this->_attrs[$field->name];
        }

        return $this->_attrs[$field->name] = $field->AttrInit();
    }

    public function Get($name){
        $attr = $this->GetAttr($name);
        if (!$attr){
            return null;
        }
        return $attr->Get();
    }

    public function Set($name, $value){
        $attr = $this->GetAttr($name);
        if (!$attr){
            return false;
        }

        return $attr->Set($value);
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
        $this->_attrs = array();
    }

    public function IsRoleAccess(Ab_Attr $attr){
        $rolefn = $attr->field->rolefn;

        $moduleManager = Abricos::GetModuleManager($this->key->module);
        if (!method_exists($moduleManager, $rolefn)){
            return false;
        }

        return $moduleManager->$rolefn();
    }

    public function IsPersonalAccess(Ab_Attr $attr){
        $userid = intval(Abricos::$user->id);
        if (empty($userid)){
            return false;
        }

        $field = $this->_fields->Get('userid');
        if (empty($field)){
            return false;
        }

        $fUserId = intval($this->Get('userid'));

        return $userid === $fUserId;
    }


    public function ToJSON($ret = null){
        if (!$ret){
            $ret = new stdClass();
        }

        /**
         * @var string $name
         * @var Ab_Attr $attr
         */
        foreach ($this->_attrs as $name => $attr){
            if (!$attr->isInit){
                continue;
            }

            $field = $attr->field;

            if ($field->rolefn && !$this->IsRoleAccess($attr)){
                continue;
            } else if ($field->personal && !$this->IsRoleAccess($attr)){
                continue;
            }

            $value = $attr->ToJSON();
            if (empty($value)){
                continue;
            }

            $name = !empty($field->json) ? $field->json : $field->name;
            $ret->$name = $value;
        }

        return $ret;
    }
}
