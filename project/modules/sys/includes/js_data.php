<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
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
	switch ($ts->nm){
		case 'bricks':
			if ($rcclear){ CMSQSys::BrickRecycleClear(Brick::$db); }
			break;
	}
	foreach ($ts->rs as $tsrs){
		if (empty($tsrs->r)){
			continue;
		}
		switch ($ts->nm){
			case 'config':
				Brick::$builder->phrase->PreloadByModule($tsrs->p->mod);
				foreach ($tsrs->r as $r){
					if ($r->f == 'u'){
						Brick::$builder->phrase->Set($tsrs->p->mod, $r->d->nm, $r->d->ph);
					}
				}
				Brick::$builder->phrase->Save();
				break;
			case 'brick':
				foreach ($tsrs->r as $r){
					if ($r->f == 'u'){ CMSQSys::BrickSave(Brick::$db, $r->d); }
				}
				break;
			case 'brickparam':
				foreach ($tsrs->r as $r){
					if ($r->f == 'a'){
						CMSQSys::BrickParamAppend(Brick::$db, $r->d);
					}else if ($r->f == 'u'){
						CMSQSys::BrickParamSave(Brick::$db, $r->d);
					}else if ($r->f == 'd'){
						CMSQSys::BrickParamRemove(Brick::$db, $r->d->id);
					}
				}
				break;
			case 'bricks':
				foreach ($tsrs->r as $r){
					if ($r->f == 'd'){ CMSQSys::BrickRemove(Brick::$db, $r->d->id); }
					if ($r->f == 'r'){ CMSQSys::BrickRestore(Brick::$db, $r->d->id); }
				}
				break;
		}
	}
}

$br = $mod->getBrickReader();
$br->CheckBrickVersion();

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
			case 'styles':
				$rows = array();
				$dir = dir(CWD."/tt");
				while (false !== ($entry = $dir->read())) {
					if ($entry == "." || $entry == ".." || empty($entry) || $entry == "_sys" || $entry == "_my"){ continue; }
					if (!file_exists(CWD."/tt/".$entry."/main.html")){ continue ;}
					$row = array();
					$row['nm'] = $entry;
					array_push($rows, $row);
				}
				break;
			case 'config':
				Brick::$builder->phrase->PreloadByModule($tsrs->p->mod);
				$rows = Brick::$builder->phrase->GetArray($tsrs->p->mod);
				break;
			case 'bricks':
				$rows = CMSQSys::BrickList(Brick::$db, $tsrs->p->tp, 'yes');
				break;
			case 'brick':
				$rows = CMSQSys::BrickById(Brick::$db, $tsrs->p->bkid, true);
				break;
			case 'brickparam':
				$rows = CMSQSys::BrickParamList(Brick::$db, $tsrs->p->bkid);
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