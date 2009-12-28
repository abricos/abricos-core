<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage News
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$brick = Brick::$builder->brick;

$param = $brick->param;
$modNews = Brick::$modules->GetModule('news');
$newsid = $modNews->newsid;

if (Brick::$session->IsAdminMode()){
	Brick::$builder->AddJSModule('news', 'api.js');
	$t = $brick->param->var['fedit'];
	$t = str_replace("{v#id}", $newsid, $t);
	$brick->param->var['feditbody'] = $t;
}

$row = $modNews->data;

$brick->param->var['date'] = $row['dp']>0 ? rusDateTime(date($row['dp'])) : $brick->param->var['notpub'];
$brick->param->var['page'] = 0;  
$brick->param->var['title'] = $row['tl'];
$brick->param->var['intro'] = $row['intro'];
$brick->param->var['body'] = $row['body'];

if (empty($row['srcnm']) || empty($row['srclnk'])){
	$brick->param->var['source'] = '';
}else{
	$t = str_replace('#srclnk#', $row['srclnk'], $brick->param->var['source']);
	$t = str_replace('#srcnm#', $row['srcnm'], $t);
	$brick->param->var['source'] = $t;
}

if (empty($row['img'])){
	$brick->param->var['image'] = '';
}else{
	$brick->param->var['image'] = str_replace('#id#', $row['img'], $brick->param->var['image']);
}
Brick::$contentId = $row['contentid'];

?>