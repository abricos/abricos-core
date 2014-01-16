<?php
/**
 * Обработка запросов DataSet 
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage User
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 * @ignore
 */

$brick = Brick::$builder->brick;

$mod = Abricos::GetModule('sys');
$modUser = Abricos::GetModule('user');
$manager = $modUser->GetManager();
$ds = $mod->getDataSet();

$ret = new stdClass();
$ret->_ds = array();

// Первым шагом необходимо выполнить все комманды по добавлению/обновлению таблиц
foreach ($ds->ts as $ts){
	foreach ($ts->rs as $tsrs){
		if (empty($tsrs->r)){continue; }
		$manager->DSProcess($ts->nm, $tsrs);
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
		$rows = $manager->DSGetData($ts->nm, $tsrs);
		if (is_null($rows)){
			$rows = array(array('id'=>0));
		}
		if ($qcol){
			$table->cs = $mod->columnToObj($rows);
			$qcol = false;
		}
		$rs = new stdClass();
		$rs->p = $tsrs->p;
		$rs->d = is_array($rows) ? $rows : $mod->rowsToObj($rows);
		array_push($table->rs, $rs);
	}
	array_push($ret->_ds, $table);
}

$brick->param->var['obj'] = json_encode($ret);

?>