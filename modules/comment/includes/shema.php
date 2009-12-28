<?php
/**
 * Схема таблиц модуля
 * @version $Id$
 * @package Abricos
 * @subpackage Comment
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = CMSRegistry::$instance->modules->updateManager; 
$db = CMSRegistry::$instance->db;
$pfx = $db->prefix;

if ($updateManager->isInstall()){
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."cmt_comment (
		  `commentid` int(10) UNSIGNED NOT NULL auto_increment,
		  `parentcommentid` int(10) UNSIGNED NOT NULL,
		  `contentid` int(10) UNSIGNED NOT NULL,
		  `userid` int(10) UNSIGNED NOT NULL,
		  `dateline` int(10) UNSIGNED NOT NULL,
		  `dateedit` int(10) UNSIGNED NOT NULL,
		  `deldate` int(10) UNSIGNED NOT NULL DEFAULT '0',
		  `body` text NOT NULL,
		  `status` int(2) UNSIGNED NOT NULL DEFAULT '0',
		  PRIMARY KEY  (`commentid`),
		  KEY `dateedit` (`dateedit`),
		  KEY `contentid` (`contentid`)
		)".$charset
	);
}

if ($updateManager->isInstall() || $updateManager->isUpdate('0.3')){
	CMSRegistry::$instance->modules->GetModule('comment')->permission->InstallDefault();
}

?>