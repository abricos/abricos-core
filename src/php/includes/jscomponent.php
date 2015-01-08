<?php

/**
 * JavaScript компонент
 *
 * @package Abricos
 * @subpackage Core
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
class Ab_CoreJSCFile{

    public $module = "";
    public $component = "";
    public $template = "default";
    public $language = "ru";

    public $fileJS = "";
    public $fileHTML = "";
    public $fileCSS = "";
    public $fileLangs = array();
    public $fileJSONLangs = array();

    public function __construct($pModule, $pComponent, $pTname = "default", $pLang = "ru"){
        $tname = $this->parseName($pTname);
        $module = $this->parseName($pModule);
        $component = $this->parseName($pComponent);

        $this->module = $module;
        $this->component = $component;
        $this->template = $tname;

        $rootPath = realpath(".");
        $modPath = $rootPath."/modules/".$module."/js";
        $compPath = $modPath."/".$component;

        $this->fileJS = $compPath.".js";

        if ($pModule != $module || $pComponent != $component || !file_exists($this->fileJS)){
            $this->error();
        }
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
        return $this->read($this->fileJS);
    }

    public function read($path){
        $path = realpath($this->parseName($path));
        $fi = pathinfo($path);

        if (!$path || !file_exists($path) || !@is_file($path)){
            return "";
        }

        $extension = strtolower($fi["extension"]);

        switch ($extension) {
            case "js":
                break;
            default:
                $this->error(); // die("Hacker?");
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
        while (!feof($fp)) {
            $content .= fgets($fp);
        }
        fclose($fp);

        return $content;
    }

}


?>