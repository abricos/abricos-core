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
 * Class Ab_Logger
 */
class Ab_Logger {

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
        if (!Ab_Logger::IsEnable()){
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
        return Ab_Logger::Log(Ab_Logger::TRACE, $message, $ownerType, $ownerName, $debugInfo);
    }

    public static function Debug($message, $ownerType = 'over', $ownerName = '', $debugInfo = null){
        return Ab_Logger::Log(Ab_Logger::DEBUG, $message, $ownerType, $ownerName, $debugInfo);
    }

    public static function Info($message, $ownerType = 'over', $ownerName = '', $debugInfo = null){
        return Ab_Logger::Log(Ab_Logger::INFO, $message, $ownerType, $ownerName, $debugInfo);
    }

    public static function Warn($message, $ownerType = 'over', $ownerName = '', $debugInfo = null){
        return Ab_Logger::Log(Ab_Logger::WARN, $message, $ownerType, $ownerName, $debugInfo);
    }

    public static function Error($message, $ownerType = 'over', $ownerName = '', $debugInfo = null){
        return Ab_Logger::Log(Ab_Logger::ERROR, $message, $ownerType, $ownerName, $debugInfo);
    }

    public static function Fatal($message, $ownerType = 'over', $ownerName = '', $debugInfo = null){
        return Ab_Logger::Log(Ab_Logger::FATAL, $message, $ownerType, $ownerName, $debugInfo);
    }
}

/**
 * Class AbricosLogger
 *
 * @deprecated
 */
class AbricosLogger extends Ab_Logger {
}