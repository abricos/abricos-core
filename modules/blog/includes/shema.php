<?php
/**
 * Схема таблиц модуля
 * @version $Id$
 * @package Abricos
 * @subpackage Blog
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = CMSRegistry::$instance->modules->updateManager; 
$db = CMSRegistry::$instance->db;
$pfx = $db->prefix;

if ($updateManager->isInstall()){
	$db->query_write("
		CREATE TABLE `".$pfx."bg_cat` (
			`catid` INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
			`parentcatid` INTEGER(10) UNSIGNED NOT NULL DEFAULT '0',
			`name` VARCHAR(150) NOT NULL,
			`phrase` VARCHAR(250) NOT NULL,
			PRIMARY KEY (`catid`),
			KEY `parentcatid` (`parentcatid`))
		". $charset);
	$db->query_write("
		CREATE TABLE `".$pfx."bg_tag` (
			`tagid` INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
			`name` VARCHAR(50) NOT NULL,
			`phrase` VARCHAR(100) NOT NULL,
			PRIMARY KEY (`tagid`))
		". $charset);
	$db->query_write("
		CREATE TABLE `".$pfx."bg_topcat` (
			`topcat` INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
			`catid` INTEGER(10) UNSIGNED NOT NULL,
			`topicid` INTEGER(10) UNSIGNED NOT NULL,
			PRIMARY KEY (`topcat`)) 
		". $charset);
	$db->query_write("
		CREATE TABLE `".$pfx."bg_topic` (
			`topicid` INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
			`name` VARCHAR(250) NOT NULL,
			`title` VARCHAR(250) NOT NULL,
			`metadesc` VARCHAR( 250 ) NOT NULL DEFAULT '',
			`metakeys` VARCHAR( 150 ) NOT NULL DEFAULT '',
			`catid` INTEGER(10) UNSIGNED NOT NULL DEFAULT '0',
			`intro` TEXT NOT NULL,
			`contentid` INTEGER(10) UNSIGNED NOT NULL,
			`userid` INTEGER(10) UNSIGNED NOT NULL,
			`dateline` INTEGER(10) UNSIGNED NOT NULL,
			`dateedit` INTEGER(10) UNSIGNED NOT NULL,
			`datepub` INTEGER(10) UNSIGNED NOT NULL DEFAULT '0',
			`status` INTEGER(2) NOT NULL DEFAULT '0',
			`deldate` INTEGER(10) UNSIGNED NOT NULL DEFAULT '0',
			PRIMARY KEY (`topicid`), KEY `name` (`name`)) 
		". $charset);
	$db->query_write("
		CREATE TABLE `".$pfx."bg_toptag` (
			`toptagid` INTEGER(10) UNSIGNED NOT NULL AUTO_INCREMENT,
			`topicid` INTEGER(10) UNSIGNED NOT NULL,
			`tagid` INTEGER(10) UNSIGNED NOT NULL,
			PRIMARY KEY (`toptagid`)) 
	". $charset);

	/*
	$rows = $db->query_read("
		SELECT contentid as ctid
		FROM ".$pfx."bg_topic
	");
	$wh = array();
	while (($row = $db->fetch_array($rows))){
		array_push($wh, "contentid=".$row['ctid']);
	}
	if (!empty($wh)){
		$db->query_write("
			UPDATE ".$pfx."content
			SET modman='blog'
			WHERE ".implode(' OR ', $wh)." 
		");
	}
	*/
}

if ($updateManager->isInstall() || $updateManager->isUpdate('0.4')){
	CMSRegistry::$instance->modules->GetModule('blog')->permission->InstallDefault();
}

?>