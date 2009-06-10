<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

if (!Brick::$session->IsAdminMode()){ return; }
$brick = Brick::$builder->brick;

$p_do = Brick::$input->clean_gpc('g', 'do', TYPE_STR);

if ($p_do == 'order'){
	$p_id = Brick::$input->clean_gpc('p', 'id', TYPE_INT);
	$p_newpid = Brick::$input->clean_gpc('p', 'newpid', TYPE_INT);
	CMSSqlQuerySys::MenuMove(Brick::$db, $p_id, $p_newpid);
	
	// change order
	$p_ordcnt = Brick::$input->clean_gpc('p', 'ordcnt', TYPE_INT);
	
	for ($i=0;$i<$p_ordcnt;$i++){
		$p_id 		= Brick::$input->clean_gpc('p', 'ord_id_'.$i, TYPE_INT);
		$p_neword = Brick::$input->clean_gpc('p', 'ord_nv_'.$i, TYPE_INT);
		CMSSqlQuerySys::MenuChangeOrder(Brick::$db, $p_id, $p_neword);
	}
}

$rows = CMSSqlQuerySys::MenuListJSON(Brick::$db);
while (($row = Brick::$db->fetch_array($rows))){
	$brick->param->var['lst'] .= str_replace("#c#", 
		json_encode_ext($row), 
		$brick->param->var['i']
	);
}

?>