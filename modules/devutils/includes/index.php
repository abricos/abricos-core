<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage News
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$brick = Brick::$builder->brick;

$cpsFile = CWD."/modules/jscompile/lib/compressor/yuicompressor-2.4.2.jar";

$inputPath = CWD."/modules/jscompile/js";
$outputPath = $inputPath."/build";

$inputFile = $inputPath."/example1.js";
$outputFile = $outputPath."/example1-min.js";

$cmd = 'java -jar "'.$cpsFile.'" --charset utf8 -v --type js -o "'.$outputFile.'" "'.$inputFile.'"';
// $cmd = 'java -jar "'.$cpsFile.'" -h';
/**/
$outline = array();
$str = exec($cmd, &$outline);

$brick->param->var['result'] = print_r($cmd, true)."\n".print_r($outline, true);
/**/

// $brick->param->var['result'] = system($cmd);


?>