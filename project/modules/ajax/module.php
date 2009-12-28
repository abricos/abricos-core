<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage Ajax
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$mod = new CMSModuleAjax();
CMSRegistry::$instance->modules->Register($mod);

/**
 * Модуль обработки AJAX запросов
 * @package Abricos
 * @subpackage Ajax
 */
class CMSModuleAjax extends CMSModule{
	public function CMSModuleAjax(){
		$this->version = "1.0.0";
		$this->name = "ajax";
		$this->takelink = "ajax";
	}
}
?>