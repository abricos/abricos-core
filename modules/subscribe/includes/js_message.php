<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage Subscribe
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */


if (!Brick::$session->IsAdminMode()){ return; }

$brick = Brick::$builder->brick;
$json = Brick::$input->clean_gpc('p', 'json', TYPE_STR);

$obj = json_decode($json);

$row = CMSQSubscribe::AdmGetMessage(Brick::$db, $obj);
$row['act'] = $obj->act;
$row['cnt'] = CMSQSubscribe::AdmGetCountSender(Brick::$db, $obj->id);

$cfg = new stdClass();
$cfg->testmail = CMSQSubscribe::ConfigByName(Brick::$db, 'testmail');
$row['cfg'] = $cfg;


$rows = CMSQSubscribe::TemplateList(Brick::$db);
$arr = array();
while (($tp = Brick::$db->fetch_array($rows))){
	array_push($arr, $tp);
}
$row['tps'] = $arr; 

$att = new stdClass();
$att->msgid = $row['id'];
$rows= CMSQSubscribe::AttachmentList(Brick::$db, $att);
$arr = array();
while (($at = Brick::$db->fetch_array($rows))){
	array_push($arr, $at);
}
$row['files'] = $arr; 

if ($obj->act == 'edit'){
	$t = $brick->param->var['cmd_edit'];
}else{
	$t = $brick->param->var['cmd_prev'];
}
$brick->content = str_replace("#obj#", json_encode($row), $t);
?>