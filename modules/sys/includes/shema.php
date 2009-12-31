<?php
/**
 * Схема таблиц данного модуля.
 * 
 * @version $Id$
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
		CREATE TABLE IF NOT EXISTS `".$pfx."content` (
		  `contentid` int(8) unsigned NOT NULL auto_increment,
		  `body` longtext,
		  `dateline` int(10) unsigned NOT NULL,
		  `deldate` int(10) unsigned NOT NULL default '0',
		  `modman` varchar(30) NOT NULL default '',
		  PRIMARY KEY  (`contentid`)
		)".$charset
	);

	$mainpage = "
<h1>Добро пожаловать!</h1>
<p>Поздравляем! Платформа <a href='http://abricos.org'>Abricos</a> успешно установлена на ваш сайт.</p>
<p>Спасибо за то, что выбрали наш продукт.</p>
<p>С чего начать?</p>
<h3>Изменение учетной записи пользователя по умолчанию.</h3>
<p>По умолчанию в системе создается пользователь <strong>admin</strong>(пароль <strong>admin</strong>) с правами Администратора. Необходимо изменить эту учетную запись (установить новый пароль и сменить e-mail). Для этого:</p>
<ol>
<li>Осуществите вход на сайт (имя пользователя: admin, пароль: admin);</li>
<li>Зайдите в панель управления (в правом верхнем углу ссылка);</li>
<li>В левом меню кликните на <strong>Пользователи</strong> и в списке, напротив единственной учетной записи admin, нажмите <strong>Редактировать</strong>.</li>
<li>Смените пароль и e-mail, нажмите сохранить.</li>
</ol>
<p>Полную документацию по Abricos смотрите на <a href='http://abricos.org'>официальном сайте</a></p>
	";
	$about = "
<h1>О проекте</h1>\n<p><a href='http://abricos.org'>Abricos</a> - это самая современная на сегодняшний день система управления web-контентом.</p>	
	";
	
	$db->query_write("
		INSERT INTO `".$pfx."content` (`contentid`, `body`, `dateline`, `deldate`, `modman`) VALUES
		(1, '".bkstr($mainpage)."', 1241810741, 0, 'sitemap'),
		(2, '".bkstr($about)."', 1241845327, 0, 'sitemap')
	");

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
	
	// добавление в таблицу администратора
	$db->query_write("
		INSERT INTO `".$pfx."user` (`usergroupid`, `username`, `password`, `email`, `joindate`, `lastvisit`, `salt`) VALUES
		(6, 'admin', '3f5726cdbe88eac915ffb9e981b72682', 'admin@example.com', ".TIMENOW.", '', '( R');
	");
	
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

	// Кеш собранных кирпичей
	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."sys_cache` (
		  `cacheid` int(10) unsigned NOT NULL auto_increment,
		  `module` varchar(50) NOT NULL DEFAULT '' COMMENT 'Имя модуля',
		  `name` varchar(50) NOT NULL DEFAULT '',
		  `body` text NOT NULL,
		  `upddate` int(10) unsigned NOT NULL default '0' COMMENT 'Время кеширования',
		  PRIMARY KEY (`cacheid`),
		  KEY `module` (`module`),
		  KEY `name` (`name`)
		)".$charset
	);
	
	// Кирпич
	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."sys_brick` (
		  `brickid` int(10) unsigned NOT NULL auto_increment,
		  `owner` varchar(50) NOT NULL DEFAULT '' COMMENT 'Источник: шаблон - имя папки, кирпич - имя модуля',
		  `name` varchar(50) NOT NULL DEFAULT '',
		  `body` TEXT NOT NULL,
		  `bricktype` int(2) unsigned NOT NULL default '0' COMMENT 'Тип кирпича: 0-кирпич, 1-шаблон',
		  `comments` TEXT COMMENT 'Комментарии',
		  `dateline` int(10) unsigned NOT NULL default '0',
		  `upddate` int(10) unsigned NOT NULL default '0' COMMENT 'Исправлен пользователем',
		  `deldate` int(10) unsigned NOT NULL default '0',
		  `hash` varchar(32) NOT NULL DEFAULT '' COMMENT 'Версия(хеш) параметров',
		  PRIMARY KEY (`brickid`),
		  KEY `folder` (`owner`),
		  KEY `name` (`name`)
		  )".$charset
	);
	
	// параметры кирпича
	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."sys_brickparam` (
		  `brickparamid` int(10) unsigned NOT NULL auto_increment,
		  `brickid` int(10) UNSIGNED NOT NULL DEFAULT '0',
		  `paramtype` int(2) unsigned NOT NULL default '0',
		  `name` varchar(50) NOT NULL DEFAULT '',
		  `paramvalue` text NOT NULL,
		  `upddate` int(10) unsigned NOT NULL default '0' COMMENT 'Исправлен пользователем',
		  PRIMARY KEY (`brickparamid`),
		  KEY `name` (`name`)
		)".$charset
	);
		
	// Фразы
	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."sys_phrase` (
		  `phraseid` int(10) unsigned NOT NULL auto_increment,
		  `module` varchar(32) NOT NULL DEFAULT '',
		  `name` varchar(50) NOT NULL DEFAULT '',
		  `phrase` text NOT NULL,
		  `language` char(2) NOT NULL DEFAULT 'ru',
		  `dateline` int(10) unsigned NOT NULL default '0',
		  `upddate` int(10) unsigned NOT NULL default '0',
		  `deldate` int(10) unsigned NOT NULL default '0',
		  PRIMARY KEY (`phraseid`),
		  KEY `module` (`module`),
		  KEY `name` (`name`)
		)".$charset
	);
	
	// меню
	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."sys_menu` (
		  `menuid` int(10) unsigned NOT NULL auto_increment,
		  `parentmenuid` int(10) unsigned NOT NULL default '0',
		  `menutype` int(1) unsigned NOT NULL default '0' COMMENT 'Тип меню: 0-раздел, 1-ссылка',
		  `name` varchar(250) NOT NULL DEFAULT '' COMMENT 'Имя',
		  `title` varchar(250) NOT NULL DEFAULT '' COMMENT 'Название',
		  `descript` varchar(250) NOT NULL DEFAULT '' COMMENT 'Описание',
		  `link` varchar(250) NOT NULL DEFAULT '' COMMENT 'Ссылка',
		  `language` char(2) NOT NULL DEFAULT 'ru',
		  `menuorder` int(4) unsigned NOT NULL default '0',
		  `level` int(2) unsigned NOT NULL default '0',
		  `off` tinyint(1) unsigned NOT NULL default '0',
		  `dateline` int(10) unsigned NOT NULL default '0',
		  `deldate` int(10) unsigned NOT NULL default '0',
		  PRIMARY KEY (`menuid`)
		)".$charset
	);

	// Страницы
	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."sys_page` (
		  `pageid` int(10) unsigned NOT NULL auto_increment,
		  `menuid` int(10) unsigned NOT NULL default '0',
		  `brickid` int(10) unsigned NOT NULL default '0' COMMENT 'Кирпич отвечающий за вывод',
		  `contentid` int(10) unsigned NOT NULL default '0',
		  `pagename` varchar(250) NOT NULL DEFAULT '' COMMENT 'Имя',
		  `title` varchar(250) NOT NULL DEFAULT '' COMMENT 'Описание',
		  `language` char(2) NOT NULL DEFAULT 'ru',
		  `metakeys` varchar(250) NOT NULL DEFAULT '' COMMENT 'Описание',
		  `metadesc` varchar(250) NOT NULL DEFAULT '' COMMENT 'Описание',
		  `mods` TEXT NOT NULL,
		  `usecomment` tinyint(1) unsigned NOT NULL default '0',
		  `dateline` int(10) unsigned NOT NULL default '0',
		  `deldate` int(10) unsigned NOT NULL default '0',
		  PRIMARY KEY (`pageid`)
		)".$charset
	);
	
	$db->query_write("
		INSERT INTO `".$pfx."sys_menu` (`menuid`, `parentmenuid`, `menutype`, `name`, `title`, `descript`, `link`, `language`, `menuorder`, `level`, `off`, `dateline`, `deldate`) VALUES
		(1, 0, 1, '', 'Главная', 'Главная страница сайта Abricos', '/', 'ru', 0, 0, 0, 0, 0),
		(2, 0, 0, 'about', 'О проекте', '', '', 'ru', 0, 0, 0, 0, 0)
	");
	
	$db->query_write("
		INSERT INTO `".$pfx."sys_page` (`pageid`, `menuid`, `brickid`, `contentid`, `pagename`, `title`, `language`, `metakeys`, `metadesc`, `usecomment`, `dateline`, `deldate`) VALUES
		(1, 0, 0, 1, 'index', '', 'ru', '', '', 0, 1241810741, 0),
		(2, 2, 0, 2, 'index', '', 'ru', '', '', 0, 1241845327, 0)
	");

	// Настройки по умолчанию
	$db->query_write("
		INSERT INTO `".$pfx."sys_phrase` (`module`, `name`, `phrase`, `language`) VALUES
		('sys', 'style', 'default', 'ru'),
		('sys', 'site_name', 'Abricos', 'ru'),
		('sys', 'site_title', 'система управления web-контентом', 'ru'),
		('sys', 'admin_mail', '', 'ru')
	");
}

// обновление для платформы Abricos версии 0.5
if ($updateManager->isInstall() || $updateManager->serverVersion == '1.0.4'){

	// Политика безопасности
	$db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."sys_permission (
		  `permissionid` int(10) unsigned NOT NULL auto_increment,
		  `module` varchar(50) NOT NULL DEFAULT '' COMMENT 'Имя модуля',
		  `subject` TEXT NOT NULL COMMENT 'Группы пользователей с префиксом @, и/или пользователи, через запятую',
		  `action` TEXT NOT NULL COMMENT 'Действия через запятую',
		  `status` tinyint(1) unsigned NOT NULL default 0 COMMENT '1 - разрешено, 0 - запрещено',
		  PRIMARY KEY  (`permissionid`)
		)".$charset
	);

	CMSRegistry::$instance->modules->GetModule('user')->permission->InstallDefault();
}

if ($updateManager->isUpdate('0.5.1')){
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