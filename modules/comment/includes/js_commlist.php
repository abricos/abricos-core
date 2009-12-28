<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage Comment
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

if (!Brick::$session->IsAdminMode()){	return; }

$brick = Brick::$builder->brick;
$json = Brick::$input->clean_gpc('p', 'json', TYPE_STR);
$obj = json_decode($json);
if (empty($obj->page)){ $obj->page = 1; }

if ($obj->act == 'status'){
	CMSQComt::SpamSet(Brick::$db, $obj);
}

$brick->param->var['total'] = CMSQComt::AdmListCount(Brick::$db);
$brick->param->var['page'] = $obj->page;

$rows = CMSQComt::AdmList(Brick::$db, $obj->page);

while (($row = Brick::$db->fetch_array($rows))){
	$brick->param->var['lst'] .= str_replace("#c#", 
		json_encode_ext($row), 
		$brick->param->var['i']
	);
}

?>