<?php 
/**
 * @version $Id$
 * @package Abricos * @subpackage Feedback
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$cms = CMSRegistry::$instance;

$mod = new CMSModFeedback();
$cms->modules->Register($mod);

/**
 * Модуль обратной связи
 * @package Abricos 
 * @subpackage Feedback
 */
class CMSModFeedback extends CMSModule {

	/**
	 * Конструктор 
	 */
	public function CMSModFeedback(){
		$this->version = "0.2";
		$this->name = "feedback";
		$this->takelink = "feedback";
	}
}

/**
 * Класс статичных функций модуля
 * 
 * @package Abricos
 * @subpackage Feedback
 */
class CMSModFeedbackMan {
	
	public static function IsAdmin(){
		return CMSRegistry::$instance->session->IsAdminMode();
	}
	
	public static function IsRegistred(){
		return CMSRegistry::$instance->session->IsRegistred();
	}
	
	/**
	 * Добавить сообщение от пользователя и отправить уведомление администратору сайта
	 * 
	 * @static
	 * @param object $data данные сообщения 
	 * @return integer идентификатор нового сообщения
	 */
	public static function MessageAppend($data){
		$utmanager = CMSRegistry::$instance->GetUserTextManager();
		$message = $utmanager->Parser($data->message);
		// $message = $data->message;
		if (empty($message)){ return 0; }
		
		$userid = Brick::$session->userinfo['userid'];
		if (!CMSModFeedbackMan::IsRegistred() && empty($data->email)){
			return 0;
		}
		
		$globalid = md5(TIMENOW);
		
		$emails = Brick::$builder->phrase->Get('feedback', 'adm_emails');
		$arr = explode(',', $emails);
		$subject = Brick::$builder->phrase->Get('feedback', 'adm_notify_subj');
		$body = nl2br(Brick::$builder->phrase->Get('feedback', 'adm_notify'));
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
		
		return CMSQFeedback::MessageAppend(Brick::$db, $globalid, $userid, $data->fio, $data->phone, $data->email, $message, $data->owner, $data->ownerparam);
	}
	
	/**
	 * Получить список сообщений из базы
	 * 
	 * @static
	 * @param integer $status статус сообщения, 0 - новое, 1 - сообщения на которые был дан ответ
	 * @param integer $page номер страницы
	 * @param integer $limit кол-во сообщений на страницу
	 * @return integer указатель на результат SQL запроса
	 */
	public static function MessageList($status, $page, $limit){
		if (!CMSModFeedbackMan::IsAdmin()){return ;}
		return CMSQFeedback::MessageList(Brick::$db, $status, $page, $limit);
	}
	
	/**
	 * Удалить сообщение из базы
	 * 
	 * @static
	 * @param integer $messageid идентификатор сообщения
	 */
	public static function MessageRemove($messageid){
		if (!CMSModFeedbackMan::IsAdmin()){ return ;}
		CMSQFeedback::MessageRemove(Brick::$db, $messageid);
	}
	
	/**
	 * Ответить на сообщение, занеся ответ в базу и отправив email с ответом пользователю
	 * 
	 * @static
	 * @param object $data данные сообщения и текст ответа
	 */
	public static function Reply($data){
		if (!CMSModFeedbackMan::IsAdmin()){return ;}
		
		$messageid = $data->id;
		$userid = Brick::$session->userinfo['userid'];
		$body = nl2br($data->rp_body);
		
		$mailer = Brick::$cms->GetMailer();
		$mailer->Subject = "Re: ".Brick::$builder->phrase->Get('sys', 'site_name');
		$mailer->MsgHTML($body);
		$mailer->AddAddress($data->ml);
		$mailer->Send();
		
		CMSQFeedback::Reply(Brick::$db, $messageid, $userid, $body);
	}
}

/**
 * Класс статичных функций запросов к базе данных
 * 
 * @package Abricos
 * @subpackage Feedback
 */
class CMSQFeedback {
	
	/**
	 * Новое сообщение 
	 * @var integer
	 */
	const MSG_NEW = 0;
	/**
	 * Сообщение на которое был дан ответ администратором сайта 
	 * @var integer
	 */
	const MSG_REPLY = 1;
	
	/**
	 * Добавить ответ на сообщение пользователя и изменить статус этого сообщения на отвеченное
	 * 
	 * @static
	 * @param CMSDatabase $db менеджер базы данных
	 * @param integer $messageid идентификатор сообщения
	 * @param integer $userid идентификатор пользователя который дает ответ на сообщение
	 * @param string $body текст ответа
	 */
	public static function Reply(CMSDatabase $db, $messageid, $userid, $body){
		$sql = "
			INSERT INTO ".$db->prefix."fb_reply
			(userid, messageid, body, dateline) VALUES (
				".bkint($userid).",
				".bkint($messageid).",
				'".bkstr($body)."',
				".TIMENOW."
			)
		";
		$db->query_write($sql);
		
		$sql = "
			UPDATE ".$db->prefix."fb_message
			SET status=".CMSQFeedback::MSG_REPLY."
			WHERE messageid=".bkint($messageid)."
		";
		$db->query_write($sql);
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
			FROM ".$db->prefix."fb_message
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
			FROM ".$db->prefix."fb_message a
			WHERE a.messageid=".bkint($messageid)."
			LIMIT 1
		";
		return $db->query_read($sql);
	}
	
	public static function MessageRemove(CMSDatabase $db, $messageid){
		$sql = "
			DELETE FROM ".$db->prefix."fb_message
			WHERE messageid=".bkint($messageid)."
		";
		$db->query_write($sql);
	}
	
	public static function MessageAppend(CMSDatabase $db, $globalid, $userid, $fio, $phone, $email, $message, $owner, $ownerparam){
		$sql = "
			INSERT INTO ".$db->prefix."fb_message
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