<?php 
/**
 * Модуль "DevUtils"
 *
 * Задачи модуля: <br>
 * 1) сформировать список JS компонентов <br>
 * 2) сформировать документацию по каждому YUIDoc <br>
 * 3) ссжать YUICompressor-ом <br>
 * 4) скомпилировать каждый в конечный файл, две версии обычная и упакованная в gz-пом
 * 
 * @version $Id: module.php 96 2009-10-16 13:10:09Z roosit $
 * @package Abricos
 * @subpackage DevUtils
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$mod = new CMSModDevUtils();
CMSRegistry::$instance->modules->Register($mod);

/**
 * Модуль DevUtils
 * @package Abricos
 * @subpackage DevUtils
 */
class CMSModDevUtils extends CMSModule {
	
	/**
	 * Конструктор
	 */
	public function __construct(){
		// Версия модуля
		$this->version = "0.1";
		
		// Название модуля
		$this->name = "devutils";
		
		$this->takelink = "devutils";
	}
	
}


?>