<?php
/**
 * Схема таблиц данного модуля.
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Sys
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @ignore
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = Ab_UpdateManager::$current; 
$db = Abricos::$db;
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
		  `language` CHAR(2) NOT NULL DEFAULT 'en', 
		  `usergroupid` int(4) unsigned NOT NULL default '0',
		  `username` varchar(150) NOT NULL default '',
		  `password` varchar(32) NOT NULL default '',
		  `email` varchar(100) NOT NULL default '',
		  `joindate` int(10) unsigned NOT NULL default '0',
		  `lastvisit` int(10) unsigned NOT NULL default '0',
		  `agreement` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
		  `ipadress` varchar(15) NOT NULL default '',
		  `salt` char(3) NOT NULL default '',
		  `upddate` int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата обновления',
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
		INSERT INTO `".$pfx."user` (`language`, `usergroupid`, `username`, `password`, `email`, `joindate`, `salt`) VALUES
		('".Abricos::$LNG."', 6, 'admin', '3f5726cdbe88eac915ffb9e981b72682', '', ".TIMENOW.", '( R');
	");
	
}

// обновление для платформы Abricos версии 0.5
if ($updateManager->isInstall() || $updateManager->serverVersion === '1.0.1'){
	$updateManager->serverVersion = '0.2';
	
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."userconfig (
		  `userconfigid` int(10) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL,
		  `module` varchar(50) NOT NULL DEFAULT '' COMMENT 'Имя модуля',
		  `optname` varchar(25) NOT NULL DEFAULT '' COMMENT 'Имя параметра',
		  `optvalue` TEXT NOT NULL COMMENT 'Значение параметра',
		  PRIMARY KEY  (`userconfigid`),
		  UNIQUE KEY `configvar` (`userid`,`module`,`optname`),
		  KEY `module` (`module`),
		  KEY `userid` (`userid`)
	  )".$charset
	);
}
$createGroupTable = false;
if ($updateManager->isUpdate('0.2.1')){

	$db->query_write("DROP TABLE IF EXISTS `".$pfx."usergroup`");
	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."group` (
		  `groupid` int(5) unsigned NOT NULL auto_increment,
		  `groupname` varchar(100) NOT NULL default '' COMMENT 'Наименование группы',
		  `groupkey` varchar(32) NOT NULL DEFAULT '' COMMENT 'Идентификатор группы в ядре',
		  PRIMARY KEY  (`groupid`)
		)".$charset
	);
	
	// заполнение таблицы групп пользователей
	$db->query_write("
		INSERT INTO `".$pfx."group` (`groupid`, `groupname`, `groupkey`) VALUES
		(1, 'Guest', 			'guest'),
		(2, 'Registered', 		'register'),
		(3, 'Administrator', 	'admin')
	");
	$createGroupTable = true;

	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."usergroup` (
		  `usergroupid` int(5) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL,
		  `groupid` int(5) unsigned NOT NULL,
		  PRIMARY KEY  (`usergroupid`),
		  UNIQUE KEY `usergroup` (`userid`,`groupid`)
		)".$charset
	);
	
	$db->query_write("
		INSERT IGNORE INTO `".$pfx."usergroup` (`userid`, `groupid`)  
		SELECT 
			userid, 
			CASE usergroupid WHEN 6 THEN 3 ELSE 2 END
		FROM `".$pfx."user`
	");
	$db->query_write("ALTER TABLE `".$pfx."user` DROP `usergroupid`");  
	
	$db->query_write("ALTER TABLE `".$pfx."user` ADD `emailconfirm` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0 AFTER `email`");  
	$db->query_write("
		UPDATE `".$pfx."user`
		SET
			`emailconfirm`=1
		WHERE lastvisit > 0 OR userid=1
	");  
	
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."userrole (
		  `roleid` int(10) unsigned NOT NULL auto_increment,
		  `modactionid` int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Идентификатор действия',
		  `usertype` tinyint(1) unsigned NOT NULL default 0 COMMENT '0 - группа, 1 - пользователь',
		  `userid` int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Идентификатор пользователя/группы в зависимости от usertype',
		  `status` tinyint(1) unsigned NOT NULL default 0 COMMENT '1 - разрешено, 0 - запрещено',
		  PRIMARY KEY  (`roleid`),
		  KEY `userid` (`userid`),
		  UNIQUE KEY `userrole` (`modactionid`,`userid`,`usertype`)
		)".$charset
	);
	Abricos::GetModule('user')->permission->Install();
	
	$db->query_write("ALTER TABLE `".$pfx."user` DROP INDEX `username`, ADD UNIQUE `username` ( `username` )");  
}

if ($updateManager->isUpdate('0.2.2')){
	// удалить все второстепенные поля, для работы новой технологии 
	// хранения этих полей, такие как Фамилия, Имя и т.п.
	// по умолчанию таблица пользователей будет содержать только основные 
	// рабочие поля

	$rows = $db->query_read("SHOW COLUMNS FROM ".$pfx."user");
	$cols = array();
	while (($row = $db->fetch_array($rows))){
		$cols[$row['Field']] = $row; 
	}
	if (!empty($cols['realname']))
		$db->query_write("ALTER TABLE `".$pfx."user` DROP `realname`");  
	if (!empty($cols['sex']))
		$db->query_write("ALTER TABLE `".$pfx."user` DROP `sex`");  
	if (!empty($cols['homepagename']))
		$db->query_write("ALTER TABLE `".$pfx."user` DROP `homepagename`");  
	if (!empty($cols['homepage']))
		$db->query_write("ALTER TABLE `".$pfx."user` DROP `homepage`");  
	if (!empty($cols['icq']))
		$db->query_write("ALTER TABLE `".$pfx."user` DROP `icq`");  
	if (!empty($cols['aim']))
		$db->query_write("ALTER TABLE `".$pfx."user` DROP `aim`");  
	if (!empty($cols['yahoo']))
		$db->query_write("ALTER TABLE `".$pfx."user` DROP `yahoo`");  
	if (!empty($cols['msn']))
		$db->query_write("ALTER TABLE `".$pfx."user` DROP `msn`");  
	if (!empty($cols['skype']))
		$db->query_write("ALTER TABLE `".$pfx."user` DROP `skype`");  
	if (!empty($cols['birthday']))
		$db->query_write("ALTER TABLE `".$pfx."user` DROP `birthday`");
}
if ($updateManager->isUpdate('0.2.3') && !$updateManager->isInstall()){
	if (!$createGroupTable){
		$db->query_write("
			ALTER TABLE `".$pfx."group` ADD `groupkey` varchar(32) NOT NULL DEFAULT '' COMMENT 'Глобальный идентификатор группы в ядре'
		");
	}

	$db->query_write("UPDATE `".$pfx."group` SET groupkey='guest' WHERE groupid=1");
	$db->query_write("UPDATE `".$pfx."group` SET groupkey='register' WHERE groupid=2");
	$db->query_write("UPDATE `".$pfx."group` SET groupkey='admin' WHERE groupid=3");
}

if ($updateManager->isUpdate('0.2.5') && !$updateManager->isInstall()){
	$db->query_write("
		ALTER TABLE `".$pfx."user` ADD `language` CHAR(2) NOT NULL DEFAULT 'ru' AFTER `userid`
	");
}

if ($updateManager->isUpdate('0.2.5.1') && !$updateManager->isInstall()){
	$db->query_write("
		ALTER TABLE `".$pfx."userconfig` ADD UNIQUE `configvar` (`userid`, `module`, `optname`)
	");
}

if ($updateManager->isUpdate('0.2.5.2') && !$updateManager->isInstall()){
	$db->query_write("
		ALTER TABLE `".$pfx."user` ADD `agreement` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0
	");
}


if ($updateManager->isUpdate('0.2.5.3')){
	
	// логи входа дубликатов
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."userdoublelog (
			`doublelogid` int(10) unsigned NOT NULL auto_increment,
			`userid` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '',
			`doubleuserid` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '',
			`ipadress` varchar(15) NOT NULL default '',
			`dateline` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '',
			PRIMARY KEY  (`doublelogid`)
		)".$charset
	);

	// дубликаты
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."userdouble (
			`userid` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '',
			`doubleuserid` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '',
			`dateline` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '',
		  	UNIQUE KEY `userdouble` (`userid`,`doubleuserid`)
		)".$charset
	);
	
}

if ($updateManager->isUpdate('0.2.5.4') && !$updateManager->isInstall()){
	$db->query_write("
		ALTER TABLE `".$pfx."user` ADD `upddate` int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата обновления'
	");
}


?>