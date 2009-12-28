<?php
/**
 * Схема таблиц модуля
 * @version $Id$
 * @package CMSBrick
 * @subpackage FileManager
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$cms = CMSRegistry::$instance;
$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$svers = $cms->modules->moduleUpdateShema->serverVersion;
$pfx = $cms->db->prefix;
$db = $cms->db;

if (version_compare($svers, "0.0.0", "==")){
	
	// таблица файлов
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."fm_file (
		  `fileid` int(10) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL,
		  `filehash` varchar(8) NOT NULL,
		  `filename` varchar(250) NOT NULL,
		  `filedata` mediumblob,
		  `filesize` int(10) unsigned NOT NULL,
		  `extension` varchar(20) NOT NULL,
		  `counter` int(10) unsigned NOT NULL default '0',
		  `lastget` int(10) unsigned NOT NULL default '0',
		  `dateline` int(10) unsigned NOT NULL,
		  `deldate` int(10) unsigned NOT NULL default '0',
		  `attribute` int(6) unsigned NOT NULL default '0',
		  `isimage` int(1) unsigned NOT NULL default '0',
		  `imgwidth` int(6) unsigned NOT NULL default '0',
		  `imgheight` int(6) unsigned NOT NULL default '0',
		  `folderid` int(10) unsigned NOT NULL default '0',
		  PRIMARY KEY  (`fileid`),
		  UNIQUE KEY `filehash` (`filehash`),
		  KEY `userid` (`userid`)
		)".$charset
	);
	
	// таблица типов файлов и их параметры
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."fm_filetype (
		  `filetypeid` int(5) unsigned NOT NULL auto_increment,
		  `extension` varchar(20) NOT NULL default '',
		  `usergroupid` int(5) unsigned NOT NULL,
		  `mimetype` varchar(50) NOT NULL default '',
		  `maxsize` int(10) unsigned NOT NULL default '0',
		  `maxwidth` int(5) unsigned NOT NULL default '0',
		  `maxheight` int(5) unsigned NOT NULL default '0',
		  `disable` tinyint(1) unsigned NOT NULL default '0',
		  PRIMARY KEY  (`filetypeid`),
		  KEY `usergroupid` (`usergroupid`)
		)".$charset
	);
	
	// список разрешеных типов файлов и их параметры
	$db->query_write("
		INSERT INTO `".$pfx."fm_filetype` 
		(`filetypeid`, `extension`, `usergroupid`, `mimetype`, `maxsize`, `maxwidth`, `maxheight`, `disable`) VALUES 
		(1, 'bmp', 0, '', 307200, 1024, 768, 0),
		(2, 'doc', 0, 'application/msword', 307200, 0, 0, 0),
		(3, 'gif', 0, 'image/gif', 307200, 1024, 768, 0),
		(4, 'jpe', 0, '', 307200, 1024, 768, 0),
		(5, 'jpeg', 0, '', 307200, 1024, 768, 0),
		(6, 'jpg', 0, 'image/jpeg', 307200, 1600, 1600, 0),
		(7, 'pdf', 0, 'application/pdf', 51200, 0, 0, 0),
		(8, 'png', 0, 'image/png', 307200, 1024, 768, 0),
		(9, 'rar', 0, 'application/rar', 102400, 0, 0, 0),
		(10, 'txt', 0, 'text/plain', 51200, 0, 0, 0),
		(11, 'zip', 0, 'application/zip', 102400, 0, 0, 0)	
	");
	
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."fm_folder (
		  `folderid` int(10) unsigned NOT NULL auto_increment,
		  `parentfolderid` int(10) unsigned NOT NULL default '0',
		  `userid` int(10) unsigned NOT NULL,
		  `name` varchar(100) NOT NULL,
		  `phrase` varchar(250) NOT NULL,
		  `dateline` int(10) unsigned NOT NULL default '0',
		  `deldate` int(10) unsigned NOT NULL default '0',
		  PRIMARY KEY  (`folderid`),
		  KEY `parentfolderid` (`parentfolderid`,`userid`)
		)".$charset
	);
	
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."fm_imgprev (
		  `imgprevid` int(10) unsigned NOT NULL auto_increment,
		  `filehashsrc` varchar(8) NOT NULL,
		  `width` int(6) NOT NULL,
		  `height` int(6) NOT NULL,
		  `cnv` varchar(20) default NULL,
		  `filehashdst` varchar(8) NOT NULL,
		  PRIMARY KEY  (`imgprevid`),
		  KEY `filehashsrc` (`filehashsrc`)
		)".$charset
	);
	
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."fm_usergrouplimit (
		  `usergrouplimitid` int(4) unsigned NOT NULL auto_increment,
		  `usergroupid` int(4) unsigned NOT NULL,
		  `flimit` int(10) unsigned NOT NULL,
		  PRIMARY KEY  (`usergrouplimitid`)
		)".$charset
	);

	// лимиты объема файлов на группу пользователей
	$db->query_write("
		INSERT INTO `".$pfx."fm_usergrouplimit` (`usergrouplimitid`, `usergroupid`, `flimit`) VALUES 
		(1, 3, 5242880),
		(2, 5, 15728640),
		(3, 6, 104857600)
	");
}

if (version_compare($svers, "1.0.2", "<")){
	
	$db->query_write("
		ALTER TABLE `".$pfx."fm_file` ADD `title` VARCHAR( 250 ) NOT NULL AFTER `filename`
	");

	// таблица для хранения изменений в редакторе картинок
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."fm_editor (
		  `editorid` int(10) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL COMMENT 'Идентификатор пользователя',
		  `filehashsrc` varchar(8) NOT NULL COMMENT 'Картинка источник',
		  `width` int(6) unsigned NOT NULL DEFAULT 0,
		  `height` int(6) unsigned NOT NULL DEFAULT 0,
		  `left` int(6) unsigned NOT NULL DEFAULT 0,
		  `top` int(6) unsigned NOT NULL DEFAULT 0,
		  `tools` varchar(20) default NULL,
		  `filehashdst` varchar(8) NOT NULL,
		  `dateline` int(10) unsigned NOT NULL DEFAULT 0,
		  `session` int(10) unsigned NOT NULL DEFAULT 0,
		  PRIMARY KEY  (`editorid`),
		  KEY `filehashsrc` (`filehashsrc`)
		)".$charset
	);
}
?>