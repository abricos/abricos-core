<?php
/**
* @version $Id: cmsmailer.php 769 2009-04-27 04:45:07Z AKuzmin $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

require_once(CWD.'/includes/phpmailer/class.phpmailer.php');

class CMSMailer extends PHPMailer {
	
	/**
	 * Ядро
	 *
	 * @var CMSRegistry
	 */
	private $registry = null;
	
	function __construct(CMSRegistry $registry){
		$this->registry = $registry;
		
		$this->FromName = Brick::$builder->phrase->Get('sys', 'site_name');
		$this->From = Brick::$builder->phrase->Get('sys', 'admin_mail'); 
		$this->AltBody = "To view the message, please use an HTML compatible email viewer!";
		$this->Priority = 3; 
		$this->CharSet = "utf-8";
	}
	
	public function MsgHTML($message, $basedir=''){
		$message = "<html><body>".$message."</body></html>";
		parent::MsgHTML($message, $basedir);
	}
	
	public function Send(){
		if ($this->registry->db->readonly){
			return true;
		}
		return parent::Send();
	}
}
?>