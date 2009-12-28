<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage FileManager
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$brick = Brick::$builder->brick;
$userid = Brick::$session->userinfo['userid'];
$mod = Brick::$modules->GetModule('sys');
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
					if ($r->f == 'u' && $r->d->act == 'editor'){ CMSFileManagerMan::ImageEditorSave($r->d); }
					if ($r->f == 'd'){ CMSFileManagerMan::FileRemove($r->d); }
				}
				break;
			case 'editor':
				foreach ($tsrs->r as $r){
					if ($r->f == 'a'){ CMSFileManagerMan::ImageChange($tsrs->p->filehash, $tsrs->p->session, $r->d); }
				}
				break;
			case 'folders':
				foreach ($tsrs->r as $r){
					if ($r->f == 'a'){ CMSFileManagerMan::FolderAppend($r->d); }
					if ($r->f == 'd'){ CMSFileManagerMan::FolderRemove($r->d); }
					if ($r->f == 'u'){ CMSFileManagerMan::FolderChangePhrase($r->d); }
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
				$rows = CMSQFileManager::FileList(Brick::$db, $userid, $tsrs->p->folderid, CMSQFileManager::FILEATTRIBUTE_NONE); 
				break;
			case 'folders':
				$rows = CMSQFileManager::FolderList(Brick::$db, $userid); 
				break;
			case 'editor':
				$rows = CMSQFileManager::EditorList(Brick::$db, $tsrs->p->filehash, $tsrs->p->session);
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