<?php
/**
 * Структура таблиц модуля
 * 
 * @version $Id$
 * @package CMSBrick
 * @subpackage News
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

global $cms;
$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$svers = $cms->modules->moduleUpdateShema->serverVersion;
$db = $cms->db;
$pfx = $db->prefix;

if (version_compare($svers, "1.0.1", "<")){
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."ns_cat (
		  `catid` int(10) unsigned NOT NULL auto_increment,
		  `parentcatid` int(10) unsigned NOT NULL,
		  `name` varchar(250) NOT NULL,
		  `phrase` varchar(250) NOT NULL,
		  PRIMARY KEY  (`catid`)
		)".$charset
	);
	
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."ns_news (
		  `newsid` int(10) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL,
		  `dateline` int(10) unsigned NOT NULL default '0',
		  `dateedit` int(10) unsigned NOT NULL default '0',
		  `deldate` int(10) unsigned NOT NULL default '0',
		  `contentid` int(10) unsigned NOT NULL,
		  `title` varchar(200) NOT NULL,
		  `intro` text NOT NULL,
		  `imageid` varchar(8) default NULL,
		  `published` int(10) unsigned NOT NULL default '0',
		  `source_name` varchar(200) default NULL,
		  `source_link` varchar(200) default NULL,
		  PRIMARY KEY  (`newsid`)
		)".$charset
	);
}
?>