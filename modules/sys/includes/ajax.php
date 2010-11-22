<?php
/**
 * Скрипт обработки Ajax запросов.
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Ajax
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$adress = CMSRegistry::$instance->adress;

$p_module = $adress->dir[1];
$p_brick = $adress->dir[2];

$mod = Brick::$modules->GetModule($p_module);
if (empty($mod)){
	return;
}

$brick = Brick::$builder->brick;

Brick::$builder->LoadBrick($mod, $p_brick, $brick);

$brick->content = "[mod]".$mod->name.":".$p_brick."[/mod]";

?>