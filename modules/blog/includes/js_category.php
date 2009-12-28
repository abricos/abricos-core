<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage Blog
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

if (!Brick::$session->IsAdminMode()){	return; }

$brick = Brick::$builder->brick;

$json = Brick::$input->clean_gpc('p', 'json', TYPE_STR);
if (!empty($json)){
	$obj = json_decode($json);
	if ($obj->act == 'save'){
		if ($obj->id > 0){
			
		}else{
			CMSQBlog::CategoryAdd(Brick::$db, $obj);
		}
	}else if ($obj->act == 'remove'){
		CMSQBlog::CategoryRemove(Brick::$db, $obj->id);
	}
}

$counts = array();
$rows = CMSQBlog::CategoryListCountTopic(Brick::$db);
while (($row = Brick::$db->fetch_array($rows))){
	$counts[$row['id']] = $row['cnt'];
}
$rows = CMSQBlog::CategoryList(Brick::$db);
while (($row = Brick::$db->fetch_array($rows))){
	
	$row['cnt'] = intval($counts[$row['id']]);
	
	$brick->param->var['lst'] .= str_replace("#c#", 
		json_encode_ext($row), 
		$brick->param->var['i']
	);
}

?>