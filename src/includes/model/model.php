<?php

/**
 * @package Abricos
 * @subpackage Core
 * @copyright 2008-2016 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @link http://abricos.org
 */
class Ab_Response {
    const ERR_BAD_REQUEST = 400;
    const ERR_UNAUTHORIZED = 401;
    const ERR_FORBIDDEN = 403;
    const ERR_NOT_FOUND = 404;
    const ERR_SERVER_ERROR = 500;

    public static function IsError($response){
        if ($response instanceof AbricosResponse){
            return $response->error > 0;
        }

        if (is_integer($response)){
            return true;
        }

        return false;
    }
}

/**
 * Class Ab_ModelBase
 *
 * @method void Fill(Ab_App $app, $p0 = null, $p1 = null, $p2 = null) (optional)
 */
abstract class Ab_ModelBase {

    /**
     * @var string
     */
    protected $_structModule;

    /**
     * @var string
     */
    protected $_structName;

    /**
     * @var Ab_Structure
     */
    protected $_structure;

    /**
     * @var Ab_Attrs
     */
    protected $_attrs;

    /**
     * @var Ab_Attrs
     */
    protected $_args;

    /**
     * Error code
     *
     * @var int
     */
    protected $_error = 0;

    /**
     * Response Detail Codes
     *
     * @var int
     */
    protected $_code = 0;

    public function __construct($data = null){
        $this->Update($data);
    }

    /**
     * @return Ab_App
     */
    public function GetApp(){
        return Abricos::GetApp($this->_structModule);
    }

    /**
     * @return Ab_Structure
     * @throws Exception
     */
    public function GetStructure(){
        if (isset($this->_structure)){
            return $this->_structure;
        }

        $structure = Abricos::GetStructure($this->_structModule, $this->_structName);

        if (empty($structure)){
            throw new Exception(
                "Structure `$this->_structName` not found in module `".$this->_structModule."`"
            );
        }

        return $this->_structure = $structure;
    }

    protected function GetAttrs(){
        if (isset($this->_attrs)){
            return $this->_attrs;
        }
        $struct = $this->GetStructure();
        return $this->_attrs = new Ab_Attrs(
            $struct->key,
            $struct->fields
        );
    }

    public function __get($name){
        if (!$this->_attrs){
            $this->GetAttrs();
        }
        return $this->_attrs->Get($name);
    }

    public function __set($name, $value){
        if (!$this->_attrs){
            $this->GetAttrs();
        }
        $this->_attrs->Set($name, $value);
    }

    public function Update($data){
        if (!$this->_attrs){
            $this->GetAttrs();
        }
        $this->_attrs->Update($data);
    }

    public function GetArgs(){
        if (isset($this->_args)){
            return $this->_args;
        }
        $struct = $this->GetStructure();

        return $this->_args = new Ab_Attrs(
            $this->_structModule,
            $struct->args
        );
    }

    public function SetArgs($data){
        $argsData = $this->GetArgs();
        $argsData->Clean();
        $argsData->Update($data);
    }


    public function SetError($error, $code = 0){
        $this->_error = intval($error);
        if (!empty($code)){
            $this->_code = intval($code);
        }
        return $this;
    }

    public function IsError(){
        return $this->_error > 0;
    }

    public function AddCode(){
        $count = func_num_args();
        for ($i = 0; $i < $count; $i++){
            $this->_code |= intval(func_get_arg($i));
        }
    }

    public function IsSetCode($code){
        return $code & $this->_code;
    }

    public function IsJSONExtended(){
        return $this->_code > 0 || $this->_error > 0;
    }

    public function ToJSON(){
        if (!$this->IsJSONExtended()){
            return $this->_attrs->ToJSON();
        }

        $ret = new stdClass();
        $ret->__ = 1;

        if ($this->_code > 0){
            $ret->code = $this->_code;
        }

        if ($this->_error > 0){
            $ret->error = $this->_error;
            return $ret;
        }

        if (!$this->_attrs && !$this->_args){
            return $ret;
        }

        $ret->attrs = $this->_attrs->ToJSON();

        return $ret;
    }
}

class Ab_Model extends Ab_ModelBase {

    public function ToArray($fieldName = ''){
        if (!$this->_attrs){
            $this->GetAttrs();
        }
        return $this->_attrs->ToArray($fieldName);
    }

}

/**
 * Class Ab_ModelList
 *
 * @method Ab_StructureModelList GetStructure()
 */
class Ab_ModelList extends Ab_ModelBase {

    /**
     * @var AbricosList
     */
    protected $_list;

    protected $_itemClassName;

    public function __construct($data = null){
        parent::__construct($data);

        $this->_list = new AbricosList();
    }

    public function Add($item){
        if (is_array($item)){
            if (!isset($this->_itemClassName)){
                $app = $this->GetApp();
                $alias = $this->GetStructure()->itemType;
                $this->_itemClassName = $app->GetClassName($alias);
            }
            $item = new $this->_itemClassName($item);
        }

        $this->_list->Add($item);
        return $item;
    }

    public function Ids(){
        return $this->_list->Ids();
    }

    public function Count(){
        return $this->_list->Count();
    }

    public function GetByIndex($index){
        return $this->_list->GetByIndex($index);
    }

    public function Get($id){
        return $this->_list->Get($id);
    }

    public function GetBy($name, $value){
        return $this->_list->GetBy($name, $value);
    }

    public function ToArray($fieldName = ''){
        if ($fieldName === 'id'){
            return $this->Ids();
        }

        $ret = array();
        $count = $this->Count();
        for ($i = 0; $i < $count; $i++){

            /** @var Ab_Model $item */
            $item = $this->GetByIndex($i);

            if (empty($fieldName)){
                $ret[] = $item->ToArray();
            } else {
                $ret[] = $item->$fieldName;
            }
        }
        return $ret;
    }

    public function ToJSON(){
        $ret = parent::ToJSON();

        $this->_list->ToJSON($ret);

        return $ret;
    }

}