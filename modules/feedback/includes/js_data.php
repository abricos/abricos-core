<?php
/**
 * Обработка запросов DataSet
 * 
 * @version $Id$
 * @package CMSBrick
 * @subpackage Feedback
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$brick = Brick::$builder->brick;

$mod = Brick::$modules->GetModule('sys');
$modfb = Brick::$modules->GetModule('feedback');
$ds = $mod->getDataSet();

$ret = new stdClass();
$ret->_ds = array();

$newMessageId = 0;
// Первым шагом необходимо выполнить все комманды по добавлению/обновлению таблиц
foreach ($ds->ts as $ts){
	foreach ($ts->rs as $tsrs){
		if (empty($tsrs->r)){continue; }
		switch ($ts->nm){
			case 'message':
				foreach ($tsrs->r as $r){
					if ($r->f == 'a'){ 
						$newMessageId = CMSModFeedbackMan::MessageAppend($r->d);
					}
				}
				break;
			case 'messages':
				foreach ($tsrs->r as $r){
					if ($r->f == 'u'){ CMSModFeedbackMan::Reply($r->d); }
					if ($r->f == 'd'){ CMSModFeedbackMan::MessageRemove($r->d->id); }
				}
				break;
			case 'config':
				if (Brick::$cms->session->IsAdminMode()){
					Brick::$builder->phrase->PreloadByModule($tsrs->p->mod);
					foreach ($tsrs->r as $r){
						if ($r->f=='u'){ Brick::$builder->phrase->Set($tsrs->p->mod, $r->d->nm, $r->d->ph); }
					}
					Brick::$builder->phrase->Save();
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
			case 'message':
				$rows = CMSQFeedback::Message(Brick::$db, $newMessageId);
				break;
			case 'messages':
				$rows = CMSModFeedbackMan::MessageList(0, 1, 1);
				break;
			case 'config':
				if (Brick::$cms->session->IsAdminMode()){
					Brick::$builder->phrase->PreloadByModule($tsrs->p->mod);
					$rows = Brick::$builder->phrase->GetArray($tsrs->p->mod);
				}
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