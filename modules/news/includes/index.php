<?php
/**
 * Вывод списка новостей
 * 
 * @version $Id$
 * @package CMSBrick
 * @subpackage News
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$brick = Brick::$builder->brick;
$modNews = Brick::$modules->GetModule('news');

// кол-во новостей на странице
$limit = Brick::$builder->phrase->Get('news', 'page_count', 10);
$dateFormat = Brick::$builder->phrase->Get('news', 'date_format', "Y-m-d");
$page = $modNews->page;

$baseUrl = "/".$modNews->takelink."/";

$tNewsRow = $brick->param->var['r'];
$lst = "";
$rows = CMSQNews::NewsPublicList(Brick::$db, $page, $limit);

while (($row = Brick::$db->fetch_array($rows))){
	$t = $tNewsRow;
	$link = $baseUrl.$row['id']."/";
	
	$t = str_replace("#d#", date($dateFormat, $row['dp']), $t);
	$t = str_replace("#l#", $link, $t);
	$t = str_replace("#h#", $row['tl'], $t);
	$t = str_replace("#s#", $row['intro'], $t);
	$lst .= $t;
}

$brick->param->var['lst'] = $lst;

$newsCount = CMSQNews::NewsPublicCount(Brick::$db, true);

// подгрузка кирпича пагинатора с параметрами
Brick::$builder->LoadBrickS('sitemap', 'p_paginator', $brick, array("p" => array(
	"total" => $newsCount,
	"page" => $page,
	"perpage" => $limit,
	"uri" => $baseUrl
)));


?>