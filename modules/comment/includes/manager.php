<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage Comment
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

/**
 * Менеджер комментариев
 * @package CMSBrick
 * @subpackage Comment
 */
class CMSCommentManager {
	
	/**
	 * Ядро
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	/**
	 * Данные пользователя
	 *
	 * @var CMSSysSession
	 */
	public $session = null;
	
	/**
	 * Менеджер обработки пользовательского текста
	 *
	 * @var CMSUserText
	 */
	public $utmanager = null;
	
	public function __construct(CMSRegistry $registry){
		$this->registry = $registry;
		$this->session = $registry->session;
		$this->utmanager = $registry->GetUserTextManager();
	}
	
	public function Preview($d){
		$d->bd = $this->utmanager->Parser($d->bd);
		$arr = array();
		$row = array();
		$row['id'] = 1;
		$row['bd'] = $d->bd;
		array_push($arr, $row);
		return $arr;
	}
	
	/**
	 * Добавить комментарий
	 * @param integer $contentid идентификатор страницы
	 * @param object $d данные комментария
	 */
	public function Append($contentid, $d){
		if (!$this->session->IsRegistred()){ return; }
		
		// Комментарий добавляет не администратор, значит необходимо обработать входные данные
		/* временно отключено
		if (!$this->session->IsAdminMode()){
			$error = null;
			$d->bd = $this->jevix->parse($d->bd, $error); 
		}
		/**/
		$d->bd = $this->utmanager->Parser($d->bd);
		if (empty($d->bd)){ return; }
		$d->uid = $this->session->userinfo['userid']; 
		$d->id = CMSQComt::Append($this->registry->db, $contentid, $d);
		$d->cid = $contentid;

		// отправка уведомления 
		$contentinfo = CMSSqlQuery::ContentInfo(Brick::$db, $contentid);
		if (!empty($contentinfo)){
			$module = Brick::$modules->GetModule('comment');
			$module->commentData = $d;
			
			$module = Brick::$modules->GetModule($contentinfo['modman']);
			$module->OnComment();
		}
		
	}
}

?>