<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

$json = Brick::$input->clean_gpc('p', 'json', TYPE_STR);
$brick = Brick::$builder->brick;

if (empty($json)){ return; }

$obj = json_decode($json);
$ret = new stdClass();
$ret->eml = $obj->eml;
$ret->error = 0; 

if ($obj->act == 'reg'){
	if (!CMSModuleUser::UserVerifyName($obj->unm)){
		$ret->error = 3; 
	}else{
		$ret->error = CMSSqlQueryUser::QueryRegUsernameExists(Brick::$db, $obj->unm, $obj->eml);
	}
	
	if ($ret->error == 0){
		$p_salt = CMSModuleUser::UserCreateSalt();
		
		$user = array();
		$user["username"] = $obj->unm;
		$user["joindate"] = TIMENOW;
		$user["salt"] = $p_salt;
		$user["password"] = CMSModuleUser::UserPasswordCrypt($obj->pass, $p_salt);
		$user["email"] = $obj->eml;
		
		// Добавление юзера в БД
		CMSSqlQueryUser::QueryAddUser(Brick::$db, $user);
			
		$host = $_SERVER['HTTP_HOST'] ? $_SERVER['HTTP_HOST'] : $_ENV['HTTP_HOST'];
		$link = "http://".$host."/user/activate/".$user["userid"]."/".$user["activateid"];
		
		$sitename = Brick::$builder->phrase->Get('sys', 'site_name');
		$subject = Brick::$builder->phrase->Get('user', 'reg_mailconf_subj'); 
		$message = sprintf(nl2br(Brick::$builder->phrase->Get('user', 'reg_mailconf')), $user['username'], $link, $sitename);
		$send = true;
	}
	$brick->param->var['js'] = str_replace('#j#', json_encode($ret), $brick->param->var['jsreg']); 
}else if($obj->act == 'pwd'){
	$user = CMSSqlQueryUser::UserByEMail(Brick::$db, $obj->eml);
	if (empty($user)){
		$ret->error = 1; // пользователь не найден
	}else{
		$countsend = CMSSqlQueryUser::PwdCountSend(Brick::$db, $user['userid']);
		if ($countsend > 0){
			$ret->error = 2; // письмо уже отправлено
		}else{
			$hash = md5(microtime());
			CMSSqlQueryUser::PwdReqCreate(Brick::$db, $user['userid'], $hash);
			
			$host = $_SERVER['HTTP_HOST'] ? $_SERVER['HTTP_HOST'] : $_ENV['HTTP_HOST'];
			$link = "http://".$host."/user/recpwd/".$hash;
		
			$sitename = Brick::$builder->phrase->Get('sys', 'site_name');
			
			$subject = sprintf(Brick::$builder->phrase->Get('user', 'pwd_mail_subj'), $sitename);
			$message = sprintf(nl2br(Brick::$builder->phrase->Get('user', 'pwd_mail')), $obj->eml, $link, $user['username'], $sitename);
			$send = true;
		}
	}
	$brick->param->var['js'] = str_replace('#j#', json_encode($ret), $brick->param->var['jspwd']); 
}

if ($send){
	$mailer = Brick::$cms->GetMailer();
	$mailer->Subject = $subject;
	$mailer->MsgHTML($message);
	$mailer->AddAddress($obj->eml);
	$mailer->Send();
}

?>