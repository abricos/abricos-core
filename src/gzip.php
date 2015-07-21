<?php
/**
 * @package Abricos
 * @link http://abricos.org
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @ignore
 */

// Set the error reporting to minimal.
@error_reporting(E_ERROR | E_WARNING | E_PARSE);

require_once 'includes/jscomponent.php';

// example
// http://www.abricos.org/gzip.php?file=js/yui/[версия yui]/yuiloader/yuiloader-min.js

// Get input
$files = explode(',', getParam("file", ""));
$basedir = getParam("base", "");
$version = getParam("version", "");
$lang = getParam("lang", "ru");
$libType = getParam("type", "");
$templateName = getParam("tt", "default");
$module = getParam("module", "");
// $mime = getParam("mime", "");

$diskCache = getParam("diskcache", "true") == "true";
$compress = getParam("compress", "true") == "true";
$expiresOffset = 3600 * 24 * 30; // Cache for 30 days in browser cache

$cacheLimitCount = 1024; // Cache directory: file count  

$encodings = array();
// $supportsGzip = false;
$enc = "";
$cacheKey = "";
$realPath = realpath(".");
$cachePath = $realPath."/cache/gzip";
$diskCacheFileKey = "";

@mkdir($cachePath, 0777, true);

if ($libType == 'sys'){
    $mime = 'js';
    $files = array('/modules/sys/js/brick.js');
    $module = "sys";
} else if ($libType == 'fullcssforie'){
    $mime = 'css';
    $files = array('fullcssforie');
    $module = "sys";
} else if ($libType == 'mod'){
    $mime = 'js';
    $newFiles = array();
    foreach ($files as $file){
        if ($module == "_template"){
            $newFiles[] = '/tt/'.$templateName.'/jsmod/'.$file;
        } else {
            $newFiles[] = '/modules/'.$module.'/js/'.$file;
        }
    }
    $files = $newFiles;
} else if (count($files) > 0 && empty($mime)){
    $fi = pathinfo($files[0]);
    $ext = strtolower($fi['extension']);
    switch ($ext){
        case "js":
            $mime = "js";
            break;
        case "css":
            $mime = "css";
            break;
    }
}

switch ($mime){
    case "js":
        $headContentType = "Content-type: text/javascript; charset=utf-8";
        break;
    case "css":
        $headContentType = "Content-type: text/css; charset=utf-8";
        break;
}

header($headContentType);

if ($compress){
    if (isset($_SERVER['HTTP_ACCEPT_ENCODING']))
        $encodings = explode(',', strtolower(preg_replace("/\s+/", "", $_SERVER['HTTP_ACCEPT_ENCODING'])));

    $zlibOn = ini_get('zlib.output_compression') || (ini_set('zlib.output_compression', 0) === false);

    if (
        (in_array('gzip', $encodings) ||
            in_array('x-gzip', $encodings) ||
            isset($_SERVER['---------------'])
        )
        && !$zlibOn
        && function_exists('gzencode')
    ){
        // function_exists('ob_gzhandler') && !ini_get('zlib.output_compression'))


        $enc = in_array('x-gzip', $encodings) ? "x-gzip" : "gzip";
    } else {
        $compress = false;
    }
}

// Setup cache info
if ($diskCache){
    if (!$cachePath){
        // header($headContentType);
        die("alert('Real path failed.');");
    }

    $key = "";
    foreach ($files as $file){
        $key .= preg_replace("/[^0-9a-z\-_]+/i", "", $file);
    }
    $diskCacheFileKey = "js_".md5($key);

    $cacheFile = $diskCacheFileKey;
    $cacheKey = md5(implode("", $files).$version);

    $cacheFileName = $cacheFile."_".$cacheKey;
    if ($compress)
        $cacheFile = $cachePath."/".$cacheFileName.".gz";
    else
        $cacheFile = $cachePath."/".$cacheFileName.".js";
}

$cacheFileExists = file_exists($cacheFile) && $diskCache;
$etag = $cacheKey;

if ($cacheFileExists){
    $if_modified_since = isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) ? stripslashes($_SERVER['HTTP_IF_MODIFIED_SINCE']) : FALSE;
    $if_none_match = isset($_SERVER['HTTP_IF_NONE_MATCH']) ? stripslashes($_SERVER['HTTP_IF_NONE_MATCH']) : FALSE;

    $last_modified = gmdate('D, d M Y H:i:s', filemtime($cacheFile)).' GMT';

    if ($if_modified_since && $if_none_match
        && $if_none_match == $etag // etag must match
        && $if_modified_since == $last_modified
    ){ // if-modified-since must match
        header('HTTP/1.1 304 Not Modified');

        // All 304 responses must send an etag if the 200 response for the same object contained an etag
        header("Etag: $etag");
        return;
    }
}

header("Vary: Accept-Encoding"); // Handle proxies

header("ETag: $etag");
header("Expires: ".gmdate("D, d M Y H:i:s", time() + $expiresOffset)." GMT");

// Use cached file disk cache
if ($cacheFileExists){
    header("Last-Modified: $last_modified");

    if ($compress)
        header("Content-Encoding: ".$enc);

    header("Content-Length: ".filesize($cacheFile));

    readfile($cacheFile);
    return;
}

$content = "";

if ($libType == 'sys'){
    $module = 'sys';
}

if ($libType == 'fullcssforie'){

    $dir = dir($realPath."/modules");
    while (false !== ($entry = $dir->read())){
        if ($entry == "." || $entry == ".." || empty($entry)){
            continue;
        }

        $jsdir = $realPath."/modules/".$entry."/js";

        $cssfiles = globa($jsdir."/*.css");
        foreach ($cssfiles as $file){
            $content .= "\n".getFileContents($file);
        }
    }

} else if ($libType == 'mod' || $libType == 'sys'){

    // Append main file
    foreach ($files as $file){
        $cname = basename($file, ".js");

        $jsCompFile = new Ab_CoreJSCFile($module, $cname, $templateName, $lang);
        $content .= "\n".$jsCompFile->build();
    }

} else {
    foreach ($files as $file){
        $content .= "\n".getFileContents($realPath."/".$basedir."/".$file);
    }
}

// Формирования системного js скрипта:
// 1) чтение системного js файла /modules/sys/js/brick.js
// 2) определение версии всех js модулей по формуле md5(размер+время модификации) 
// и составление списка с добавление в системный js файл скрипт
if ($libType == 'sys'){
    $content .= "\n(function(){\nvar m={},v=[];\n";

    // проход по всем модулям
    $dir = dir($realPath."/modules");
    while (false !== ($entry = $dir->read())){

        // Добавление js модулей шаблона
        if ($entry == "."){
            $entry = "_template";
        }

        if ($entry == "." || $entry == ".." || empty($entry)){
            continue;
        }

        if ($entry == "_template"){
            $jsdir = $realPath."/tt/".$templateName."/jsmod";
        } else {
            $jsdir = $realPath."/modules/".$entry."/js";
        }

        $jsfiles = globa($jsdir."/*.js");
        if (empty($jsfiles)){
            continue;
        }
        $content .= "\nv=[];\n";

        // чтение всех js модулей в модуле
        foreach ($jsfiles as $jsfile){
            $cname = basename($jsfile, ".js");
            $bname = basename($jsfile);
            $jsCompFile = new Ab_CoreJSCFile($entry, $cname, $templateName, $lang);

            $key = $jsCompFile->buildKey();
            $content .= "v[v.length]={f:'".$bname."', k:'".$key."'};\n";
        }
        $content .= "m['".$entry."']=v;\n";
    }
    $content .= "
Brick.Modules = m;
})();";
}

// Generate GZIP'd content
if ($compress){
    header("Content-Encoding: ".$enc);
    $cacheData = gzencode($content, 9, FORCE_GZIP);
} else {
    $cacheData = $content;
}

// Write gz file
if ($diskCache && $cacheKey != ""){
    $chFiles = globa($cachePath."/*");
    if (count($chFiles) >= $cacheLimitCount){
        foreach ($chFiles as $rfile){
            @unlink($rfile);
        }
    } else {
        $chFiles = globa($cachePath."/".$diskCacheFileKey."*");
        foreach ($chFiles as $rfile){
            if (!strpos($rfile, $cacheFileName))
                @unlink($rfile);
        }
    }
    putFileContents($cacheFile, $cacheData);
}

header("Content-Length: ".strlen($cacheData));

// Stream to client
echo $cacheData;

/////////////////////////////// Functions /////////////////////////////// 

function globa($pattern, $flag = 0){
    $res = glob($pattern, $flag);
    return $res ? $res : array();
}

function getParam($name, $def = false){
    if (!isset($_GET[$name]))
        return $def;

    $ret = str_replace("\\", "/", $_GET[$name]);
    $ret = str_replace("..", "", $ret);
    return preg_replace("/[^0-9a-z\-_,\/\.]+/i", "", $ret);
}

function getFileContents($path, $notcheck = false){
    $path = realpath($path);
    $fi = pathinfo($path);
    $extension = strtolower($fi["extension"]);

    if (!$notcheck){
        switch ($extension){
            case "css":
            case "htm":
            case "js":
                break;
            default:
                // die("Hacker?");
                return "";
        }
    }
    if (!$path || !@is_file($path))
        return "";

    if (function_exists("file_get_contents")){
        $content = @file_get_contents($path);
    } else {
        $content = "";
        $fp = @fopen($path, "r");
        if (!$fp)
            return "";

        while (!feof($fp))
            $content .= fgets($fp);

        fclose($fp);
    }

    if ($extension == "css"){

        $realPath = realpath(".");
        $rBase = str_replace($realPath, "", $fi['dirname'])."/";

        $content = preg_replace('/(url\()(\'\.\.\/)+/', 'url(\''.$rBase."../", $content); // url ('../foo.png')
        $content = preg_replace('/(url\()(\"\.\.\/)+/', 'url(\"'.$rBase."../", $content); // url ("../foo.png")
        $content = preg_replace('/(url\()(\.\.\/)+/', 'url('.$rBase."../", $content); // url (../foo.png)

        /*
        $pattern = '#((url\()([^\\|^\/|^\.\.]\S+)(\)))#';

        //Handle image path corrections (order is important)
        $content = preg_replace($pattern,
            '${2}'.$rBase.'/${3}${4}',
            $content, -1, $count
        ); // just filename or subdirs/filename (e.g) url(foo.png),
        // url(foo/foo.png)

        preg_match_all('/(url\()(\.\.\/\S+)(\))/', $content, $matches);

        $urls = $matches[2];
        $reps = array();
        for ($i = 0; $i < count($urls); $i++) {
            $url = $urls[$i];
            if ($reps[$url]) {
                continue;
            }
            $reps[$url] = true;

            $urlFile = realpath($fi['dirname']."/".$url);
            if (empty($urlFile)) {
                continue;
            }

            $absUrl = str_replace($realPath, "", $urlFile);
            if ($absUrl == $urlFile) {
                continue;
            }

            $tmp = str_replace($url, $absUrl, $matches[0][$i]);

            $content = str_replace($matches[0][$i], $tmp, $content);
        }
        /**/
    }

    return $content;
}

function putFileContents($path, $content){
    if (function_exists("file_put_contents"))
        return @file_put_contents($path, $content);

    $fp = @fopen($path, "wb");
    if ($fp){
        fwrite($fp, $content);
        fclose($fp);
    }
}

?>