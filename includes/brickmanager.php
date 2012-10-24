<?php
/**
 * Кирпич - строительный материал для страниц в платформе Абрикос
 * 
 * Идеология платформы Абрикос построена на том, что любой блок в собираемой 
 * страницы должен иметь в себе все необходимое и быть в своем роде независимым 
 * блоком.
 * 
 * Кирпич (Brick) - и есть тот самый строительный материал, который содержит в себе шаблон
 * и при необходимости скрипт подготовки данных.
 * 
 * Кирпич может иметь вложенные кирпичи в неограниченном кол-ве.
 * 
 * Есть три типа кирпича: Brick, Template, Content.
 * 
 * Brick - свободный кирпич, который может быть использован в любом другом кирпиче;<br />
 * Template - шаблон (каркас, своего рода фасад здания). Содержит в себе любые кирпичи, кроме кирпичей 
 * шаблонов и стартовых кирпичей;<br />
 * Content - стартовый кирпич, с него начинается сборка страницы. Обязательное условие - наличие 
 * кирпича шаблона.
 * 
 * Пример свободного кирпича helloworld из модуля Example (/modules/example/brick/helloworld.html)
 * {@example modules/example/brick/helloworld.html}
 * 
 * Пример стартового кирпича helloworld из модуля Example (/modules/example/content/helloworld.html)
 * {@example modules/example/content/helloworld.html}
 * 
 * Пример скрипта подготовки данных helloworld.php из модуля Example (/modules/example/includes/helloworld.php)
 * {@example modules/example/includes/helloworld.php}
 * 
 * Результат можно посмотреть по адресу: {@link http://demo.abricos.org/example/helloworld.html}
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage 
 * @copyright Copyright (C) 2008-2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
class Brick {
	
	const BRICKTYPE_BRICK = 0;
	const BRICKTYPE_TEMPLATE = 1;
	const BRICKTYPE_CONTENT = 2;
	
	const BRICKPRM_VAR = 0;
	const BRICKPRM_GLOBALVAR = 1;
	const BRICKPRM_MODULE = 2;
	const BRICKPRM_TEMPLATE = 3;
	const BRICKPRM_PHRASE = 4;
	const BRICKPRM_SCRIPT = 5;
	const BRICKPRM_JSMOD = 6;
	const BRICKPRM_JSFILE = 7;
	const BRICKPRM_CSS = 8;
	const BRICKPRM_PARAM = 9;
	const BRICKPRM_CSSMOD = 6;
	
	/**
	 * Текущий стиль, содержащий шаблоны, для сборок страниц
	 * @var string
	 */
	public static $style = 'default';
	
	/**
	 * Идентификатор страницы.
	 * 
	 * @var int
	 */
	public static $contentId = 0;
	
	/**
	 * Компилятор кирпичей
	 *
	 * @var Ab_CoreBrickBuilder
	 */
	public static $builder = null;
	
	/**
	 * Менеджер базы данных
	 *
	 * @var Ab_Database
	 */
	public static $db = null;
	
	/**
	 * Модуль, который получил управления на вывод страницы
	 *
	 * @var Ab_Module
	 */
	public static $modman = null;
	
	/**
	 * Менеджер модулей
	 *
	 * @var AbricosCoreModuleManager
	 */
	public static $modules = null;
	
	/**
	 * Ядро платформы Abricos
	 *
	 * @var CMSRegistry
	 */
	public static $cms = null;
	
	/**
	 * 
	 * @var CMSInputCleaner
	 */
	public static $input = null;
	
	/**
	 * Замена в тексте $template идентификатора $varname на значение $value
	 * 
	 * Например:<br>
	 * <pre>
	 *   $result = Brick::$ReplaceVar("Строка {v#for} теста", "for", "для");
	 *   
	 *   // $result будет содержать текст: "Строка для теста"
	 * </pre>
	 * 
	 * @param string $template исходный текст
	 * @param string $varname идентификатор замены
	 * @param string $value значение, на которое будет заменен идентификатор
	 * @return string
	 */
	public static function ReplaceVar($template, $varname, $value){
		return str_replace("{v#".$varname."}", $value, $template);
	}
	
	/**
	 * Пакетная замена в тексте $template данными из ассоциативного массива
	 * 
	 * Например:<br>
	 * <pre>
	 *   $result = Brick::$ReplaceVar("Строка в которой {v#s1} заменить {v#s2}", array(
	 *     "s1" => "необходимо", "s2" => "текст"
	 *   ));
	 *   
	 *   // $result будет содержать текст: "Строка в которой необходимо заменить текст"
	 * </pre>
	 * 
	 * @param string $template исходный текст
	 * @param mixed $data ассоциативный массив
	 * @return string
	 */
	public static function ReplaceVarByData($template, $data){
		foreach ($data as $varname => $value){
			$template = Brick::ReplaceVar($template, $varname, $value);
		}
		return $template;
	}
	
	/**
	 * Сессия текущего пользователя
	 * TODO: на удаление
	 *
	 * @var User
	 */
	public static $session = null;
	
	/**
	 * Текущий пользователь
	 * 
	 * @var User
	 */
	public static $user = null;
}

/**
 * Конструктор страницы из кирпичей 
 * 
 * @package Abricos
 * @subpackage Core
 */
class Ab_CoreBrickBuilder {
	
	/**
	 * Ядро
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	/**
	 * Текущий кирпич.
	 * 
	 * Используется в скриптах управления кирпичем
	 *
	 * @var Ab_CoreBrick
	 */
	public $brick = null;

	/**
	 * Шаблон
	 *
	 * @var Ab_CoreBrick
	 */
	public $template = null;
	
	/**
	 * Глобальные переменные кирпича 
	 * 
	 * Список всех переменных объявленых в блоке кирпича "Параметры": <br>
	 * [var=имя]значение[/var]
	 * 
	 * @access private
	 * @var mixed
	 */
	private $_globalVar = array();
	/**
	 * Фразы из БД [phrase=имя]значение по умолчанию[/phrase]
	 * @access private
	 */
	private $_phrase = array();
	/**
	 * JS Widget модуля [mjs=имя модуля]файл js[/mjs]
	 * @access private
	 */
	private $_jsmod = array();
	/**
	 * CSS модуля [mcss=имя модуля]файл css[/mcss]
	 * @access private
	 */
	private $_cssmod = array();
	/**
	 * JS файл [js]путь к файлу[/js]
	 * @access private
	 */
	private $_jsfile = array();
	/**
	 * CSS файл [css]путь к файлу[/css]
	 * @access private
	 */
	private $_cssfile = array();
	
	/**
	 * Массив модулей используемых в построение страницы
	 * @access private
	 */
	private $_usemod = array();
	
	/**
	 * Менеджер фраз
	 *
	 * @var Ab_CorePhrase
	 */
	public $phrase = null;

	/**
	 * Конструктор
	 * 
	 * @param CMSRegistry $registry
	 */
	public function __construct(CMSRegistry $registry){
		$this->registry = $registry;
		$this->phrase = Ab_CorePhrase::GetInstance();
	}

	/**
	 * Заносит модуль в {@link $_usemod}
	 * @param string $modname имя модуля
	 */
	private function SetUseModule($modname){
		if ($this->_usemod[$modname]){ return; }
		$this->_usemod[$modname] = true;
	}
	
	/**
	 * Сборка страницы. 
	 * параметр $brick - имеет тип шаблон.
	 */
	public function Compile(Ab_CoreBrick $brick){
		// загрузить все глобальные параметры кирпичей 
		$this->TakeGlobalParam($brick);
		
		$this->phrase->Preload($this->_phrase);
		
		$this->ExecuteBrick($brick);
		$pbprm = &$brick->parent->param->param;
		
		// Установка метатегов страницы по умолчанию, если они не установлены в процессе компиляции кирпичей
		if (isset($this->_phrase['sys:meta_title'])){
			if (isset($pbprm['meta_title']) && !empty($pbprm['meta_title'])){
				$this->_globalVar['meta_title'] = $pbprm['meta_title'];
			}else if (isset($this->_globalVar['meta_title']) && empty($this->_globalVar['meta_title'])){
				$this->_globalVar['meta_title'] = $this->phrase->Get('sys', 'meta_title');
			}
			if (isset($pbprm['meta_keys']) && !empty($pbprm['meta_keys'])){
				$this->_globalVar['meta_keys'] = $pbprm['meta_keys'];
			}else if (isset($this->_globalVar['meta_keys']) && empty($this->_globalVar['meta_keys'])){
				$this->_globalVar['meta_keys'] = $this->phrase->Get('sys', 'meta_keys');
			}
			if (isset($pbprm['meta_desc']) && !empty($pbprm['meta_desc'])){
				$this->_globalVar['meta_desc'] = $pbprm['meta_desc'];
			}else if (isset($this->_globalVar['meta_desc']) && empty($this->_globalVar['meta_desc'])){
				$this->_globalVar['meta_desc'] = $this->phrase->Get('sys', 'meta_desc');
			}
		}
		if (isset($this->_globalVar['jsyui'])){
			$this->_globalVar['jsyui'] = Ab_CoreSystemModule::$YUIVersion;
		}
		
		// установка версии
		if (isset($this->_globalVar['version'])){
			$modSys = $this->registry->modules->GetModule('sys');
			$version = $modSys->version . (!empty($modSys->revision)?"-r".$modSys->revision: "");
			$this->_globalVar['version'] = $version;  
		}
		if (isset($this->_globalVar['host'])){
			$this->_globalVar['host'] = $_SERVER['HTTP_HOST'] ? $_SERVER['HTTP_HOST'] : $_ENV['HTTP_HOST'];;  
		}

		$this->FetchVars($brick);

		$this->PagePrint($brick);
		
		$this->phrase->Save();
	}
	
	public function SetGlobalVar($name, $value){
		$this->_globalVar[$name] = $value;
	}
	
	/**
	 * Динамическая загрузка кирпича
	 *
	 * @param CMSModule $module
	 * @param string $name
	 */
	public function LoadBrick(Ab_Module $module, $name, Ab_CoreBrick $parent = null, $overparam = null){
		
		$bm = new Ab_CoreBrickManager($this->registry, false);
		$brick = $bm->BuildOutput($module->name, $name, Brick::BRICKTYPE_BRICK, $parent);
		
		$this->SetUseModule($module->name);
		
		if (!empty($parent)){
			array_push($parent->child, $brick);
			if (!is_array($parent->param->module[$brick->owner])){
				$parent->param->module[$brick->owner] = array();
			}
			$bmod = new stdClass();
			$bmod->name = $name;
			array_push($parent->param->module[$brick->owner], $bmod);
		}
		$this->TakeGlobalParam($brick);
		$this->phrase->Preload($this->_phrase);
		
		if (!is_null($overparam)){
			if (!empty($overparam['bkvar'])){
				foreach ($overparam['bkvar'] as $key => $value){
					$brick->param->var[$key] = $value;
				}
			}
			if (!empty($overparam['p'])){
				foreach ($overparam['p'] as $key => $value){
					$brick->param->param[$key] = $value;
				}
			}
		}

		$this->ExecuteBrick($brick);
		return $brick;
	}
	
	public function LoadBrickS($moduleName, $name, Ab_CoreBrick $parent = null, $overparam = null){
		$mod = $this->registry->modules->GetModule($moduleName);
		return $this->LoadBrick($mod, $name, $parent, $overparam);
	}
	

	/**
	 * Динамическое добавление JavaScript модуля
	 *
	 * @param string $moduleName имя модуля
	 * @param string $file имя файла
	 */
	public function AddJSModule($moduleName, $file){
		$this->_jsmod[$moduleName][$file] = true;
	}
	
	/**
	 * Динамическое добавление CSS модуля
	 *
	 * @param string $moduleName имя модуля
	 * @param string $file - имя CSS файла
	 */
	public function AddCssModule($moduleName, $file){
		$this->_cssmod[$moduleName][$file] = true;
	}
	
	/**
	 * Добавление JS файлов
	 */
	public function AddJSFile($file){
		$this->_jsfile[$file] = $file;
	}
	
	/**
	 * Добавление CSS файла
	 */
	public function AddCSSFile($file){
		$this->_cssfile[$file] = $file;
	}
	
	private function SetVar(Ab_CoreBrick $brick, $search, $replace){
		$brick->content = str_replace($search, $replace, $brick->content);
	}
	
	private function PagePrint(Ab_CoreBrick $tplBrick){
		header("Content-Type: text/html; charset=utf-8");
		header("Expires: Mon, 26 Jul 2005 15:00:00 GMT");
		header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
		header("Cache-Control: no-store, no-cache, must-revalidate");
		header("Cache-Control: post-check=0, pre-check=0", false);
		header("Pragma: no-cache");

		$contentBrick = null;
		foreach ($tplBrick->child as $cbrick){
			if ($cbrick->type == Brick::BRICKTYPE_CONTENT){
				$contentBrick = $cbrick;
				break;
			}
		}
		
		$sa = explode("[tt]content[/tt]", $tplBrick->content);
		
		$this->PrintBrick($tplBrick, $sa[0]);
		$this->PrintBrick($contentBrick, $contentBrick->content);
		$this->PrintBrick($tplBrick, $sa[1]);
	}
	
	public function PrintBrick(Ab_CoreBrick $brick, $content){
		// Поиск в $content запросы на вставку данных из дочерних кирпичей $brick, 
		// результат будет занесен в $mathes, для последующей обработки. 
		$mathes = array();
		preg_match_all(	"#\[mod\](.+?)\[/mod\]#is", 
						$content, $mathes, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);

		$position = 0;
		foreach ($mathes as $value){
			// Пример $value: 
			//	Array (
    		// 		[0] => Array (
            //			[0] => [mod]sitemap:vmenuf:0[/mod]	- найденый запрос
            //			[1] => 134 							- позиция
            //		)
    		//		[1] => Array (
            //			[0] => sitemap:vmenuf:0
            //			[1] => 139
        	//		)
			//	)
			
			$sa = explode(":", $value[1][0]);
			$modName = $sa[0];
			$modBrickName = $sa[1];
			$modId = count($sa) == 3 ? $sa[2] : 0;
			
			// $mods = $brick->param->module[$sa[0]];
			// if (empty($mods)){ continue; }
			
			$printBrick = null;
			foreach ($brick->child as $cbrick){
				if ($cbrick->owner != $modName || $cbrick->name != $modBrickName || ($cbrick->param->param['id'] > 0 && $cbrick->param->param['id'] != $modId)){
					continue; 
				}
				$printBrick = $cbrick;
				break;
			}
			if (!is_null($printBrick)){
				print substr($content, $position, $value[0][1]-$position);
				$this->PrintBrick($printBrick, $printBrick->content);
				$position = $value[0][1]+strlen($value[0][0]);
			}else{
				// кирпич модуля заявлен в контенте кирпича родителя, но не вывиден
				// возможно модуль просто не добавлен в систему, значит необходимо
				// вывести пустое значение 
				print substr($content, $position, $value[0][1]-$position);
				$position = $value[0][1]+strlen($value[0][0]);
				// TODO: необходимо добавить настройку, не выводить пустое значение, если нет кирпича модуля, но он заявлен в кирпиче родителя
			}
		}
		print substr($content, $position, strlen($content)-$posiiton);
	}
	
	private function FetchVars(Ab_CoreBrick $brick){

		if ($brick->type == Brick::BRICKTYPE_TEMPLATE){
			$list = array();
			foreach ($this->_jsmod as $key => $mod){
				$files = array();
				foreach ($mod as $file=>$value){
					array_push($files, "'".$file."'");
				}
				array_push($list, "{name:'".$key."',files:[".implode(',', $files)."]}");
			}
			$brick->param->var['js'] = "<script language='JavaScript' type='text/javascript' charset='utf-8'>Brick.Loader.add({mod:[".implode(',', $list)."]})</script>";
			$brick->param->var['ttowner'] = $brick->owner;
			$this->_globalVar['ttowner'] = $brick->owner;

			// добавление дополнительных JS файлов
			foreach ($this->_jsfile as $value){
				$brick->param->var['js'] .= "<script src='".$value."' language='JavaScript' type='text/javascript' charset='utf-8'></script>";
			}
			
			foreach ($this->_cssmod as $modname => $files){
				foreach ($files as $file => $value){
					$webcssfile = "/modules/".$modname."/css/".$file;
					
					$weboverride = "/tt/".Brick::$style."/override/".$modname."/css/".$file;
					if (file_exists(CWD.$weboverride)){
						$webcssfile = $weboverride; 
					}
					if (!file_exists(CWD.$webcssfile)){ continue; }
					if ( filesize(CWD.$webcssfile) <= 5){ continue; }
					
					$this->AddCSSFile($webcssfile);
				}
			}
			
			// проверка css модулей по умолчания
			foreach ($this->_usemod as $modname => $value){
				$mod = Abricos::GetModule($modname);
				if (empty($mod->defaultCSS)){ continue; }
				$webcssfile = "/modules/".$modname."/css/".$mod->defaultCSS;
				$cssfile = CWD.$webcssfile;
				if (!file_exists($cssfile)){ continue; }
				// есть ли перегруженный файл css
				$weboverride = "/tt/".Brick::$style."/override/".$modname."/css/".$mod->defaultCSS;
				$override = CWD.$weboverride;
				if (file_exists($override)){
					if ( filesize($override) <= 5){ continue; }
					$webcssfile = $weboverride; 
				}
				$this->AddCSSFile($webcssfile);
			}
			
			// добавление css файлов
			foreach ($this->_cssfile as $value){
				$brick->param->var['css'] .= "<style type='text/css' media='screen, projection, print'>/*<![CDATA[*/	@import '".$value."'; /*]]>*/</style>";
			}
		}
		
		foreach ($brick->child as $childbrick){
			$this->FetchVars($childbrick);
		}
		
		$p = $brick->param;
		foreach ($p->var as $key=>$value){
			$this->SetVar($brick, "[bkvar]".$key."[/bkvar]", $value);
		}
		
		foreach ($p->gvar as $key => $value){
			$this->SetVar($brick, "[var]".$key."[/var]", $this->_globalVar[$key]);
		}
		
		foreach ($p->phrase as $key=>$value){
			$sa = explode(":", $key);
			if (count($sa) == 2){
				$newval = $this->phrase->Get($sa[0], $sa[1], $value);
				$this->SetVar($brick, "[ph]".$key."[/ph]", $newval);
			}
		}
	}
	
	/**
	 * Взять глобальные параметры у каждого кирпича
	 *
	 * @param Ab_CoreBrick $brick
	 */
	private function TakeGlobalParam(Ab_CoreBrick $brick){
		if ($brick->type != Brick::BRICKTYPE_TEMPLATE){
			$this->SetUseModule($brick->owner);
		}
		$p = $brick->param;
		foreach ($p->gvar as $key => $value){
			$this->_globalVar[$key] = $value;
		}
		foreach ($p->phrase as $key => $value){
			$this->_phrase[$key] = $value;
		}
		foreach ($p->jsfile as $value){
			$this->AddJSFile($value);
		}
		foreach ($p->css as $value){
			$this->AddCSSFile($value);
		}
		foreach ($p->jsmod as $key => $files){
			foreach ($files as $file){
				$this->_jsmod[$key][$file] = true;
			}
		}
		foreach ($p->cssmod as $key => $files){
			foreach ($files as $file){
				$this->_cssmod[$key][$file] = true;
			}
		}
		foreach ($brick->child as $childbrick){
			$this->TakeGlobalParam($childbrick);
		}
	}
	
	/**
	 * Выполнение скриптов кирпича
	 *
	 * @param Ab_CoreBrick $brick
	 */
	private function ExecuteBrick(Ab_CoreBrick $brick){
		
		$p = $brick->param;
		foreach ($brick->child as $childbrick){
			$this->ExecuteBrick($childbrick);
		}
		foreach ($p->script as $script){
			$path = CWD;
			if ($brick->type == Brick::BRICKTYPE_TEMPLATE){
				$path .= "/includes/over/";
			}else{
				$path .= "/modules/".$brick->owner."/includes/";
			}
			$file = $path.$script;
			if (!file_exists($file)){
				$brick->content .= "File not found: ".$file."\n";
			}else{
				$mod = Abricos::GetModule($brick->owner);
				if (empty($mod)){
					$brick->content .= "Module ".$brick->owner." not found!\n";
				}else{
					Brick::$builder->brick = $brick; 
					require ($file);
					Brick::$builder->brick = null;
				} 
			}
		}
	}
}

/**
 * Загрузчик кирпичей.
 * 
 * Загружает кирпичи и их параметры из базы данных, если они были изменены 
 * администратором сайта, либо с файловой системы
 * 
 * @package Abricos
 * @subpackage Core
 */
class Ab_CoreBrickManager {
	
	/**
	 * Ядро
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	/**
	 * Пользовательские версии кирпичей и параметров
	 *
	 * @var Ab_CoreCustomBrickManager
	 */
	public $custom = null;
	
	public function __construct(CMSRegistry $registry, $useCustom = true){
		$this->registry = $registry;
		// пользовательские кирпичи и параметры
		if ($useCustom){
			$this->custom = new Ab_CoreCustomBrickManager($this->registry);
		}
	}
	
	/**
	 * Сборка вывода из кирпичей
	 *
	 * @param string $owner - источник
	 * @param integer $brickType - тип кирпича
	 * @param string $brickName - имя кирпича
	 */
	public function BuildOutput($owner, $brickName, $brickType, $parent = null, $inparam = array()){
		$cache = null;
		$db = $this->registry->db;
		$recache = false;
		
		// Если это кирпичь модуля, то необходимо проверить наличие модуля в системе
		if ($brickType == Brick::BRICKTYPE_BRICK){
			$mod = $this->registry->modules->GetModule($owner);
			if (empty($mod)){ return null; }
		}
		
		// кеш, применим только к шаблону
		if ($brickType == Brick::BRICKTYPE_TEMPLATE){
			if (CMSRegistry::$instance->config['Misc']['brick_cache']){
				$time = TIMENOW-5*360;
				$cache = Ab_CoreQuery::Cache($db, $owner, $brickName);
				if (empty($cache) || $cache['ud'] < $time){
					$recache = true;
				}
				if (!$recache && !empty($cache)){
					$brick = unserialize($cache['bd']);
					return $brick;
				}
			}
		}
		
		// Возможно кирпичь редактировался пользователем, тогда он будет взят из базы 
		if (is_null($brick) && !is_null($this->custom)){
			$customBrick = $this->custom->GetBrick($owner, $brickName, $brickType);
		}
		$brick = null;
		if (empty($customBrick)){
			// кирпич не найден в БД, читаем из файла
			$brickFF = Ab_CoreBrickReader::ReadBrick($owner, $brickName, $brickType);
			$brick = new Ab_CoreBrick($owner, $brickName, $brickType, $brickFF->body, $brickFF->param, $parent);
			$this->SyncParam($owner, $brickName, $brickType, $brick->param);
		}else{
			$param = new Ab_CoreBrickParam();
			$this->SyncParam($owner, $brickName, $brickType, $param);
			$brick = new Ab_CoreBrick($owner, $brickName, $brickType, $customBrick['bd'], $param, $parent);
		}
		
		$p = $brick->param;
		// если кирпич вызывается с параметрами, необходим изменить дефолтные
		if (!empty($inparam)){
			foreach ($inparam as $key => $value){
				$p->param[$key] = $value;
			}
		}
		
		// обработка вложенных кирпичей
		if (!empty($p->template)){
			if (!empty($this->registry->config["Template"]) && $p->template['owner'] != "_sys"){
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
							$p->template["owner"] = $exp["owner"]; 
							$p->template["name"] = $exp["name"];
							break;
						}
					}
				}
				if (!$find && !empty($cfg["default"])){
					$p->template = $cfg["default"];
				}
			}
				
			// шаблон определенный администратором
			$mod = $this->registry->modules->GetModule($owner);
			$ttpl = $mod->GetTemplate();
			if (!is_null($ttpl)){
				$p->template["owner"] = $ttpl["owner"]; 
				$p->template["name"] = $ttpl["name"];
			}
			if (empty($p->template["owner"])){
				$towner = Brick::$builder->phrase->Get('sys', 'style', 'default');
				if (!file_exists(CWD."/tt/".$towner."/main.html")){
					$p->template["owner"] = "default";
					Brick::$builder->phrase->Set('sys', 'style', 'default');
				}else{
					$p->template["owner"] = $towner;
				}
			}
			$childBrick = $this->BuildOutput($p->template["owner"], $p->template['name'], Brick::BRICKTYPE_TEMPLATE, $brick);
			array_push($brick->child, $childBrick);
		}
		if (!empty($p->module)){
			foreach($p->module as $key => $value){
				foreach ($value as $obj){
					$childBrick = $this->BuildOutput($key, $obj->name, Brick::BRICKTYPE_BRICK, $brick, $obj->param);
					if (is_null($childBrick)){ continue; }
					array_push($brick->child, $childBrick);
				}
			}
		}
		if ($brickType == Brick::BRICKTYPE_TEMPLATE && $recache){
			if (empty($cache)){
				Ab_CoreQuery::CacheAppend($db, $owner, $brickName, serialize($brick));
			}else{
				Ab_CoreQuery::CacheUpdate($db, $cache['id'], serialize($brick));
			}
		}
		return $brick;
	}
	/**
	 * Синхронизация параметров с пользовательскими
	 *
	 * @param string $owner
	 * @param string $brickName
	 * @param integer $brickType
	 * @param Ab_CoreBrickParam $param
	 */
	private function SyncParam($owner, $brickName, $brickType, Ab_CoreBrickParam $param){
		if (is_null($this->custom)){ return; }
		$customParam = $this->custom->GetParams($brickType, $owner, $brickName);
		if (empty($customParam)){
			return;
		}
		Ab_CoreBrickReader::SyncParamFromDB($param, $customParam);
	}
}

/**
 * Параметры кирпича
 * 
 * @package Abricos
 * @subpackage Core
 */
class Ab_CoreBrickParam {
	
	/**
	 * Параметры кирпича (могут определяться в процессе подключения)
	 *
	 * @var array
	 */
	public $param = array();
	
	/**
	 * Локальные переменные кирпича
	 *
	 * @var mixed
	 */
	public $var = array();
	/**
	 * Глобальные переменные используемые в кирпиче
	 *
	 * @var mixed
	 */
	public $gvar = array();
	/**
	 * Используемые модули
	 *
	 * @var mixed
	 */
	public $module = array();
	
	/**
	 * Скрипты кирпича
	 *
	 * @var mixed
	 */
	public $script = array();
	/**
	 * Шаблон. Параметр используется только в кирпиче контента
	 *
	 * @var mixed
	 */
	public $template = array();
	/**
	 * Фразы
	 *
	 * @var mixed
	 */
	public $phrase = array();
	/**
	 * JavaScript модули 
	 *
	 * @var mixed
	 */
	public $jsmod = array();
	/**
	 * JavaScript файлы
	 *
	 * @var mixed
	 */
	public $jsfile = array();
	/**
	 * CSS файлы
	 *
	 * @var mixed
	 */
	public $css = array();
	/**
	 * CSS файлы модуля
	 *
	 * @var mixed
	 */
	public $cssmod = array();
	
}

/**
 * Кирпич
 * 
 * @package Abricos
 * @subpackage Core
 */
class Ab_CoreBrick {
	
	/**
	 * Родитель
	 *
	 * @var Ab_CoreBrick
	 */
	public $parent = null;
	
	/**
	 * Вложенные кирпичи
	 *
	 * @var mixed
	 */
	public $child = array();
	
	/**
	 * Источник
	 *
	 * @var string
	 */
	public $owner = null;
	
	/**
	 * Тип кирпича
	 *
	 * @var integer
	 */
	public $type = Brick::BRICKTYPE_BRICK;
	
	/**
	 * Имя кирпича
	 *
	 * @var string
	 */
	public $name = "";

	/**
	 * Тело кирпича
	 *
	 * @var string
	 */
	public $content = "";
	
	/**
	 * Параметры кирпича
	 *
	 * @var Ab_CoreBrickParam
	 */
	public $param = null;
	
	public function __construct($owner, $name, $type, $content, $param, $parent){
		$this->owner = $owner;
		$this->name = $name;
		$this->type = $type;
		$this->content = $content;
		$this->param = $param;
		$this->parent = $parent;
	}
}

/**
 * Класс управления кирпичами исправленых администратором сайта
 *
 * @package Abricos
 * @subpackage Core
 */
class Ab_CoreCustomBrickManager {
	
	public $bricks = array();
	public $params = array();
	
	/**
	 * Конструктор. Загружает из БД все custom кирпичи и их параметры
	 */
	public function __construct(CMSRegistry $registry){
		$db = $registry->db;
		$rows = Ab_CoreQuery::BrickListCustom($db);
		while (($row = $db->fetch_array($rows))){
			$key = $row['own'].$row['nm'].$row['tp'];
			$this->bricks[$key] = $row;
		}

		$rows = Ab_CoreQuery::BrickParamListCustom($db);
		while (($row = $db->fetch_array($rows))){
			$k1 = $row['bown'].$row['bnm'].$row['btp'];
			if (!is_array($this->params[$k1])){
				$this->params[$k1] = array();
			}
			array_push($this->params[$k1], $row);
		}
	}
	
	public function GetBrick($owner, $name, $type){
		return $this->bricks[$owner.$name.$type];
	}
	
	public function GetParam($brickType, $brickOwner, $brickName){
		$brick = $this->GetParams($brickOwner, $brickName, $brickType);
		if (empty($brick)){
			return null;
		}
		return $brick;
	}
	
	public function GetParams($brickType, $brickOwner, $brickName){
		return $this->params[$brickOwner.$brickName.$brickType];
	}
}

/**
 * Устарел, оставлен для совместимости
 * 
 * @package Abricos
 * @subpackage Deprecated
 * @deprecated устарел начиная с версии 0.5.5, необходимо использовать {@link Ab_CoreBrickBuilder}
 * @ignore
 */
final class CMSSysBrickBuilder extends Ab_CoreBrickBuilder {
}

/**
 * Устарел, оставлен для совместимости
 * 
 * @package Abricos
 * @subpackage Deprecated
 * @deprecated устарел начиная с версии 0.5.5, необходимо использовать {@link Ab_CoreBrickManager}
 * @ignore
 */
final class CMSSysBrickManager extends Ab_CoreBrickManager {
}

/**
 * Устарел, оставлен для совместимости
 * 
 * @package Abricos
 * @subpackage Deprecated
 * @deprecated устарел начиная с версии 0.5.5, необходимо использовать {@link Ab_CoreBrickParam}
 * @ignore
 */
final class CMSSysBrickParam extends Ab_CoreBrickParam {
}

/**
 * Устарел, оставлен для совместимости
 * 
 * @package Abricos
 * @subpackage Deprecated
 * @deprecated устарел начиная с версии 0.5.5, необходимо использовать {@link Ab_CoreCustomBrickManager}
 * @ignore
 */
final class CMSSysBrickCustomManager extends Ab_CoreCustomBrickManager {
}
?>