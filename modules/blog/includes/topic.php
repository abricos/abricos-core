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
$userid = Brick::$session->userinfo['userid'];
$in = Brick::$input;

$p_do = Brick::$input->clean_gpc('g', 'do', TYPE_STR);
$obj = new stdClass();

if ($p_do == 'loadbody'){
	// запрос на подгрузку тела записи
	$topicid = Brick::$input->clean_gpc('g', 'topicid', TYPE_INT);
	$info = CMSQBlog::TopicInfo(Brick::$db, $topicid);

	if (empty($info) || $info['status'] != 1){
		return;
	}
	$obj->id = $topicid;
	$obj->uid = $info['userid'];
	$topic = CMSQBlog::Topic(Brick::$db, $obj);
	$brick->content = $topic['body'];
	return;
}

$mod = Brick::$modules->GetModule('blog');
$topicid = $mod->topicid;
$info = $mod->topicinfo;

if (empty($info) || 
		($info['userid'] != $userid && $info['status'] != 1)
	){
	$cms->SetPageStatus(PAGESTATUS_404);
	$brick->content = "";
	return;
}

$obj->id = $topicid;
$obj->uid = $info['userid'];

$topic = CMSQBlog::Topic(Brick::$db, $obj);

$title = $topic['tl'] .' - '. $topic['catph'] ;
Brick::$builder->SetGlobalVar("page_title", $topic['mtd']);

$lcat = "/blog/".$topic['catnm']."/";
$ltop = $lcat.$topic['id']."/";

$tdata = array();
$tdata['catlink'] = $lcat;
$tdata['cat'] = $topic['catph'];
$tdata['subj'] = $topic['tl'];
$tdata['subjlink'] = $ltop;
$tdata['user'] = $topic['unm'];

$tdata['date'] = rusDateTime(intval($topic['dp']));
$tdata['date_m3'] = rusMonth(intval($topic['dp']), true);
$tdata['date_d'] = date("d", intval($topic['dp']));

$tdata['intro'] = $topic['intro'];
$tdata['body'] = $topic['body'];

$tags = CMSQBlog::Tags(Brick::$db, $topicid);
$ttags = array();
while (($tag = Brick::$db->fetch_array($tags))){
	array_push($ttags, Brick::ReplaceVarByData($brick->param->var['tag'], array(
		"link" => $tag['nm'],
		"tag" => $tag['ph']
	)));
}
$tdata['tags'] = implode(", ", $ttags); 

$brick->content = Brick::ReplaceVarByData($brick->content, $tdata);



?>