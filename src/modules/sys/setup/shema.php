<?php
/**
 * @package Abricos
 * @subpackage Core
 * @copyright 2008-2016 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @link http://abricos.org
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = Ab_UpdateManager::$current;
$db = Abricos::$db;
$pfx = $db->prefix;

if ($updateManager->isInstall()){
    Ab_UpdateManager::$isCoreInstall = true;

    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."content (
		  contentid int(8) unsigned NOT NULL auto_increment,
		  body longtext,
		  dateline int(10) unsigned NOT NULL,
		  deldate int(10) unsigned NOT NULL default '0',
		  modman varchar(30) NOT NULL default '',
		  PRIMARY KEY  (contentid)
		)".$charset
    );

    // Кеш собранных кирпичей
    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."sys_cache (
		  cacheid int(10) unsigned NOT NULL auto_increment,
		  module varchar(50) NOT NULL DEFAULT '' COMMENT 'Имя модуля',
		  name varchar(50) NOT NULL DEFAULT '',
		  body text NOT NULL,
		  upddate int(10) unsigned NOT NULL default '0' COMMENT 'Время кеширования',
		  PRIMARY KEY (cacheid),
		  KEY module (module),
		  KEY name (name)
		)".$charset
    );

    // Кирпич
    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."sys_brick (
		  brickid int(10) unsigned NOT NULL auto_increment,
		  owner varchar(50) NOT NULL DEFAULT '' COMMENT 'Источник: шаблон - имя папки, кирпич - имя модуля',
		  name varchar(50) NOT NULL DEFAULT '',
		  body TEXT NOT NULL,
		  bricktype int(2) unsigned NOT NULL default '0' COMMENT 'Тип кирпича: 0-кирпич, 1-шаблон',
		  comments TEXT COMMENT 'Комментарии',
		  dateline int(10) unsigned NOT NULL default '0',
		  upddate int(10) unsigned NOT NULL default '0' COMMENT 'Исправлен пользователем',
		  deldate int(10) unsigned NOT NULL default '0',
		  hash varchar(32) NOT NULL DEFAULT '' COMMENT 'Версия(хеш) параметров',
		  PRIMARY KEY (brickid),
		  KEY folder (owner),
		  KEY name (name)
		  )".$charset
    );

    // параметры кирпича
    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."sys_brickparam (
		  brickparamid int(10) unsigned NOT NULL auto_increment,
		  brickid int(10) UNSIGNED NOT NULL DEFAULT '0',
		  paramtype int(2) unsigned NOT NULL default '0',
		  name varchar(50) NOT NULL DEFAULT '',
		  paramvalue text NOT NULL,
		  upddate int(10) unsigned NOT NULL default '0' COMMENT 'Исправлен пользователем',
		  PRIMARY KEY (brickparamid),
		  KEY name (name)
		)".$charset
    );

    // Фразы
    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."sys_phrase (
		  phraseid int(10) unsigned NOT NULL auto_increment,
		  module varchar(32) NOT NULL DEFAULT '',
		  name varchar(50) NOT NULL DEFAULT '',
		  phrase text NOT NULL,
		  language char(2) NOT NULL DEFAULT 'ru',
		  dateline int(10) unsigned NOT NULL default '0',
		  upddate int(10) unsigned NOT NULL default '0',
		  deldate int(10) unsigned NOT NULL default '0',
		  PRIMARY KEY (phraseid),
		  KEY module (module),
		  KEY name (name)
		)".$charset
    );
}

if ($updateManager->isUpdate('0.5.3')){
    $db->query_write("DROP TABLE IF EXISTS ".$pfx."sys_permission");

    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."sys_modaction (
		  modactionid int(10) unsigned NOT NULL auto_increment,
		  module varchar(50) NOT NULL DEFAULT '' COMMENT 'Имя модуля',
		  action int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Действие',
		  PRIMARY KEY  (modactionid),
		  UNIQUE KEY modaction (module,action)
		)".$charset
    );
}

if ($updateManager->isUpdate('0.5.5')){
    Abricos::GetModule('sys')->permission->Install();
}
