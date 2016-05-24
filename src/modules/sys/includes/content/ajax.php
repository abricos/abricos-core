<?php
/**
 * @package Abricos
 * @subpackage Core
 * @copyright 2008-2016 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @link http://abricos.org
 */

/**
 * Скрипт обработки Ajax запросов.
 * @ignore
 */

$adress = Abricos::$adress;

$p_module = $adress->dir[1];
$p_brick = $adress->dir[2];

$mod = Abricos::GetModule($p_module);

if (empty($mod)){
    return;
}

$brick = Brick::$builder->brick;

Brick::$builder->LoadBrick($mod, $p_brick, $brick);

$brick->content = "[mod]".$mod->name.":".$p_brick."[/mod]";
