<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

// Set the error reporting to minimal.
@error_reporting(E_ERROR | E_WARNING | E_PARSE);

// example
// http://www.cmsbrick.ru/gzip.php?file=js/yui/[версия yui]/yuiloader/yuiloader-min.js

// Get input
$files = explode(',', getParam("file", ""));
$basedir = getParam("base", "");
$version = getParam("version", "");
$lang = getParam("lang", "ru");
$libType = getParam("type", "");
$templateName = getParam("tt", "default");
$module = getParam("module", "");

$diskCache = getParam("diskcache", "true") == "true";
$compress = getParam("compress", "true") == "true";
$expiresOffset = 3600 * 24 * 30; // Cache for 30 days in browser cache

$cacheLimitCount = 1024; // Cache directory: file count  

$encodings = array();
// $supportsGzip = false;
$enc = "";
$cacheKey = "";
$realPath = realpath(".");
$cachePath = $realPath."/temp";
$diskCacheFileKey = "";

$headContentType = "Content-type: text/javascript; charset=utf-8";

if ($libType == 'sys'){
	$files = array('/modules/sys/js/brick.js');
}else if ($libType == 'mod'){
	$newFiles = array();
	foreach($files as $file){
		if ($module == "_template"){
			array_push($newFiles, '/tt/'.$templateName.'/jsmod/'.$file);
		}else{
			array_push($newFiles, '/modules/'.$module.'/js/'.$file);
		}
	}
	$files = $newFiles;
}

// if (is_browser('ie')){ $compress = false; }
if ($compress){
	if (isset($_SERVER['HTTP_ACCEPT_ENCODING']))
		$encodings = explode(',', strtolower(preg_replace("/\s+/", "", $_SERVER['HTTP_ACCEPT_ENCODING'])));
	
	if (
		(in_array('gzip', $encodings) ||
			 in_array('x-gzip', $encodings) || 
			 isset($_SERVER['---------------'])
		) 
		&& 
		function_exists('gzencode')) 
	{
		// function_exists('ob_gzhandler') && !ini_get('zlib.output_compression')) 
		
		$enc = in_array('x-gzip', $encodings) ? "x-gzip" : "gzip";
	}else {
		$compress = false;
	}
}

// Setup cache info
if ($diskCache) {
	if (!$cachePath){
		header($headContentType);
		die("alert('Real path failed.');");
	}
	
	$key = "";
	foreach($files as $file){
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

	$last_modified = gmdate('D, d M Y H:i:s', filemtime($cacheFile)) .' GMT'; 
	
	if ($if_modified_since && $if_none_match
      && $if_none_match == $etag // etag must match
      && $if_modified_since == $last_modified) {  // if-modified-since must match
    header('HTTP/1.1 304 Not Modified');
    
    // All 304 responses must send an etag if the 200 response for the same object contained an etag
    header("Etag: $etag");
    return;
  }
}

header($headContentType);
header("Vary: Accept-Encoding");  // Handle proxies

header("ETag: $etag");
header("Expires: " . gmdate("D, d M Y H:i:s", time() + $expiresOffset) . " GMT");

// Use cached file disk cache
if ($cacheFileExists) {
	header("Last-Modified: $last_modified");
	
	if ($compress)
		header("Content-Encoding: " . $enc);

	header("Content-Length: " . filesize($cacheFile));
		
	echo getFileContents($cacheFile);
	die();
}

$content = "";
foreach ($files as $file){
	$content .= getFileContents($realPath."/".$basedir."/". $file);
}

if ($libType == 'mod' || $libType == 'sys'){
	// 	Append language files
	foreach ($files as $file){
		$langFile = createLangFile("/".$basedir."/".$file, $lang);
		if (file_exists($realPath.$langFile)){
			$content .= "(function(){";
			$content .= getFileContents($realPath.$langFile);
			$content .= "})();";
		}
	}

	// Convert and Append template files
	foreach ($files as $file){
		$tempFile = createTemplateFile($realPath."/".$basedir."/".$file);
		if (file_exists($tempFile)){
			
			// если шаблон перегружен, значит чтение перегруженого шаблона
			$bname = basename($file, ".htm");
			$override = createTemplateFile($realPath."/tt/".$templateName."/override/".$module."/js/".$bname);
			$content .= "(function(){var mt=Brick.util.Template; if(typeof mt['".$module."']=='undefined'){mt['".$module."']={}};var t=mt['".$module."'];";
			if (file_exists($override)){
				$content .= convertTemplateToJS($override);
			}else{
				$content .= convertTemplateToJS($tempFile);
			}
			$content .= "})();";
		}
	}
	// Convert and Append css file
	foreach ($files as $file){
		$cssFile = createCssFile($realPath."/".$basedir."/".$file);
		if (file_exists($cssFile)){
			$content .= "
(function(){
	var mcss=Brick.util.CSS; 
	if(typeof mcss['".$module."']=='undefined'){
		mcss['".$module."']={};
	};
	var css=mcss['".$module."'];
";
			$content .= convertCssToJS($cssFile);
			$content .= "
})();
";
		}
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
	while (false !== ($entry = $dir->read())) {
		
		// Добавление js модулей шаблона
		if ($entry == "."){
			$entry = "_template";
		}
		
		if ($entry == "." || $entry == ".." || empty($entry)){ continue; }
		
		if ($entry == "_template"){
			$jsdir = $realPath."/tt/".$templateName."/jsmod";
		}else{
			$jsdir = $realPath."/modules/".$entry."/js";
		}
		
		$jsfiles = glob($jsdir."/*.js");
		if (empty($jsfiles)){ continue; 	}
		$content .="\nv=[];\n"; 
		
		// чтение всех js модулей в модуле
		foreach ($jsfiles as $jsfile){
			$bname = basename($jsfile);
			$key = filemtime($jsfile)+filesize($jsfile);
			// language file
			$langFile = createLangFile($jsfile, $lang);
			if (file_exists($langFile))
				$key += filemtime($langFile)+filesize($langFile);

			// шаблон js модуля
			$tmpFile = createTemplateFile($jsfile);
			if (file_exists($tmpFile)){
				// если шаблон перегружен, значит чтение версии перегруженого шаблона
				$override = createTemplateFile($realPath."/tt/".$templateName."/override/".$entry."/js/".basename($tmpFile));
				if (file_exists($override)){
					$key += filemtime($override)+filesize($override);
				}else{
					$key += filemtime($tmpFile)+filesize($tmpFile);
				}
			}

			// css file
			$tmpFile = createCssFile($jsfile);
			if (file_exists($tmpFile))
				$key += filemtime($tmpFile)+filesize($tmpFile);
				
			$content .= "v[v.length]={f:'".$bname."', k:'".md5($key)."'};\n";
		}
		$content .= "m['".$entry."']=v;\n";
	}
	$content .= "
Brick.Modules = m;
})();";
}

// Generate GZIP'd content
if ($compress) {
	header("Content-Encoding: " . $enc);
	$cacheData = gzencode($content, 9, FORCE_GZIP);
} else
	$cacheData = $content;

// Write gz file
if ($diskCache && $cacheKey != ""){
	$chFiles = glob($cachePath."/*");
	if (count($chFiles) >= $cacheLimitCount){
		foreach ($chFiles as $rfile){
			@unlink($rfile);
		}
	}else{
		$chFiles = glob($cachePath."/".$diskCacheFileKey."*");
		foreach ($chFiles as $rfile){
			if (!strpos($rfile, $cacheFileName))
				@unlink($rfile);
		}
	}
	putFileContents($cacheFile, $cacheData);
}

header("Content-Length: " . strlen($cacheData));

// Stream to client
echo $cacheData;

/* * * * * * * * * * * * * * * * Functions * * * * * * * * * * * * * * * * */

function createCssFile($file){
	return str_replace('.js', '.css', $file);
}

function convertCssToJS($file){
	$str = getFileContents($file);
	$str = preg_replace("/[\n\r\t]+/", "", $str);
	$str = addslashes($str);
	
	$bname = basename($file, ".css");
	$js = "css['".$bname."']='".$str."';";
	return $js;
}

function createTemplateFile($file){return str_replace('.js', '.htm', $file);}

function convertTemplateToJS($file){
	$str = getFileContents($file);
	$str = preg_replace("/[\n\r\t]+/", "", $str);
	$str = preg_replace("/>[\s]+</", "><", $str);
	
	$pattern = '/<!--{([a-zA-Z0-9_ ]+)}-->/siU';
	$mathes = array();
	preg_match_all($pattern, $str, $mathes, PREG_SET_ORDER);
	$ret = $str;

	$bname = basename($file, ".htm");
	$js = "t['".$bname."']={};";
	
	for ($i=count($mathes)-1;$i>=0;$i--){
		$varr = $mathes[$i][0];
		$var = trim($mathes[$i][1]);

		$pos = strpos($ret, $varr);
		$s = substr($ret, $pos);
		$ret = substr($ret, 0, strlen($ret)-strlen($s));
		
		$s = substr($s, strlen($varr));
		
		$js .= "t['".$bname."']['".$var."']='".addslashes($s)."';";
	}
	
	return $js;
}

function createLangFile($file, $lang){
	$pi = pathinfo($file);
	return $pi['dirname']."/langs/".str_replace('.js', '_'.$lang.'.js', $pi['basename']);
}

function getParam($name, $def = false) {
	if (!isset($_GET[$name]))
		return $def;
		
	$ret = str_replace("\\", "/", $_GET[$name]); 
	return preg_replace("/[^0-9a-z\-_,\/\.]+/i", "", $ret); 
}

function getFileContents($path) {
	$path = realpath($path);

	if (!$path || !@is_file($path))
		return "";

	if (function_exists("file_get_contents"))
		return @file_get_contents($path);

	$content = "";
	$fp = @fopen($path, "r");
	if (!$fp)
		return "";

	while (!feof($fp))
		$content .= fgets($fp);

	fclose($fp);

	return $content;
}

function putFileContents($path, $content) {
	if (function_exists("file_put_contents"))
		return @file_put_contents($path, $content);

	$fp = @fopen($path, "wb");
	if ($fp) {
		fwrite($fp, $content);
		fclose($fp);
	}
}


function is_browser($browser, $version = 0){
	static $is;
	if (!is_array($is))	{
		$useragent = strtolower($_SERVER['HTTP_USER_AGENT']);
		$regs = array();
		$is = array(
			'opera' => 0,
			'ie' => 0,
			'mozilla' => 0,
			'firebird' => 0,
			'firefox' => 0,
			'camino' => 0,
			'konqueror' => 0,
			'safari' => 0,
			'webkit' => 0,
			'webtv' => 0,
			'netscape' => 0,
			'mac' => 0
		);

		// detect opera
			# Opera/7.11 (Windows NT 5.1; U) [en]
			# Mozilla/4.0 (compatible; MSIE 6.0; MSIE 5.5; Windows NT 5.0) Opera 7.02 Bork-edition [en]
			# Mozilla/4.0 (compatible; MSIE 6.0; MSIE 5.5; Windows NT 4.0) Opera 7.0 [en]
			# Mozilla/4.0 (compatible; MSIE 5.0; Windows 2000) Opera 6.0 [en]
			# Mozilla/4.0 (compatible; MSIE 5.0; Mac_PowerPC) Opera 5.0 [en]
		if (strpos($useragent, 'opera') !== false) {
			preg_match('#opera(/| )([0-9\.]+)#', $useragent, $regs);
			$is['opera'] = $regs[2];
		}

		// detect internet explorer
			# Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; Q312461)
			# Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; .NET CLR 1.0.3705)
			# Mozilla/4.0 (compatible; MSIE 5.22; Mac_PowerPC)
			# Mozilla/4.0 (compatible; MSIE 5.0; Mac_PowerPC; e504460WanadooNL)
		if (strpos($useragent, 'msie ') !== false AND !$is['opera'])		{
			preg_match('#msie ([0-9\.]+)#', $useragent, $regs);
			$is['ie'] = $regs[1];
		}

		// detect macintosh
		if (strpos($useragent, 'mac') !== false) {
			$is['mac'] = 1;
		}

		// detect safari
			# Mozilla/5.0 (Macintosh; U; PPC Mac OS X; en-us) AppleWebKit/74 (KHTML, like Gecko) Safari/74
			# Mozilla/5.0 (Macintosh; U; PPC Mac OS X; en) AppleWebKit/51 (like Gecko) Safari/51
		if (strpos($useragent, 'applewebkit') !== false AND $is['mac']) {
			preg_match('#applewebkit/(\d+)#', $useragent, $regs);
			$is['webkit'] = $regs[1];

			if (strpos($useragent, 'safari') !== false) {
				preg_match('#safari/([0-9\.]+)#', $useragent, $regs);
				$is['safari'] = $regs[1];
			}
		}

		// detect konqueror
			# Mozilla/5.0 (compatible; Konqueror/3.1; Linux; X11; i686)
			# Mozilla/5.0 (compatible; Konqueror/3.1; Linux 2.4.19-32mdkenterprise; X11; i686; ar, en_US)
			# Mozilla/5.0 (compatible; Konqueror/2.1.1; X11)
		if (strpos($useragent, 'konqueror') !== false) {
			preg_match('#konqueror/([0-9\.-]+)#', $useragent, $regs);
			$is['konqueror'] = $regs[1];
		}

		// detect mozilla
			# Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.4b) Gecko/20030504 Mozilla
			# Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.2a) Gecko/20020910
			# Mozilla/5.0 (X11; U; Linux 2.4.3-20mdk i586; en-US; rv:0.9.1) Gecko/20010611
		if (strpos($useragent, 'gecko') !== false AND !$is['safari'] AND !$is['konqueror']) {
			preg_match('#gecko/(\d+)#', $useragent, $regs);
			$is['mozilla'] = $regs[1];

			// detect firebird / firefox
				# Mozilla/5.0 (Windows; U; WinNT4.0; en-US; rv:1.3a) Gecko/20021207 Phoenix/0.5
				# Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.4b) Gecko/20030516 Mozilla Firebird/0.6
				# Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.4a) Gecko/20030423 Firebird Browser/0.6
				# Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.6) Gecko/20040206 Firefox/0.8
			if (strpos($useragent, 'firefox') !== false OR strpos($useragent, 'firebird') !== false OR strpos($useragent, 'phoenix') !== false) {
				preg_match('#(phoenix|firebird|firefox)( browser)?/([0-9\.]+)#', $useragent, $regs);
				$is['firebird'] = $regs[3];
				if ($regs[1] == 'firefox') {
					$is['firefox'] = $regs[3];
				}
			}

			// detect camino
				# Mozilla/5.0 (Macintosh; U; PPC Mac OS X; en-US; rv:1.0.1) Gecko/20021104 Chimera/0.6
			if (strpos($useragent, 'chimera') !== false OR strpos($useragent, 'camino') !== false) {
				preg_match('#(chimera|camino)/([0-9\.]+)#', $useragent, $regs);
				$is['camino'] = $regs[2];
			}
		}

		// detect web tv
		if (strpos($useragent, 'webtv') !== false) {
			preg_match('#webtv/([0-9\.]+)#', $useragent, $regs);
			$is['webtv'] = $regs[1];
		}

		// detect pre-gecko netscape
		if (preg_match('#mozilla/([1-4]{1})\.([0-9]{2}|[1-8]{1})#', $useragent, $regs)){
			$is['netscape'] = "$regs[1].$regs[2]";
		}
	}

	// sanitize the incoming browser name
	$browser = strtolower($browser);
	if (substr($browser, 0, 3) == 'is_') {
		$browser = substr($browser, 3);
	}

	// return the version number of the detected browser if it is the same as $browser
	if ($is["$browser"]) {
		// $version was specified - only return version number if detected version is >= to specified $version
		if ($version) {
			if ($is["$browser"] >= $version) {
				return $is["$browser"];
			}
		}else{
			return $is["$browser"];
		}
	}

	// if we got this far, we are not the specified browser, or the version number is too low
	return 0;
}

?>