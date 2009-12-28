<?php

// set up include path so we can find all files, no matter what
$a = explode('/', str_replace('\\', '/', dirname(realpath(__FILE__))));

array_pop($a);
array_pop($a);
array_pop($a);

if (!defined('CWD')){
	define('CWD', join('/', $a));
}

require_once "classes/common.php";

CMSModDevUtils_Output::$instance = new CMSModDevUtils_Output();

require_once "classes/compressor.php";

$options = new CMSModDevUtils_CompressorOptions();

$compressor = new CMSModDevUtils_Compressor($options);
$compressor->build("devutils")

/*

$io = new CMSModJSCompile_CompressorOptions();
$settings = $io->parseArgv(); 

print_r($settings);

flush();

$cpsFile = CWD."/modules/jscompile/lib/compressor/yuicompressor-2.4.2.jar";

$inputPath = CWD."/modules/jscompile/js";
$outputPath = $inputPath."/build";

$inputFile = $inputPath."/example1.js";
$outputFile = $outputPath."/example1-min.js";

$cmd = 'java -jar "'.$cpsFile.'" --charset utf8 -v --type js -o "'.$outputFile.'" "'.$inputFile.'"';
// $cmd = 'java -jar "'.$cpsFile.'" -h';

$outline = array();

$str = exec($cmd, &$outline, &$return_var);

/**/
?>
