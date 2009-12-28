<?php 
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * Модуль Вопрос-Ответ
 */

$cms = CMSRegistry::$instance;

$mod = new CMSModFaq();
$cms->modules->Register($mod);

class CMSModFaq extends CMSModule {
	
	public function __construct(){
		$this->version = "1.0.0";
		$this->name = "faq";
		$this->takelink = "faq";
	}
}

class CMSModFaqMan {
	
	public static function IsAdmin(){
		return CMSRegistry::$instance->session->IsAdminMode();
	}
	
	public static function IsRegistred(){
		return CMSRegistry::$instance->session->IsRegistred();
	}
	
	/**
	 * Добавление сообщения
	 */
	public static function MessageAppend($data){
		$utmanager = CMSRegistry::$instance->GetUserTextManager();
		$message = $utmanager->Parser($data->message);
		// $message = $data->message;
		if (empty($message)){ return 0; }
		
		$userid = Brick::$session->userinfo['userid'];
		if (!CMSModFaqMan::IsRegistred() && empty($data->email)){
			return 0;
		}
		
		$globalid = md5(TIMENOW);
		
		$emails = Brick::$builder->phrase->Get('faq', 'adm_emails');
		$arr = explode(',', $emails);
		$subject = Brick::$builder->phrase->Get('faq', 'adm_notify_subj');
		$body = nl2br(Brick::$builder->phrase->Get('faq', 'adm_notify'));
		$body = sprintf($body, $data->fio, $data->phone, $data->email, $message);
		foreach ($arr as $email){
			$email = trim($email);
			if (empty($email)){ continue; }
			$mailer = Brick::$cms->GetMailer();
			$mailer->Subject = $subject;
			$mailer->MsgHTML($body);
			$mailer->AddAddress($email);
			$mailer->Send();
		}
		
		return CMSQFaq::MessageAppend(Brick::$db, $globalid, $userid, $data->fio, $data->phone, $data->email, $message, $data->owner, $data->ownerparam);
	}
	
	public static function MessageList($status, $page, $limit){
		if (!CMSModFaqMan::IsAdmin()){return ;}
		return CMSQFaq::MessageList(Brick::$db, $status, $page, $limit);
	}
	public static function Arhive($status, $page, $limit){
		if (!CMSModFaqMan::IsAdmin()){return ;}
		return CMSQFaq::Arhive(Brick::$db, $status, $page, $limit);
	}
	
	public static function MessageRemove($messageid){
		if (!CMSModFaqMan::IsAdmin()){ return ;}
		CMSQFaq::MessageRemove(Brick::$db, $messageid);
	}
	/*
	public static function Reply($data){
		if (!CMSModFaqMan::IsAdmin()){return ;}
		
		$messageid = $data->id;
		$userid = Brick::$session->userinfo['userid'];
		$body = nl2br($data->rp_body);
		
		$mailer = Brick::$cms->GetMailer();
		$mailer->Subject = "Re: ".Brick::$builder->phrase->Get('sys', 'site_name');
		$mailer->MsgHTML($body);
		$mailer->AddAddress($data->ml);
		$mailer->Send();
		
		CMSQFaq::Reply(Brick::$db, $messageid, $userid, $body);
	}
	*/

	public static function Reply($data){
		if (!CMSModFaqMan::IsAdmin()){return ;}
		
		$messageid = $data->id;
		$st = $data->st;
		$userid = Brick::$session->userinfo['userid'];
		//$question = nl2br($data->body);
		//$answer = nl2br($data->rp_body);
		$subject = Brick::$builder->phrase->Get('faq', 'usr_notify_subj');
		$body = nl2br(Brick::$builder->phrase->Get('faq', 'usr_notify'));
		$body = sprintf($body, $data->fio, $data->body, $data->rp_body);
		
		$mailer = Brick::$cms->GetMailer();
		$mailer->Subject = $subject;
		$mailer->MsgHTML($body);
		$mailer->AddAddress($data->ml);
		$mailer->Send();
		
		CMSQFaq::Reply(Brick::$db, $messageid, $userid, $data->body, $data->rp_body, $st);
	}
	
	public static function Edit($data){
		if (!CMSModFaqMan::IsAdmin()){return ;}
		
		$messageid = $data->id;
		$st = $data->st;
		$userid = Brick::$session->userinfo['userid'];
		$question = nl2br($data->body);
		$answer = nl2br($data->rp_body);
		
		CMSQFaq::Edit(Brick::$db, $messageid, $userid, $question, $answer, $st);
	}
}

class CMSQFaq {
	
	const MSG_NEW = 0;
	const MSG_REPLY = 1;
	
	/**
	 * Ответ на сообщение
	 */
	public static function Reply(CMSDatabase $db, $messageid, $userid, $question, $answer, $st){
		$sql = "
			INSERT INTO ".$db->prefix."faq_reply
			(userid, messageid, body, dateline) VALUES (
				".bkint($userid).",
				".bkint($messageid).",
				'".bkstr($answer)."',
				".TIMENOW."
			)
		";
		$db->query_write($sql);
		
		$sql = "
			UPDATE ".$db->prefix."faq_message
			SET status=".bkint($st).", message='".bkstr($question)."'
			WHERE messageid=".bkint($messageid)."
		";
		$db->query_write($sql);
	}
	
	/* в функции edit определить нужные переменные тело ответа и вопроса и обновить их в 2-х таблицах
	 * +смена статуса 2 - "публиковать на сайте"*/
	public static function Edit(CMSDatabase $db, $messageid, $userid, $question, $answer, $st){
		$sql = "
			UPDATE cms_faq_message
			SET message='".bkstr($question)."', status=".bkint($st)."
			WHERE messageid=".bkint($messageid)."
		";
		$db->query_write($sql);
		
		$sql = "
			UPDATE ".$db->prefix."faq_reply
			SET body='".bkstr($answer)."', userid=".bkint($userid)."
			WHERE messageid=".bkint($messageid)."
		";
		$db->query_write($sql);
	}
	/*
	public static function Reply(CMSDatabase $db, $messageid, $userid, $body){
		$sql = "
			INSERT INTO ".$db->prefix."faq_reply
			(userid, messageid, body, dateline) VALUES (
				".bkint($userid).",
				".bkint($messageid).",
				'".bkstr($body)."',
				".TIMENOW."
			)
		";
		$db->query_write($sql);
		
		$sql = "
			UPDATE ".$db->prefix."faq_message
			SET status=".CMSQFaq::MSG_REPLY."
			WHERE messageid=".bkint($messageid)."
		";
		$db->query_write($sql);
	}
	*/
	public static function AllQuestions(CMSDatabase $db){
		$sql = "
		SELECT 
		a.messageid, a.fio, a.message, a.dateline AS qdate,
		aa.messageid,
		aa.body,
		aa.dateline AS adate
		FROM cms_faq_message a
		LEFT JOIN cms_faq_reply aa ON aa.messageid=a.messageid
		WHERE a.status = 2
		ORDER BY adate DESC
		LIMIT 0 , 1000";
		return $db->query_read($sql);
	}
	
	public static function Arhive(CMSDatabase $db){
		$sql = "
			SELECT a.messageid AS id, a.fio, a.phone AS phn, a.email AS ml, a.message AS msg, a.dateline AS qd, aa.body AS ans, aa.dateline AS ad
			FROM cms_faq_message a
			LEFT JOIN cms_faq_reply aa ON aa.messageid = a.messageid
			WHERE a.status !=0
			ORDER BY ad DESC
			LIMIT 0 , 1000";
		return $db->query_read($sql);
	}
	
	public static function MessageList(CMSDatabase $db, $status, $page, $limit){
		$sql = "
			SELECT
				messageid as id,
				userid as uid,
				fio,
				phone as phn,
				email as ml,
				message as msg,
				dateline as dl,
				status as st,
				owner as own,
				ownerparam as ownprm
			FROM ".$db->prefix."faq_message
			WHERE status=".bkint($status)."
			ORDER BY dl DESC
		";
		return $db->query_read($sql);
	}
	
	public static function Message(CMSDatabase $db, $messageid){
		$sql = "
			SELECT
				a.messageid as id,
				a.*
			FROM ".$db->prefix."faq_message a
			WHERE a.messageid=".bkint($messageid)."
			LIMIT 1
		";
		return $db->query_read($sql);
	}
	
	public static function MessageRemove(CMSDatabase $db, $messageid){
		$sql = "
			DELETE FROM ".$db->prefix."faq_message
			WHERE messageid=".bkint($messageid)."
		";
		$db->query_write($sql);
	}
	
	public static function MessageAppend(CMSDatabase $db, $globalid, $userid, $fio, $phone, $email, $message, $owner, $ownerparam){
		$sql = "
			INSERT INTO ".$db->prefix."faq_message
			(globalmessageid, userid, fio, phone, email, message, owner, ownerparam, dateline) VALUES
			(
				'".bkstr($globalid)."',
				".bkint($userid).",
				'".bkstr($fio)."',
				'".bkstr($phone)."',
				'".bkstr($email)."',
				'".bkstr($message)."',
				'".bkstr($owner)."',
				'".bkstr($ownerparam)."',
				".TIMENOW."
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
}

?>