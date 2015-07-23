<?php
/**
 * Схема таблиц данного модуля.
 *
 * @version $Id$
 * @package Abricos
 * @link http://abricos.org
 * @copyright Copyright (C) 2008-2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 * @ignore
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = Ab_UpdateManager::$current;
$db = Abricos::$db;
$pfx = $db->prefix;

if ($updateManager->isInstall()){

    $db->query_write("
        INSERT INTO ".$pfx."sys_phrase (module, name, phrase, language) VALUES
            ('sys', 'style', 'default', '".Abricos::$LNG."'),
            ('sys', 'site_name', 'Site Name', '".Abricos::$LNG."'),
            ('sys', 'site_title', 'Brief description of your site', '".Abricos::$LNG."'),
            ('sys', 'admin_mail', '', 'ru')
    ");
}

?>