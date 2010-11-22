<?php
/**
* @version $Id$
* @package Abricos
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @link http://abricos.org
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

// error_reporting(E_ALL);
error_reporting(E_ALL & ~E_NOTICE);

define("DEBUG", true);
define('THIS_SCRIPT', 'index');
define('JUST_IN_CASE', 1);
define('TIMENOW', time());

if (function_exists('memory_get_usage')){
	$startMemory = memory_get_usage();
}else{
	$startMemory = 0;
}

function getmicrotime() {
	list($usec, $sec) = explode(" ",microtime());
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

require_once('includes/global_define.php');
require_once('includes/functions.php');
require_once('includes/cmsregistry.php');
require_once('includes/cmsinputcleaner.php');
require_once('includes/cmsadress.php');
require_once('includes/cmsdatabase.php');
require_once('includes/cmsmysqldb.php');
require_once('includes/module.php');
require_once('includes/corequery.php');
require_once('includes/brickmanager.php');
require_once('includes/brickreader.php');
require_once('includes/phrase.php');

$core = new CMSRegistry();

// Основное управление сайтом ложится на системный модуль
$modSys = $core->modules->GetModule('sys');
$modUser = $core->modules->GetModule('user');
$modUser->SessionUpdate();

$core->system = $modSys;
$core->user = $modUser;

$modSys->BuildOutput();

if ($core->db->IsError()){
	echo($core->db->errorText);
}
$core->db->close();

if ($core->config['Misc']['showbuildinfo'] && Brick::$builder->template->owner != "_sys"){
	if (function_exists('memory_get_usage')){
		$endMemory = memory_get_usage();
	}else{
		$endMemory = 0;
	}
	echo("
	<!-- 
	memory: ".($endMemory-$startMemory)."
	time: ".(round(getmicrotime()-$startTime, 6))."
	sql: ".($core->db->querycount)."
	-->
	");
}
?>