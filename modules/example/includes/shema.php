<?php
/**
 * Схема таблиц модуля
 * 
 * @version $Id$
 * @package CMSBrick
 * @subpackage Example
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$cms = CMSRegistry::$instance;
$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$svers = $cms->modules->moduleUpdateShema->serverVersion;
$db = $cms->db;
$pfx = $db->prefix;

if (version_compare($svers, "1.0.0", "<")){
	
	// таблица сообщений
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."ex_message (
		  `messageid` int(10) unsigned NOT NULL auto_increment,
		  `message` TEXT NOT NULL COMMENT 'Сообщение',
		  PRIMARY KEY  (`messageid`)
		 )".$charset
	);
	
}
?>