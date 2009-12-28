<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage Blog
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$brick = Brick::$builder->brick;
$limit = 30;

$rows = CMSQBlog::CatBlock(Brick::$db);
$lst = "";
while (($row = Brick::$db->fetch_array($rows))){
	$t = str_replace('#lnk#', $row['nm'], $brick->param->var['t']);
	$t = str_replace('#cnt#', $row['cnt'], $t);
	$t = str_replace('#c#', $row['ph'], $t);
	$lst .= $t . ' ';
}
unset($brick->param->var['t']);
$brick->param->var['lst'] = $lst;
?>