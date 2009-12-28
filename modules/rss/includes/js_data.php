<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage RSS
 * @copyright Copyright (C) 2008 Abricos. All rights reservedd.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */


if (!Brick::$session->IsAdminMode()){ return; }
$brick = Brick::$builder->brick;

$mod = Brick::$modules->GetModule('sys');
$ds = $mod->getDataSet();

$ret = new stdClass();
$ret->_ds = array();

// Первым шагом необходимо выполнить все комманды по обновлению таблиц
foreach ($ds->ts as $ts){
	foreach ($ts->rs as $tsrs){
		if (empty($tsrs->r)){ continue; }
		switch ($ts->nm){
			case 'config':
				Brick::$builder->phrase->PreloadByModule($tsrs->p->mod);
				foreach ($tsrs->r as $r){
					if ($r->f=='u'){ Brick::$builder->phrase->Set($tsrs->p->mod, $r->d->nm, $r->d->ph); }
				}
				Brick::$builder->phrase->Save();
				break;
			case 'chanel':
				foreach ($tsrs->r as $r){
					if ($r->f=='a'){ CMSQRss::ChanelAppend(Brick::$db, $r->d); }
					if ($r->f=='u'){ CMSQRss::ChanelUpdate(Brick::$db, $r->d); }
					if ($r->f=='d'){ CMSQRss::ChanelRemove(Brick::$db, $r->d->id); }
				}
				break;
			case 'source':
				foreach ($tsrs->r as $r){
					if ($r->f=='a'){ CMSQRss::SourceAppend(Brick::$db, $r->d); }
					if ($r->f=='u'){ CMSQRss::SourceUpdate(Brick::$db, $r->d); }
					if ($r->f=='d'){ CMSQRss::SourceRemove(Brick::$db, $r->d->id); }
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
			case 'modules':
				Brick::$modules->RegisterAllModule();
				$rows = array();
				foreach (Brick::$modules->table as $childmod){
					if (method_exists($childmod, 'RssMetaLink')){
						$row = array();
						$row['nm'] = $childmod->name;
						array_push($rows, $row);
					}
				}
				break;
			case 'config':
				Brick::$builder->phrase->PreloadByModule($tsrs->p->mod);
				$rows = Brick::$builder->phrase->GetArray($tsrs->p->mod);
				break;
			case 'chanel':
				$rows = CMSQRss::ChanelList(Brick::$db);
				break;
			case 'source':
				$rows = CMSQRss::SourceList(Brick::$db);
				break;
			case 'chanelsource':
				$rows = CMSQRss::ChanelSourceList(Brick::$db);
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