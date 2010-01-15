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

$cms = Brick::$cms;

$p_module = Brick::$input->clean_gpc('g', 'md', TYPE_STR);
$p_brick = Brick::$input->clean_gpc('g', 'bk', TYPE_STR);
$p_js = Brick::$input->clean_gpc('g', 'js', TYPE_STR);

$mod = Brick::$modules->GetModule($p_module);
if (empty($mod)){
	return;
}

$brick = Brick::$builder->brick;

Brick::$builder->LoadBrick($mod, $p_brick, $brick);

$brick->content = "[mod]".$mod->name.":".$p_brick."[/mod]";

?>