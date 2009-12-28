<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage Comment
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

// оставлять комментарии могут только зарегистрированные пользователи
if (!Brick::$session->IsRegistred()){ return; }

$brick = Brick::$builder->brick;
$user = &Brick::$session->userinfo;

$p_do = Brick::$input->clean_gpc('g', 'do', TYPE_STR);
$p_contentId = Brick::$input->clean_gpc('g', 'contentid', TYPE_INT);
$p_comment = Brick::$input->clean_gpc('p', 'comment', TYPE_STR);
$p_last = Brick::$input->clean_gpc('g', 'last', TYPE_INT);

$brick->param->var['cid'] = $p_contentId;

if ($p_do == "send" && !empty($p_comment)){

	$p_commentId = Brick::$input->clean_gpc('g', 'commentid', TYPE_INT);
	
	$allowTags = array(
    'b', 'strong', 'i', 'em', 'u','a',
    'p', 'sup', 'sub', 'div', 'img', 'span',
    'font', 'br', 'ul', 'ol', 'li'
	);
	$p_comment = strip_tags($p_comment, '<'.implode('><', $allowTags).'>');
	
	$data = array();
	$data['userid'] = $user['userid'];
	$data['contentid'] = $p_contentId;
	$data['parentcommentid'] = $p_commentId;
	$data['body'] = $p_comment;

	$newCommentId = CMSQComt::Append(Brick::$db, $data);
	$data['commentid'] = $newCommentId; 
	
	/* Отправка писем уведомлений */
	
	$contentinfo = CMSSqlQuery::ContentInfo(Brick::$db, $p_contentId);

	if (!empty($contentinfo)){
		$module = Brick::$modules->GetModule('comment');
		$module->commentData = $data;
		
		$module = Brick::$modules->GetModule($contentinfo['modman']);
		$module->OnComment();
	}
}

$rows = CMSQComt::Comments(Brick::$db, $p_contentId, $p_last);

while (($row = Brick::$db->fetch_array($rows))){
	if ($row['st'] == 1){
		$row['bd'] = '';
	}
	$brick->param->var['lst'] .= str_replace("#c#", 
		json_encode($row), $brick->param->var['i']
	);
}
?>