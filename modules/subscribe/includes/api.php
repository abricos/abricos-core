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

if (!empty($json)){
	$obj = json_decode($json);
	if ($obj->act == 'add'){
		$id = CMSQSubscribe::AdmAddMessage(Brick::$db, $obj);
		if (!empty($obj->module)){
			$newobj = new stdClass();
			$newobj->id = $id;
			$newobj->act = 'preview';
			$brick->param->var['prv'] = str_replace("#obj#", json_encode($newobj), $brick->param->var['prvjs']);
		}
	}else if ($obj->act == 'remove'){
		CMSQSubscribe::AdmMessageRemove(Brick::$db, $obj);
	}else if ($obj->act == 'save'){
		if ($obj->id > 0){
			CMSQSubscribe::MessageSave(Brick::$db, $obj);
		}else{
			CMSQSubscribe::MessageAppend(Brick::$db, $obj);
		}
	}
}

$rows = CMSQSubscribe::AdmMessageList(Brick::$db);

while (($row = Brick::$db->fetch_array($rows))){
	$brick->param->var['lst'] .= str_replace("#c#", 
		json_encode($row), $brick->param->var['i']
	);
}
/**/
?>