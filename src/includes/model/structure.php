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
 * Class Ab_Structure
 */
abstract class Ab_Structure {

    public $name;

    public function __construct($name, $data = null){
        $this->name = $name;
    }
}

class Ab_StructureModel extends Ab_Structure {

    public function __construct($data){
        parent::__construct('vars', $data);
    }

}