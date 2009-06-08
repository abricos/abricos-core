<?php
global $cms;

$mod = new CMSModuleAjax();
$cms->modules->Register($mod);

class CMSModuleAjax extends CMSModule{
	function __construct(){
		$this->version = "1.0.0";
		$this->name = "ajax";
		$this->takelink = "ajax";
	}
}
?>