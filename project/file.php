<?php
/**
* @version $Id: file.php 782 2009-05-04 11:38:08Z AKuzmin $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
//error_reporting(E_ALL & ~E_NOTICE);
error_reporting(E_ERROR);

define('JUST_IN_CASE', 1);

require_once('./global.php');

$p_fileid = Brick::$input->clean_gpc('g', 'i', TYPE_INT);

$fileinfo = $cms->db->query_first("
	SELECT 
		filename, 
		filesize, 
		extension, 
		dateline, 
		SUBSTRING(filedata, 1, 2097152) AS filedata 
	FROM ".$db->prefix."file 
	WHERE fileid = ".$p_fileid. " LIMIT 1");

if (empty($fileinfo)){
	$filedata = base64_decode('R0lGODlhAQABAIAAAMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==');
	$filesize = strlen($filedata);
	header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');             // Date in the past
	header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT'); // always modified
	header('Cache-Control: no-cache, must-revalidate');           // HTTP/1.1
	header('Pragma: no-cache');                                   // HTTP/1.0
	header("Content-disposition: inline; filename=clear.gif");
	header('Content-transfer-encoding: binary');
	header("Content-Length: $filesize");
	header('Content-type: image/gif');
	echo $filedata;
	exit;
}


header('Cache-control: max-age=31536000');
header('Expires: ' . gmdate("D, d M Y H:i:s", TIMENOW + 31536000) . ' GMT');
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $fileinfo['dateline']) . ' GMT');
header('ETag: "' . $fileinfo['fileid'] . '"');

$filename = $fileinfo['filename'];
$extension = $fileinfo['extension'];

if (preg_match('~&#([0-9]+);~', $filename)){
	if (function_exists('iconv')) {
		$filename = @iconv($cms->config['Misc']['charset'], 'UTF-8//IGNORE', $filename);
	}

	$filename = preg_replace(
		'~&#([0-9]+);~e',
		"convert_int_to_utf8('\\1')",
		$filename
	);
	$filename_charset = 'utf-8';
} else {
	$filename_charset = $cms->config['Misc']['charset'];
}


if (is_browser('mozilla')) {
	$filename = "filename*=" . $filename_charset . "''" . rawurlencode($filename);
} else {
	// other browsers seem to want names in UTF-8
	if ($filename_charset != 'utf-8' AND function_exists('iconv')) {
		$filename = @iconv($filename_charset, 'UTF-8//IGNORE', $filename);
	}

	if (is_browser('opera')) {
		// Opera does not support encoded file names
		$filename = 'filename="' . str_replace('"', '', $filename) . '"';
	} else {
		// encode the filename to stay within spec
		$filename = 'filename="' . rawurlencode($filename) . '"';
	}
}

if (in_array($extension, array('jpg', 'jpe', 'jpeg', 'gif', 'png'))) {
	header("Content-disposition: inline; $filename");
	header('Content-transfer-encoding: binary');
} else {
	// force txt files to be downloaded because of a possible XSS issue
	header("Content-disposition: attachment; $filename");
}

header('Content-Length: ' . $fileinfo['filesize']);

$mimetype = $fileinfo['mimetype'];

if (!empty($mimetype)) {
	header($header);
} else {
	header('Content-type: unknown/unknown');
}

/* Обновить счетчик */
$sql = "UPDATE ".$db->prefix."file SET counter = counter + 1 where fileid = ".$p_fileid." LIMIT 1";
$cms->db->query_write($sql);

$count = 1;
while (!empty($fileinfo['filedata']) AND connection_status() == 0) {
	echo $fileinfo['filedata'];
	flush();

	if (strlen($fileinfo['filedata']) == 2097152) {

		$startat = (2097152 * $count) + 1;
		$fileinfo = $db->query_first("
			SELECT fileid, SUBSTRING(filedata, $startat, 2097152) AS filedata
				FROM ".$db->prefix."file
				WHERE fileid = $fileinfo[fileid]
			");
			$count++;
		} else {
			$fileinfo['filedata'] = '';
		}
	}

$cms->db->close();

?>