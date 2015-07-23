<?php
/**
 * Пример конфигурационного файла платформы Абрикос
 * 
 * @package Abricos
 * @subpackage Core
 * @link http://abricos.org
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @filesource
 */

/*
 * Включить/выключить режим "только для чтения" работы с БД
 * 
 * Если режим включен (значение true), то запросы отправленые методом
 * Ab_Database::query_write() не уходят к БД
 */
$config['Database']['readonly'] = false;

// Тип базы данных MySQL
$config['Database']['dbtype'] = 'mysql';

// Имя базы данных
$config['Database']['dbname'] = 'cms';

// Префикс таблиц в базе данных
$config['Database']['tableprefix'] = 'cms_';

// адрес сервера базы данных
$config['Server']['servername'] = 'localhost';

// порт сервера базы данных
$config['Server']['port'] = 3306;

// имя пользователя базы данных
$config['Server']['username'] = 'root';

// пароль пользователя базы данных
$config['Server']['password'] = '';


// префик в COOKIE
$config['Misc']['cookieprefix'] = 'cms_';

// время хранения COOKIE в секундах
$config['Misc']['cookietimeout'] = 86400 * 14;

// язык контента
$config['Misc']['language'] = "ru";

// язык интерфейса пользователя
$config['Misc']['locale'] = "ru-RU";

/*
 * Включить/выключить режим "Разработчика" работы платформы
 * 
 * Если режим включен, то отключается кеширование JS компонентов
 */ 
$config['Misc']['develop_mode'] = false;

/*
 * Добавить внизу каждой страниы информацию работы движка: скорость 
 * сборки страницы, кол-во запросов к БД
 */
$config['Misc']['showbuildinfo'] = false;


/*
 * Идентификатор пользователя которому необходимо присвоить 
 * роль "СУПЕРАДМИНИСТРАТОРА".
 * 
 * Если таких пользователей несколько, то необходимо их идентификаторы 
 * указать через запятую
 */
$config['superadmin'] = '';

// Указать модуль, который будет отвечать за главную страницу сайта
// Например: BosUI (менеджер задач, календарь и т.п.) будет в качестве 
// заглавной страницы сайта
/*
$config['Takelink'] = array(
	"__super" => array(
		"module" => "bos" 
	)
);
/**/

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
*/

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