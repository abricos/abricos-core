<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage News
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

if (!Brick::$session->IsAdminMode()){ return; }

$brick = Brick::$builder->brick; 

$userid = Brick::$session->userinfo['userid'];

$p_newsid = Brick::$input->clean_gpc('g', 'newsid', TYPE_INT);
$data = CMSQNews::News(Brick::$db, $p_newsid, true);

if (empty($data)){
	$currBrick->content = ""; 
	return; 
}

$row = array();
$row['module'] = 'news';
$row['subject'] = $data['tl'];
$row['body'] = $data['intro'].$data['body'];

$brick->param->var['lst'] = json_encode_ext($row); 

?>