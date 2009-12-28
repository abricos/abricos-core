<?php
/**
 * Схема таблиц модуля
 * 
 * @version $Id: shema.php 162 2009-11-09 13:58:51Z roosit $
 * @package Abricos
 * @subpackage FileManager
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = CMSRegistry::$instance->modules->updateManager; 
$db = CMSRegistry::$instance->db;
$pfx = $db->prefix;

if ($updateManager->isInstall()){
	/*
	// Таблица альбомов
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."foto_album (
		  `albumid` int(10) unsigned NOT NULL auto_increment,
		  `parentalbumid` int(10) unsigned NOT NULL default '0',
		  `userid` int(10) unsigned NOT NULL ,
		  `albumname` varchar(250) NOT NULL default '0',
		  PRIMARY KEY  (`albumid`)
		)".$charset
	);
	
	// Файлы в альбоме
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."foto_albumfiles (
		  `albumfilesid` int(10) unsigned NOT NULL auto_increment,
		  `albumid` int(10) unsigned NOT NULL,
		  `filehash` varchar(8) NOT NULL,
		  PRIMARY KEY  (`albumfilesid`)
		)".$charset
	);


	// Политика безопасности
	// permtype - безопасносить применяется к функциям:
	//  0 - модуля,
	//  1 - альбома пользователя.
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."foto_perm (
		  `permid` int(10) unsigned NOT NULL auto_increment,
		  `permtype` int(1) unsigned NOT NULL COMMENT 'Тип',
		  `isgroup` int(1) unsigned NOT NULL default '0' COMMENT '0 - пользователь, 1 - группа',
		  `userid` int(10) unsigned NOT NULL COMMENT 'Идентификатор группы или пользователя',
		  `mode` int(3) unsigned NOT NULL COMMENT 'Что именно разрешено',
		  PRIMARY KEY  (`permid`)
		)".$charset
	);
	/**/
}

?>