<?php
/**
 * @package Abricos
 * @subpackage Core
 * @copyright 2008-2016 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @link http://abricos.org
 */

require_once 'model.php';

class AbricosLogger {

    const TRACE = 'trace';
    const DEBUG = 'debug';
    const INFO = 'info';
    const WARN = 'warn';
    const ERROR = 'error';
    const FATAL = 'fatal';

    const OWNER_TYPE_CORE = 'core';
    const OWNER_TYPE_MODULE = 'module';
    const OWNER_TYPE_OVER = 'over';

    public static function IsEnable(){
        return isset(Abricos::$config['module']['logs']['use'])
        && Abricos::$config['module']['logs']['use'];
    }

    public static function Log($level, $message, $ownerType = 'over', $ownerName = '', $debugInfo = null){
        if (!AbricosLogger::IsEnable()){
            return;
        }
        /** @var LogsApp $logsApp */
        $logsApp = Abricos::GetApp('logs');
        if (empty($logsApp)){
            return;
        }
        $logsApp->LogAppend($level, $message, $ownerType, $ownerName, $debugInfo);
    }

    public static function Trace($message, $ownerType = 'over', $ownerName = '', $debugInfo = null){
        return AbricosLogger::Log(AbricosLogger::TRACE, $message, $ownerType, $ownerName, $debugInfo);
    }

    public static function Debug($message, $ownerType = 'over', $ownerName = '', $debugInfo = null){
        return AbricosLogger::Log(AbricosLogger::DEBUG, $message, $ownerType, $ownerName, $debugInfo);
    }

    public static function Info($message, $ownerType = 'over', $ownerName = '', $debugInfo = null){
        return AbricosLogger::Log(AbricosLogger::INFO, $message, $ownerType, $ownerName, $debugInfo);
    }

    public static function Warn($message, $ownerType = 'over', $ownerName = '', $debugInfo = null){
        return AbricosLogger::Log(AbricosLogger::WARN, $message, $ownerType, $ownerName, $debugInfo);
    }

    public static function Error($message, $ownerType = 'over', $ownerName = '', $debugInfo = null){
        return AbricosLogger::Log(AbricosLogger::ERROR, $message, $ownerType, $ownerName, $debugInfo);
    }

    public static function Fatal($message, $ownerType = 'over', $ownerName = '', $debugInfo = null){
        return AbricosLogger::Log(AbricosLogger::FATAL, $message, $ownerType, $ownerName, $debugInfo);
    }
}

/**
 * Class AbricosApplication
 */
abstract class AbricosApplication {

    /**
     * @var Ab_ModuleManager
     */
    public $manager;

    /**
     * @var Ab_Database
     */
    public $db;

    /**
     * @var AbricosModelManager
     */
    public $models;

    /**
     * @param Ab_ModuleManager $manager
     * @param array $appExtends (optional)
     */
    public function __construct(Ab_ModuleManager $manager, $appExtends = array()){
        $this->manager = $manager;
        $this->db = $manager->db;
        $this->models = AbricosModelManager::GetManager($manager->module->name);
        $this->models->appExtends = $appExtends;
        $this->RegisterClasses();
    }

    protected $_cache = array();

    public function CacheClear(){
        $this->_cache = array();
    }

    protected function GetAppClasses(){
        return array();
    }

    protected $_cacheChildApps = array();

    /**
     * @param $name
     * @return AbricosApplication
     */
    public function GetChildApp($name){
        if (isset($this->_cacheChildApps[$name])){
            return $this->_cacheChildApps[$name];
        }
        $classes = $this->GetAppClasses();
        if (!isset($classes[$name])){
            throw new Exception('Child app `'.$name.'` not found`');
        }
        $className = $classes[$name];
        return $this->_cacheChildApps[$name] =
            new $className($this->manager, $this->models->appExtends);
    }

    public function GetChildApps(){
        $ret = array();
        $apps = $this->GetAppClasses();
        foreach ($apps as $name => $value){
            $ret[] = $this->GetChildApp($name);
        }
        return $ret;
    }

    protected $_cacheAppsByKey = array();

    public function GetApp($key, $notException = false){
        if (isset($this->_cacheAppsByKey[$key])){
            return $this->_cacheAppsByKey[$key];
        }
        $arr = explode(".", $key);
        $moduleName = $arr[0];
        $module = Abricos::GetModule($moduleName);
        if (empty($module)){
            if (!$notException){
                return null;
            }
            throw new Exception('Module `'.$moduleName.'` not found');
        }
        $manager = $module->GetManager();
        if (empty($manager)){
            if (!$notException){
                return null;
            }
            throw new Exception('Manager not found in Module '.$moduleName);
        }
        if (!method_exists($manager, 'GetApp')){
            if (!$notException){
                return null;
            }
            throw new Exception('GetApp function not found in Manager of Module '.$moduleName);
        }
        $app = $manager->GetApp();
        if (count($arr) > 1){
            $app = $app->GetChildApp($arr[1]);
        }
        return $this->_cacheAppsByKey[$key] = $app;
    }

    public function IsAppFunctionExist($key, $fn){
        $app = $this->GetApp($key);
        if (empty($app)){
            return false;
        }
        if (!method_exists($app, $fn)){
            return false;
        }
        return true;
    }

    protected abstract function GetClasses();

    protected function RegisterClasses(){
        $classes = $this->GetClasses();
        foreach ($classes as $key => $value){
            $this->models->RegisterClass($key, $value);
        }
    }

    public function InstanceClass($structName){
        $args = func_get_args();
        $p0 = isset($args[1]) ? $args[1] : null;
        $p1 = isset($args[2]) ? $args[2] : null;
        $p2 = isset($args[3]) ? $args[3] : null;

        $obj = $this->models->InstanceClass($structName, $p0, $p1, $p2);
        $obj->app = $this;
        return $obj;
    }

    protected abstract function GetStructures();

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
        $this->LogError('AJAX response unknow', array("do" => $d->do));

        return null;
    }

    public function AppStructureToJSON(){
        $arr = array($this->GetStructures());
        $extApps = $this->GetChildApps();
        for ($i = 0; $i < count($extApps); $i++){
            /** @var AbricosApplication $extApp */
            $extApp = $extApps[$i];
            $arr[] = $extApp->GetStructures();
        }

        $structures = implode(",", $arr);
        $res = $this->models->ToJSON($structures);
        if (empty($res)){
            return null;
        }

        $ret = new stdClass();
        $ret->appStructure = $res;

        return $ret;
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

    protected function MergeObject($o1, $o2){
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
                $this->MergeObject($o1->$key, $o2->$key);
            } else {
                $o1->$key = $v2;
            }
        }
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

    /* * * * * * * * * * * * * Logging * * * * * * * * * * * */

    public function Log($level, $message, $debugInfo = null){
        AbricosLogger::Log($level, $message, AbricosLogger::OWNER_TYPE_MODULE, $this->manager->module->name, $debugInfo);
    }

    public function LogTrace($message, $debugInfo = null){
        $this->Log(AbricosLogger::TRACE, $message, $debugInfo);
    }

    public function LogDebug($message, $debugInfo = null){
        $this->Log(AbricosLogger::DEBUG, $message, $debugInfo);
    }

    public function LogInfo($message, $debugInfo = null){
        $this->Log(AbricosLogger::INFO, $message, $debugInfo);
    }

    public function LogWarn($message, $debugInfo = null){
        $this->Log(AbricosLogger::WARN, $message, $debugInfo);
    }

    public function LogError($message, $debugInfo = null){
        $this->Log(AbricosLogger::ERROR, $message, $debugInfo);
    }

    public function LogFatal($message, $debugInfo = null){
        $this->Log(AbricosLogger::FATAL, $message, $debugInfo);
    }
}
