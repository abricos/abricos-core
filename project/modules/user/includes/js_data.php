<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

$brick = Brick::$builder->brick;

$mod = Brick::$modules->GetModule('sys');
$modum = Brick::$modules->GetModule('user');
$ds = $mod->getDataSet();
$um = $modum->GetUserManager();

$ret = new stdClass();
$ret->_ds = array();

// Первым шагом необходимо выполнить все комманды по добавлению/обновлению таблиц
foreach ($ds->ts as $ts){
	foreach ($ts->rs as $tsrs){
		if (empty($tsrs->r)){continue; }
		switch ($ts->nm){
			case 'user':
				foreach ($tsrs->r as $r){
					if ($r->f == 'u'){ $um->UserSave($r->d); }
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
			case 'user':
				$rows = $um->UserInfo($tsrs->p->id, $tsrs->p->unm);
				break;
			case 'userlist':
				$rows = $um->UserList($tsrs->p->page, $tsrs->p->limit);
				break;
			case 'usercount':
				$rows = $um->UserCount();
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