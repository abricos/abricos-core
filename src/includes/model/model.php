<?php
/**
 * @package Abricos
 * @subpackage Core
 * @copyright 2008-2016 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @link http://abricos.org
 */

require_once 'field.php';
require_once 'structure.php';

/**
 * Class Ab_ModelBase
 */
abstract class Ab_ModelBase extends AbricosItem {

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
     * @var Ab_FieldsData
     */
    protected $_fieldsData;

    public function __construct($data = null){
        parent::__construct($data);
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
        if (isset($this->_fieldsData)){
            return $this->_fieldsData;
        }
        $struct = $this->GetStructure();
        return $this->_fieldsData = new Ab_FieldsData(
            $struct->key,
            $struct->fields
        );
    }

    public function __get($name){
        if (!$this->_fieldsData){
            $this->GetFieldsData();
        }
        return $this->_fieldsData->Get($name);
    }

    public function __set($name, $value){
        if (!$this->_fieldsData){
            $this->GetFieldsData();
        }
        $this->_fieldsData->Set($name, $value);
    }

    public function Update($data){
        if (!$this->_fieldsData){
            $this->GetFieldsData();
        }
        $this->_fieldsData->Update($data);
    }

    /**
     * @var Ab_FieldsData
     */
    protected $_argsData;

    public function GetArgs(){
        if (isset($this->_argsData)){
            return $this->_argsData;
        }
        $struct = $this->GetStructure();

        return $this->_argsData = new Ab_FieldsData(
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
        $ret = parent::ToJSON();

        if (!$this->_fieldsData && !$this->_argsData){
            return $ret;
        }

        return $ret;
    }

}


class Ab_Model extends Ab_ModelBase {

}