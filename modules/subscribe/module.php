<?php
/**
 * Модуль "Рассылка"
 * 
 * @version $Id$
 * @package CMSBrick
 * @subpackage Subscribe
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$mod = new CMSModSubscribe();
CMSRegistry::$instance->modules->Register($mod);

/**
 * Модуль "Рассылка"
 * 
 * @package CMSBrick
 * @subpackage Subscribe
 */
class CMSModSubscribe extends CMSModule {
	
	const ST_AVAIL = 0;
	const ST_REG = 1;
	const ST_DELETED = 2;
		
	function __construct(){
		$this->version = "1.0.9";
		$this->name = "subscribe";
	}
}

/**
 * Статичные функции запросов к базе данных
 * 
 * @package CMSBrick
 * @subpackage Subscribe
 */
class CMSQSubscribe {
	
	public static function AttachmentRemove(CMSDatabase $db, $id){
		$sql = "
			DELETE FROM ".$db->prefix."scb_attachment
			WHERE attachmentid=".bkint($id)."
		";
		$db->query($sql);
	}
	
	public static function AttachmentAppend(CMSDatabase $db, $obj){
		$sql = "
			INSERT INTO ".$db->prefix."scb_attachment
			(filehash, ownerid, ownertype, fromserver) VALUES
			(
				'".bkstr($obj->fhash)."', 
				".bkint($obj->oid).", 
				".bkint($obj->otype).", 
				".bkint($obj->fsvr)." 
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
	public static function AttachmentUpdate(CMSDatabase $db, $obj){
		if ($obj->tpid > 0){
			$ownerid = $obj->tpid;
			$ownertype = 0; 
			$sql = "
				DELETE FROM ".$db->prefix."scb_attachment
				WHERE ownerid=".bkint($obj->tpid)." AND ownertype=0 
			";
		}else {
			$ownerid = $obj->msgid; 
			$ownertype = 1; 
			$sql = "
				DELETE FROM ".$db->prefix."scb_attachment
				WHERE ownerid=".bkint($obj->msgid)." AND ownertype=1 
			";
		}
		$db->query_write($sql);

		if (empty($obj->files)){
			return ;
		}
		$list = array();
		
		foreach ($obj->files as $file){
			array_push($list, "
				( 
					'".bkstr($file->fid)."', 
					".bkint($ownerid).", 
					".bkint($ownertype).", 
					0 
				)
			");
		}
		$sql = "
			INSERT INTO ".$db->prefix."scb_attachment
			(filehash, ownerid, ownertype, fromserver) VALUES
			".implode(",", $list)."
		";
		$db->query_write($sql);
	}
	
	public static function AttachmentList(CMSDatabase $db, $obj){
		
		$arr = array();
		if ($obj->tpid > 0){
			$obj->tpid = bkint($obj->tpid);
			array_push($arr, "
				SELECT 
					a.attachmentid as id,
					".$obj->tpid." as oid, 
					a.filehash as fid,
					a.ownertype as otype,
					a.fromserver as fsvr,
					f.filename as fnm,
					f.filesize as fsz,
					f.isimage as fimg
				FROM ".$db->prefix."scb_attachment a
				LEFT JOIN ".$db->prefix."fm_file f ON a.filehash = f.filehash
				WHERE a.ownerid = ".$obj->tpid." AND a.ownertype=0 
			");
		}
		if ($obj->msgid > 0){
			$obj->msgid = bkint($obj->msgid);
			array_push($arr, "
				SELECT 
					a.attachmentid as id,
					".$obj->msgid." as oid, 
					a.filehash as fid,
					a.ownertype as otype,
					a.fromserver as fsvr,
					f.filename as fnm,
					f.filesize as fsz,
					f.isimage as fimg
					FROM ".$db->prefix."scb_attachment a
				LEFT JOIN ".$db->prefix."fm_file f ON a.filehash = f.filehash
				WHERE a.ownerid = ".$obj->msgid." AND a.ownertype=1 
			");
		}
		if (empty($arr)){
			return;
		}
		return $db->query_read(implode(" UNION ", $arr));
	}
	
	public static function Template(CMSDatabase $db, $id){
		$sql = "
			SELECT templateid as id, name as nm, body
			FROM ".$db->prefix."scb_template
			WHERE templateid=".bkint($id)."
		";
		return $db->query_first($sql);
	}
	
	public static function TemplateAppend(CMSDatabase $db, $obj){
		$sql = "
			INSERT INTO ".$db->prefix."scb_template
			(name, body) VALUES
			('".bkstr($obj->nm)."', '".bkstr($obj->body)."')
		";
		$db->query_write($sql);
		
		$nobj = new stdClass();
		$nobj->tpid = $db->insert_id();
		$nobj->files = $obj->files;
		CMSQSubscribe::AttachmentUpdate($db, $nobj);
	}
		
	public static function TemplateSave(CMSDatabase $db, $obj){
		$sql = "
			UPDATE ".$db->prefix."scb_template
			SET 
				name='".bkstr($obj->nm)."',
				body='".bkstr($obj->body)."'
			WHERE templateid=".bkint($obj->id)."
		";
		$db->query_write($sql);
		
		$nobj = new stdClass();
		$nobj->tpid = $obj->id;
		$nobj->files = $obj->files;
		CMSQSubscribe::AttachmentUpdate($db, $nobj);
	}
	
	public static function TemplateList (CMSDatabase $db){
		$sql = "
			SELECT templateid as id, name as nm
			FROM ".$db->prefix."scb_template
		";
		return $db->query_read($sql);
	}
	
	public static function ConfigUpdate(CMSDatabase $db, $name, $value){
		$sql = "
			UPDATE ".$db->prefix."scb_config
			SET cfgvalue='".bkstr($value)."'
			WHERE cfgname='".bkstr($name)."'
		";
		$db->query_write($sql);
	}
	
	public static function ConfigByName(CMSDatabase $db, $name){
		$sql = "
			SELECT cfgname as name, cfgvalue as value
			FROM ".$db->prefix."scb_config
			WHERE cfgname='".bkstr($name)."'
		";
		$row = $db->query_first($sql);
		return $row['value'];
	}
	
	public static function Config(CMSDatabase $db){
		$sql = "
			SELECT cfgname as name, cfgvalue as value
			FROM ".$db->prefix."scb_config
		";
		return $db->query_read($sql);
	}

	public static function MailRCClear(CMSDatabase $db){
		$sql = "
			DELETE FROM ".$db->prefix."scb_email
			WHERE deldate>0
		";
		$db->query_write($sql);
	}
	
	public static function MailRestory(CMSDatabase $db, $id){
		$sql = "
			UPDATE ".$db->prefix."scb_email
			SET deldate=0
			WHERE emailid=".bkint($id)."
		";
		$db->query_write($sql);
	}
	
	public static function MailRemove(CMSDatabase $db, $id){
		$sql = "
			UPDATE ".$db->prefix."scb_email
			SET deldate=".TIMENOW."
			WHERE emailid=".bkint($id)."
		";
		$db->query_write($sql);
	}
	
	public static function MailListCount(CMSDatabase $db){
		$sql = "
			SELECT count(emailid) as cnt
			FROM ".$db->prefix."scb_email
		";
		$row = $db->query_first($sql);
		return $row['cnt'];
	}
	
	public static function MailList(CMSDatabase $db, $page){
		$from = (($page-1)*15);
		$sql = "
			SELECT 
				emailid as id, 
				contactname as cnm, 
				email as ml, 
				status as st, 
				dateline as dl, 
				code as cd, 
				userid as uid,
				deldate as dd
			FROM ".$db->prefix."scb_email
			ORDER BY dl DESC
			LIMIT ".$from.", 15
		";
		return $db->query_read($sql);
	}
	
	public static function CheckEmail(CMSDatabase $db, $email){
		$sql = "
			SELECT emailid as id
			FROM ".$db->prefix."scb_email
			WHERE email='".bkstr($email)."'
		";
		
		$row = $db->query_first($sql);
		if (empty($row)){
			return 0;
		}
		return $row['id'];
	}
	
	public static function AdmSaveEmail(CMSDatabase $db, $data){
		$sql = "
			UPDATE ".$db->prefix."scb_email
			SET 
				status=".CMSModSubscribe::ST_REG.",
				email='".bkstr($data->ml)."',
				contactname='".bkstr($data->cnm)."'
			WHERE emailid='".bkint($data->id)."'
		";
		$db->query_write($sql);
	}
	
	public static function AdmSenderSend(CMSDatabase $db, $senderid){
		$sql = "
			UPDATE ".$db->prefix."scb_sender
			SET datesend=".TIMENOW."
			WHERE senderid=".bkint($senderid)."
		";
		$db->query_write($sql);
	}
	
	public static function AdmSenderList(CMSDatabase $db, $messageid){
		$sql = "
			SELECT
				a.senderid as id, 
				b.contactname as name,
				b.email as email
			FROM ".$db->prefix."scb_sender a
			LEFT JOIN ".$db->prefix."scb_email b ON a.emailid=b.emailid
			WHERE a.messageid=".bkint($messageid)." 
				AND a.datesend=0 AND b.deldate=0 
				AND b.status=".CMSModSubscribe::ST_REG."
		";
		return $db->query_read($sql);
	}
	
	public static function AdmSenderIsCreated(CMSDatabase $db, $messageid){
		
		$sql = "
			SELECT datesend
			FROM ".$db->prefix."scb_message
			WHERE messageid=".bkint($messageid)." AND datesend=0
			LIMIT 1
		";
		$row = $db->query_first($sql);
		
		return empty($row); 
	}

	public static function AdmGetCountSender(CMSDatabase $db, $messageid){
		
		if ($messageid > 0 && CMSQSubscribe::AdmSenderIsCreated($db, $messageid)){ // рассылка уже была
			// попытка добавить новых
			CMSQSubscribe::AdmSenderCreate($db, $messageid);

			$sql = "
				SELECT count(*) as cnt
				FROM ".$db->prefix."scb_sender a
				LEFT JOIN ".$db->prefix."scb_email b ON a.emailid=b.emailid
				WHERE a.messageid=".bkint($messageid)." 
					AND a.datesend=0 AND b.deldate=0 
					AND b.status=".CMSModSubscribe::ST_REG."
			";
		}else{
			$sql = "
				SELECT count(emailid) as cnt
				FROM ".$db->prefix."scb_email
				WHERE status=".CMSModSubscribe::ST_REG." and deldate=0
			";
		}
		$row = $db->query_first($sql);
		return $row['cnt']; 
	}

	public static function AdmSenderCreate(CMSDatabase $db, $messageid){
		
		// производилась ли отправка этого сообщения
		$msgissend = CMSQSubscribe::AdmSenderIsCreated($db, $messageid);

		if (!$msgissend){ 
			// новая рассылка
			$sql = "
				INSERT INTO ".$db->prefix."scb_sender
				(messageid, emailid)
				SELECT ".bkint($messageid)." as messageid, emailid
				FROM ".$db->prefix."scb_email
				WHERE status=".CMSModSubscribe::ST_REG." and deldate=0
			";
			$db->query_write($sql);
		}else{
			// рассылка уже была, но вдруг появились новые контакты которым надо разослать 
			$sql = "
				INSERT INTO ".$db->prefix."scb_sender
				(messageid, emailid)
				SELECT ".bkint($messageid)." as messageid, emailid
				FROM (
					SELECT emailid, d
					FROM (
						(
							SELECT '0' as d, a.emailid
							FROM ".$db->prefix."scb_email a
							WHERE deldate=0
						)UNION(
							SELECT '1' as d, a.emailid
							FROM ".$db->prefix."scb_sender a
							WHERE messageid = ".bkint($messageid)."
						)
					) aa
					GROUP BY emailid
					HAVING COUNT(*)=1 AND (d='0' OR d='2')
				) aaa		
			";
			$db->query_write($sql);
		}
		$sql = "
			UPDATE ".$db->prefix."scb_message
			SET
				datesend=".TIMENOW."
			WHERE messageid=".bkint($messageid)."
		";
		$db->query_write($sql);
	}
	
	public static function AdmGetMessage(CMSDatabase $db, $obj){
		$sql = "
			SELECT 
				a.messageid as id,
				a.subject as subject,
				a.body as body,
				a.templateid as tpid,
				b.name as tpnm,
				b.body as tpbody
			FROM ".$db->prefix."scb_message a
			LEFT JOIN ".$db->prefix."scb_template b ON a.templateid = b.templateid 
			WHERE a.messageid=".bkint($obj->id)."
		";
		return $db->query_first($sql);
	}
	
	public static function AdmMessageList(CMSDatabase $db){
		$sql = "
			SELECT 
				messageid as id,
				subject as sj,
				dateline as dl,
				datesend as ds,
				module as md
			FROM ".$db->prefix."scb_message
			WHERE deldate=0
			ORDER BY dl DESC
		";
		return $db->query_read($sql);
	}
	
	public static function MessageAppend(CMSDatabase $db, $obj){
		return CMSQSubscribe::AdmAddMessage($db, $obj);
	}
	
	public static function MessageSave(CMSDatabase $db, $obj){
		$sql = "
			UPDATE ".$db->prefix."scb_message
			SET
				subject='".bkstr($obj->subject)."',
				body='".bkstr($obj->body)."',
				dateline='".TIMENOW."',
				templateid=".bkint($obj->tpid)."
			WHERE messageid=".bkint($obj->id)."
		";
		$db->query_write($sql);
		
		$nobj = new stdClass();
		$nobj->msgid = $obj->id;
		$nobj->files = $obj->files;
		CMSQSubscribe::AttachmentUpdate($db, $nobj);
	}
	
	public static function AdmMessageRemove(CMSDatabase $db, $obj){
		$sql = "
			UPDATE ".$db->prefix."scb_message
			SET deldate=".TIMENOW."
			WHERE messageid=".bkint($obj->id)."
		";
		$db->query_write($sql);
	} 
	
	public static function AdmAddMessage(CMSDatabase $db, $obj){
		$obj->tpid = intval($obj->tpid);
		$sql = "
			INSERT INTO ".$db->prefix."scb_message
			(subject, body, dateline, module, templateid) VALUES
			(
				'".bkstr($obj->subject)."',
				'".bkstr($obj->body)."',
				'".TIMENOW."',
				'".bkstr($obj->module)."',
				".bkint($obj->tpid)."
			)
		";
		$db->query_write($sql);
		
		$nobj = new stdClass();
		$nobj->msgid = $db->insert_id();
		$nobj->files = $obj->files;
		CMSQSubscribe::AttachmentUpdate($db, $nobj);
		
		return $nobj->msgid;
	}
	
	public static function AdmAddEmail(CMSDatabase $db, $obj){
		$email = trim($obj->ml);
		$cname = trim($obj->cnm);
		$id = CMSQSubscribe::CheckEmail($db, $email);
		if ($id > 0){
			/*
			$sql = "
				UPDATE ".$db->prefix."scb_email
				SET status = 1
				WHERE emailid='".$id."'
			";
			/**/
		}else{
			$sql = "
				INSERT INTO ".$db->prefix."scb_email
				(contactname, email, status, dateline, code) VALUES
				('".bkstr($cname)."', '".bkstr($email)."', '1', '".TIMENOW."','')
			";
		}
		$db->query_write($sql);
	}
}

?>