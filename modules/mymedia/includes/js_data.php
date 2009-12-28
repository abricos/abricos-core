<?php
/**
 * @version $Id: js_data.php 162 2009-11-09 13:58:51Z roosit $
 * @package Abricos
 * @subpackage Frend
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$brick = Brick::$builder->brick;
$mod = Brick::$modules->GetModule('sys');
$myMediaManager = Brick::$modules->GetModule('mymedia')->GetMyMediaManager();

$ds = $mod->getDataSet();
$ret = new stdClass();
$ret->_ds = array();


// Первым шагом необходимо выполнить все комманды по добавлению/обновлению таблиц
foreach ($ds->ts as $ts){
	foreach ($ts->rs as $tsrs){
		if (empty($tsrs->r)){continue; }
		switch ($ts->nm){
			case 'albumeditor':
				foreach ($tsrs->r as $r){
					if ($r->f == 'a'){ $myMediaManager->AlbumAppend($r->d); }
					if ($r->f == 'u'){ $myMediaManager->AlbumUpdate($r->d); }
				}
				break;
			case 'files':
				foreach ($tsrs->r as $r){
					if ($r->f == 'd'){ $myMediaManager->FileRemove($r->d->id); }
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
			case 'albumlist':
				$rows = $myMediaManager->AlbumList($tsrs->p->userid); 
				break;
			case 'albumeditor':
				$rows = $myMediaManager->AlbumEdit($tsrs->p->albumid); 
				break;
			case 'album':
				$rows = $myMediaManager->AlbumView($tsrs->p->albumid); 
				break;
			case 'files':
				$rows = $myMediaManager->FileList($tsrs->p->albumid); 
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