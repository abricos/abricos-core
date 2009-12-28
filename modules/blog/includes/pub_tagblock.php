<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage Blog
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$brick = Brick::$builder->brick;
$mod = Brick::$modules->GetModule('blog');

$limit = $mod->taglimit;

$rows = CMSQBlog::TagBlock(Brick::$db, $limit);

$tags = array();
$min = 100000;
$max = 1;

while (($row = Brick::$db->fetch_array($rows))){
	$cnt = intval($row['cnt']);
	$row['cnt'] = $cnt;
	if ($cnt < $min){
		$min = $row['cnt'];
	}
	if ($cnt > $max){
		$max = $row['cnt'];
	}
	array_push($tags, $row);
}
$fmin = 0;
$fmax = 15;
if ($min == $max){
	$max++;
}
$g1 = log($min+1);
$g2 = log($max+1);

$lst = "";
foreach ($tags as $tag){
	$cnt = intval($tag['cnt']);
	
	$n1 = ($fmin+log($cnt+1)-$g1)*$fmax;
	$n2 = $g2-$g1;
	$v = intval($n1/$n2);
	$font = $v*5+75;

	$t = str_replace('#lnk#', $tag['nm'], $brick->param->var['t']);
	$t = str_replace('#fnt#', $font, $t);
	$t = str_replace('#c#', $tag['ph'], $t);
	$lst .= $t . ' ';
}
unset($brick->param->var['t']);

$brick->param->var['lst'] = $lst;

?>