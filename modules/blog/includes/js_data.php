<?php
/**
 * Обработка запросов DataSet
 * 
 * @version $Id: js_data.php 102 2009-10-16 13:38:40Z roosit $
 * @package Abricos
 * @subpackage Blog
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

// Первым шагом необходимо выполнить все комманды по добавлению/обновлению таблиц
foreach ($ds->ts as $ts){
	$rcclear = false;
	foreach($ts->cmd as $cmd){
		if ($cmd == 'rc'){ $rcclear = true; }
	}
	/*
	switch ($ts->nm){
		case 'newslist':
			if ($rcclear){ CMSQNews::NewsRecycleClear(Brick::$db); }
			break;
	}
	/**/
	foreach ($ts->rs as $tsrs){
		if (empty($tsrs->r)){continue; }
		switch ($ts->nm){
			case 'topic':
				foreach ($tsrs->r as $r){
					if ($r->f == 'a'){ CMSModuleBlog::TopicAppend($r->d); }
					if ($r->f == 'u'){ CMSModuleBlog::TopicUpdate($r->d); }
				}
				break;
			case 'category':
				foreach ($tsrs->r as $r){
					if ($r->f == 'a'){ CMSModuleBlog::CategoryAppend($r->d); }
					if ($r->f == 'u'){ CMSModuleBlog::CategoryAppend($r->d); }
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
			case 'topiclistbyuser':
				$rows = CMSModuleBlog::TopicListByUser($tsrs->p->page, $tsrs->p->limit, false);
				break;
			case 'topiccountbyuser':
				$rows = array();
				array_push($rows, array("cnt" => CMSModuleBlog::TopicCountByUser(false)));
				break;
			case 'topic':
				$rows = array();
				array_push($rows, CMSModuleBlog::Topic($tsrs->p->topicid));
				break;
			case 'categorylist':
				$rows = CMSQBlog::CategoryList(Brick::$db);
				break;
			case 'category':
				$rows = CMSQBlog::CategoryById(Brick::$db, $tsrs->p->categoryid, false);
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