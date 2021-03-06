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

    $db->query_write("
        INSERT INTO ".$pfx."sys_phrase (module, name, phrase, language) VALUES
            ('sys', 'style', 'default', 'ru'),
            ('sys', 'site_name', 'Название сайта', 'ru'),
            ('sys', 'site_title', 'Краткое описание Вашего сайта', 'ru'),
            ('sys', 'admin_mail', '', 'ru')
    ");

}
