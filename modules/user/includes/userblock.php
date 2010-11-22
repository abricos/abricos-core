<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage User
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$var = &$brick->param->var; 
if (!CMSRegistry::$instance->user->IsRegistred()){
	$var['result'] = $var['guest'];
}else{
	$var['result'] = Brick::ReplaceVarByData($var['user'], array(
		"username" => CMSRegistry::$instance->user->info['username']
	));
}
 
?>