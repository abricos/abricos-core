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
	if ($obj->act == 'save'){
		if ($obj->id > 0){
			CMSQSubscribe::TemplateSave(Brick::$db, $obj);
		}else if (empty($obj->id)){
			CMSQSubscribe::TemplateAppend(Brick::$db, $obj);
		}
	}
}

$rows = CMSQSubscribe::TemplateList(Brick::$db);

while (($row = Brick::$db->fetch_array($rows))){
	$brick->param->var['lst'] .= str_replace("#c#", 
		json_encode($row), $brick->param->var['i']
	);
}
/**/
?>