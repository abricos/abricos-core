<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage Blog
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$brick = Brick::$builder->brick;
$contentId = Brick::$input->clean_gpc('g', 'contentid', TYPE_INT);
$brick->param->var['cid'] = $contentId;

$info = CMSQBlog::TopicInfo(Brick::$db, 0, $contentId);

if ($info['status'] != 1){
	return;
}
$obj = new stdClass();
$obj->uid = $info['userid'];
$obj->id = $info['topicid'];

$topic = CMSQBlog::Topic(Brick::$db, $obj);
if (empty($topic)){
	return;
}

$brick->param->var['tl'] = $topic['catph']." -> ".$topic['tl'];

?>