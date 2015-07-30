<?php
/**
 * Скрипт обработки Ajax запросов новая версия.
 *
 * @package Abricos
 * @link http://abricos.org
 * @copyright Copyright (C) 2008-2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 * @ignore
 */

$adress = Abricos::$adress;
$p_module = $adress->dir[1];
$mod = Abricos::GetModule($p_module);
$pData = Abricos::CleanGPC('p', 'data', TYPE_STR);

$brick = Brick::$builder->brick;
if (empty($pData)){
    $data = new stdClass();
} else {
    $data = json_decode($pData);
}
$result = new stdClass();
if (empty($mod)){
    // TODO: Отправить в header код ошибки 500
    // $result->error = 500;
} else {
    $modManager = $mod->GetManager();

    if (is_array($data)){
        $result->multi = true;
        $result->data = array();
        $counter = 0;
        foreach ($data as $d){
            if ($counter++ >= 5){
                break;
            }
            $result->data[] = $modManager->AJAX($d);
        }
    } else {
        if (!property_exists($data, 'do')){
            $data->do = '';
        }

        $result->data = $modManager->AJAX($data);
    }
}
$brick->content = json_encode($result);
?>