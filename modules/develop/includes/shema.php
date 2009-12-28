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

	// Таблица пользователей, которые не нуждаются в премодерации 
	// их приложений.
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."dev_userprof (
		  `userprofid` int(10) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL ,
		  PRIMARY KEY  (`userprofid`)
		)".$charset
	);
	
	// Приложение
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."dev_app (
		  `appid` int(10) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL ,
		  `appname` varchar(250) NOT NULL default '',
		  `appdesc` varchar(250) NOT NULL default '' COMMENT 'Краткое описание приложения',
		  PRIMARY KEY  (`appid`)
		)".$charset
	);

	// Версия приложения
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."dev_version (
		  `versionid` int(10) unsigned NOT NULL auto_increment,
		  `appid` int(10) unsigned NOT NULL ,
		  `version` varchar(25) NOT NULL default '0.1',
		  PRIMARY KEY  (`versionid`)
		)".$charset
	);
	
	// Исходный код приложения
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."dev_source (
			`sourceid` int(10) unsigned NOT NULL auto_increment,
			`versionid` int(10) unsigned NOT NULL COMMENT 'Идентификатор версии приложения',
			`filetype` int(2) unsigned NOT NULL default '0' COMMENT 'Тип файла: 0-исходный код, 1-шаблон, 2-локализация',
			`language` varchar(2) NOT NULL default 'ru' COMMENT 'Идентификатор локализации',
			`source` TEXT,
			PRIMARY KEY  (`sourceid`)
		)".$charset
	);
}

?>