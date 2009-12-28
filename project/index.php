<?php
/**
* @version $Id$
* @package Abricos
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @link http://abricos.org
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

error_reporting(E_ALL & ~E_NOTICE);

define("DEBUG", true);
define('THIS_SCRIPT', 'index');
define('JUST_IN_CASE', 1);
define('TIMENOW', time());

/*
$startMemory = memory_get_usage();

function getmicrotime() {
	list($usec, $sec) = explode(" ",microtime());
	return ((float)$usec + (float)$sec);
}

$startTime = getmicrotime();
/**/
require_once('./global.php');

$cms = CMSRegistry::$instance;

// Основное управление сайтом ложится на системный модуль
$modSys = $cms->modules->GetModule('sys');
$modSys->Init();
$cms->session = $modSys->session;
$modSys->BuildOutput();

if ($cms->db->IsError()){
	echo($cms->db->errorText);
}
$cms->db->close();


/*
$endMemory = memory_get_usage();
echo("
<!-- 
mem  = ".($endMemory-$startMemory)."
time = ".(getmicrotime()-$startTime)."
-->
");
/**/
?>