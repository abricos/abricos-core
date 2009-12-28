<?php
/**
 * Восстановление пароля пользователя
 * 
 * URL по типу http://mysite.com/user/recpwd/{hash}, где:
 * {hash} - идентификатор восстановления пароля.
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage User
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$brick = Brick::$builder->brick;

$adress = Brick::$cms->adress;
$p_hash = bkstr($adress->dir[2]);
$ret->error = 0;

$userManager = CMSRegistry::$instance->modules->GetModule('user')->GetUserManager(); 

$pwdreq = CMSSqlQueryUser::PwdReqGetAccess(Brick::$db, $p_hash);
if (empty($pwdreq)){
	$ret->error = 1; sleep(1);			
}else{
	$userid = $pwdreq['userid'];
	$user = CMSQUser::UserById(Brick::$db, $userid);
			
	$newpass = cmsrand(100000, 999999);
	$passcrypt = $userManager->UserPasswordCrypt($newpass, $user['salt']);
			
	CMSSqlQueryUser::PwdChange(Brick::$db, $userid, $p_hash, $passcrypt);

	$ph = Brick::$builder->phrase;
	$sitename = $ph->Get('sys', 'site_name');
	
	$subject = sprintf($ph->Get('user','pwdres_changemail_subj'), $sitename);
			
	$emlmsg = nl2br($ph->Get('user','pwdres_changemail'));
	$message = sprintf($emlmsg, $user['username'], $newpass, $sitename);
		
	$mailer = Brick::$cms->GetMailer();
	$mailer->Subject = $subject;
	$mailer->MsgHTML($message);
	$mailer->AddAddress($user['email'], $user['username']);
	$mailer->Send();
}
$brick->param->var['result'] = json_encode($ret);

?>