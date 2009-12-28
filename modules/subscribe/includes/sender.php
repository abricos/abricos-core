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
$count = 0;
$error = 0;
$obj = json_decode($json);
$report = array();
$errorMail = array();

$row = CMSQSubscribe::AdmGetMessage(Brick::$db, $obj);

if ($row['tpid'] > 0){
	$body = str_replace("{v#message}", $row['body'], $row['tpbody']);
}else{
	$body = $row['body'];
}
$subject = $row['subject'];

if ($obj->act == 'test'){
	CMSQSubscribe::ConfigUpdate(Brick::$db, 'testmail', $obj->email);

	$arr = explode(',', $obj->email);
	foreach ($arr as $email){
		$mailer = Brick::$cms->GetMailer();
		$mailer->Subject = $subject;
		$mailer->MsgHTML($body);
		$mailer->AddAddress($email);
		$result = $mailer->Send();
		if ($result){
			$count++;
		}else{
			$error++;
		}
	}
}else if ($obj->act == 'send'){
	
	CMSQSubscribe::AdmSenderCreate(Brick::$db, $obj->id);
	
	$rows = CMSQSubscribe::AdmSenderList(Brick::$db, $obj->id);
	while (($row = Brick::$db->fetch_array($rows))){
		
		$mailer = Brick::$cms->GetMailer();
		$mailer->Subject = $subject;
		$mailer->MsgHTML($body);
		$mailer->AddAddress($row['email']);
		
		$result = $mailer->Send();
		if ($result){ // сообщение отправлено успешно
			CMSQSubscribe::AdmSenderSend(Brick::$db, $row['id']);
			$count++;
		}else{
			array_push($errorMail, $row['email']);
			$error++;
		}
	}
}

$report['count'] = $count;
$report['error'] = $error;
$report['errml'] = $errorMail;

$brick->param->var['d'] = json_encode($report); 

?>