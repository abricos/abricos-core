<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
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
$config['Misc']['cookietimeout'] = 86400 * 31;

$config['Misc']['charset'] = "utf-8";
$config['Misc']['language'] = "ru";

$config['Misc']['brick_cache'] = false;


?>