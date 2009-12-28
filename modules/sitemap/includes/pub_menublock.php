<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage Sitemap
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$brick = Brick::$builder->brick;
$db = Brick::$db;
$param = $brick->param;

$modSitemap = Brick::$modules->GetModule('sitemap');
$mm = $modSitemap->GetMenu();
if (empty($mm->menu->child)){
	$brick->content = "";
	return;
}
$param->var['result'] = sitemap_pub_menublock_out($mm->menu, $param);

function sitemap_pub_menublock_out(CMSSitemapMenuItem $menu, $param){
	$prefix = $menu->isSelected ? "sel" : "";
	$prefix .= ($menu->isLast && empty($menu->child))?"last":"";
	$t = $param->var['item'.$prefix];
	$t = Brick::ReplaceVar($t, "tl", $menu->title);
	$t = Brick::ReplaceVar($t, "link", $menu->link);
	
	$lst = "";
	foreach ($menu->child as $child){
		$lst .= sitemap_pub_menublock_out($child, $param);
	}
	if (!empty($lst)){
		$tlst = Brick::ReplaceVar($param->var[($menu->id==0?"menuroot":"menu")], "lvl", $menu->level);
		$lst = Brick::ReplaceVar($tlst, "rows", $lst);
	}
	if ($menu->id == 0){ return $lst; }
	$t = Brick::ReplaceVar($t, "child", $lst);
	
	return $t;
}


?>