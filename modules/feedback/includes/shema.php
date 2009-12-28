<?php
/**
 * Структура таблиц модуля
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Feedback
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */


$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = CMSRegistry::$instance->modules->updateManager; 
$db = CMSRegistry::$instance->db;
$pfx = $db->prefix;

if ($updateManager->isInstall()){
	
	// таблица сообщений
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."fb_message (
		  `messageid` int(10) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL default '0' COMMENT 'идентификатор пользователя, 0-гость',
		  `globalmessageid` varchar(32) NOT NULL default '' COMMENT 'глобальный идентификатор сообщения',
		  `fio` varchar(250) NOT NULL default '' COMMENT 'Контактное лицо',
		  `phone` varchar(250) NOT NULL default '' COMMENT 'Телефон',
		  `email` varchar(250) NOT NULL default '' COMMENT 'E-mail',
		  `message` TEXT NOT NULL COMMENT 'Сообщение',
		  `status` int(1) unsigned NOT NULL default '0' COMMENT 'Статус: 0-поступившее, 1-был дан ответ',
		  `owner` varchar(30) NOT NULL default '' COMMENT 'Модуль со страниц которого поступило сообщение',
		  `ownerparam` TEXT NOT NULL COMMENT 'Пар-ры в JSON формате',
		  `dateline` int(10) unsigned NOT NULL default '0',
		  `deldate` int(10) unsigned NOT NULL default '0',
		  PRIMARY KEY  (`messageid`)
		 )".$charset
	);

	// ответы администрации сайта
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."fb_reply (
		  `replyid` int(10) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL default '0' COMMENT 'идентификатор пользователя' ,
		  `messageid` int(10) unsigned NOT NULL default '0' COMMENT 'идентификатор сообщения' ,
		  `body` TEXT NOT NULL,
		  `dateline` int(10) unsigned NOT NULL default '0',
		  `deldate` int(10) unsigned NOT NULL default '0',
		  PRIMARY KEY  (`replyid`)
		 )".$charset
	);

	// администраторы
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."fb_admin (
		  `adminid` int(10) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL default '0' COMMENT 'идентификатор пользователя' ,
		  PRIMARY KEY  (`adminid`)
		 )".$charset
	);
	
}
?>