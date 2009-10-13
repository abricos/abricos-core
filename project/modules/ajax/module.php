<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage Ajax
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$mod = new CMSModuleAjax();
CMSRegistry::$instance->modules->Register($mod);

/**
 * Модуль обработки AJAX запросов
 * @package CMSBrick
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