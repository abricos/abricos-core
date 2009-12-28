<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

if (!Brick::$session->IsAdminMode()){ return; }
$brick = Brick::$builder->brick;

$mod = Brick::$modules->GetModule('catalog');
$ds = $mod->getDataSet();

$brick->content = str_replace("{v#mmp}", bkstr($ds->pfx), $brick->content);

$ret = new stdClass();
$ret->_ds = array();

// Первым шагом необходимо выполнить все комманды по добавление/обновлению таблиц
foreach ($ds->ts as $ts){
	$rcclear = false;
	foreach($ts->cmd as $cmd){
		if ($cmd == 'rc'){ $rcclear = true; }
	}
	switch ($ts->nm){
		case 'catelements':
			if ($rcclear){ CMSQCatalog::CatalogElementRecycleClear(Brick::$db); }
			break;
		case 'eloption':
			if ($rcclear){ CMSQCatalog::ElementOptionRecycleClear(Brick::$db); }
			break;
	}
	foreach ($ts->rs as $tsrs){
		if (empty($tsrs->r)){
			continue;
		}
		switch ($ts->nm){
			case 'catelements':
				foreach ($tsrs->r as $r){
					if ($r->f == 'd'){ CMSQCatalog::CatalogElementRemove(Brick::$db, $r->d->id);
					}else if ($r->f == 'r'){ CMSQCatalog::CatalogElementRestore(Brick::$db, $r->d->id); }
				}
				break;
			case 'catelement':
				foreach ($tsrs->r as $r){
					$data = $r->d;
					if ($r->f == 'a'){
						CMSQCatalog::CatalogElementAppend(Brick::$db, $data);
					}else if ($r->f == 'u'){
						CMSQCatalog::CatalogElementSave(Brick::$db, $data);
					}
				}
				break;
			case 'catalog':
				foreach ($tsrs->r as $r){
					if ($r->f == 'a'){
						CMSQCatalog::CatalogAppend(Brick::$db, $r->d);
					}else if ($r->f == 'u'){
						CMSQCatalog::CatalogSave(Brick::$db, $r->d);
					}else if ($r->f == 'd'){
						CMSQCatalog::CatalogRemove(Brick::$db, $r->d->id);
					}
				}
				break;
			case 'catalogcfg':
				$list = CMSQCatalog::CatalogConfigList(Brick::$db);
				$scatalog = array();
				while (($row = Brick::$db->fetch_array($list))){ $scatalog[$row['lvl']] = $row; }
				foreach ($tsrs->r as $r){
					if (empty($scatalog[$r->d->lvl])){CMSQCatalog::CatalogConfigAppend(Brick::$db, $r->d);
					}else{CMSQCatalog::CatalogConfigUpdate(Brick::$db, $r->d);}
				}
				break;
			case 'eltype':
				foreach ($tsrs->r as $r){
					$data = $r->d;
					if ($r->f == 'a'){
						// Добавление типа элемента:
						// 1 - проверка возможности;
						// 2 - создание таблицы, в которой будут храниться элементы типа
						// 3 - добавление записи в таблицу типов элемента каталога
						
						$data->nm = translateruen($data->nm);
						$row = CMSQCatalog::ElementTypeByName(Brick::$db, $data->nm);
						
						if (empty($row)){ 
							$tablefind = false;
							$rows = CMSQCatalog::TableList(Brick::$db);
							while (($row = Brick::$db->fetch_array($rows, CMSDatabase::DBARRAY_NUM))){
								if ($row[0] == (Brick::$db->prefix."ctg_eltbl_".$data->nm)){
									$tablefind = true;
									break;
								}
							}
							if (!$tablefind){
								CMSQCatalog::ElementTypeTableCreate(Brick::$db, $data->nm);
								CMSQCatalog::ElementTypeAppend(Brick::$db, $data);
							}
						}
					}else if ($r->f == 'u'){
						CMSQCatalog::ElementTypeSave(Brick::$db, $data);
					}
				}
				break;
			case 'eloption':
				foreach ($tsrs->r as $r){
					if ($r->f == 'd'){ CMSQCatalog::ElementOptionRemove(Brick::$db, $r->d->id);
					}else if ($r->f == 'r'){ CMSQCatalog::ElementOptionRestore(Brick::$db, $r->d->id); }
					$data = $r->d;
					$data->nm = strtolower(translateruen($data->nm));
					
					if (empty($data->grp) && !empty($data->grpalt)){
						$data->grp = CMSQCatalog::ElementOptGroupAppend(Brick::$db, $data->eltid, $data->grpalt, '');
					}
					if ($r->f == 'a'){
						$error = false;
						$prms = json_decode(urldecode($data->prms));
						$data->fldtp = intval($data->fldtp);
						switch($data->fldtp){
							case CMSQCatalog::OPTIONTYPE_BOOLEAN: $prms->def = intval($prms->def) > 0 ? 1 : 0; break;
							case CMSQCatalog::OPTIONTYPE_NUMBER:
								$prms->size = intval($prms->size);
								$prms->def = intval($prms->def);
								if ($prms->size < 1 || $prms->size > 10){
									$error = true;
								}
								break;
							case CMSQCatalog::OPTIONTYPE_DOUBLE: break;
							case CMSQCatalog::OPTIONTYPE_STRING: $prms->size = intval($prms->size); break;
							case CMSQCatalog::OPTIONTYPE_MULTI: break;
						}
						if (!$error){
							// информация типа элемента каталога
							$eltype = CMSQCatalog::ElementTypeById(Brick::$db, $data->eltid);
							$data->eltypenm = $eltype['nm'];
							// чтение имени поля из таблицы типа элемента
							$fieldfind = false;
							$rowsfl = CMSQCatalog::ElementTypeTableFieldList(Brick::$db, $eltype['nm']);
							while (($row = Brick::$db->fetch_array($rowsfl))){
								if ($row['field'] == "fld_".$data->nm){
									$fieldfind = true;
									break;
								}
							}
							// есть ли это имя опции в таблице опций eloption
							if (!$fieldfind){ 
								$row = CMSQCatalog::ElementOptionByName(Brick::$db, $data->eltid, $data->nm);
								if (!empty($row)){
									$fieldfind = true;
								}
							}
							
							// если это опция - тип таблица
							if (!$fieldfind && $data->fldtp == CMSQCatalog::OPTIONTYPE_TABLE){
								$rows = CMSQCatalog::TableList(Brick::$db);
								while (($row = Brick::$db->fetch_array($rows, CMSDatabase::DBARRAY_NUM))){
									if ($row[0] == (Brick::$db->prefix."ctg_eltbl_".$eltype['nm']."_fld_".$data->nm)){
										$fieldfind = true;
										break;
									}
								}
							}
							
							if (!$fieldfind){ // опция не найдена.
								// создание поля в таблице элемента, добавление опции в таблицу опций 
								CMSQCatalog::ElementOptionAppend(Brick::$db, $data, $prms);
							}
						}
					}else if ($r->f == 'u'){
						CMSQCatalog::ElementOptionSave(Brick::$db, $data);
					}
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
	foreach($ts->cmd as $cmd){
		if ($cmd == 'i'){ $qcol = true; }
	}
	
	$table->rs = array();
	
	foreach ($ts->rs as $tsrs){
		$rows = null;
		switch ($ts->nm){
			case 'eloptionfld':
				if (!empty($tsrs->p->eltpnm) && !empty($tsrs->p->fldnm)){
					$rows = CMSQCatalog::ElementOptionFieldTableList(Brick::$db, $tsrs->p->eltpnm, $tsrs->p->fldnm);
				}
				break;
			case 'catelement':
				$rows = CMSQCatalog::CatalogElement(Brick::$db, $tsrs->p->id);
				break;
			case 'catelements':
					$rows = CMSQCatalog::CatalogElementList(Brick::$db, $tsrs->p->catid);
				break;
			case 'fotos':
				$rows = CMSQCatalog::FotoList(Brick::$db, $tsrs->p->eltid, $tsrs->p->elid);
				break;
			case 'catalog':
				$rows = CMSQCatalog::CatalogList(Brick::$db);
				break;
			case 'catalogcfg':
				$rows = CMSQCatalog::CatalogConfigList(Brick::$db);
				break;
			case 'eltype':
				$rows = CMSQCatalog::ElementTypeList(Brick::$db);
				break;
			case 'eloptgroup':
				$rows = CMSQCatalog::ElementOptGroupList(Brick::$db);
				break;
			case 'eloption':
				$rows = CMSQCatalog::ElementOptionList(Brick::$db);
				break;
			case '':
				break;
		}
		if ($qcol && !is_null($rows)){
			$table->cs = $mod->columnToObj($rows);
			$qcol = false;
		}
		if (!is_null($rows)){
			$rs = new stdClass();
			$rs->p = $tsrs->p;
			$rs->d = $mod->rowsToObj($rows);
			array_push($table->rs, $rs);
		}
	}
	
	array_push($ret->_ds, $table);
}

$brick->param->var['obj'] = json_encode($ret);


?>