<?php
/**
 * Обработка запросов DataSet
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Sitemap
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

if (!Brick::$session->IsAdminMode()){ return; }
$brick = Brick::$builder->brick;

$mod = Brick::$modules->GetModule('sys');
$ds = $mod->getDataSet();

$ret = new stdClass();
$ret->_ds = array();

$newmenuid = 0;
$createmenu = false;
// создание страницы в два этапа: 1-создание меню, 2-создание страницы в этом меню
foreach ($ds->ts as $ts){
	foreach ($ts->rs as $tsrs){
		switch ($ts->nm){
			case 'pagemenu':
				foreach ($tsrs->r as $r){
					if ($r->f == 'a'){
						$newmenuid = CMSQSitemap::MenuCreate(Brick::$db, $r->d);
						$createmenu = true;
					}
				}
				break;
		}
	}
}

// Первым шагом необходимо выполнить все комманды по добавлению/обновлению таблиц
foreach ($ds->ts as $ts){
	foreach ($ts->rs as $tsrs){
		if (empty($tsrs->r)){
			continue;
		}
		switch ($ts->nm){
			case 'page':
				foreach ($tsrs->r as $r){
					if ($r->f == 'u'){
						CMSQSitemap::PageUpdate(Brick::$db, $r->d);
					}else if ($r->f == 'a'){
						if ($createmenu){
							$r->d->mid = $newmenuid;
						}
						CMSQSitemap::PageCreate(Brick::$db, $r->d);
					}
				}
				break;
			case 'link':
				foreach ($tsrs->r as $r){
					if ($r->f == 'u'){ 
						CMSQSitemap::MenuUpdate(Brick::$db, $r->d); 
					}else if ($r->f == 'a'){
						CMSQSitemap::MenuCreate(Brick::$db, $r->d);
					}
				}
				break;
			case 'pagemenu':
				foreach ($tsrs->r as $r){
					if ($r->f == 'u'){ CMSQSitemap::MenuUpdate(Brick::$db, $r->d); }
				}
				break;
			case 'menulist':
				foreach ($tsrs->r as $r){
					if ($r->f == 'd'){
						CMSQSitemap::MenuRemove(Brick::$db, $r->d->id); 
					}else if ($r->f == 'u'){
						CMSQSitemap::MenuUpdate(Brick::$db, $r->d);
					}
				}
				break;
			case 'pagelist':
				foreach ($tsrs->r as $r){
					if ($r->f == 'd'){ CMSQSitemap::PageRemove(Brick::$db, $r->d->id); }
				}
				break;
		}
	}
}

// Вторым шагом выдать запрашиваемые таблицы 
foreach ($ds->ts as $ts){
	$table = new stdClass();
	$table->nm = $ts->nm;
	// нужно ли запрашивать колонки таблицы
	$qcol = false;
	foreach($ts->cmd as $cmd){ if ($cmd == 'i'){ $qcol = true; } }
	
	$table->rs = array();
	foreach ($ts->rs as $tsrs){
		$rows = null;
		switch ($ts->nm){
			case 'templates':
				$rows = array();
				$dir = dir(CWD."/tt");
				while (false !== ($entry = $dir->read())) {
					if ($entry == "." || $entry == ".." || empty($entry) ){ continue; }
					$files = glob(CWD."/tt/".$entry."/*.html");
					foreach ($files as $file){
						$bname = basename($file);
						$row = array();
						$row['nm'] = $entry;
						$row['vl'] = substr($bname, 0, strlen($bname)-5);  
						array_push($rows, $row);
					}
				}
				break;
			case 'link':
				$rows = CMSQSitemap::MenuById(Brick::$db, $tsrs->p->id);
				break;
			case 'page':
				$rows = CMSQSitemap::PageById(Brick::$db, $tsrs->p->id);
				break;
			case 'pagemenu':
				$rows = CMSQSitemap::MenuByPageId(Brick::$db, $tsrs->p->id);
				break;
			case 'menulist':
				$rows = CMSQSitemap::MenuList(Brick::$db);
				break;
			case 'pagelist':
				$rows = CMSQSitemap::PageList(Brick::$db);
				break;
		}
		if (!is_null($rows)){
			if ($qcol){
				$table->cs = $mod->columnToObj($rows);
				$qcol = false;
			}
			$rs = new stdClass();
			$rs->p = $tsrs->p;
			$rs->d = is_array($rows) ? $rows : $mod->rowsToObj($rows);  
			array_push($table->rs, $rs);
		}
	}
	
	array_push($ret->_ds, $table);
}
$brick->param->var['obj'] = json_encode($ret);

?>