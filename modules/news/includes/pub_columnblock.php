<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage News
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$brick = Brick::$builder->brick;
$db = Brick::$db;
$param = $brick->param;
$modNews = Brick::$modules->GetModule('news');
$takelink = $modNews->takelink;
$dateFormat = Brick::$builder->phrase->Get('news', 'date_format', "Y-m-d");

$tNewsRow = $brick->param->var['r'];

$count = $brick->param->param['count'];

$lst = "";
$rows = CMSQNews::NewsPublicList($db, 1, $count);
while(($row = $db->fetch_array($rows))){
	$t = $tNewsRow;
	$link = "/".$takelink."/".$row['id']."/";
	
	$t = str_replace("#d#", date($dateFormat, $row['dp']), $t);
	$t = str_replace("#l#", $link, $t);
	$t = str_replace("#h#", $row['tl'], $t);
	$t = str_replace("#s#", $row['intro'], $t);
	$lst .= $t;
}
if ($lst == ""){
	$brick->param->var = array();
	$brick->content = "";
	return;
}

$t = $brick->content;
$t = str_replace("{v#lst}", $lst, $t); 
$t = str_replace("{v#tlink}", $takelink, $t); 

$brick->content = $t;
?>