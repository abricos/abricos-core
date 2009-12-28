<?php

class CMSModDevUtils_JSDoc extends CMSModDevUtils_Abstract{

	/**
	 * Установки
	 * @var CMSModDevUtils_JSDocOptions 
	 */
	public $options;
	
	public function CMSModDevUtils_JSDoc($options){
		$this->options = $options;
		
		$this->log("JSDoc started");
	}
	
	private function createDir($dir){
		if (!is_dir($dir) && !@mkdir($dir, 0777, true)){
			$this->log("Error: Can`t create directory ".$dir);
			die();
		}
	}
	
	function removeDir($current_dir) {

		if($dir = @opendir($current_dir)) {
			while (($f = readdir($dir)) !== false) {
				if($f > '0' && filetype($current_dir.$f) == "file") {
					unlink($current_dir.$f);
				} elseif($f > '0' and filetype($current_dir.$f) == "dir") {
					$this->removeDir($current_dir.$f."\\");
				}
			}
			closedir($dir);
			rmdir($current_dir);
		}
	}

	public function build(){

		$buildsrcDir = $this->options->get('buildsrc');
		$this->removeDir($buildsrcDir."/");
		$this->createDir($buildsrcDir);
		
		$modspath = CWD."/modules";
		$dir = dir($modspath);
		
		// Создание структуры файлов
		$this->log("Structure creation in a folder ".$buildsrc);
		while (false !== ($entry = $dir->read())) {
			if ($entry == "." || $entry == ".." || empty($entry) || $entry == ".svn"){ continue; }
			
			if ($entry != "user" 
				&& $entry != "sys" 
				&& $entry != "blog"
				&& $entry != "tinymce"
				&& $entry != "comment"
				&& $entry != "news"
				&& $entry != "feedback"
				&& $entry != "webos"
				){continue;}
			
			$jspath = $modspath."/".$entry."/js";
			$jsfiles = glob($jspath."/*.js");
			if (count($jsfiles) == 0){ continue; }
			
			$this->createDir($buildsrcDir."/".$entry);
			
			foreach ($jsfiles as $jsfile){
				$filename = basename($jsfile);
				copy($jsfile, $buildsrcDir."/".$entry."/".$filename); 
			}
		}
		$dir->close();
		
		$cmd = CWD.'/modules/devutils/lib/yuidoc/bin/yuidoc.py "'.$buildsrcDir.'" -p "'.
			$this->options->get("parseroutdir").'" -o "'.
			$this->options->get("outputdir").'" -t "'.
			$this->options->get("template").'" -v "1.0.0" -Y "3"';
		
		$this->log($cmd);
		$str = exec($cmd, &$outline, &$return_var);
	}
}

class CMSModDevUtils_JSDocOptions extends CMSModDevUtils_Options {

	function CMSModDevUtils_JSDocOptions() {
		$this->options['buildsrc']['tag'] = array("-p", "--buildsrc");
		$this->options['buildsrc']['desc'] = "";
		$this->options['buildsrc']['type'] = "path";
		
		$this->options['parseroutdir']['tag'] = array("-p", "--parseroutdir");
		$this->options['parseroutdir']['desc'] = "the location to output the parser data. This output is a file containing a json string, and copies of the parsed files.";
		$this->options['parseroutdir']['type'] = "path";

		$this->options['outputdir']['tag'] = array("-o", "--outputdir");
		$this->options['outputdir']['desc'] = "the directory to put the html file outputted by the generator.";
		$this->options['outputdir']['type'] = "path";

		$this->options['template']['tag'] = array("-t", "--template");
		$this->options['template']['desc'] = "the location of the template files.  Any subdirectories here will be copied verbatim to the destination directory.";
		$this->options['template']['type'] = "path";

		$this->options['quiet']['tag'] = array("-q", "--quiet");
		$this->options['quiet']['desc'] = "do not display parsing/conversion messages.  Useful for cron jobs on/off default off";
		$this->options['quiet']['type'] = "set";
		$this->options['quiet']['validvalues'] = $this->valid_booleans;
		
        $this->phpDocOptions['hidden']['tag'] = array("-dh", "--hidden");
        $this->phpDocOptions['hidden']['desc'] = "set equal to on (-dh on) to descend into hidden directories (directories starting with '.'), default is off";
        $this->phpDocOptions['hidden']['type'] = "set";
        $this->phpDocOptions['hidden']['validvalues'] = $this->valid_booleans;

		$this->options['help']['tag'] = array("-h", "--help");
		$this->options['help']['desc'] = "    show this help message";
		
		// build default settings 
		$baseDir = CWD."/modules/devutils";
		$workerDir = $baseDir ."/worker/jsdoc";
		
		$setting['parseroutdir'] = $workerDir."/parser";
		$setting['outputdir'] = $workerDir."/docs";
		$setting['buildsrc'] = $workerDir."/buildsrc";
		
		$setting['template'] = $baseDir."/lib/yuidoc/template/trac";
		$setting['hidden'] = "off";
		$this->pt_parseArgv($setting);
	}
}
?>