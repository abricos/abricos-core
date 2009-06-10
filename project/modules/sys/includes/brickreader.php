<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

class CMSSysBrickReader {
	
	/**
	 * CMS Engine
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	public $isAdmin = false;
	
	/**
	 * Database
	 *
	 * @var CSMDatabase
	 */
	public $db = null;
	
	public function __construct(CMSRegistry $registry){
		$this->registry = $registry;
		$this->db = $registry->db;
		$this->isAdmin = $registry->session->IsAdminMode(); 
	}
	
	public static function ReadBrick($owner, $name, $type){
		$path = CWD."/modules/".$owner."/";
		
		switch ($type){
			case CMSQSys::BRICKTYPE_BRICK: $path .= "brick/"; break; 
			case CMSQSys::BRICKTYPE_CONTENT: $path .= "content/"; break;
			case CMSQSys::BRICKTYPE_TEMPLATE: 
				$path = CWD."/tt/".$owner."/"; 
				break;
		}
		$path .= $name.".html";
		return CMSSysBrickReader::ReadBrickFromFile($path);
	}
	
	/**
	 * Проверка на изменение кирпичей движка
	 *
	 */
	public function CheckBrickVersion(){
		$this->checkTemplateFiles();
		$this->checkBrickFiles();
		$this->checkContentFiles();
	}
	
	private function checkBrickFiles(){
		if (!$this->isAdmin){ return; }
		$this->registry->modules->RegisterAllModule();
		
		$brickdb = array();

		$rows = CMSQSys::BrickListFromParser($this->registry->db, CMSQSys::BRICKTYPE_BRICK);
		while (($row = $this->registry->db->fetch_array($rows))){
			$brickdb[$row['own'].".".$row['nm']] = $row;
		}
		
		$mods = $this->registry->modules->GetModules();
		foreach ($mods as $module){
			$files = glob(CWD."/modules/".$module->name."/brick/pub_*.html");
			foreach ($files as $file){
				$bname = basename($file, ".html");
				$key = $module->name.".".$bname;
				if (empty($brickdb[$key])){
					$brick = CMSSysBrickReader::ReadBrickFromFile($file);
					$brickid = CMSQSys::BrickAppendFromParser($this->db, $module->name, $bname, $brick->body, CMSQSys::BRICKTYPE_BRICK, $brick->hash);
					CMSQSys::BrickParamAppendFromParser($this->db, $brickid, $brick->param);
				}else { 
					$bk = $brickdb[$key];
					if (empty($bk['ud'])){
						$brick = CMSSysBrickReader::ReadBrickFromFile($file);
						if ($bk['hh'] != $brick->hash){
							CMSQSys::BrickSaveFromParser($this->db, $bk['id'], $brick->body, $brick->hash);
							CMSQSys::BrickParamAppendFromParser($this->db, $bk['id'], $brick->param);
						}
					}
				}
			}
		}
	}
	
	private function checkContentFiles(){
		if (!$this->isAdmin){ return; }
		$this->registry->modules->RegisterAllModule();
		
		$brickdb = array();

		$rows = CMSQSys::BrickListFromParser($this->registry->db, CMSQSys::BRICKTYPE_CONTENT);
		while (($row = $this->registry->db->fetch_array($rows))){
			$brickdb[$row['own'].".".$row['nm']] = $row;
		}
		
		$mods = $this->registry->modules->GetModules();
		foreach ($mods as $module){
			$files = glob(CWD."/modules/".$module->name."/content/*.html");
			foreach ($files as $file){
				$bname = basename($file, ".html");
				$key = $module->name.".".$bname;
				if (empty($brickdb[$key])){
					$brick = CMSSysBrickReader::ReadBrickFromFile($file);
					$brickid = CMSQSys::BrickAppendFromParser($this->db, $module->name, $bname, $brick->body, 
						CMSQSys::BRICKTYPE_CONTENT, $brick->hash);
					CMSQSys::BrickParamAppendFromParser($this->db, $brickid, $brick->param);
				}else { 
					$bk = $brickdb[$key];
					if (empty($bk['ud'])){
						$brick = CMSSysBrickReader::ReadBrickFromFile($file);
						if ($bk['hh'] != $brick->hash){
							CMSQSys::BrickSaveFromParser($this->db, $bk['id'], $brick->body, $brick->hash);
							CMSQSys::BrickParamAppendFromParser($this->db, $bk['id'], $brick->param);
						}
					}
				}
			}
		}
	}
	
	private function checkTemplateFiles(){
		if (!$this->isAdmin){ return; }
		
		$template = array();
		
		$rows = CMSQSys::BrickListFromParser($this->registry->db, CMSQSys::BRICKTYPE_TEMPLATE);
		while (($row = $this->registry->db->fetch_array($rows))){
			$template[$row['own'].".".$row['nm']] = $row;
		}

		$dir = dir(CWD."/tt/");
		while (($dirname = $dir->read())) {
			if ($dirname == "." || $dirname == ".." || empty($dirname)){ continue; }
			if ($dirname == "_sys"){ continue; }

			$files = glob(CWD."/tt/".$dirname."/*.html");
			foreach ($files as $file){
				$bname = basename($file, ".html");
				$key = $dirname.".".$bname;
				
				if (empty($template[$key])){
					$brick = CMSSysBrickReader::ReadBrickFromFile($file);
					$brickid = CMSQSys::BrickAppendFromParser($this->db, $dirname, $bname, $brick->body, CMSQSys::BRICKTYPE_TEMPLATE, $brick->hash);
					CMSQSys::BrickParamAppendFromParser($this->db, $brickid, $brick->param);
				}else{
					$bk = $template[$key];
					if (empty($bk['ud'])){
						$brick = CMSSysBrickReader::ReadBrickFromFile($file);
						if ($bk['hh'] != $brick->hash){
							CMSQSys::BrickSaveFromParser($this->db, $bk['id'], $brick->body, $brick->hash);
							CMSQSys::BrickParamAppendFromParser($this->db, $bk['id'], $brick->param);
						}
					}
				}
			}
		}
	}
	
	public static function SyncParamFromDB(CMSSysBrickParam $param, $customParam){
		foreach ($customParam as $p){
			switch ($p['tp']){
				case CMSQSys::BRICKPRM_CSS:
					CMSSysBrickReader::SyncParamVar($param->css, $p['v']);
					break;
				case CMSQSys::BRICKPRM_GLOBALVAR:
					$param->gvar[$p['nm']] = $p['v'];
					break;
				case CMSQSys::BRICKPRM_JSFILE:
					CMSSysBrickReader::SyncParamVar($param->jsfile, $p['v']);
					break;
				case CMSQSys::BRICKPRM_JSMOD:
					if (!is_array($param->module[$p['nm']])){
						$param->jsmod[$p['nm']] = array();
					}
					CMSSysBrickReader::SyncParamVar($param->jsmod[$p['nm']], $p['v']);
					break;
				case CMSQSys::BRICKPRM_MODULE:
					if (!is_array($param->module[$p['nm']])){
						$param->module[$p['nm']] = array();
					}
					// модуль и его параметры
					foreach ($p['v'] as $modstr){
						$tmp = explode("|",$modstr);
						$param->module[$p['nm']][$tmp[0]] = array();
						$cnt = count($tmp);
						for ($i=1;$i<$cnt;$i++){
							$ttmp = explode("=", $tmp[$i]);
							$param->module[$p['nm']][$tmp[0]][$ttmp[0]] = $ttmp[1]; 
						}
					}
					// CMSSysBrickReader::SyncParamVar($param->module[$p['nm']], $p['v']);
					break;
				case CMSQSys::BRICKPRM_PARAM:
					if (!is_array($param->param[$p['nm']])){
						$param->param[$p['nm']] = array();
					}
					CMSSysBrickReader::SyncParamVar($param->param[$p['nm']], $p['v']);
				case CMSQSys::BRICKPRM_PHRASE:
					if (!is_array($param->phrase[$p['nm']])){
						$param->phrase[$p['nm']] = array();
					}
					CMSSysBrickReader::SyncParamVar($param->phrase[$p['nm']], $p['v']);
					break;
				case CMSQSys::BRICKPRM_SCRIPT:
					CMSSysBrickReader::SyncParamVar($param->script, $p['v']);
					break;
				case CMSQSys::BRICKPRM_TEMPLATE:
					$param->template['name'] = $p['nm'];
					$param->template['owner'] = $p['v'];
					break;
				case CMSQSys::BRICKPRM_VAR:
					$param->var[$p['nm']] = $p['v'];
					break;
			}
		}
	}
	
	private static function SyncParamVar(&$arr, $val){
		$find = false;
		foreach ($arr as $inval){
			if ($inval == $val){
				$find = true;
				break;
			}
		}
		if (!$find){array_push($arr, $val); }
	}
	
	public static function ReadBrickFromFile($file){
		$ret = new stdClass();
		if (!file_exists($file)){
			$filebody = "File not found: ".$file;
		}else {
			$filebody = file_get_contents($file);
		}
		
		$langa = array();
		// чтение языковых идентификаторов
		$lngs = array();
		preg_match_all("{#[a-zA-Z_.]+}", $filebody, $lngs);
		if (!empty($lngs)){
			foreach ($lngs[0] as $value){
				$value = str_replace("#", "", $value);
				$arr = explode(".", $value);
				if (!is_array($langa[$arr[0]])){
					$langa[$arr[0]] = array();
				}
				$find = false;
				foreach ($langa[$arr[0]] as $vname){
					if ($vname == $arr[1]){
						$find = true;
						break;
					}
				}
				if (!$find){
					array_push($langa[$arr[0]], $arr[1]);
				}
			}
		}
		// обработка языковых фраз в контенте кирпича
		if (!empty($langa)){
			foreach ($langa as $modname => $value){
				foreach ($value as $name){
					$mod = CMSRegistry::$instance->modules->GetModule($modname);
					if (!empty($mod)){
						$filebody = str_replace("{#".$modname.".".$name."}", $mod->lang[$name], $filebody);
					}
				}
			}
		}
		
		$pattern = "#<!--\[\*\](.+?)\[\*\]-->#is";
		$mathes = array();
		preg_match($pattern, $filebody, $mathes);
		$param = $mathes[1];
		
		$ret->hash = md5("sz".filesize($file)."tm".filemtime($file));
		
		$ret->body = preg_replace($pattern, '', $filebody);
		$p = new CMSSysBrickParam();
		
		// локальные переменные кирпича
		$p->var = CMSSysBrickReader::BrickParseVar($param, "bkvar");
		// глобальные переменные
		$p->gvar = CMSSysBrickReader::BrickParseVar($param, "var");
		// подключаемые модули
		$arr = CMSSysBrickReader::BrickParseVar($param, "mod");
		foreach($arr as $key => $value){
			if (!is_array($p->module[$key])){
				$p->module[$key] = array();
			}
			$mods = explode(',', $value);
			// модуль и его параметры
			foreach ($mods as $modstr){
				$tmp = explode("|",$modstr);
				$p->module[$key][$tmp[0]] = array();
				$cnt = count($tmp);
				for ($i=1;$i<$cnt;$i++){
					$ttmp = explode("=", $tmp[$i]);
					$p->module[$key][$tmp[0]][$ttmp[0]] = $ttmp[1]; 
				}
			}
		}
		
		// шаблон
		$arr = CMSSysBrickReader::BrickParseVar($param, "tt");
		foreach ($arr as $key => $value){
			$p->template['name'] = $key;
			$p->template['owner'] = $value;
			break;
		}

		// Фразы
		$p->phrase = CMSSysBrickReader::BrickParseVar($param, "ph");
		$p->param = CMSSysBrickReader::BrickParseVar($param, "p");
		$p->script = CMSSysBrickReader::BrickParseValue($param, "script");

		// JavaScript модули
		$arr = CMSSysBrickReader::BrickParseVar($param, "mjs");
		foreach($arr as $key => $value){
			$p->jsmod[$key] = explode(',', $value); 
		}

		// JavaScript файлы
		$p->jsfile = CMSSysBrickReader::BrickParseValue($param, "js");
		$p->css = CMSSysBrickReader::BrickParseValue($param, "css");
		
		$ret->param = $p; 
		
		return $ret;
	}

	private static function BrickParseValue($text, $name){
		$array = array();
			
		/* Разбор - переменные кирпича */
		$pattern = 	"#\[".$name."\](.+?)\[/".$name."\]#is";
		while(true){
			$mathes = array();
			if (preg_match($pattern, $text, $mathes) == 0)
				break;
					
			$array[$mathes[1]] = trim($mathes[1]);
			
			$text = preg_replace($pattern, "", $text, 1);
		}
		return $array;
	}
		
	private static function BrickParseVar($text, $name){
		$array = array();
			
		/* Разбор - переменные кирпича */
		$pattern = 	"#\[".$name."=(.+?)\](.*?)\[/".$name."\]#is";
			
		while(true){
			$mathes = array();
	
			if (preg_match($pattern, $text, $mathes) == 0)
				break;
					
			$array[$mathes[1]] = trim($mathes[2]);
		
			$text = preg_replace($pattern, "", $text, 1);
		}
		return $array;
	}
	
}

?>