<?php
/**
 * @package Abricos
 * @link http://abricos.org
 * @copyright Copyright (C) 2008-2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

function globa($pattern, $flag = 0){
	$res = glob($pattern, $flag);
	return $res ? $res : array();
}

function bkstr($value){
	return addslashes($value);
}

function bkint($value){
	return intval($value);
}
function bkdouble($value){
	return doubleval($value);
}

function json_encode_ext($arr){
	return Abricos::GetJSONManager()->encode($arr);
}

if (!function_exists('json_decode')){
	function json_decode($str){
		return Abricos::GetJSONManager()->decode($str);
	}
}

if ( ! function_exists('json_encode')){
	function json_encode($arr){
		return Abricos::GetJSONManager()->encode($arr);
	}
}

function verify_link(&$link) {
	if (preg_match('#^www\.#si', $link)) {
		$link = 'http://' . $link;
		return true;
	} else if (!preg_match('#^[a-z0-9]+://#si', $link)) {
		// link doesn't match the http://-style format in the beginning -- possible attempted exploit
		return false;
	} else {
		return true;
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

function go_headers_sent(&$filename, &$linenum){
	return headers_sent($filename, $linenum);
}
/**/
function cms_setcookie($name, $value = '', $permanent = true, $httponly = false){

	if ($permanent)	{
		$expire = TIMENOW + 60 * 60 * 24 * 365;
	} else {
		$expire = 0;
	}

	// IE for Mac doesn't support httponly
	$httponly = (($httponly AND (is_browser('ie') AND is_browser('mac'))) ? false : $httponly);

	// check for SSL
	$secure = (($_SERVER['HTTPS'] == 'on' OR $_SERVER['HTTPS'] == '1') ? true : false);

	$filename = 'N/A';
	$linenum = 0;

	if (!go_headers_sent($filename, $linenum)) {

		if ($value === '' OR $value === false) {
			if ($_SERVER['PATH_INFO'] OR $_ENV['PATH_INFO']) {
				$scriptpath = $_SERVER['PATH_INFO'] ? $_SERVER['PATH_INFO'] : $_ENV['PATH_INFO'];
			} else if ($_SERVER['REDIRECT_URL'] OR $_ENV['REDIRECT_URL'])  {
				$scriptpath = $_SERVER['REDIRECT_URL'] ? $_SERVER['REDIRECT_URL'] : $_ENV['REDIRECT_URL'];
			} else {
				$scriptpath = $_SERVER['PHP_SELF'] ? $_SERVER['PHP_SELF'] : $_ENV['PHP_SELF'];
			}

			$dirarray = explode('/', preg_replace('#/+$#', '', $scriptpath));

			$alldirs = '';
			$havepath = false;
			if (!defined('SKIP_AGGRESSIVE_LOGOUT')) {
				foreach ($dirarray AS $thisdir) {
					$alldirs .= "$thisdir";

					if ($alldirs == "/" OR "$alldirs/" == "/") {
						$havepath = true;
					}

					if (!empty($thisdir)) {
						// try unsetting without the / at the end
						exec_go_setcookie($name, $value, $expire, $alldirs, "", $secure, $httponly);
					}

					$alldirs .= "/";
					exec_go_setcookie($name, $value, $expire, $alldirs, "", $secure, $httponly);
				}
			}

			if ($havepath == false) {
				exec_go_setcookie($name, $value, $expire, "/", "", $secure, $httponly);
			}
		} else {
			exec_go_setcookie($name, $value, $expire, "/", "", $secure, $httponly);
		}
	}
}/**/

function exec_go_setcookie($name, $value, $expires, $path = '', $domain = '', $secure = false, $httponly = false) {
	if ($httponly AND $value) {
		// cookie names and values may not contain any of the characters listed
		foreach (array(",", ";", " ", "\t", "\r", "\n", "\013", "\014") AS $bad_char) {
			if (strpos($name, $bad_char) !== false OR strpos($value, $bad_char) !== false) {
				return false;
			}
		}

		// name and value
		$cookie = "Set-Cookie: $name=" . urlencode($value);

		// expiry
		$cookie .= ($expires > 0 ? '; expires=' . gmdate("D, d-M-Y H:i:s T", $expires) : '');

		// path
		$cookie .= ($path ? "; path=$path" : '');

		// domain
		$cookie .= ($domain ? "; domain=$domain" : '');

		// secure
		$cookie .= ($secure ? '; secure' : '');

		// httponly
		$cookie .= ($httponly ? '; httponly' : '');

		header($cookie, false);
		return true;
	} else {
		return setcookie($name, $value, $expires, $path, $domain, $secure);
	}
}

function exec_headers(){
	header("Expires: Mon, 26 Jul 2005 15:00:00 GMT");
	header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
	header("Cache-Control: no-store, no-cache, must-revalidate");
	header("Cache-Control: post-check=0, pre-check=0", false);
	header("Content-Type: text/html; charset=utf-8");
	header("Pragma: no-cache");
}

if (!function_exists('file_get_contents')) {
	function file_get_contents($filename) {
		$handle = @fopen($filename, 'rb');
		if ($handle) {
			do {
				$data = fread($handle, 8192);
				if (strlen($data) == 0) {
					break;
				}
				$contents .= $data;
			} while (true);

			@fclose($handle);
			return $contents;
		}
		return false;
	}
}

function cut_www($host){
	$pos = strpos($host, "www.");
	if ($pos === false)
		return $host;
	if ($pos == 0){
		$check = explode(".",$host);
		if (count($check)>2){
			$host = substr($host, 4);
		}
	}
	return $host;
}

function cmsrand($min, $max, $seed = -1) {
	if (!defined('RAND_SEEDED')) {
		if ($seed == -1) {
			$seed = (double) microtime() * 1000000;
		}
		mt_srand($seed);
		define('RAND_SEEDED', true);
	}
	return mt_rand($min, $max);
}

function htmlspecialchars_uni($text, $entities = true){
	return str_replace(
		// replace special html characters
		array('<', '>', '"'),
		array('&lt;', '&gt;', '&quot;'),
		preg_replace(
			// translates all non-unicode entities
			'/&(?!' . ($entities ? '#[0-9]+' : '(#[0-9]+|[a-z]+)') . ';)/si',
			'&amp;',
			$text
		)
	);
}

function rusMonth($dt, $socr = false){
	if ($socr){
		$rusdtph = array(
			"m1"=>"Янв",
			"m2"=>"Фев",
			"m3"=>"Мар",
			"m4"=>"Апр",
			"m5"=>"Май",
			"m6"=>"Июн",
			"m7"=>"Июл",
			"m8"=>"Авг",
			"m9"=>"Сен",
			"m10"=>"Окт",
			"m11"=>"Ноя",
			"m12"=>"Дек"
		);
	}else{
		$rusdtph = array(
			"m1"=>"Января",
			"m2"=>"Февраля",
			"m3"=>"Марта",
			"m4"=>"Апреля",
			"m5"=>"Мая",
			"m6"=>"Июня",
			"m7"=>"Июля",
			"m8"=>"Августа",
			"m9"=>"Сентября",
			"m10"=>"Октября",
			"m11"=>"Ноября",
			"m12"=>"Декабря"
		);
	}
	return $rusdtph["m".intval(date("m", $dt))];
}

function rusDateTime($dt){
	return date("d", $dt)." ".
			rusMonth($dt)." ".
			date("Y", $dt).", ".
			date("H:i", $dt); 
}

function translateruen($p_text){
	if (empty($p_text)){
		return "";
	}
	
	$s = array(
		"а","б","в","г","д","е","ё","ж","з","и","й",
		"к","л","м","н","о","п","р","с","т","у","ф",
		"х","ц","ч","ш","щ","ъ","ы","ь","э","ю","я",
		"А","Б","В","Г","Д","Е","Ё","Ж","З","И","Й",
		"К","Л","М","Н","О","П","Р","С","Т","У","Ф",
		"Х","Ц","Ч","Ш","Щ","Ъ","Ы","Ь","Э","Ю","Я"," ","-"
	);
	
	$r = array(
		"a","b","v","g","d","e","yo","zh","z","i","j",
		"k","l","m","n","o","p","r","s","t","u","f",
		"x","c","ch","sh","shh","","y","","e","yu","ya",
		"a","b","v","g","d","e","yo","zh","z","i","j",
		"k","l","m","n","o","p","r","s","t","u","f",
		"x","c","ch","sh","shh","","y","","e","yu","ya","_","-"
	);
	
	$t = str_replace($s, $r, $p_text);
	$t = strtolower($t);
	
	$phrasa = str_split($t);
	
	$t = "";
	foreach($phrasa as $v){
		$asc = ord($v);
		if (
			(97 <= $asc && $asc <= 122) || 
			(48 <= $asc && $asc <= 57) ||
			$asc == 95){
			$t .= $v;
		}
	}
	
	return $t;
}


?>