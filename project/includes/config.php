<?php

/**
* @version $Id: config.php 793 2009-05-08 11:13:24Z AKuzmin $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

$config['Database']['readonly'] = false;

$config['Database']['dbtype'] = 'mysql';
$config['Database']['dbname'] = 'inst';

$config['Server']['servername'] = 'localhost';
$config['Server']['port'] = 3306;
$config['Server']['username'] = 'dbuser';
$config['Server']['password'] = 'pass';

$config['Misc']['cookieprefix'] = 'cms_';
$config['Misc']['cookietimeout'] = 86400 * 31;

$config['Misc']['charset'] = "utf-8";
$config['Misc']['language'] = "ru";

$config['Misc']['brick_cache'] = false;


?>