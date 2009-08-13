<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

// выборка контента из БД
$brick = Brick::$builder->brick;
$pagename = Brick::$cms->adress->contentName;
$page = null;
$adress = Brick::$cms->adress;
$modSitemap = Brick::$modules->GetModule('sitemap');
if (!empty($modSitemap)){
	if (Brick::$cms->adress->level == 0){
		$rows = CMSQSitemap::PageByName(Brick::$db, 0, $pagename);
		while (($row = Brick::$db->fetch_array($rows))){
			$page = $row;
			break;
		}
	}else {
		$rows = CMSQSitemap::MenuListByUrl(Brick::$db, Brick::$cms->adress->dir);
		$arr = array();
		while (($row = Brick::$db->fetch_array($rows))){
			$arr[$row['id']] = $row;
		}
		$pid = 0;
		for ($i=0;$i<$adress->level;$i++){
			$find = false;
			$fmenu = null;
			foreach($arr as $menu){
				if ($menu['nm'] == $adress->dir[$i] && $menu['pid'] == $pid){
					$find = true;
					$fmenu = $menu;
					$pid = $menu['id'];
					break;
				}
			}
		}
		if ($pid > 0){
			$rows = CMSQSitemap::PageByName(Brick::$db, $pid, $pagename);
			while (($row = Brick::$db->fetch_array($rows))){
				$page = $row;
				break;
			}
		}
	}
}
if (!is_null($page)){
	$brick->content = $page['bd'];
	
	if (!empty($page['mods'])){
		
		$mods = json_decode($page['mods']);
		foreach ($mods as $own => $val){
			foreach ($mods->$own as $bkname => $val2){
				Brick::$builder->LoadBrickS($own, $bkname, $brick);
			}
		}
	}
	
	if (!empty($page['tl'])){
		Brick::$builder->SetGlobalVar('meta_title', $page['tl']);
	}
	if (!empty($page['mtks'])){
		Brick::$builder->SetGlobalVar('meta_keys', $page['mtks']);
	}
	if (!empty($page['mtdsc'])){
		Brick::$builder->SetGlobalVar('meta_desc', $page['mtdsc']);
	}
}else{
	$brick->content = "<h1>Error 404</h1>Page not found";
}

?>