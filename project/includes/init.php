<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

if (!defined('JUST_IN_CASE')){ exit; }

if (isset($_REQUEST['GLOBALS']) OR isset($_FILES['GLOBALS'])){
	echo 'Request tainting attempted.';
	exit;
}

if (!defined('CWD')){
	define('CWD', (($getcwd = getcwd()) ? $getcwd : '.'));
}

require_once(CWD . '/includes/global_define.php');
require_once(CWD . '/includes/functions.php');
require_once(CWD . '/includes/cmsregistry.php');

$cms = new CMSRegistry();
$cms->fetch_config();
CMSRegistry::$instance = $cms;

if (empty($cms->config['Misc']['language'])){
	$cms->config['Misc']['language'] = 'ru';
}

define('LNG', $cms->config['Misc']['language']);

$db = new CMSMySqlDB($cms);
$db->connect(
	$cms->config['Database']['dbname'],
	$cms->config['Server']['servername'],
	$cms->config['Server']['port'],
	$cms->config['Server']['username'],
	$cms->config['Server']['password']
);
$db->readonly = $cms->config['Database']['readonly'];

$cms->db = $db;
$cms->Init();

function __autoload($class_name) {
	$class_name = strtolower($class_name);
	global $cms;
	if (!empty($cms->modules->currentRegisterModuleName)){
		$script = CWD .'/modules/' . 
			$cms->modules->currentRegisterModuleName . 
			'/includes/' . $class_name . '.php';
	}else{
		$script = CWD.'/includes/'. $class_name . '.php';
	}
	
	if (!file_exists($script)){ return; }
  require_once($script);
}
?>