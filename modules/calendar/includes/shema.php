<?php
/**
 * Схема таблиц модуля
 * 
 * @version $Id: shema.php 162 2009-11-09 13:58:51Z roosit $
 * @package Abricos
 * @subpackage Calendar
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = CMSRegistry::$instance->modules->updateManager; 
$db = CMSRegistry::$instance->db;
$pfx = $db->prefix;

if ($updateManager->isInstall()){
	
	CMSRegistry::$instance->modules->GetModule('calendar')->permission->InstallDefault();

	// Таблица мероприятий
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."cdr_task (
		  `taskid` int(10) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL,
		  `title` varchar(250) NOT NULL default 'Заголовок задачи',
		  `descript` TEXT NOT NULL COMMENT 'Описание задачи',
		  `datebegin` int(10) unsigned NOT NULL default '0' COMMENT 'Время начала события',
		  `dateend` int(10) unsigned NOT NULL default '0' COMMENT 'Время окончания события',
		  `dateline` int(10) unsigned NOT NULL default '0' COMMENT 'Время создания события',
		  PRIMARY KEY  (`taskid`),
		  KEY `userid` (`userid`)
		)".$charset
	);
}

if ($updateManager->isUpdate('0.1.1')){
	
	// Расширение таблицы календаря
	// owner - основатель записи (префикс), например, 'cmpn' - запись 
	//   создана из модуля Company
	// permlevel - уровень доступа:
	//   0 - доступно создателю, 
	//   1 - доступно определенной групе,
	//   2 - доступно всем
	// tasktype - тип записи в календаре, например для модуля Company:
	//   0-простая запись, 
	//   1-совещание, 
	//   2-приглашение на совещание.
	// options - параметры, используются модулем создателя: 
	$db->query_write("
		ALTER TABLE `".$pfx."cdr_task` 
			ADD `owner` VARCHAR(5) DEFAULT 'cdr' NOT NULL,
			ADD `permlevel` TINYINT (2) UNSIGNED DEFAULT '0' NOT NULL,
			ADD `tasktype` TINYINT (2) UNSIGNED DEFAULT '0' NOT NULL,
			ADD `options` TEXT NOT NULL
	");
	$db->query_write("
		ALTER TABLE `".$pfx."cdr_task` ADD INDEX (`owner`)
	");
}

?>