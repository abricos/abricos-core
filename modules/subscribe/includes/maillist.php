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

if ($obj->act == 'save'){
	if ($obj->id > 0){
		CMSQSubscribe::AdmSaveEmail(Brick::$db, $obj);
	}else if (empty($obj->id)){
		CMSQSubscribe::AdmAddEmail(Brick::$db, $obj);
	}
}else if ($obj->act == 'remove'){
	CMSQSubscribe::MailRemove(Brick::$db, $obj->id);
}else if ($obj->act == 'restore'){
	CMSQSubscribe::MailRestory(Brick::$db, $obj->id);
}else if ($obj->act == 'rcclear'){
	CMSQSubscribe::MailRCClear(Brick::$db);
}

if (empty($obj->_page)){ $obj->_page = 1; }

$brick->param->var['total'] = CMSQSubscribe::MailListCount(Brick::$db);
$brick->param->var['page'] = $obj->_page;

$rows = CMSQSubscribe::MailList(Brick::$db, $obj->_page);

while (($row = Brick::$db->fetch_array($rows))){
	$brick->param->var['lst'] .= str_replace("#c#", 
		json_encode($row), $brick->param->var['i']
	);
}
/**/
?>