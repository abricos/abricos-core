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
 * Class Ab_Structure
 *
 * @property string $type
 * @property string $version
 */
abstract class Ab_ModelBase extends AbricosItem {

    protected $_type = 'undefined';

    protected $_version = '0.1.0';

    public function __get($name){
        switch ($name){
            case 'type':
                return $this->_type;
            case 'version':
                return $this->_version;
        }
    }
}
