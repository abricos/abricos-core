<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

global $cms;
$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$svers = $cms->modules->moduleUpdateShema->serverVersion;
$pfx = $cms->db->prefix."ctg_";
$db = $cms->db;

if (version_compare($svers, "1.0.0", "<=")){

	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."module` (
		  `moduleid` int(3) unsigned NOT NULL auto_increment,
		  `name` VARCHAR(50) NOT NULL default '',
		  `dbprefix` VARCHAR(10) NOT NULL default '',
		  `version` VARCHAR(10) NOT NULL default '0.0.0',
		  `dateline` int(10) unsigned NOT NULL default '0' COMMENT 'дата добавления',
		  `deldate` int(10) unsigned NOT NULL default '0' COMMENT 'дата удаления',
		  PRIMARY KEY  (`moduleid`)
		)
	". $charset);

}

?>