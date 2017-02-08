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

    protected function OnRequestRoot(){
        return Ab_Response::ERR_BAD_REQUEST;
    }

    protected function GetCurrentVersion(){
        if (count($this->_versions) === 0){
            return '';
        }

        foreach ($this->_versions as $key => $value){
            return $key;
        }
        return '';
    }

    /**
     * @param string $version (optional)
     * @return Ab_APIMethods|int
     * @throws Exception
     */
    protected function GetMethods($version = null){
        if (empty($version)){
            $version = $this->GetCurrentVersion();
        }

        if (isset($this->_instances[$version])){
            return $this->_instances[$version];
        }

        if (!isset($this->_versions[$version])){
            return Ab_Response::ERR_BAD_REQUEST;
        }

        $className = $this->_versions[$version];

        if (!class_exists($className)){
            $moduleName = $this->app->module->name;
            throw new Exception("Class `$className` not defined in `$moduleName`");
        }

        return $this->_instances[$version] = new $className($this->app);
    }

    public function Run(){
        $aGetURL = array_slice(Abricos::$adress->dir, 2);

        if (count($aGetURL) < 2){
            return $this->OnRequestRoot();
        }

        $version = $aGetURL[0];

        /** @var Ab_APIMethods $instance */
        $instance = $this->GetMethods($version);

        if (is_integer($instance)){
            return $instance;
        }

        $methodAPI = $aGetURL[1];

        if (!isset($instance->methods[$methodAPI])
            || !method_exists($instance, $instance->methods[$methodAPI])
        ){
            return Ab_Response::ERR_BAD_REQUEST;
        }

        $funcName = $instance->methods[$methodAPI];

        $p = array();
        for ($i = 0; $i < 5; $i++){
            $p[] = isset($aGetURL[$i + 2]) ? $aGetURL[$i + 2] : null;
        }

        $result = $instance->$funcName($p[0], $p[1], $p[2], $p[3], $p[4]);

        return $result;
    }

    public function ToJSON(){
        $methods = $this->GetMethods();
        if (is_integer($methods)){
            return $methods;
        }

        $ret = new stdClass();
        $ret->version = $this->GetCurrentVersion();
        $ret->structures = $methods->ToJSON();

        return $ret;
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

    protected function GetStructures(){
        return '';
    }

    public function POSTParamToObject($name){
        $val = Abricos::CleanGPC('p', $name, TYPE_STR);

        try {
            $data = json_decode($val);
        } catch (Exception $d){
            return null;
        }
        return $data;
    }

    public function ToJSON(){
        $names = $this->GetStructures();
        if (is_string($names)){
            $names = explode(",", $names);
        }
        $moduleName = $this->app->module->name;

        $ret = array();

        foreach ($names as $name){
            $structure = Abricos::GetStructure($moduleName, $name);
            $ret[] = $structure->ToJSON();
        }

        return $ret;
    }
}
