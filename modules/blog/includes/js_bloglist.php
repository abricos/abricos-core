<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage Blog
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

if (!Brick::$session->IsAdminMode()){
	return;
}
$user = Brick::$session->userinfo;
$brick = Brick::$builder->brick;

$json = Brick::$input->clean_gpc('p', 'json', TYPE_STR);
$obj = json_decode($json);
if (empty($obj->rc)){
	$obj->rc = "show";
}
if (empty($obj->page)){ $obj->page = 1; }

if ($obj->type == 'topic'){
	$obj->de = TIMENOW;
	$obj->nm = translateruen($obj->tl);
	
	if (!empty($obj->id)){
		$info = CMSQBlog::TopicInfo(Brick::$db, $obj->id);
		
		if (!Brick::$session->IsAdminMode() && $info['userid'] != $user['userid']){
			$brick->content = "alert('Access denied!');";
			return;
		}
	}
	
	if ($obj->act == 'save'){
		if ($obj->st == 1 && empty($obj->dp)){
			$obj->dp = TIMENOW;
		}else if (empty($obj->st)){
			$obj->dp = 0;
		}
		$isnew = empty($obj->id);
		if ($isnew){ // new
			$obj->uid = $user['userid'];
			$obj->dl = TIMENOW;
			$obj->id = CMSQBlog::TopicCreate(Brick::$db, $obj); 
		}
		
		$info = CMSQBlog::TopicInfo(Brick::$db, $obj->id);
	
		$tagarr = array();
		foreach ($obj->tags as $t){
			$t = trim($t);
			$tagarr[$t]['phrase'] = $t;
			$tagarr[$t]['name'] = translateruen($t);
		}

		CMSQBlog::TagSetId(Brick::$db, $tagarr);
		if (!$isnew){
			CMSQBlog::TopicSave(Brick::$db, $info, $obj);
		}
		CMSQBlog::TagUpdate(Brick::$db, $obj->id, $tagarr);
	}else if ($obj->act == 'remove'){
		CMSQBlog::TopicRemove(Brick::$db, $obj->id);
	}else if ($obj->act == 'restore'){
		CMSQBlog::TopicRestore(Brick::$db, $obj->id);
	}else if ($obj->act == 'publish'){
		CMSQBlog::TopicPublish(Brick::$db, $obj->id);
	}
} else {
	if ($obj->act == 'rcclear'){
		CMSQBlog::TopicRecycleClear(Brick::$db, $user['userid']);
	}
}

$obj->uid = 0;
$brick->param->var['total'] = CMSQBlog::TopicUserListCount(Brick::$db, $obj);
$brick->param->var['page'] = $obj->page;
$brick->param->var['rc'] = $obj->rc;

$rows = CMSQBlog::TopicUserList(Brick::$db, $obj);

while (($row = Brick::$db->fetch_array($rows))){
	$brick->param->var['lst'] .= str_replace("#c#", 
		json_encode_ext($row), 
		$brick->param->var['i']
	);
}

?>