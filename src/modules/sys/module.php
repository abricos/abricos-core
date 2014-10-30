<?php
/**
 * Системный модуль
 * 
 * @package Abricos
 * @subpackage Core
 * @link http://abricos.org
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
class Ab_CoreSystemModule extends Ab_Module {
	
	/**
	 * Адрес, на основе которого собрано меню.
	 * 
	 * @var CMSAdress
	 */
	public $adress = null;
	
	public static $YUIVersion = "3.14.0";
	
	private $_manager = null;
	
	public function __construct(){
		$this->version = "0.5.6";
		$this->name = "sys";
		
		$this->permission = new Ab_CoreSystemPermission($this);
	}
	
	/**
	 * Получить менеджер 
	 *
	 * @return Ab_CoreSystemManager
	 */
	public function GetManager(){
		if (is_null($this->_manager)){
			require_once 'includes/manager.php';
			$this->_manager = new Ab_CoreSystemManager($this);
		}
		return $this->_manager;
	}
	
	private $_superContentFile;
	
	/**
	 * Запрашивается ли супер-контент
	 * Супер-контент должен распологаться по адресу /content/[lang]/...
	 */
	public function IsSuperContent(){
		$adr = Abricos::$adress;
		
		$path = $adr->uri;
		
		$path = str_replace("\\", "/", $path);
		$path = str_replace("..", "", $path);
		$path = preg_replace("/[^0-9a-z\-_,\/\.]+/i", "", $path);
		
		if (!empty(Abricos::$config['supercontent']['path'])){
			$path = Abricos::$config['supercontent']['path']."/".Abricos::$LNG.$path;
		}else{
			$path = CWD."/content/".Abricos::$LNG.$path;
		}
		
		if (!file_exists($path)){ 
			return false;
		}
		
		$this->_superContentFile = $path;
		
		return true;
	}
	
	/**
	 * Сборка вывода клиенту
	 */
	public function BuildOutput(){
		
		// Определить модуль управления выводом
		$adress = $this->registry->adress;
		$modules = $this->registry->modules;
		$modman = null;
		
		$isSuperContent = false;
		
		if ($this->IsSuperContent()){
			$modman = $this;
			$contentName = $this->_superContentFile;
			$isSuperContent = true;
		}else if ($adress->level >= 2 && $adress->dir[0] == 'ajax'){
			$modman = $this;
			$contentName = 'ajax';
		}else if ($adress->level >= 2 && $adress->dir[0] == 'tajax'){
			$modman = $this;
			$contentName = 'tajax';
		}else{
			$flagDevelopPage = $adress->level >= 2 && 
				$adress->dir[1] == 'develop' &&
				Abricos::$config['Misc']['develop_mode'];
							
			
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

			// сначало проверить в настройках
			if (is_null($modman)){
				$superModule = Abricos::$config['Takelink']['__super']['module'];
				if (!empty($superModule)){
					$modman = $modules->RegisterByName($superModule);
				}
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
		
		$bm = new Ab_CoreBrickManager($this->registry);
		
		Brick::$db = $this->registry->db;
		Brick::$input = $this->registry->input;
		Brick::$modules = $this->registry->modules;
		Brick::$cms = $this->registry;
		Brick::$builder = new Ab_CoreBrickBuilder($this->registry);
		// Brick::$user = $this->registry->user;
		Brick::$style = Brick::$builder->phrase->Get('sys', 'style', 'default');
		
		// возможно стиль предопределен в конфиге для этого урла
		
		if (!empty($this->registry->config["Template"])){
			$uri = $this->registry->adress->requestURI;
			$cfg = &$this->registry->config["Template"];
			$find = false;
		
			if (!empty($cfg["ignore"])){
				foreach($cfg["ignore"] as &$exp){
					$find = $exp["regexp"] ? preg_match($exp["pattern"], $uri) : $exp["pattern"] == $uri;
					if ($find){
						break;
					}
				}
			}
			if (!$find && !empty($cfg["exp"])){
				foreach($cfg["exp"] as &$exp){
					$find = $exp["regexp"] ? preg_match($exp["pattern"], $uri) : $exp["pattern"] == $uri;
					if ($find){
						Brick::$style = $exp["owner"];
						break;
					}
				}
			}
			if (!$find && !empty($cfg["default"])){
				Brick::$style = $cfg["default"]['owner'];
			}
		}
		
		
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

		$brick = $bm->BuildOutput($modman->name, $contentName, Brick::BRICKTYPE_CONTENT, null, null, $isSuperContent);
		if ($this->registry->pageStatus == PAGESTATUS_500){
			header("HTTP/1.1 500 Internal Server Error");
			exit;
		}
		
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
		
		if (is_null($template)){
			header("HTTP/1.1 500 Internal Server Error");
			print("Template not found. Add the started brick: [tt=main][/tt]");
			exit;
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
			$this->brickReader = new Ab_CoreBrickReader();
		}
		return $this->brickReader;
	}
	
	public $ds = null;
	public function getDataSet(){
		if (is_null($this->ds)){
			$json = Abricos::CleanGPC('p', 'json', TYPE_STR);
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

/**
 * Права (идентификаторы действий) пользователя системного модуля
 * 
 * @package Abricos
 * @subpackage Core
 */
class Ab_CoreSystemAction {
	/**
	 * Администратор
	 * 
	 * @var integer
	 */
	const ADMIN	= 50;
}

/**
 * Права пользователей системного модуля
 * 
 * @package Abricos
 * @subpackage Core
 */
class Ab_CoreSystemPermission extends Ab_UserPermission {

	public function __construct(Ab_CoreSystemModule $module){
		$defRoles = array(
			new Ab_UserRole(Ab_CoreSystemAction::ADMIN, Ab_UserGroup::ADMIN)
		);
		parent::__construct($module, $defRoles);
	}

	/**
	 * Получить роли
	 */
	public function GetRoles(){
		return array(
			Ab_CoreSystemAction::ADMIN => $this->CheckAction(Ab_CoreSystemAction::ADMIN)
		);
	}
}
Abricos::ModuleRegister(new Ab_CoreSystemModule())

?>