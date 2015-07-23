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
    public $locale = "ru-RU";

    public $fileJS = "";
    public $fileHTML = "";
    public $fileCSS = "";
    // public $fileLANG = "";
    public $localeFiles = array();
    public $fileJSONLangs = array();

    public function __construct($pModule, $pComponent, $pTname = "default", $locale = "ru-RU") {
        $tname = $this->parseName($pTname);
        $module = $this->parseName($pModule);
        $component = $this->parseName($pComponent);
        $locale = $this->parseName($locale);

        $this->module = $module;
        $this->component = $component;
        $this->template = $tname;
        $this->locale = $locale;

        $rootPath = realpath(".");
        $modPath = $rootPath."/modules/".$module."/js";
        $compPath = $modPath."/".$component;

        $this->fileJS = $compPath.".js";

        if ($pModule != $module || $pComponent != $component || !file_exists($this->fileJS)) {
            $this->error();
        }

        $overPath = realpath($rootPath."/tt/".$tname."/override/".$module."/js/".$component);

        $this->fileHTML = $compPath.".htm";
        if (file_exists($this->fileHTML)) {
            $override = $overPath.".htm";
            if (file_exists($override)) {
                $this->fileHTML = $override;
            }
        }

        $this->fileCSS = $compPath.".css";
        if (file_exists($this->fileCSS)) {
            $override = $overPath.".css";
            if (file_exists($override)) {
                $this->fileCSS = $override;
            }
        }

        // $this->fileLANG = $modPath."/langs/".$component."_".$locale.".js";

        $this->localeFiles = globa($modPath."/langs/".$component."_*.js");
        $this->fileJSONLangs = globa($modPath."/langs/".$component."_*.json");
    }

    public function error() {
        header("HTTP/1.0 404 Not Found");
        header("HTTP/1.1 404 Not Found");
        header("Status: 404 Not Found");
        die();
    }

    public function parseName($str) {
        $ret = str_replace("\\", "/", $str);
        $ret = str_replace("..", "", $ret);
        return preg_replace("/[^0-9a-z\-_,\/\.\:]+/i", "", $ret);
    }

    public function build() {
        $js = $this->readJS();
        $htm = $this->readHTML();
        $css = $this->readCSS();
        $locales = $this->readLangs();
        $localesJSON = $this->readJSONLangs();

        $jscomp = new Ab_CoreJSCBuilder($this->module, $this->component);
        return $jscomp->build($js, $htm, $css, $locales, $localesJSON);
    }

    public function readJS() {
        return $this->read($this->fileJS);
    }

    public function readCSS() {
        return $this->read($this->fileCSS);
    }

    public function readHTML() {
        return $this->read($this->fileHTML);
    }

    public function readLangs() {
        $ret = array();
        foreach ($this->localeFiles as $localeFile) {
            $ret[] = $this->read($localeFile);
        }
        return $ret;
    }

    public function readJSONLangs() {

        $ret = array();
        foreach ($this->fileJSONLangs as $localeFile) {
            $fi = pathinfo($localeFile);
            $fn = $fi['filename'];

            $langId = str_replace($this->component."_", "", $fn);
            if (!empty($langId)) {
                $ret[$langId] = $this->read($localeFile);
            }
        }

        return $ret;
    }

    public function read($path) {
        $path = realpath($this->parseName($path));
        $fi = pathinfo($path);

        if (!$path || !file_exists($path) || !@is_file($path)) {
            return "";
        }

        $extension = strtolower($fi["extension"]);

        switch ($extension) {
            case "css":
            case "htm":
            case "js":
            case "json":
                break;
            default:
                $this->error();
                // die("Hacker?");
                return "";
        }

        if (function_exists("file_get_contents")) {
            return @file_get_contents($path);
        }

        $content = "";
        $fp = @fopen($path, "r");
        if (!$fp) {
            return "";
        }
        while (!feof($fp)) {
            $content .= fgets($fp);
        }
        fclose($fp);

        return $content;
    }

    /**
     * Сгенерировать уникальный ключ js компонента
     */
    public function buildKey() {
        $key = $this->buildKeyByFile($this->fileJS);
        $key += $this->buildKeyByFile($this->fileCSS);
        $key += $this->buildKeyByFile($this->fileHTML);
        $key += $this->buildKeyByFile($this->fileLANG);
        $key += 5;
        return md5($this->module.$this->component.$this->locale.$key);
    }

    public function buildKeyByFile($file) {
        if (!file_exists($file)) {
            return 0;
        }

        return filemtime($file) + filesize($file);
    }
}

class Ab_CoreJSCBuilder {

    public $module = "";
    public $component = "";
    public $version = "";
    public $key = "";

    public function __construct($module, $component) {
        $this->module = $module;
        $this->component = $component;

        $this->key = "mod.".$module.".".$this->component;
    }

    public function build($js, $htm, $css, $locales, $localesJSON) {
        $module = $this->module;
        $component = $this->component;

        $content = $js;
        $content .= $this->buildLanguage($locales);
        $content .= $this->buildLanguageJSON($localesJSON);
        $content .= $this->buildHTML($htm);
        $content .= $this->buildCSS($css);

        // Replace constants
        $content = str_replace("{C#MODNAME}", $module, $content);
        $content = str_replace("{C#COMNAME}", $component, $content);

        $moduri = $module;
        $a = explode("/", $moduri);
        if (count($a) == 2) {
            $host = $a[0];
            $port = 80;
            $mname = $a[1];
            $aa = explode(":", $host);
            if (count($aa) == 1 && intval($aa[1]) > 0) {
                $port = intval($aa[1]);
            }
            $moduri = $aa[0]."\t".$port."\t".$mname;
        }

        $content = str_replace("{C#MODNAMEURI}", urlencode($moduri), $content);

        // Append initialize code
        $content .= "if (typeof Component != 'undefined'){ Brick.add('".$module."', '".$component."', Component); Component = undefined; }";

        return $content;
    }

    public function buildLanguage($locales) {
        $ret = "";
        if (is_array($locales)) {
            foreach ($locales as $lang) {
                $ret .= "(function(){".$lang."})();";
            }
        }

        return $ret;
    }

    public function buildLanguageJSON($locales) {
        $ret = "";
        if (is_array($locales)) {
            foreach ($locales as $key => $value) {
                $ret .= "
Abricos.Language.add('".$this->key."', '".$key."', ".$value.");
";
            }
        }

        return $ret;
    }

    public function buildHTML($htm) {
        if (empty($htm)) {
            return "";
        }

        $content = "
Abricos.Template.add('".$this->key."', '".$this->parseHTMLnew($htm)."');
        ";

        return $content;
    }

    public function parseHTMLnew($htm) {
        $str = $htm;
        $str = preg_replace("/[\n\r\t]+/", "", $str);
        $str = preg_replace("/>[\s]+</", "><", $str);
        $str = addslashes($str);

        return $str;
    }

    public function parseHTML($htm) {
        $str = $htm;
        $str = preg_replace("/[\n\r\t]+/", "", $str);
        $str = preg_replace("/>[\s]+</", "><", $str);

        $pattern = '/<!--{([a-zA-Z0-9_ ]+)}-->/siU';
        $mathes = array();
        preg_match_all($pattern, $str, $mathes, PREG_SET_ORDER);
        $ret = $str;

        $js = "t['".$this->component."']={};";

        for ($i = count($mathes) - 1; $i >= 0; $i--) {
            $varr = $mathes[$i][0];
            $var = trim($mathes[$i][1]);

            $pos = strpos($ret, $varr);
            $s = substr($ret, $pos);
            $ret = substr($ret, 0, strlen($ret) - strlen($s));

            $s = substr($s, strlen($varr));

            $js .= "t['".$this->component."']['".$var."']='".addslashes($s)."';";
        }

        return $js;
    }

    public function buildCSS($css) {
        if (empty($css)) {
            return "";
        }

        $module = $this->module;

        $content = "
Abricos.CSS.add('".$this->key."', '".$this->parseCSS($css)."');
		";
        return $content;
    }

    function parseCSS($css) {
        $str = $css;
        $str = preg_replace("/[\n\r\t]+/", "", $str);
        $str = addslashes($str);
        return $str;
    }


}

?>