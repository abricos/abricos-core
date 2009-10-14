<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage User
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$brick = Brick::$builder->brick;

if (Brick::$session->IsRegistred()){
	$brick->param->var['js'] = 'profile.js';
}else{
	$brick->param->var['js'] = 'guest.js';
}

?>