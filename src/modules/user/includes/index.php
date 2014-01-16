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

$brick = Brick::$builder->brick;

if (Abricos::$user->id > 0){
	$brick->param->var['js'] = 'profile.js';
}else{
	$brick->param->var['js'] = 'guest.js';
}

?>