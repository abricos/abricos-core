<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

class CMSAdress extends CMSBaseClass{
	/**
	 * Директории разложенные в массив
	 *
	 * @var Array
	 */
	public $dir = null;

	/**
	 * Наименование страницы
	 *
	 * @var string
	 */
	public $contentName = "index";

	/**
	 * Уровень 
	 */
	public $level = 0;

	/**
	 * Запрашиваемый путь к скрипту 
	 * Например: /product/soft
	 * @var string
	 */
	public $contentDir = "/";
	
	public $requestURI = "";
	
	public $requestURINonParam = "";
	
	public $host = "";
	
	public function CMSAdress(){
		$this->Build(fetch_uri());
	}
	
	/**
	 * Получить адрес директории начиная с $sublevel
	 */
	public function GetDir($sublevel = -1){
		if ($sublevel == -1){
			$sublevel = $this->level-1;
		}
		$path = "";
		for ($i = $sublevel; $i < $this->level; $i++){
			$path .= "/".$this->dir[$i];
		}
		return $path;
	}
	
	/**
	 * Переход на нулевой уровень в урле и пересборка адреса
	 */
	public function MoveTop(){
		$this->Build($this->host);
	}

	public function Build($requestUri){
		$this->host = "http://". fetch_host();
		$requestUri = strtolower($requestUri);
		$this->requestURI = $requestUri;
		$arr = parse_url($requestUri);
		$script = $arr['path'];
		
		if (substr($script, strlen($script)-5) != ".html"){
			$script .= substr($script, strlen($script)-1) == "/" ? "" : "/";
			$script .= "index.html";
		}
		
		$this->requestURINonParam = $script;
		$dir = explode('/', $script);
		$this->contentName = array_pop($dir);
		$this->contentName = substr($this->contentName, 0, strlen($this->contentName)-5);
		$this->contentDir = implode('/', $dir);

		$i=0;
		foreach($dir as $d){
			if (empty($d)){continue;}
			$this->dir[$i++] = $d;
		}
		$this->level = count($this->dir);
	}
	
}

function fetch_host(){
	$host = $_SERVER['HTTP_HOST'] ? $_SERVER['HTTP_HOST'] : $_ENV['HTTP_HOST'];
	return $host;
}

function fetch_uri(){
	$scriptPath = "";
	if ($_SERVER['REQUEST_URI'] OR $_ENV['REQUEST_URI']) {
		$scriptPath = $_SERVER['REQUEST_URI'] ? $_SERVER['REQUEST_URI'] : $_ENV['REQUEST_URI'];
	}else {
		if ($_SERVER['PATH_INFO'] OR $_ENV['PATH_INFO']){
			$scriptPath = $_SERVER['PATH_INFO'] ? $_SERVER['PATH_INFO'] : $_ENV['PATH_INFO'];
		} else if ($_SERVER['REDIRECT_URL'] OR $_ENV['REDIRECT_URL']){
			$scriptPath = $_SERVER['REDIRECT_URL'] ? $_SERVER['REDIRECT_URL'] : $_ENV['REDIRECT_URL'];
		}else{
			$scriptPath = $_SERVER['PHP_SELF'] ? $_SERVER['PHP_SELF'] : $_ENV['PHP_SELF'];
		}
		if ($_SERVER['QUERY_STRING'] OR $_ENV['QUERY_STRING']) {
			$scriptPath .= '?' . ($_SERVER['QUERY_STRING'] ? $_SERVER['QUERY_STRING'] : $_ENV['QUERY_STRING']);
		}
	}
	return $scriptPath;
}
?>