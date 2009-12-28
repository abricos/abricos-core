<?php

abstract class CMSModDevUtils_Abstract {
	
	public function log($text){
		if (is_null(CMSModDevUtils_Output::$instance)){
			return;
		}
		CMSModDevUtils_Output::$instance->out($text);
	}
}

class CMSModDevUtils_Output {
	
	/**
	 * 
	 * @var CMSModDevUtils_Output
	 */
	public static $instance = null;
	
	private $options;
	
	private $isConsole = true;
	
	function CMSModDevUtils_Output($options = null){
		if (is_null($options)){
			$options = array("type" => "console");
		}
		$this->options = $options;
		
		$this->isConsole = $options["type"] == "console"; 
	}
	
	public function out($text){
		if ($this->isConsole){
			print($text."\n");
		}else{
			print($text."<br>");
		}
		flush();
	}
}

class CMSModDevUtils_Options {

	protected $values = array();
	
	protected $options;
	protected $valid_booleans = array ('', ' ', 'on', 'y', 'yes', 'true', '1', 'off', 'n', 'no', 'false', '0');
	
	public function get($name){
		return $this->values[$name];
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
	
	protected function pt_parseArgv($setting) {
		$argv = $_SERVER['argv'];

		$valnext = "junk";
		$data = array();
		if(isset($argv) && is_array($argv)) {
			foreach ($argv as $cmd) {
				if ($cmd == '--') { continue; }
				if ($cmd == '-h' || $cmd == '--help') {
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

				foreach( $this->options as $name => $data ) {
					if (!empty($data['tag'])) {
						if (in_array($cmd,$data['tag'])) {
							$valnext = $name;
							break;
						} else {
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
		$this->values = $setting;
	}
}

?>