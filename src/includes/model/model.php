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
 * Class Ab_ModelBase
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

    public function __construct($data = null){
        $this->Update($data);
    }

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

    protected function GetFieldsData(){
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
            $this->GetFieldsData();
        }
        return $this->_attrs->Get($name);
    }

    public function __set($name, $value){
        if (!$this->_attrs){
            $this->GetFieldsData();
        }
        $this->_attrs->Set($name, $value);
    }

    public function Update($data){
        if (!$this->_attrs){
            $this->GetFieldsData();
        }
        $this->_attrs->Update($data);
    }

    /**
     * @var Ab_Attrs
     */
    protected $_argsData;

    public function GetArgs(){
        if (isset($this->_argsData)){
            return $this->_argsData;
        }
        $struct = $this->GetStructure();

        return $this->_argsData = new Ab_Attrs(
            $this->_structModule,
            $struct->args
        );
    }

    public function SetArgs($data){
        $argsData = $this->GetArgs();
        $argsData->Clean();
        $argsData->Update($data);
    }

    public function ToJSON(){
        $ret = new stdClass();

        if (!$this->_attrs && !$this->_argsData){
            return $ret;
        }

        $ret->attrs = $this->_attrs->ToJSON();

        return $ret;
    }
}

class Ab_Model extends Ab_ModelBase {

    public function ToArray($fieldName = ''){
        if (!$this->_attrs){
            $this->GetFieldsData();
        }
        return $this->_attrs->ToArray($fieldName);
    }

}

class Ab_ModelList extends Ab_ModelBase {

    /**
     * @var AbricosList
     */
    protected $_list;

    public function __construct($data = null){
        parent::__construct($data);

        $this->_list = new AbricosList();
    }

    public function Add($item){
        $this->_list->Add($item);
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