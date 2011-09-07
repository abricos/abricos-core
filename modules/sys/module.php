<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage Sys
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

/**
 * Системный модуль платформы Abricos
 * @package Abricos
 * @subpackage Sys
 */
class SystemModule extends CMSModule {
	
	/**
	 * Идентификатор страницы в БД
	 *
	 * @var Integer
	 */
	private $pageId = 0;
	
	/**
	 * Идентификатор раздела к которому принадлежит страница
	 *
	 * @var Integer
	 */
	private $menuId = 0;
	
	/**
	 * Адрес, на основе которого собрано меню.
	 * 
	 * @var CMSAdress
	 */
	public $adress = null;
	
	public static $YUIVersion = "2.8.1r1";
	
	private $_manager = null;
	
	public function SystemModule(){
		$this->version = "0.5.4";
		$this->name = "sys";
	}
	
	/**
	 * Получить менеджер 
	 *
	 * @return SystemManager
	 */
	public function GetManager(){
		if (is_null($this->_manager)){
			require_once 'includes/manager.php';
			$this->_manager = new SystemManager($this);
		}
		return $this->_manager;
	}
	
	
	/**
	 * Сборка вывода клиенту
	 */
	public function BuildOutput(){
		
		// Определить модуль управления выводом
		$adress = $this->registry->adress;
		$modules = $this->registry->modules;
		$modman = null;

		if ($adress->level >= 2 && $adress->dir[0] == 'ajax'){
			$modman = $this;
			$contentName = 'ajax';
		}else if ($adress->level >= 2 && $adress->dir[0] == 'tajax'){
			$modman = $this;
			$contentName = 'tajax';
		}else{
			$flagDevelopPage = $adress->level >= 2 && 
				$adress->dir[1] == 'develop' &&
				CMSRegistry::$instance->config['Misc']['develop_mode'];
							
			
			foreach ($modules->modulesInfo as $key => $info){
				// разрешить страницу для разработчика модуля
				if ($flagDevelopPage){
					if ($adress->dir[0] != $key){ continue; }
				}else{
					if ($adress->dir[0] != $info['takelink'] || empty($info['takelink'])){ continue; }
				}
				$modman = $modules->RegisterByName($key);
				if (empty($modman)){
					$this->registry->SetPageStatus(PAGESTATUS_500);
				}
				break;
			}
			if (is_null($modman)){
				foreach ($modules->modulesInfo as $key => $info){
					if ($info['takelink'] == '__super'){
						$modman = $modules->RegisterByName($key);
						break;
					}
				}
			}
			if (is_null($modman)){
				$modman = $this;
			}
			
			// имя кирпича
			if ($flagDevelopPage){
				$contentName = 'develop';
			}else{
				$contentName = $modman->GetContentName();
			}
		}
		
		Brick::$modman = $modman;
		
		if (empty($contentName)){
			$this->registry->pageStatus = PAGESTATUS_404;
		}
		if ($this->registry->pageStatus != PAGESTATUS_OK){
			Brick::$modman = $modman = $this;
			$contentName = $this->GetContentName();
			header("HTTP/1.1 404 Not Found");
		}
		
		$bm = new CMSSysBrickManager($this->registry);
		
		Brick::$db = $this->registry->db;
		Brick::$input = $this->registry->input;
		Brick::$modules = $this->registry->modules;
		Brick::$cms = $this->registry;
		Brick::$builder = new CMSSysBrickBuilder($this->registry);
		Brick::$user = $this->registry->user;
		// TODO: необходимо удалить
		Brick::$session = $this->registry->user; 
		Brick::$style = Brick::$builder->phrase->Get('sys', 'style', 'default');
		
		if (is_array($contentName)){
			// поиск для перегруженных кирпичей
			$find = false;
			foreach ($contentName as $cname){
				if (file_exists(CWD."/tt/".Brick::$style."/override/".$modman->name."/content/".$cname.".html")){
					$contentName = $cname;
					$find = true;
					break;
				}
			}
			if (!$find){
				foreach ($contentName as $cname){
					if (file_exists(CWD."/modules/".$modman->name."/content/".$cname.".html")){
						$contentName = $cname;
						$find = true;
						break;
					}
				}
			}
		}

		$brick = $bm->BuildOutput($modman->name, $contentName, Brick::BRICKTYPE_CONTENT);
		// Любая сборка страницы начинается с кирпича BRICKTYPE_CONTENT
		// и обязательно содержит в себе шаблон, в который он будет входить.
		// Необходимо для дальнейшей компиляции страницы подчинить кирпич-контент 
		// в кирпич-шаблон и определить его как последний собираемый кирпич
		$newChildren = array();
		$template = null;
		foreach ($brick->child as $childbrick){
			if ($childbrick->type == Brick::BRICKTYPE_TEMPLATE){
				$template = $childbrick;
			}else{
				array_push($newChildren, $childbrick);
			}
		}
		
		Brick::$builder->template = $template;
		$brick->child = $newChildren;
		array_push($template->child, $brick);

		Brick::$builder->Compile($template);
	}
	
	public function GetContentName(){
		$adress = $this->registry->adress;
		
		// разрешить страницу для разработчика модуля
		if ($adress->level >= 1 
			&& $adress->dir[0] == 'develop' 
			&& $this->registry->config['Misc']['develop_mode']){
			return 'develop';
		}
		
		switch($this->registry->pageStatus){
			case PAGESTATUS_404:
				return '404';
			case PAGESTATUS_500:
				return '500';
		}
		// return 'index';
		// системный модуль не отдает контент 
		return '404'; 
	}
	
	private $brickReader = null;
	
	public function getBrickReader(){
		if (is_null($this->brickReader)){
			$this->brickReader = new CMSSysBrickReader($this->registry);
		}
		return $this->brickReader;
	}
	
	public $ds = null;
	public function getDataSet(){
		if (is_null($this->ds)){
			$json = $this->registry->input->clean_gpc('p', 'json', TYPE_STR);
			if (empty($json)){ return; }
			$obj = json_decode($json);
			if (empty($obj->_ds)){ return; }
			$this->ds = $obj->_ds;
		}
		return $this->ds;
	}
	
	public function columnToObj($result){
		$arr = array();
		$db = $this->registry->db;
		$count = $db->num_fields($result);
		for ($i=0;$i<$count;$i++){
			array_push($arr, $db->field_name($result, $i));
		}
		return $arr;
	}
	
	public function rowToObj($row){
		$ret = new stdClass();
		$ret->d = $row;
		return $row;
	}
	
	public function &rowsToObj($rows){
		$arr = array();
		while (($row = $this->registry->db->fetch_array($rows))){
			array_push($arr, $this->rowToObj($row));
		}
		return $arr;
	}
}

$mod = new SystemModule();
CMSRegistry::$instance->modules->Register($mod);

?>