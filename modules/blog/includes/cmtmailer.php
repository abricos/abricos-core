<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage Blog
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$modComt = Brick::$modules->GetModule('comment');
$modBlog = Brick::$modules->GetModule('blog');
$comment = $modComt->commentData;

$brick = Brick::$builder->brick;

if (empty($comment)){	return; }

$user = Brick::$session->userinfo;

$topic = CMSQBlog::TopicInfo(Brick::$db, 0, $comment->cid);
if (empty($topic)){
	return;
}

$comments = array();
$rows = CMSQComt::Comments(Brick::$db, $comment->cid);
while(($row = Brick::$db->fetch_array($rows))){
	$comments[$row['id']] = $row;
}
$topicUser = CMSQSys::UserById(Brick::$db, $topic['userid']);

$host = $_SERVER['HTTP_HOST'] ? $_SERVER['HTTP_HOST'] : $_ENV['HTTP_HOST'];
$tpLink = "http://".$host.$modBlog->GetTopicLink($topic);

$sitename = Brick::$builder->phrase->Get('sys', 'site_name');
$cmt = $comments[$comment->id];

if ($topic['userid'] != $comment->uid){	// сообщаем автору топика о комментарии
	
	$subject = str_replace('#topic#', $topic['title'], $brick->param->var['emlautorsubj']);
	
	$message = $brick->param->var['emlautor'];
	$message = str_replace('#user#', $cmt['unm'], $message);
	$message = str_replace('#tpclnk#', $tpLink, $message);
	$message = str_replace('#tpcname#', $topic['title'], $message);
	$message = str_replace('#site#', $sitename, $message);
	$message = str_replace('#comment#', $cmt['bd'], $message);
	
	$mailer = Brick::$cms->GetMailer();
	$mailer->Subject = $subject;
	$mailer->MsgHTML($message);
	$mailer->AddAddress($topicUser['email']);
	$mailer->Send();
}

$pcmt = $comments[$comment->pid];
if ($topic['userid'] != $pcmt['uid'] && 
		!empty($pcmt) && 
		$pcmt['uid'] != $topic['userid'] &&
		$pcmt['uid'] != $cmt['uid']){
			
	$userMail = CMSSqlQuery::QueryGetUserInfo(Brick::$db, $pcmt['uid']);
	
	$subject = str_replace('#topic#', $topic['title'], $brick->param->var['emlusrsubj']);
	
	$message = $brick->param->var['emlusr'];
	$message = str_replace('#user#', $cmt['unm'], $message);
	$message = str_replace('#tpclnk#', $tpLink, $message);
	$message = str_replace('#tpcname#', $topic['title'], $message);
	$message = str_replace('#site#', $sitename, $message);
	$message = str_replace('#comment1#', $pcmt['bd'], $message);
	$message = str_replace('#comment2#', $cmt['bd'], $message);
	
	$mailer = Brick::$cms->GetMailer();
	$mailer->Subject = $subject;
	$mailer->MsgHTML($message);
	$mailer->AddAddress($userMail['email']);
	$mailer->Send();
}

?>