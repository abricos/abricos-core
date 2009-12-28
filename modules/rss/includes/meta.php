<?php 
/**
 * @version $Id$
 * @package Abricos
 * @subpackage RSS
 * @copyright Copyright (C) 2008 Abricos. All rights reservedd.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$mod = Brick::$modman;
if (!method_exists($mod, 'RssMetaLink')){
	$default = Brick::$builder->phrase->Get('rss', 'default');
	if (!empty($default)){
		$mod = Brick::$modules->GetModule($default);
	}else{
		return;
	}
}
$brick = Brick::$builder->brick;

$brick->content = str_replace("{v#link}", $mod->RssMetaLink(), $brick->param->var['link']);

?>