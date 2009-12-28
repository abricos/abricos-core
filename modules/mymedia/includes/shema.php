<?php
/**
 * Схема таблиц модуля
 * 
 * @version $Id: shema.php 162 2009-11-09 13:58:51Z roosit $
 * @package Abricos
 * @subpackage MyMedia
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = CMSRegistry::$instance->modules->updateManager; 
$db = CMSRegistry::$instance->db;
$pfx = $db->prefix;

if ($updateManager->isInstall()){
	
	CMSRegistry::$instance->modules->GetModule('mymedia')->permission->InstallDefault();
	
	// Таблица альбомов
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."mm_album (
		  `albumid` int(10) unsigned NOT NULL auto_increment,
		  `parentalbumid` int(10) unsigned NOT NULL default '0',
		  `userid` int(10) unsigned NOT NULL ,
		  `albumname` varchar(250) NOT NULL default '0',
		  `albumdesc` TEXT NOT NULL,
		  `dateline` int(10) unsigned NOT NULL default '0' COMMENT 'Дата создания альбома',
		  PRIMARY KEY  (`albumid`),
		  KEY `userid` (`userid`)
		)".$charset
	);
	
	// Файлы в альбоме
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."mm_file (
		  `fileid` int(10) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL,
		  `albumid` int(10) unsigned NOT NULL,
		  `filehash` varchar(8) NOT NULL,
		  `contentid` int(10) unsigned NOT NULL COMMENT 'ID подписи файла, так же для модуля комментариев',
		  PRIMARY KEY  (`fileid`),
		  KEY `albumid` (`albumid`)
		)".$charset
	);

}

?>