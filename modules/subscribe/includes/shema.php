<?php
/**
 * Схема таблиц модуля
 * @version $Id$
 * @package CMSBrick
 * @subpackage Subscribe
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

global $cms;
$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$svers = $cms->modules->moduleUpdateShema->serverVersion;
$pfx = $cms->db->prefix."scb_";
$db = $cms->db;

if (version_compare($svers, "0.0.0", "==")){
	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."email` (
		  `emailid` int(10) unsigned NOT NULL auto_increment,
		  `contactname` varchar(250) NOT NULL default '',
		  `email` varchar(150) NOT NULL,
		  `status` int(3) unsigned NOT NULL default '0',
		  `dateline` int(10) unsigned NOT NULL default '0',
		  `code` varchar(32) NOT NULL default '',
		  `userid` int(10) unsigned NOT NULL default '0',
		  PRIMARY KEY  (`emailid`),
		  KEY `status` (`status`)
		)
		". $charset);

	$db->query_write("
		CREATE TABLE `".$pfx."message` (
		  `messageid` int(10) unsigned NOT NULL auto_increment,
		  `subject` varchar(250) NOT NULL,
		  `body` text NOT NULL,
		  `dateline` int(10) unsigned NOT NULL default '0',
		  `dateedit` int(10) unsigned NOT NULL default '0',
		  `datesend` int(10) unsigned NOT NULL default '0',
		  `module` varchar(50) NOT NULL default '',
		  PRIMARY KEY  (`messageid`)
		)
	". $charset);
	
	$db->query_write("
		ALTER TABLE `".$pfx."message` ADD `deldate` INT(10) UNSIGNED NOT NULL DEFAULT '0'
	");
	$db->query_write("
		ALTER TABLE `".$pfx."message` ADD INDEX (`deldate`)
	");
	$db->query_write("
		ALTER TABLE `".$pfx."message` ADD `templateid` INT(5) UNSIGNED NOT NULL DEFAULT '0' AFTER `messageid`
	");
	
	$db->query_write("
		CREATE TABLE `".$pfx."sender` (
		  `senderid` int(10) unsigned NOT NULL auto_increment,
		  `messageid` int(10) unsigned NOT NULL,
		  `emailid` int(10) unsigned NOT NULL,
		  `status` int(1) unsigned NOT NULL default '0',
		  `datesend` int(10) unsigned NOT NULL default '0',
		  PRIMARY KEY  (`senderid`)
		)
	". $charset);

	$db->query_write("
		CREATE TABLE `".$pfx."config` (
		  `configid` INT(10) unsigned NOT NULL auto_increment,
		  `cfgtype` INT(2) unsigned NOT NULL default '0',
		  `cfgname` varchar(250) NOT NULL,
		  `cfgvalue` text,
		  PRIMARY KEY (`configid`),
		  KEY `cfgname` (`cfgname`)
		)
	". $charset);
	
	$db->query_write("
		INSERT INTO `".$pfx."config`
		(cfgname, cfgvalue) VALUES
		('frommail', ''),
		('testmail', '')
	");
}

if (version_compare($svers, "1.0.5", "<")){
	$db->query_write("
		CREATE TABLE `".$pfx."template` (
		  `templateid` INT(4) unsigned NOT NULL auto_increment,
		  `name` varchar(100) NOT NULL,
		  `body` text,
		  PRIMARY KEY (`templateid`)
		)
	". $charset);
	
	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."attachment` (
			`attachmentid` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT ,
			`filehash` VARCHAR(8) NOT NULL ,
			`ownerid` INT(6) UNSIGNED NOT NULL ,
			`ownertype` INT(1) UNSIGNED NOT NULL ,
			`fromserver` INT(1) UNSIGNED NOT NULL default '0',
			PRIMARY KEY (`attachmentid`),
			INDEX ( `ownerid` )
		)
	". $charset);
}

if (version_compare($svers, "1.0.9", "<")){
	$db->query_write("
		ALTER TABLE `".$pfx."email` ADD `deldate` INT(10) UNSIGNED NOT NULL DEFAULT '0'
	");
}

?>