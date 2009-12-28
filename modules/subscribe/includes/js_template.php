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

$row = CMSQSubscribe::Template(Brick::$db, $obj->id);

$att = new stdClass();
$att->tpid = $obj->id;
$rows= CMSQSubscribe::AttachmentList(Brick::$db, $att);
$arr = array();
while (($at = Brick::$db->fetch_array($rows))){	array_push($arr, $at); }
$row['files'] = $arr; 

$brick->param->var['v'] = json_encode($row); 

?>