<?php
/**
 * @package Abricos
 * @subpackage Core
 * @copyright 2008-2017 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @link http://abricos.org
 */

/**
 * Class Ab_Application
 */
abstract class Ab_API {

    /**
     * @var Ab_App
     */
    public $app;

    protected $_versions = array();

    /**
     * @var Ab_APIMethods[]
     */
    private $_instances = array();

    public function __construct(Ab_App $app){
        $this->app = $app;
    }

    public function Run(){
        $aGetURL = array_slice(Abricos::$adress->dir, 2);

        if (count($aGetURL) < 2){
            return Ab_Response::ERR_BAD_REQUEST;
        }

        $version = $aGetURL[0];

        if (!isset($this->_versions[$version])){
            // return (new AbricosAPIResponse400())->BadVersion($version);
            return Ab_Response::ERR_BAD_REQUEST;
        }

        if (!isset($this->_instances[$version])){
            $className = $this->_versions[$version];

            if (!class_exists($className)){
                $moduleName = $this->app->module->name;
                throw new Exception("Class `$className` not defined in `$moduleName`");
            }

            $this->_instances[$version] = new $className($this->app);
        }

        $methodAPI = $aGetURL[1];

        /** @var Ab_APIMethods $instance */
        $instance = $this->_instances[$version];
        if (!isset($instance->methods[$methodAPI])
            || !method_exists($instance, $instance->methods[$methodAPI])
        ){
            // return (new AbricosAPIResponse400())->MethodNotDefined($funcName);
            return Ab_Response::ERR_BAD_REQUEST;
        }

        $funcName = $instance->methods[$methodAPI];

        $p = array();
        for ($i = 0; $i < 5; $i++){
            $p[$i] = isset($aGetURL[$i + 2]) ? isset($aGetURL[$i + 2]) : null;
        }

        $result = $instance->$funcName($p[0], $p[1], $p[2], $p[3], $p[4]);

        if ($result instanceof Ab_ModelBase){
            return $result;
        }

        throw new Exception("TODO: release object response");
    }
}


/**
 * Class Ab_APIMethods
 */
abstract class Ab_APIMethods {

    /**
     * @var Ab_App
     */
    public $app;

    /**
     * @var string[]
     */
    public $methods;


    public function __construct(Ab_App $app){
        $this->app = $app;
    }
}