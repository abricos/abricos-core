<?php 
/**
 * @version $Id: module.php 14 2009-08-20 14:13:11Z roosit $
 * @package Abricos
 * @subpackage TinyMCE
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

/**
 * Модуль текстового редактора TinyMCE.
 * 
 */

$mod = new CMSModTinyMCE();
$cms = CMSRegistry::$instance->modules->Register($mod);;

class CMSModTinyMCE extends CMSModule {
	
	/**
	 * Версия редактора TinyMCE
	 * @var String 
	 */
	public $tinyMCEVersion = "3.2.3";

	public function CMSModTinyMCE(){
		$this->version = "0.1";
		$this->name = "tinymce";
		$this->takelink = "tinymce";
	}
	
	public function GetContentName(){
		$adress = $this->registry->adress;
		
		// разрешить страницу для разработчика модуля
		if ($adress->level >= 2 && 
			$adress->dir[1] == 'develop' &&
			CMSRegistry::$instance->config['Misc']['develop_mode']){
			return 'develop';
		}
		return parent::GetContentName();
	}
}

?>