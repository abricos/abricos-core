<?php
/**
 * JavaScript компонент
 * 
 * @package Abricos
 * @subpackage Core
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
class Ab_CoreJSCFile {
	
	public $module = "";
	public $component = "";
	public $template = "default";
	public $language = "ru";
	
	public $fileJS = "";
	public $fileHTML = "";
	public $fileCSS = "";
	// public $fileLANG = "";
	public $fileLangs = array();
	
	public function __construct($pModule, $pComponent, $pTname = "default", $pLang = "ru"){
		$tname = $this->parseName($pTname);
		$module = $this->parseName($pModule);
		$component = $this->parseName($pComponent);
		$lang = $this->parseName($pLang);

		$this->module = $module;
		$this->component = $component;
		$this->template = $tname;
		$this->language = $lang;
		
		$rootPath = realpath(".");
		$modPath = $rootPath."/modules/".$module."/js";
		$compPath = $modPath."/".$component;

		$this->fileJS = $compPath.".js";

		if ($pModule != $module || $pComponent != $component || !file_exists($this->fileJS)){
			$this->error();
		}

		$overPath = realpath($rootPath."/tt/".$tname."/override/".$module."/js/".$component);
		
		$this->fileHTML = $compPath.".htm";
		if (file_exists($this->fileHTML)){
			$override = $overPath.".htm";
			if (file_exists($override)){
				$this->fileHTML = $override;
			}
		}

		$this->fileCSS = $compPath.".css";
		if (file_exists($this->fileCSS)){
			$override = $overPath.".css";
			if (file_exists($override)){
				$this->fileCSS = $override;
			}
		}
		
		// $this->fileLANG = $modPath."/langs/".$component."_".$lang.".js";
		
		$this->fileLangs = globa($modPath."/langs/".$component."_*.js");
	}
	
	public function error(){
		header("HTTP/1.0 404 Not Found");
		header("HTTP/1.1 404 Not Found");
		header("Status: 404 Not Found");
		die();
	}
	
	public function parseName($str){
		$ret = str_replace("\\", "/", $str);
		$ret = str_replace("..", "", $ret);
		return preg_replace("/[^0-9a-z\-_,\/\.\:]+/i", "", $ret);
	}
	
	public function build(){
		$js = $this->readJS();
		$htm = $this->readHTML();
		$css = $this->readCSS();
		$langs = $this->readLangs();
		
		$jscomp = new Ab_CoreJSCBuilder($this->module, $this->component);
		return $jscomp->build($js, $htm, $css, $langs);
	}
	
	public function readJS(){
		return $this->read($this->fileJS);
	}
	
	public function readCSS(){
		return $this->read($this->fileCSS);
	}
	
	public function readHTML(){
		return $this->read($this->fileHTML);
	}
	
	/*
	public function readLANG(){
		return $this->read($this->fileLANG);
	}
	/**/
	
	public function readLangs(){
		$ret = array();
		foreach ($this->fileLangs as $fileLang){
			array_push($ret, $this->read($fileLang));
		}
		return $ret;
	}
	
	public function read($path) {
		$path = realpath($this->parseName($path));
		$fi = pathinfo($path);
		
		if (!$path  || !file_exists($path) || !@is_file($path)){
			return "";
		}
	
		$extension = strtolower($fi["extension"]);
		
		switch($extension){
			case "css": case "htm": case "js": break;
			default:
				$this->error();
				// die("Hacker?");
				return "";
		}
			
		if (function_exists("file_get_contents")){
			return @file_get_contents($path);
		}
	
		$content = "";
		$fp = @fopen($path, "r");
		if (!$fp){
			return "";
		}
		while (!feof($fp)){
			$content .= fgets($fp);
		}
		fclose($fp);
	
		return $content;
	}
	
	/**
	 * Сгенерировать уникальный ключ js компонента
	 */
	public function buildKey(){
		$key = $this->buildKeyByFile($this->fileJS);
		$key += $this->buildKeyByFile($this->fileCSS);
		$key += $this->buildKeyByFile($this->fileHTML);
		$key += $this->buildKeyByFile($this->fileLANG);
		$key += 5;
		return md5($this->module.$this->component.$this->language.$key);
	}
	
	public function buildKeyByFile($file){
		if (!file_exists($file)){ return 0; }

		return filemtime($file) + filesize($file);
	}
}

class Ab_CoreJSCBuilder {

	public $module = "";
	public $component = "";
	public $version = "";
	
	public function __construct($module, $component){
		$this->module = $module;
		$this->component = $component;
	}
	
	public function build($js, $htm, $css, $langs){
		$module = $this->module;
		$component = $this->component;
		
		$content = $js;
		$content .= $this->buildLanguage($langs);
		$content .= $this->buildHTML($htm);
		$content .= $this->buildCSS($css);

		// Replace constants
		$content = str_replace("{C#MODNAME}", $module, $content);
		$content = str_replace("{C#COMNAME}", $component, $content);
		
		$moduri = $module;
		$a = explode("/", $moduri);
		if (count($a) == 2){
			$host = $a[0];
			$port = 80;
			$mname = $a[1];
			$aa = explode(":", $host);
			if(count($aa) == 1 && intval($aa[1]) > 0){
				$port = intval($aa[1]);
			}
			$moduri = $aa[0]."\t".$port."\t".$mname;
		}
		
		$content = str_replace("{C#MODNAMEURI}", urlencode($moduri), $content);
		
		// Append initialize code
		$content .= "if (typeof Component != 'undefined'){ Brick.add('".$module."', '".$component."', Component); Component = undefined; }";
		
		return $content;
	}
	
	public function buildLanguage($langs){
		$ret = "";
		if (is_array($langs)){
			foreach($langs as $lang){
				$ret .= "(function(){".$lang."})();";
			}
		}
		
		return $ret;
	}
	
	public function buildHTML($htm){
		if (empty($htm)){ return ""; }

		$module = $this->module;

        // TODO: remove old define of template
		$content = "
(function(){
    var mt=Brick.util.Template;
    if(typeof mt['".$module."']=='undefined'){mt['".$module."']={}};
    var t=mt['".$module."'];
";
		$content .= $this->parseHTML($htm);
		$content .= "
})();";

        $content .= "
Abricos.Template.add('mod.".$module.".".$this->component."', '".$this->parseHTMLnew($htm)."');
        ";

		return $content;
	}

    public function parseHTMLnew($htm){
        $str = $htm;
        $str = preg_replace("/[\n\r\t]+/", "", $str);
        $str = preg_replace("/>[\s]+</", "><", $str);
        $str = addslashes($str);

        return $str;
    }
	
	public function parseHTML($htm){
		$str = $htm;
		$str = preg_replace("/[\n\r\t]+/", "", $str);
		$str = preg_replace("/>[\s]+</", "><", $str);
		
		$pattern = '/<!--{([a-zA-Z0-9_ ]+)}-->/siU';
		$mathes = array();
		preg_match_all($pattern, $str, $mathes, PREG_SET_ORDER);
		$ret = $str;
	
		$js = "t['".$this->component."']={};";
		
		for ($i=count($mathes)-1;$i>=0;$i--){
			$varr = $mathes[$i][0];
			$var = trim($mathes[$i][1]);
	
			$pos = strpos($ret, $varr);
			$s = substr($ret, $pos);
			$ret = substr($ret, 0, strlen($ret)-strlen($s));
			
			$s = substr($s, strlen($varr));
			
			$js .= "t['".$this->component."']['".$var."']='".addslashes($s)."';";
		}
		
		return $js;
	}
	
	public function buildCSS($css){
		if (empty($css)){ return ""; }
		
		$module = $this->module;

		$content = "
Abricos.CSS.add('mod.".$module.".".$this->component."', '".$this->parseCSS($css)."');
		";
		return $content;
	}
	
	function parseCSS($css){
		$str = $css;
		$str = preg_replace("/[\n\r\t]+/", "", $str);
		$str = addslashes($str);
		return $str;
	}
	

}

?>