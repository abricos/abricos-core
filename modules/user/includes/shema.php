<?php
/**
 * Схема таблиц данного модуля.
 * 
 * @version $Id: shema.php 270 2009-12-28 13:24:34Z roosit $
 * @package Abricos
 * @subpackage Sys
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = CMSRegistry::$instance->modules->updateManager; 
$db = CMSRegistry::$instance->db;
$pfx = $db->prefix;

if ($updateManager->isInstall()){
		$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."session` (
		  `sessionhash` char(32) NOT NULL default '',
		  `userid` int(10) unsigned NOT NULL default '0',
		  `host` char(15) NOT NULL default '',
		  `idhash` char(32) NOT NULL default '',
		  `lastactivity` int(10) unsigned NOT NULL default '0',
		  `location` char(255) NOT NULL default '',
		  `useragent` char(100) NOT NULL default '',
		  `loggedin` smallint(5) unsigned NOT NULL default '0',
		  `badlocation` smallint(5) unsigned NOT NULL default '0',
		  `bypass` tinyint(4) NOT NULL default '0',
		  PRIMARY KEY  (`sessionhash`)
		)".$charset
	);
	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."user` (
		  `userid` int(10) unsigned NOT NULL auto_increment,
		  `usergroupid` int(4) unsigned NOT NULL default '0',
		  `username` varchar(150) NOT NULL default '',
		  `password` varchar(32) NOT NULL default '',
		  `email` varchar(100) NOT NULL default '',
		  `realname` varchar(150) NOT NULL default '',
		  `sex` TINYINT(1) NOT NULL default '0' COMMENT 'Пол: 0-не указан,1-мужской,2-женский',
		  `homepagename` varchar(150) NOT NULL default '' COMMENT 'Название сайта',
		  `homepage` varchar(100) NOT NULL default '' COMMENT 'Адрес сайта',
		  `icq` varchar(20) NOT NULL default '',
		  `aim` varchar(20) NOT NULL default '',
		  `yahoo` varchar(32) NOT NULL default '',
		  `msn` varchar(100) NOT NULL default '',
		  `skype` varchar(32) NOT NULL default '',
		  `joindate` int(10) unsigned NOT NULL default '0',
		  `lastvisit` int(10) unsigned NOT NULL default '0',
		  `birthday` int(10) unsigned NOT NULL default '0',
		  `ipadress` varchar(15) NOT NULL default '',
		  `salt` char(3) NOT NULL default '',
		  `deldate` int(10) NOT NULL default '0',
		  PRIMARY KEY  (`userid`),
		  KEY `username` (`username`)
		)".$charset
	);
	
	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."useractivate` (
		  `useractivateid` int(10) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL,
		  `activateid` int(10) unsigned NOT NULL,
		  `joindate` int(10) unsigned NOT NULL,
		  PRIMARY KEY  (`useractivateid`)
		)".$charset
	);
	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."usergroup` (
		  `usergroupid` int(4) unsigned NOT NULL auto_increment,
		  `name` varchar(100) NOT NULL default '',
		  `levelpermission` int(4) NOT NULL default '0',
		  PRIMARY KEY  (`usergroupid`)
		)".$charset
	);
	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."userpwdreq` (
		  `pwdreqid` int(10) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL,
		  `hash` varchar(32) NOT NULL,
		  `dateline` int(10) unsigned NOT NULL,
		  `counteml` int(2) NOT NULL default '0',
		  PRIMARY KEY  (`pwdreqid`)
		)".$charset
	);
	
	// добавление в таблицу администратора
	$db->query_write("
		INSERT INTO `".$pfx."user` (`usergroupid`, `username`, `password`, `email`, `joindate`, `lastvisit`, `salt`) VALUES
		(6, 'admin', '3f5726cdbe88eac915ffb9e981b72682', 'admin@example.com', ".TIMENOW.", '', '( R');
	");
	
}

// обновление для платформы Abricos версии 0.5
if ($updateManager->isInstall() || $updateManager->serverVersion === '1.0.1'){
	
	CMSRegistry::$instance->modules->GetModule('user')->permission->InstallDefault();
	
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."userconfig (
		  `userconfigid` int(10) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL,
		  `module` varchar(50) NOT NULL DEFAULT '' COMMENT 'Имя модуля',
		  `optname` varchar(25) NOT NULL DEFAULT '' COMMENT 'Имя параметра',
		  `optvalue` TEXT NOT NULL COMMENT 'Значение параметра',
		  PRIMARY KEY  (`userconfigid`),
		  KEY `module` (`module`),
		  KEY `userid` (`userid`)
	  )".$charset
	);
}

?>