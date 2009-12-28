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
 * Класс статичных функций и свойств. 
 * 
 * @package Abricos
 * @subpackage Sys
 */
class Brick {
	
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
	 * @var CMSSysBrickBuilder
	 */
	public static $builder = null;
	
	/**
	 * Менеджер базы данных
	 *
	 * @var CMSDatabase
	 */
	public static $db = null;
	
	/**
	 * Модуль, который получил управления на вывод страницы
	 *
	 * @var CMSModule
	 */
	public static $modman = null;
	
	/**
	 * Менеджер модулей
	 *
	 * @var CMSModuleManager
	 */
	public static $modules = null;
	
	/**
	 * Ядро платформы Abricos
	 *
	 * @var CMSRegistry
	 */
	public static $cms = null;
	
	/**
	 * GPC
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
	 *
	 * @var CMSSysSession
	 */
	public static $session = null;
}

/**
 * Конструктор страницы из кирпичей 
 * 
 * @package Abricos
 * @subpackage Sys
 */
class CMSSysBrickBuilder {
	
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
	 * @var CMSSysBrick
	 */
	public $brick = null;

	/**
	 * Шаблон
	 *
	 * @var CMSSysBrick
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
	 * @var CMSSysPhrase
	 */
	public $phrase = null;

	/**
	 * Конструктор
	 * 
	 * @param CMSRegistry $registry
	 */
	public function CMSSysBrickBuilder(CMSRegistry $registry){
		$this->registry = $registry;
		$this->phrase = new CMSSysPhrase($this->registry );
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
	public function Compile(CMSSysBrick $brick){
		// загрузить все глобальные параметры кирпичей 
		$this->TakeGlobalParam($brick);
		
		$this->phrase->Preload($this->_phrase);
		
		$this->ExecuteBrick($brick);
		
		// Установка метатегов страницы по умолчанию, если они не установлены в процессе компиляции кирпичей
		if (isset($this->_phrase['sys:meta_title'])){
			if (isset($this->_globalVar['meta_title']) && empty($this->_globalVar['meta_title'])){
				$this->_globalVar['meta_title'] = $this->phrase->Get('sys', 'meta_title');
			}
			if (isset($this->_globalVar['meta_keys']) && empty($this->_globalVar['meta_keys'])){
				$this->_globalVar['meta_keys'] = $this->phrase->Get('sys', 'meta_keys');
			}
			if (isset($this->_globalVar['meta_desc']) && empty($this->_globalVar['meta_desc'])){
				$this->_globalVar['meta_desc'] = $this->phrase->Get('sys', 'meta_desc');
			}
		}
		if (isset($this->_globalVar['jsyui'])){
			$this->_globalVar['jsyui'] = CMSModuleSys::$YUIVersion;
		}
		
		// установка версии
		if (isset($this->_globalVar['version'])){
			$modSys = $this->registry->modules->GetModule('sys');
			$version = $modSys->version . (!empty($modSys->revision)?"-r".$modSys->revision: "");
			$this->_globalVar['version'] = $version;  
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
	public function LoadBrick(CMSModule $module, $name, CMSSysBrick $parent = null, $overparam = null){
		
		$bm = new CMSSysBrickManager($this->registry, false);
		$brick = $bm->BuildOutput($module->name, $name, CMSQSys::BRICKTYPE_BRICK, $parent);
		
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
	
	public function LoadBrickS($moduleName, $name, CMSSysBrick $parent = null, $overparam = null){
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
	
	private function SetVar($brick, $search, $replace){
		$brick->content = str_replace($search, $replace, $brick->content);
	}
	
	private $_setheader = false;
	
	private function PagePrint(CMSSysBrick $brick){
		if (!$this->_setheader){
			header("Content-Type: text/html; charset=utf-8");
			header("Expires: Mon, 26 Jul 2005 15:00:00 GMT");
			header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
			header("Cache-Control: no-store, no-cache, must-revalidate");
			header("Cache-Control: post-check=0, pre-check=0", false);
			header("Pragma: no-cache");
			$this->_setheader = true;
		}
		
		$contentPos = -1;
		$brickContent = null;
		if ($brick->type == CMSQSys::BRICKTYPE_TEMPLATE){
			$contentPos = strpos($brick->content, "[tt]content[/tt]");
			foreach ($brick->child as $cbrick){
				if ($cbrick->type == CMSQSys::BRICKTYPE_CONTENT){
					$brickContent = $cbrick;
					break;
				}
			}
		}

		$name = "mod";
		$pattern = "#\[".$name."\](.+?)\[/".$name."\]#is";
		
		$mathes = array();
		preg_match_all($pattern, $brick->content, $mathes, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
		
		if (empty($mathes)){
			if ($brick->type == CMSQSys::BRICKTYPE_TEMPLATE){
				$ca = split("\[tt\]content\[\/tt\]", $content);
				print $ca[0];
				print $this->PagePrint($brickContent);
				print $ca[1];
			}else{
				print $brick->content;
			}
			return;
		}
		
		$position = 0;
		foreach ($mathes as $value){
			$replstr = $value[0][0];
			$count = $value[0][1]-$position;
			$sa = split(":", $value[1][0]);
			$id = count($sa) == 3 ? $sa[2] : 0;
			$mods = $brick->param->module[$sa[0]];
			if (empty($mods)){ continue; }
			
			// echo("id=".$id."<br>");
			
			foreach ($mods as $mbrick){
				if ($sa[1] != $mbrick->name){ continue; }
				$content = substr($brick->content, $position, $count);
				if ($brick->type == CMSQSys::BRICKTYPE_TEMPLATE && $contentPos >= $position && $contentPos <= $count+$position){
					$ca = split("\[tt\]content\[\/tt\]", $content);
					print $ca[0];
					print $this->PagePrint($brickContent);
					print $ca[1];
				}else{
					print $content;
				}
				$position = $value[0][1]+strlen($replstr);
				foreach ($brick->child as $cbrick){
					
					if ($cbrick->owner == $sa[0] && $cbrick->name == $mbrick->name && $cbrick->type != CMSQSys::BRICKTYPE_CONTENT) {
						if($cbrick->param->param['id'] > 0 && $cbrick->param->param['id'] != $id){
							continue; 
						}
						$this->PagePrint($cbrick);
						break;
					}
				}
			}
		}
		$count = strlen($brick->content)-$position;
		$content = substr($brick->content, $position, $count);
		if ($brick->type == CMSQSys::BRICKTYPE_TEMPLATE && $contentPos >= $position && $contentPos <= $count+$position){
			$ca = split("\[tt\]content\[\/tt\]", $content);
			print $ca[0];
			print $this->PagePrint($brickContent);
			print $ca[1];
		}else{
			print $content;
		}
	}
	
	private function FetchVars(CMSSysBrick $brick){

		if ($brick->type == CMSQSys::BRICKTYPE_TEMPLATE){
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
				$mod = Brick::$modules->GetModule($modname);
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
				$brick->param->var['css'] .= "<style type='text/css' media='screen, projection'>/*<![CDATA[*/	@import '".$value."'; /*]]>*/</style>";
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
	 * @param CMSSysBrick $brick
	 */
	private function TakeGlobalParam(CMSSysBrick $brick){
		if ($brick->type != CMSQSys::BRICKTYPE_TEMPLATE){
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
	 * @param CMSSysBrick $brick
	 */
	private function ExecuteBrick(CMSSysBrick $brick){
		
		$p = $brick->param;
		foreach ($brick->child as $childbrick){
			$this->ExecuteBrick($childbrick);
		}
		foreach ($p->script as $script){
			$path = CWD;
			if ($brick->type == CMSQSys::BRICKTYPE_TEMPLATE){
				$path .= "/includes/over/";
			}else{
				$path .= "/modules/".$brick->owner."/includes/";
			}
			$file = $path.$script;
			if (!file_exists($file)){
				$brick->content .= "File not found: ".$file."\n";
			}else{
				$mod = Brick::$modules->GetModule($brick->owner);
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
 * @subpackage Sys
 */
class CMSSysBrickManager {
	
	/**
	 * Ядро
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	/**
	 * Пользовательские версии кирпичей и параметров
	 *
	 * @var CMSSysBrickCustomManager
	 */
	public $custom = null;
	
	public function CMSSysBrickManager(CMSRegistry $registry, $useCustom = true){
		$this->registry = $registry;
		// пользовательские кирпичи и параметры
		if ($useCustom){
			$this->custom = new CMSSysBrickCustomManager($this->registry);
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
		if ($brickType == CMSQSys::BRICKTYPE_BRICK){
			$mod = $this->registry->modules->GetModule($owner);
			if (empty($mod)){ return null; }
		}
		
		// кеш, применим только к шаблону
		if ($brickType == CMSQSys::BRICKTYPE_TEMPLATE){
			if (CMSRegistry::$instance->config['Misc']['brick_cache']){
				$time = TIMENOW-5*360;
				$cache = CMSQSys::Cache($db, $owner, $brickName);
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
			$brickFF = CMSSysBrickReader::ReadBrick($owner, $brickName, $brickType);
			$brick = new CMSSysBrick($owner, $brickName, $brickType, $brickFF->body, $brickFF->param, $parent);
			$this->SyncParam($owner, $brickName, $brickType, $brick->param);
		}else{
			$param = new CMSSysBrickParam();
			$this->SyncParam($owner, $brickName, $brickType, $param);
			$brick = new CMSSysBrick($owner, $brickName, $brickType, $customBrick['bd'], $param, $parent);
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
			if (empty($p->template["owner"])){
				$towner = Brick::$builder->phrase->Get('sys', 'style', 'default');
				if (!file_exists(CWD."/tt/".$towner."/main.html")){
					$p->template["owner"] = "default";
					Brick::$builder->phrase->Set('sys', 'style', 'default');
				}else{
					$p->template["owner"] = $towner;
				}
			}
			$childBrick = $this->BuildOutput($p->template["owner"], $p->template['name'], CMSQSys::BRICKTYPE_TEMPLATE, $brick);
			array_push($brick->child, $childBrick);
		}
		if (!empty($p->module)){
			foreach($p->module as $key => $value){
				foreach ($value as $obj){
					$childBrick = $this->BuildOutput($key, $obj->name, CMSQSys::BRICKTYPE_BRICK, $brick, $obj->param);
					if (is_null($childBrick)){ continue; }
					array_push($brick->child, $childBrick);
				}
			}
		}
		if ($brickType == CMSQSys::BRICKTYPE_TEMPLATE && $recache){
			if (empty($cache)){
				CMSQSys::CacheAppend($db, $owner, $brickName, serialize($brick));
			}else{
				CMSQSys::CacheUpdate($db, $cache['id'], serialize($brick));
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
	 * @param CMSSysBrickParam $param
	 */
	private function SyncParam($owner, $brickName, $brickType, CMSSysBrickParam $param){
		if (is_null($this->custom)){ return; }
		$customParam = $this->custom->GetParams($brickType, $owner, $brickName);
		if (empty($customParam)){
			return;
		}
		CMSSysBrickReader::SyncParamFromDB($param, $customParam);
	}
}

/**
 * Параметры кирпича
 * 
 * @package Abricos
 * @subpackage Sys
 */
class CMSSysBrickParam {
	
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
 * @subpackage Sys
 */
class CMSSysBrick {
	
	/**
	 * Родитель
	 *
	 * @var CMSSysBrick
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
	public $type = CMSQSys::BRICKTYPE_BRICK;
	
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
	 * @var CMSSysBrickParam
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
 * @subpackage Sys
 */
class CMSSysBrickCustomManager {
	
	public $bricks = array();
	public $params = array();
	
	/**
	 * Конструктор. Загружает из БД все custom кирпичи и их параметры
	 */
	public function __construct(CMSRegistry $registry){
		$db = $registry->db;
		$rows = CMSQSys::BrickListCustom($db);
		while (($row = $db->fetch_array($rows))){
			$key = $row['own'].$row['nm'].$row['tp'];
			$this->bricks[$key] = $row;
		}

		$rows = CMSQSys::BrickParamListCustom($db);
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

?>