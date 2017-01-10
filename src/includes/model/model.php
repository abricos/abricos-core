<?php
/**
 * @package Abricos
 * @subpackage Core
 * @copyright 2008-2016 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @link http://abricos.org
 */

require_once 'fieldType.php';
require_once 'field.php';
require_once 'structure.php';

/**
 * Class Ab_ModelBase
 */
abstract class Ab_ModelBase extends AbricosItem {

    protected $_structName;

    /**
     * @var Ab_Structure
     */
    protected $_structure;

    protected $_data = array();

    /**
     * Ab_ModelBase constructor.
     *
     * @throws Exception
     *
     * @param Ab_Application $app
     * @param mixed|null $data
     * @param mixed|null $vars
     */
    public function __construct($app, $data = null, $vars = null){
        $struct = $app->module->GetStructure($this->_structName);

        if (empty($struct)){
            throw new Exception("Structure `$this->_structName` not found");
        }

        $this->_structure = $struct;

        $this->Update($data);
    }

    public function Update($d){
        if (is_object($d)){
            $d = get_object_vars($d);
        } else if (empty($d)){
            $d = array();
        }

        $fields = $this->_structure->fields;
        for ($i = 0, $count = $fields->Count(); $i < $count; $i++){
            $field = $fields->GetByIndex($i);
        }
    }


}
