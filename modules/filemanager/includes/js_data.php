<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage FileManager
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$brick = Brick::$builder->brick;
$mod = Brick::$modules->GetModule('sys');
$fileManager = Brick::$modules->GetModule('filemanager')->GetFileManager();

$ds = $mod->getDataSet();
$ret = new stdClass();
$ret->_ds = array();

$newMessageId = 0;
// Первым шагом необходимо выполнить все комманды по добавлению/обновлению таблиц
foreach ($ds->ts as $ts){
	foreach ($ts->rs as $tsrs){
		if (empty($tsrs->r)){continue; }
		switch ($ts->nm){
			case 'files':
				foreach ($tsrs->r as $r){
					if ($r->f == 'u' && $r->d->act == 'editor'){ $fileManager->ImageEditorSave($r->d); }
					if ($r->f == 'd'){ $fileManager->FileRemove($r->d->fh); }
				}
				break;
			case 'editor':
				foreach ($tsrs->r as $r){
					if ($r->f == 'a'){ 
						$fileManager->ImageEditorChange($tsrs->p->filehash, $tsrs->p->session, $r->d); 
					}
				}
				break;
			case 'folders':
				foreach ($tsrs->r as $r){
					if ($r->f == 'a'){ $fileManager->FolderAppendFromData($r->d); }
					if ($r->f == 'd'){ $fileManager->FolderRemove($r->d); }
					if ($r->f == 'u'){ $fileManager->FolderChangePhrase($r->d); }
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
			case 'files':
				$rows = $fileManager->FileList($tsrs->p->folderid); 
				break;
			case 'folders':
				$rows = $fileManager->FolderList(); 
				break;
			case 'editor':
				$rows = $fileManager->EditorList($tsrs->p->filehash, $tsrs->p->session); 
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