<?php

class CMSModDevUtils_Compressor extends CMSModDevUtils_Abstract{

	/**
	 * Опции
	 * @var array 
	 */
	public $options;
	
	public function CMSModDevUtils_Compressor($options){
		$this->options = $options;
		
		$this->log("Compressor started");
	}
	
	public function build($modname){
		$this->log("Module '".$modname."' processing...");
	}
}

class CMSModDevUtils_CompressModule {
	
	public function CMSModDevUtils_CompressModule($modname){
		print ("Processing module: ".$modname);
	}
}

class CMSModDevUtils_CompressorOptions {

	var $jsCompileOptions;
	var $ignore;
	var $valid_booleans = array ('', ' ', 'on', 'y', 'yes', 'true', '1', 'off', 'n', 'no', 'false', '0');

	function CMSModDevUtils_CompressorOptions() {
		$this->jsCompileOptions['target']['tag'] = array("-t", "--target");
		$this->jsCompileOptions['target']['desc'] = "path where to save the generated files";
		$this->jsCompileOptions['target']['type'] = "path";

		$this->jsCompileOptions['quiet']['tag'] = array("-q", "--quiet");
		$this->jsCompileOptions['quiet']['desc'] = "do not display parsing/conversion messages.  Useful for cron jobs on/off default off";
		$this->jsCompileOptions['quiet']['type'] = "set";
		$this->jsCompileOptions['quiet']['validvalues'] = $this->valid_booleans;

		$this->jsCompileOptions['help']['tag'] = array("-h", "--help");
		$this->jsCompileOptions['help']['desc'] = "    show this help message";
	}


	function displayHelpMsg() {
		unset($ret);
		$ret = "\n";
		foreach($this->jsCompileOptions as $data)
		{
			unset($tag);
			$tag = "";
			if (isset($data['tag']))
			{
				if (is_array($data['tag'])) {
					foreach($data['tag'] as $param) {
						$tag .= "$param    ";
					}
				}
				$taglen = 34;
				$outputwidth = 79;
				$tagspace = str_repeat(" ",$taglen);
				$tmp = "  ".trim($tag).$tagspace;
				$tmp = substr($tmp,0,$taglen);
				$d = wordwrap(ltrim($data['desc']),($outputwidth-$taglen));
				$dt = explode("\n",$d);
				$dt[0] = $tmp .$dt[0];
				for($i=1;$i<count($dt);$i++)
				{
					$dt[$i] = $tagspace.$dt[$i];
				}
				$ret .= implode("\n",$dt)."\n\n";

			}
		}
		$ret .= "\n".wordwrap($data['message'],$outputwidth)."\n";
		return $ret;
	}

	public function parseArgv() {
		$argv = $_SERVER['argv'];

		// defaults for setting
		$setting['hidden'] = "off";

		$valnext = "junk";
		$data = array();
		if(isset($argv) && is_array($argv))
		{
			foreach ($argv as $cmd)
			{
				if ($cmd == '--') {
					continue;
				}
				if ($cmd == '-h' || $cmd == '--help')
				{
					echo $this->displayHelpMsg();
					die();
				}

				// at first, set the arg value as if we
				// already know it's formatted normally, e.g.
				//    -q on
				$setting[$valnext] = $cmd;

				if (isset($data['type']) && $data['type'] == 'set') {

					if ($valnext !== 'junk' && strpos(trim($cmd),'-') === 0) {
						// if valnext isn't 'junk' (i.e it was an arg option)
						// then the first arg needs an implicit "" as its value, e.g.
						//     ... -q -pp ...  ===>  ... -q '' -pp ...
						$setting[$valnext] = '';

					} else if (!in_array(strtolower($cmd), $data['validvalues'], true)) {
						// the arg value is not a valid value
						addErrorDie(PDERROR_INVALID_VALUES, $valnext, $cmd,
                            '(' . implode(', ', $data['validvalues']) . ')');
					}
				}

				foreach( $this->jsCompileOptions as $name => $data )
				{
					if (!empty($data['tag']))
					{
						if (in_array($cmd,$data['tag']))
						{
							$valnext = $name;
							break;
						}
						else
						{
							$valnext = "junk";
						}
					}
				}

				if ($valnext == 'junk' && (strpos(trim($cmd),'-') === 0)) {
					// this indicates the last arg of the command
					// is an arg option (-) that was preceded by unrecognized "junk"
					// addErrorDie(PDERROR_UNKNOWN_COMMANDLINE,$cmd);

				} else if ($valnext != 'junk' && (strpos(trim($cmd),'-') === 0)) {
					// this indicates the last arg of the command
					// is an arg option (-) without an arg value

					// add an empty arg "value" for this arg "option"
					$setting[$valnext] = '';
				}
			}
		} else
		{
			echo "Please use php-cli.exe in windows, or set register_argc_argv On";
			die;
		}
		/* $setting will always have at least 3 elements
		 [hidden] => off
		 [ignoresymlinks] => 'off'
		 [template] => templates/default
		 */
		/*
		if (count($setting) < 4) {
			echo $this->displayhelpMsg();
			die();
		}
		/**/
		return $setting;
	}
}
?>
