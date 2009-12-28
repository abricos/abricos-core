<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage Blog
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

if (!Brick::$session->IsAdminMode()){	return;}
$userid = Brick::$session->userinfo['userid'];
$brick = Brick::$builder->brick;
$in = Brick::$input;

$p_do = $in->clean_gpc('g', 'do', TYPE_STR);

if ($p_do == 'add'){
	$data = array();
	$data['phrase'] = $in->clean_gpc('p', 'topic_cat_add', TYPE_STR);
	$data['name'] = $name = translateruen($data['phrase']);
	$data['parentcatid'] = 0;
	
	if (empty($name) || 
		$name == "tag" ||
		$name == "user" ||
		substr($name, 0, 4) == "page"
	){
	}else{
		$check = CMSQBlog::CategoryCheck(Brick::$db, $data);
		if (empty($check)){
			CMSQBlog::CategoryAdd(Brick::$db, $data);
		}
	}
}

$rows = CMSQBlog::CategoryList(Brick::$db);

while (($row = Brick::$db->fetch_array($rows))){
	$brick->param->var['lst'] .= str_replace("#c#", 
		json_encode($row), $brick->param->var['i']
	);
}

?>