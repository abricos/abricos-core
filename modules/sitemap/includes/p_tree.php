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

$modSitemap = Brick::$modules->GetModule('sitemap');
$mm = $modSitemap->GetMenu(true);
if (empty($mm->menu->child)){
	$brick->content = "";
	return;
}
$maxcolrows = $brick->param->param['maxcolrows'];
$curcolrows = 0;
$resultCols = "";
$result = "";
foreach ($mm->menu->child as $child){
	$childcolrows = CMSModuleSitemap::ChildMenuItemCount($child);
	if ($childcolrows + $curcolrows > $maxcolrows){
		$result .= Brick::ReplaceVar($brick->param->var['column'], 'tree', $resultCols);
		$resultCols = "";
	}
	
	$resultCols .= Brick::ReplaceVarByData($brick->param->var['root'], array(
		"link" => $child->link,
		"tl" => $child->title,
		"rows" => Sitemap_BrickBuildTreeMenuGenerate($child, $brick->param)
	));
}

$result .= Brick::ReplaceVar($brick->param->var['column'], 'tree', $resultCols);

$brick->param->var['result'] = $result;

function Sitemap_BrickBuildTreeMenuGenerate(CMSSitemapMenuItem $menu, $param){
	$lst = "";
	foreach ($menu->child as $child){
		$lst .= Brick::ReplaceVarByData($param->var["item"], array(
			"link" => $child->link, 
			"tl" => $child->title,
			"child" => Sitemap_BrickBuildTreeMenuGenerate($child, $param)
		)); 
	}
	if (!empty($lst)){
		return Brick::ReplaceVar($param->var["node"], "rows", $lst);
	}
	return "";
}
?>