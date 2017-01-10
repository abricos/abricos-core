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
 * Class Ab_Application
 */
abstract class Ab_Application extends Ab_Cache {

    /**
     * @var Ab_Module
     */
    public $module;

    /**
     * @var Ab_ModuleManager
     */
    public $manager;

    /**
     * @var Ab_Database
     */
    public $db;

    protected $aliases = array();

    public function __construct(Ab_ModuleManager $manager){
        $this->module = $manager->module;
        $this->manager = $manager;
        $this->db = $manager->db;
    }

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    /*                         Models                        */
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    /**
     * Deprecated. Use $this->aliases
     *
     * @return array
     * @deprecated
     */
    protected function GetClasses(){
    }

    protected abstract function GetStructures();

    public function InstanceClass($className){
        $args = func_get_args();
        $p = array();
        for ($i = 0; $i < 3; $i++){
            $p[$i] = isset($args[$i]) ? $args[$i] : null;
        }

        if (isset($this->aliases[$className])){
            $className = $this->aliases[$className];
        }

        if (!class_exists($className)){
            $moduleName = $this->module->name;
            throw new Exception("Class `$className` not defined (`$moduleName` module)");
        }

        return new $className($this, $p[0], $p[1], $p[2]);
    }


    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    /*                          AJAX                         */
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    public abstract function ResponseToJSON($d);

    public function AJAX($d){
        $d->do = isset($d->do) ? strval($d->do) : '';

        $this->LogTrace('AJAX response begin', array("do" => $d->do));

        switch ($d->do){
            case "appStructure":
                return $this->AppStructureToJSON();
        }
        $ret = $this->ResponseToJSON($d);

        if (empty($ret)){
            $extApps = $this->GetChildApps();
            for ($i = 0; $i < count($extApps); $i++){
                /** @var AbricosApplication $extApp */
                $extApp = $extApps[$i];
                $ret = $extApp->ResponseToJSON($d);
            }
        }
        if (!empty($ret)){
            return $ret;
        }
        $this->LogError('AJAX response unknown', array("do" => $d->do));

        return null;
    }

    public function ResultToJSON($name, $res){
        $ret = new stdClass();

        if (is_integer($res)){
            $ret->err = $res;
            return $ret;
        } else if ($res instanceof AbricosResponse && $res->error > 0){
            $ret->err = $res->error;
        }

        if (is_object($res) && method_exists($res, 'ToJSON')){
            $ret->$name = $res->ToJSON();
        } else {
            $ret->$name = $res;
        }

        return $ret;
    }

    public function ImplodeJSON($jsons, $ret = null){
        if (empty($ret)){
            $ret = new stdClass();
        }
        if (!is_array($jsons)){
            $jsons = array($jsons);
        }
        foreach ($jsons as $json){
            $this->MergeObject($ret, $json);
        }
        return $ret;
    }

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    /*                         Logging                       */
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    public function Log($level, $message, $debugInfo = null){
        Ab_Logger::Log($level, $message, Ab_Logger::OWNER_TYPE_MODULE, $this->manager->module->name, $debugInfo);
    }

    public function LogTrace($message, $debugInfo = null){
        $this->Log(Ab_Logger::TRACE, $message, $debugInfo);
    }

    public function LogDebug($message, $debugInfo = null){
        $this->Log(Ab_Logger::DEBUG, $message, $debugInfo);
    }

    public function LogInfo($message, $debugInfo = null){
        $this->Log(Ab_Logger::INFO, $message, $debugInfo);
    }

    public function LogWarn($message, $debugInfo = null){
        $this->Log(Ab_Logger::WARN, $message, $debugInfo);
    }

    public function LogError($message, $debugInfo = null){
        $this->Log(Ab_Logger::ERROR, $message, $debugInfo);
    }

    public function LogFatal($message, $debugInfo = null){
        $this->Log(Ab_Logger::FATAL, $message, $debugInfo);
    }

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    /*                     Static Methods                    */
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    public static function MergeObject($o1, $o2){
        foreach ($o2 as $key => $v2){
            if (isset($o1->$key) && is_array($o1->$key) && is_array($v2)){
                $v1 = &$o1->$key;
                for ($i = 0; $i < count($v2); $i++){
                    $v1[] = $v2[$i];
                }
                $o1->$key = $v1;
            } else if (isset($o1->$key) && is_object($o1->$key)
                && isset($o2->$key) && is_object($o2->$key)
            ){
                Ab_Application::MergeObject($o1->$key, $o2->$key);
            } else {
                $o1->$key = $v2;
            }
        }
    }
}
