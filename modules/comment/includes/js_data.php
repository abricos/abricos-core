<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage Comment
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$brick = Brick::$builder->brick;

$modSys = Brick::$modules->GetModule('sys');
$ds = $modSys->getDataSet();

$modComment = Brick::$modules->GetModule('comment');
$manager = $modComment->GetManager();

$ret = new stdClass();
$ret->_ds = array();

// Первым шагом необходимо выполнить все комманды по добавлению/обновлению таблиц
foreach ($ds->ts as $ts){
	foreach ($ts->rs as $tsrs){
		if (empty($tsrs->r)){continue; }
		switch ($ts->nm){
			case 'comments':
				foreach ($tsrs->r as $r){
					if ($r->f == 'a'){ $manager->Append($tsrs->p->cid, $r->d); }
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
			case 'comments':
				$rows = CMSQComt::Comments(Brick::$db, $tsrs->p->cid, $tsrs->op->lid);
				break;
			case 'preview':
				foreach ($tsrs->r as $r){
					$rows = $manager->Preview($r->d);
					break;
				}
				break;
		}
		if (!is_null($rows)){
			if ($qcol){
				$table->cs = $modSys->columnToObj($rows);
				$qcol = false;
			}
			$rs = new stdClass();
			$rs->p = $tsrs->p;
			if (is_array($rows)){
				$rs->d = $rows;
			}else{
				$rs->d = $modSys->rowsToObj($rows);
			}
			array_push($table->rs, $rs);
		}
	}
	array_push($ret->_ds, $table);
}

$brick->param->var['obj'] = json_encode($ret);

?>