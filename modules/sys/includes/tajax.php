<?php
/**
 * Скрипт обработки Ajax запросов новая версия.
 * 
 * @version $Id$
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
$sdata = Abricos::CleanGPC('p', 'data', TYPE_STR);
if (empty($sdata)){
	$data = new stdClass(); 
}else{
	$data = json_decode($sdata);
}
$result = new stdClass();
if (empty($mod)){
	// TODO: Отправить в header код ошибки 500
	// $result->error = 500;
}else{
	$result->data = $mod->GetManager()->AJAX($data);
}
Brick::$builder->brick->content = json_encode($result);
?>