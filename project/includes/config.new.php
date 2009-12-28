<?php
/**
* @version $Id$
* @package Abricos
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/


/**
 * Настройка режима "только для чтения" работы с БД.
 */
$config['Database']['readonly'] = false;

/**
 * Идентификатор пользователя имеющий статус "Супер администратора".
 * Примечание: статус "Супер администратор" позволяет игнорировать настройку readonly 
 */
$config['superadmin'] = '';

$config['Database']['dbtype'] = 'mysql';
$config['Database']['dbname'] = 'cms';

$config['Server']['servername'] = 'localhost';
$config['Server']['port'] = 3306;
$config['Server']['username'] = 'root';
$config['Server']['password'] = '';

$config['Misc']['cookieprefix'] = 'cms_';
$config['Misc']['cookietimeout'] = 86400 * 14;

$config['Misc']['charset'] = "utf-8";
$config['Misc']['language'] = "ru";

$config['Misc']['brick_cache'] = false;

// Режим работы платформы для разработчика 
$config['Misc']['develop_mode'] = false;

$config['JsonDB']['use'] = false;
$config['JsonDB']['password'] = "";

// Пример настройки работы модулей
/*
$config['Takelink'] = array(
	"webos" => array(
		"module" => "webos"
	),
	"calendar" => array(
		"module" => "webos",
		"enmod" => array("calendar")
	),
	"company" => array(
		"enmod" => array("webos", "company", "calendar")
	)
);
*/

?>