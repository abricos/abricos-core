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

require_once "classes/jsdocumentor.php";

$options = new CMSModDevUtils_JSDocOptions();

$compressor = new CMSModDevUtils_JSDoc($options);
$compressor->build();

?>
