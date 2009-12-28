<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

$brick = Brick::$builder->brick;

$mod = Brick::$modules->GetModule('sys');
$modfaq = Brick::$modules->GetModule('faq');
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
						$newMessageId = CMSModFaqMan::MessageAppend($r->d);
					}
				}
				break;
			case 'messages':
				foreach ($tsrs->r as $r){
					if ($r->f == 'u'){ CMSModFaqMan::Reply($r->d); }
					if ($r->f == 'd'){ CMSModFaqMan::MessageRemove($r->d->id); }
				}
				break;
			case 'arhive':
				foreach ($tsrs->r as $r){
					if ($r->f == 'u'){ CMSModFaqMan::Edit($r->d); }
					if ($r->f == 'd'){ CMSModFaqMan::MessageRemove($r->d->id); }
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
				$rows = CMSQFaq::Message(Brick::$db, $newMessageId);
				break;
			case 'messages':
				$rows = CMSModFaqMan::MessageList(0, 1, 1);
				break;
			
			case 'arhive':
				$rows = CMSModFaqMan::Arhive(0, 1, 1);
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