<?php
/**
* @version $Id: cmsbaseclass.php 343 2008-09-24 14:04:01Z AKuzmin $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

abstract class CMSBaseClass{
	
	/*
	function __construct(){
		global $cmsbaseclasscounter;

		echo(get_class($this).$cmsbaseclasscounter++."<br>");
	}/**/
	
	function GetClassId(){
		return $this->classid;
	}
	
	
	private function IsDebug(){
		if (!defined("DEBUG") || !DEBUG){
			return false;
		}
		return true;
	}
	
	private function GetDebugLine(){
		// return "<b>".__FILE__."</b> строка <b>".__LINE__."</b><br>";
		return "";
	}
	
	protected function GetDebugTrace(){
		$a = debug_backtrace();
		$ret = "";
		
		$i = 0;
		foreach ($a as $value){
			if ($i++ < 1){
				continue;
			}
			
			$class = get_class($value['object']);
			$type = $value['type'];
			$func = $value['function'];
			$file = $value['file'];
			$line = $value['line'];
			
			$prms = $value['args'];
			$saargs = array();
			foreach ($prms as &$prm){
				
				$t = gettype($prm);
				$s = "";
				switch ($t){
					case 'string':
						$s =  htmlspecialchars(substr(trim($prm), 0, 30));
						break;
					default:
						$s = $t;
						
				}
				
				array_push($saargs, "'".$s."'");
			}
			$sargs = implode(',', $saargs);
			
			$ret .= "$class$type$func($sargs): $file on line <b>$line</b><br>";
			//break;
		}
		//echo($ret);
		return $ret;
		//exit;
	}
	
	function __call($name, $args){
		if (!$this->IsDebug()){
			return;
		}
		
		echo(
			"<b>Предупреждение!</b> ".
			"Попытка вызвать не реализованный метод <b>$name</b> в классе <b>".get_class($this)."</b>:<br>".
			$this->GetDebugLine());
		$result = print_r($args);
		echo('Параметры: <br>'.str_replace('\n', '<br>', $result));
		echo($this->GetDebugTrace());
	}
	
	function __set($name, $val){
		if (!$this->IsDebug()){
			return;
		}
		echo("<b>Предупреждение!</b> Попытка присвоить значение <b>'$val'</b> переменной ".
			"<b>$name</b> в классе <b>".get_class($this)."</b>:<br />".
			$this->GetDebugLine());
		echo($this->GetDebugTrace());
	}
	
	function __get($name){
		if (!$this->IsDebug()){
			return;
		}
		echo("<b>Предупреждение!</b> Попытка обратиться к переменной ".
			"<b>$name</b> в классе <b>".get_class($this)."</b>:<br />".
			$this->GetDebugLine());
		echo($this->GetDebugTrace());
	}
}

?>