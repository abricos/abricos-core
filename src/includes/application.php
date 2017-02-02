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
abstract class Ab_App extends Ab_Cache {
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

    protected $_aliases;

    public function __construct(Ab_ModuleManager $manager){
        $this->module = $manager->module;
        $this->manager = $manager;
        $this->db = $manager->db;
    }

    public function GetClassName($alias){
        if (isset($this->_aliases[$alias])){
            return $this->_aliases[$alias];
        }
        return $alias;
    }

    /**
     * @param $className
     * @return Ab_ModelBase
     * @throws Exception
     */
    public function Create($className){
        $className = $this->GetClassName($className);
        if (!class_exists($className)){
            $moduleName = $this->module->name;
            throw new Exception("Class `$className` not defined (`$moduleName` module)");
        }

        if (func_num_args() > 1){
            $args = func_get_args();
            $p = array();
            for ($i = 0; $i < 3; $i++){
                $p[$i] = isset($args[$i + 1]) ? $args[$i + 1] : null;
            }
            return new $className($p[0], $p[1], $p[2]);
        }
        return new $className();
    }

    /**
     * @param $className
     * @param mixed $p0 (optional)
     * @param mixed $p1 (optional)
     * @param mixed $p2 (optional)
     * @return Ab_ModelBase
     */
    public function CreateFilled($className, $p0 = null, $p1 = null, $p2 = null){
        /** @var Ab_ModelBase $entity */
        $entity = $this->Create($className);

        if (method_exists($entity, 'Fill')){
            $entity->Fill($this, $p0, $p1, $p2);
        }

        return $entity;
    }

    protected $_API;

    public function GetAPI(){
        if (!isset($this->_API)){
            $this->module->ScriptRequireOnce('includes/api.php');
            $className = $this->GetAPIClassName();
            if (!class_exists($className)){
                return null;
            }
            $this->_API = new $className($this);
        }
        return $this->_API;
    }

    protected function GetAPIClassName(){
        return ucwords($this->module->name)."API";
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
                Ab_App::MergeObject($o1->$key, $o2->$key);
            } else {
                $o1->$key = $v2;
            }
        }
    }
}
