<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage Comment
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$brick = Brick::$builder->brick;
$contentId = Brick::$input->clean_gpc('g', 'contentid', TYPE_INT);

if (empty($contentId)){
	$contentId = Brick::$contentId;
}else{
	$brick->param->var['ondom'] = $brick->param->var['nonondom']; 
}

if ($contentId == 0){
	$brick->content = "";
	$brick->param->var = array();
	return;
}
$brick->param->var['cid'] = $contentId;

$data = array();
$rows = CMSQComt::Comments(Brick::$db, $contentId);
$lst = ""; $t = "";
$slst = "";
while (($row = Brick::$db->fetch_array($rows))){
	if ($row['st'] == 1){
		$row['bd'] = '';
	}
	
	$t = str_replace('#id#', $row['id'], $brick->param->var['t']);
	$t = str_replace('#u#', $row['unm'], $t);
	$t = str_replace('#c#', $row['bd'], $t);
	$lst .= $t;
	unset($row['bd']);
	
	$slst .= str_replace('#c#', json_encode($row), $brick->param->var['si']);
}
$brick->param->var['lst'] = $lst;
$brick->param->var['slst'] = $slst;

if (Brick::$session->IsRegistred()){
	$brick->param->var['ft'] = $brick->param->var['ftreg']; 
}

?>