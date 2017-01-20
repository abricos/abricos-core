<?php
/**
 * @package Abricos
 * @link http://abricos.org
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @ignore
 */

/*
 * install check, and check on removal of the install directory.
 */
$scriptPath = "";
if ($_SERVER['REQUEST_URI'] OR $_ENV['REQUEST_URI']){
    $scriptPath = $_SERVER['REQUEST_URI'] ? $_SERVER['REQUEST_URI'] : $_ENV['REQUEST_URI'];
} else {
    if ($_SERVER['PATH_INFO'] OR $_ENV['PATH_INFO']){
        $scriptPath = $_SERVER['PATH_INFO'] ? $_SERVER['PATH_INFO'] : $_ENV['PATH_INFO'];
    } else if ($_SERVER['REDIRECT_URL'] OR $_ENV['REDIRECT_URL']){
        $scriptPath = $_SERVER['REDIRECT_URL'] ? $_SERVER['REDIRECT_URL'] : $_ENV['REDIRECT_URL'];
    } else {
        $scriptPath = $_SERVER['PHP_SELF'] ? $_SERVER['PHP_SELF'] : $_ENV['PHP_SELF'];
    }
    if ($_SERVER['QUERY_STRING'] OR $_ENV['QUERY_STRING']){
        $scriptPath .= '?'.($_SERVER['QUERY_STRING'] ? $_SERVER['QUERY_STRING'] : $_ENV['QUERY_STRING']);
    }
}

define('DS', DIRECTORY_SEPARATOR);
define('PATH_ROOT', dirname(__FILE__));
define('PATH_INSTALLATION', PATH_ROOT.DS.'install');
define('PATH_CONFIGURATION', PATH_ROOT.DS.'includes');

if ($scriptPath == "/__on_mod_rewrite/" && is_dir(PATH_INSTALLATION)){
    print('ok');
    exit();
}

if (!file_exists(PATH_CONFIGURATION.DS.'config.php') || filesize(PATH_CONFIGURATION.DS.'config.php') < 10){
    if (file_exists(PATH_INSTALLATION.DS.'index.php')){
        header('Location: /install');
        exit();
    } else {
        echo 'No configuration file found and no installation code available. Exiting...';
        exit();
    }
} else if (file_exists(PATH_CONFIGURATION.DS.'config.php') && is_dir(PATH_INSTALLATION) && file_exists(PATH_INSTALLATION.DS."index.php")){
    header('Location: /install/index.php?content=7');
} else if ($scriptPath == "/install/index.php?content=7"){
    header('Location: /');
    exit;
}

if (!file_exists(PATH_CONFIGURATION.DS.'config.php')){
    die('<strong>Configuration</strong>: includes/config.php does not exist. Please fill out the data in config.new.php and rename it to config.php');
}
$config = array();
include(PATH_CONFIGURATION.DS.'config.php');

if (!array_key_exists('Misc', $config)){
    $config['Misc'] = array();
}
if (!array_key_exists('develop_mode', $config['Misc'])){
    $config['Misc']['develop_mode'] = false;
}
if ($config['Misc']['develop_mode']){
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ALL & ~E_NOTICE);
    ini_set('display_errors', 0);
}


define("DEBUG", true);
define('THIS_SCRIPT', 'index');
define('JUST_IN_CASE', 1);
define('TIMENOW', time());

if (function_exists('memory_get_usage')){
    $startMemory = memory_get_usage();
} else {
    $startMemory = 0;
}

function getmicrotime(){
    list($usec, $sec) = explode(" ", microtime());
    return ((float)$usec + (float)$sec);
}

$startTime = getmicrotime();

define('CWD', (($getcwd = getcwd()) ? $getcwd : '.'));

if (isset($_REQUEST['GLOBALS']) OR isset($_FILES['GLOBALS'])){
    echo 'Request tainting attempted.';
    exit;
}

if (!defined('CWD')){
    define('CWD', (($getcwd = getcwd()) ? $getcwd : '.'));
}

require_once('includes/cache.php');
require_once('includes/collection.php');

require_once('includes/deprecated/classes.php');
require_once('includes/deprecated/structure.php');

require_once('includes/model/key.php');
require_once('includes/model/field.php');
require_once('includes/model/attr.php');
require_once('includes/model/model.php');
require_once('includes/model/structure.php');

require_once('includes/application.php');

require_once('includes/functions.php');
require_once('includes/core.php');
require_once('includes/inputcleaner.php');
require_once('includes/adress.php');
require_once('includes/database.php');
require_once('includes/mysqldb.php');
require_once('includes/updatemanager.php');
require_once('includes/modulemanager.php');
require_once('includes/permission.php');
require_once('includes/corequery.php');
require_once('includes/brickmanager.php');
require_once('includes/brickreader.php');
require_once('includes/phrase.php');

$core = new Abricos($config);

if (Abricos::$db->IsError()){
    echo(Abricos::$db->errorText);
}
Abricos::$db->close();

if (Abricos::$config['Misc']['showbuildinfo'] && Brick::$builder->template->owner != "_sys"){
    if (function_exists('memory_get_usage')){
        $endMemory = memory_get_usage();
    } else {
        $endMemory = 0;
    }
    echo("
	<!-- 
	memory: ".($endMemory - $startMemory)."
	time: ".(round(getmicrotime() - $startTime, 6))."
	sql: ".(Abricos::$db->querycount)."
	-->
	");
}
