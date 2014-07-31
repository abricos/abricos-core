<?php
/**
 * Обработка запросов DataSet
 * 
 * @version $Id$
 * @package Abricos
 * @link http://abricos.org
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 * @ignore
 */


$brick = Brick::$builder->brick;

$mod = Abricos::GetModule('sys');
$ds = $mod->getDataSet();

$manager = $mod->GetManager();

$ret = new stdClass();
$ret->_ds = array();

if (Ab_CoreSystemManager::$instance->IsAdminRole()){ 
	
	// Первым шагом необходимо выполнить все комманды по добавлению/обновлению таблиц
	foreach ($ds->ts as $ts){
		foreach ($ts->rs as $tsrs){
			if (empty($tsrs->r)){
				continue;
			}
			switch ($ts->nm){
				case 'config':
					Brick::$builder->phrase->PreloadByModule($tsrs->p->mod);
					foreach ($tsrs->r as $r){
						if ($r->f == 'u' || $r->f == 'a'){
							Brick::$builder->phrase->Set($tsrs->p->mod, $r->d->nm, $r->d->ph);
						}
					}
					Brick::$builder->phrase->Save();
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
				case 'permission_mods':
					$rows = array();
					CMSRegistry::$instance->modules->RegisterAllModule();
					$mods = CMSRegistry::$instance->modules->GetModules();
					foreach ($mods as $modname => $module){
						if (is_null($module->permission)){
							continue;
						}
						$row = array();
						$row['nm'] = $modname;
						array_push($rows, $row);
					}
					break;
				case 'permission_mod':
					$rows = Ab_CoreQuery::PermissionsByModule($tsrs->p->module);
					break;
				case 'modules':
					$rows = $manager->ModuleList();
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
}

$brick->param->var['obj'] = json_encode($ret);

?>