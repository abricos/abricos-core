<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage RSS
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$adress = Brick::$cms->adress;

$mod = Brick::$modules->GetModule($adress->dir[1]);
if (empty($mod)){
	exit;
}

$write = new CMSRssWriter2_0();
$write->Header();
$write->Open();

$mod->RssWrite($write);

$write->Close();
?>