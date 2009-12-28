<?php
/**
 * Схема таблиц модуля
 * 
 * @version $Id: shema.php 162 2009-11-09 13:58:51Z roosit $
 * @package Abricos
 * @subpackage Company
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = CMSRegistry::$instance->modules->updateManager; 
$db = CMSRegistry::$instance->db;
$pfx = $db->prefix;

$modCalendar = CMSRegistry::$instance->modules->GetModule('calendar'); 
$modCompany = CMSRegistry::$instance->modules->GetModule('company'); 

if ($updateManager->isInstall()){
	
	$modCompany->permission->InstallDefault();

	// Таблица сотрудников
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."cmpn_employee (
		  `employeeid` int(10) unsigned NOT NULL auto_increment,
		  `userid` int(10) unsigned NOT NULL,
		  `lastname` varchar(50) NOT NULL default '' COMMENT 'Фамилия',
		  `firstname` varchar(50) NOT NULL default '' COMMENT 'Имя',
		  `patronymic` varchar(50) NOT NULL default '' COMMENT 'Отчество',
		  `postid` int(3) unsigned NOT NULL default '0' COMMENT 'Идентификатор должности',
		  `deptid` int(3) unsigned NOT NULL default '0' COMMENT 'Идентификатор отдела',
		  `phones` varchar(200) NOT NULL default '' COMMENT 'Номера телефонов',
		  `room` varchar(20) NOT NULL default '' COMMENT 'Номер кабинета',
		  `dateline` int(10) unsigned NOT NULL default '0' COMMENT 'Дата добавления сотрудника',
		  `deldate` int(10) unsigned NOT NULL default '0' COMMENT 'Дата удаления',
		  PRIMARY KEY  (`employeeid`),
		  KEY `userid` (`userid`)
		)".$charset
	);
	
	// Справочник должностей
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."cmpn_post (
		  `postid` int(3) unsigned NOT NULL auto_increment,
		  `name` varchar(250) NOT NULL default '' COMMENT 'Наименование должности',
		  `level` int(3) unsigned NOT NULL Default 0 COMMENT 'Уровень авторитета должности, 0-наивысший',
		  PRIMARY KEY  (`postid`)
		)".$charset
	);

	// Справочник отделов
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."cmpn_dept (
		  `deptid` int(3) unsigned NOT NULL auto_increment,
		  `name` varchar(250) NOT NULL default '' COMMENT 'Наименование отдела',
		  `ord` int(3) unsigned NOT NULL Default 0 COMMENT 'Сортировка',
		  PRIMARY KEY  (`deptid`)
		)".$charset
	);
}

if ($updateManager->isUpdate('0.1.1')){
	// Настройки доступа к календарю
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."cmpn_calperm (
		  `calpermid` int(10) unsigned NOT NULL auto_increment,
		  `employeeid` int(10) unsigned NOT NULL default '0',
		  `calin` TEXT NOT NULL COMMENT 'Смотреть календарь: ID сотрудников через запятую с префиксом #',
		  `calout` TEXT NOT NULL COMMENT 'Разрешить смотреть календарь: ID сотрудников через запятую с префиксом #',
		  `options` TEXT NOT NULL COMMENT 'Дополнительные настройки календаря',
		  PRIMARY KEY  (`calpermid`),
		  KEY `employeeid` (`employeeid`)
		)".$charset
	);
}

if ($updateManager->isUpdate('0.1.2')){
	$db->query_write("DROP TABLE IF EXISTS ".$pfx."cmpn_caltask");
	
	if (!empty($modCalendar)){
		$db->query_write("
			UPDATE `".$pfx."cdr_task` 
			SET 
				permlevel=1,
				owner='cmpn'
		");
	}
}

?>