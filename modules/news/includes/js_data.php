<?php
/**
 * Обработка запросов DataSet
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage News
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

if (!Brick::$session->IsAdminMode()){ return; }
$brick = Brick::$builder->brick;

$mod = Brick::$modules->GetModule('news');
$ds = $mod->getDataSet();

$ret = new stdClass();
$ret->_ds = array();

// Первым шагом необходимо выполнить все комманды по добавлению/обновлению таблиц
foreach ($ds->ts as $ts){
	$rcclear = false;
	foreach($ts->cmd as $cmd){
		if ($cmd == 'rc'){ $rcclear = true; }
	}
	switch ($ts->nm){
		case 'newslist':
			if ($rcclear){ CMSQNews::NewsRecycleClear(Brick::$db); }
			break;
	}
	foreach ($ts->rs as $tsrs){
		if (empty($tsrs->r)){continue; }
		switch ($ts->nm){
			case 'news':
				foreach ($tsrs->r as $r){
					if ($r->f == 'u'){ CMSQNews::NewsSave(Brick::$db, $r->d); }
					if ($r->f == 'a'){ CMSQNews::NewsAppend(Brick::$db, $r->d); }
				}
				break;
			case 'newslist':
				foreach ($tsrs->r as $r){
					if ($r->f == 'u'){ CMSQNews::NewsPublish(Brick::$db, $r->d->id); }
					if ($r->f == 'd'){ CMSQNews::NewsRemove(Brick::$db, $r->d->id); }
					if ($r->f == 'r'){ CMSQNews::NewsRestore(Brick::$db, $r->d->id); }
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
			case 'newslist':
				$rows = CMSQNews::NewsList(Brick::$db, $tsrs->p->page, $tsrs->p->limit);
				break;
			case 'newscount':
				$rows = CMSQNews::NewsCount(Brick::$db);
				break;
			case 'news':
				$rows = CMSQNews::News(Brick::$db, $tsrs->p->id);
				break;
		}
		if (!is_null($rows)){
			if ($qcol){
				$table->cs = $mod->columnToObj($rows);
				$qcol = false;
			}
			$rs = new stdClass();
			$rs->p = $tsrs->p;
			if (is_array($rows)){
				$rs->d = $rows;
			}else{
				$rs->d = $mod->rowsToObj($rows);
			}
			array_push($table->rs, $rs);
		}
	}
	array_push($ret->_ds, $table);
}

$brick->param->var['obj'] = json_encode($ret);

?>