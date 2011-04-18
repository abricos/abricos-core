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

$config['Database']['dbtype'] = 'mysql';
$config['Database']['dbname'] = 'cms';
$config['Database']['tableprefix'] = 'cms_';

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

// Показать информацию работы сервера (скорость сборки страницы, кол-во запросов к БД)
$config['Misc']['showbuildinfo'] = false;

$config['JsonDB']['use'] = false;
$config['JsonDB']['password'] = "";

/**
 * Идентификатор пользователя имеющий статус "Супер администратора".
 * Примечание: статус "Супер администратор" позволяет игнорировать настройку readonly 
 */
$config['superadmin'] = '';

// Пример правил применения шаблонов для страниц сайта
/*
$config['Template'] = array(
	// по умолчанию использовать шаблон blog из стиля default
	"default" => array(
		"owner" => "default", 
		"name" => "blog"
	),
	// не применять правила для страниц в разделе http://domain.tld/price/...
	"ignore" => array(
		array(
			"pattern" => "/^\/price\//i", 
			"regexp" => true
		)
	), 
	"exp" => array(
		// использовать шаблон main из стиля default для главной страницы сайта
		array(
			"pattern" => "/", 
			"regexp" => false,
			"owner" => "default", 
			"name" => "main"
		),
		// использовать шаблон news из стиля default для новостей 
		array(
			"pattern" => "/^\/news\//i", 
			"regexp" => true,
			"owner" => "default", 
			"name" => "news"
		)
	) 
);
/**/

// Пример тонкой настройки работы модулей
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