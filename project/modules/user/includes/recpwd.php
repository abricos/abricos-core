<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/*
 * Восстановление пароля
 * URL по типу http://mysite.com/user/recpwd/{hash}, где:
 * {hash} - идентификатор восстановления пароля.
 * 
 */
$brick = Brick::$builder->brick;

$adress = Brick::$cms->adress;
$p_hash = bkstr($adress->dir[2]);
$ret->error = 0;

$pwdreq = CMSSqlQueryUser::PwdReqGetAccess(Brick::$db, $p_hash);
if (empty($pwdreq)){
	$ret->error = 1; sleep(1);			
}else{
	$userid = $pwdreq['userid'];
	$user = CMSSqlQuery::QueryGetUserInfo(Brick::$db, $userid);
			
	$newpass = cmsrand(100000, 999999);
	$passcrypt = CMSModuleUser::UserPasswordCrypt($newpass, $user['salt']);
			
	CMSSqlQueryUser::PwdChange(Brick::$db, $userid, $p_hash, $passcrypt);

	$ph = Brick::$builder->phrase;
	$sitename = $ph->Get('sys', 'site_name');
	
	$subject = sprintf($ph->Get('user','pwd_mailchange_subj'), $sitename);
			
	$emlmsg = nl2br($ph->Get('user','pwd_mailchange'));
	$message = sprintf($emlmsg, $user['username'], $newpass, $sitename);
		
	$mailer = Brick::$cms->GetMailer();
	$mailer->Subject = $subject;
	$mailer->MsgHTML($message);
	$mailer->AddAddress($user['email'], $user['username']);
	$mailer->Send();
}
$brick->param->var['result'] = json_encode($ret);

?>