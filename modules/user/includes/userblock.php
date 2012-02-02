<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage User
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 * @ignore
 */

$var = &$brick->param->var;

if (Abricos::$user->id == 0){
	$var['result'] = $var['guest'];
}else{
	$var['result'] = Brick::ReplaceVarByData($var['user'], array(
		"username" => Abricos::$user->login
	));
}
 
?>