<?php

/**
 * Фраза
 *
 * @package Abricos
 * @subpackage Core
 * @copyright Copyright (C) 2008-2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
class Ab_CorePhraseItem extends AbricosItem {

    public $value = "";

    /**
     * Является ли фраза новой
     *
     * @var bool
     */
    public $isNew = false;

    /**
     * Была ли фраза изменена
     *
     * @var bool
     */
    public $isUpdate = false;

    /**
     * Производилась ли проверка на перегрузку фразу глобальный конфигом (includes/config.php)
     *
     * @var bool
     */
    public $isCheckOver = false;

    public function __construct($d) {
        parent::__construct($d);
        $this->value = trim(strval($d['value']));
    }

    public function ToAJAX() {
        $ret = parent::ToAJAX();
        $ret->value = $this->value;
        return $ret;
    }

    public function __toString() {
        return $this->value;
    }
}

class Ab_CorePhraseList extends AbricosList {

    public $modName;

    public $isNew = false;
    public $isUpdate = false;

    public function __construct($modName) {
        parent::__construct();

        $this->modName = $modName;
    }

    /**
     * @param mixed $name
     * @return Ab_CorePhraseItem
     */
    public function Get($name, $defValue = '') {
        $item = parent::Get($name);

        if (!empty($item) && $item->isCheckOver) {
            return $item;
        }
        $mName = $this->modName;

        $readOnly = false;
        $cfg = null;
        if (!empty(Abricos::$config['phrase'])){
            $cfg = Abricos::$config['phrase'];
        }

        if (!empty($cfg) && !empty($cfg[$mName]) && isset($cfg[$mName][$name])) {
            $defValue = $cfg[$mName][$name];
            $readOnly = true;
            if (!empty($item)){
                $item->value = $defValue;
            }
        }

        if (empty($item)) {
            $item = new Ab_CorePhraseItem(array(
                "id" => $name,
                "value" => $defValue
            ));
            if (!$readOnly) {
                $this->isNew = $item->isNew = true;
            }
            $this->Add($item);
        }

        $item->isCheckOver = true;

        return $item;
    }

    /**
     * @param $name
     * @param $value
     * @return Ab_CorePhraseItem
     */
    public function Set($name, $value) {
        $item = $this->Get($name);
        $value = trim(strval($value));
        if ($item->value !== $value) {
            $this->isUpdate = $item->isUpdate = $item->value !== $value;

            $item->value = $value;
        }

        return $item;
    }

}

/**
 * Менеджер управления фразами
 *
 * Загружает запрашиваемые фразы из базы. Если фраза в базе не найден, создает ее
 * из значения по умолчанию.
 *
 * @package Abricos
 * @subpackage Core
 */
class Ab_CorePhraseManager {

    private $_lists = array();

    /**
     * @param $modName
     * @return Ab_CorePhraseList
     */
    public function GetList($modName) {
        if (!empty($this->_lists[$modName])) {
            return $this->_lists[$modName];
        }
        $db = Abricos::$db;

        $list = new Ab_CorePhraseList($modName);

        $rows = Ab_CoreQuery::PhraseList($db, $modName);
        while (($row = $db->fetch_array($rows))) {
            $list->Add(new Ab_CorePhraseItem($row));
        }

        return $this->_lists[$modName] = $list;
    }

    /**
     * Сохранение фраз в базу
     */
    public function Save() {
        foreach ($this->_lists as $key => $list) {
            if (!$list->isNew && !$list->isUpdate) {
                continue;
            }
            for ($i = 0; $i < $list->Count(); $i++) {
                $item = $list->GetByIndex($i);
                if ($item->isNew) {
                    Ab_CoreQuery::PhraseAppend(Abricos::$db, $list->modName, $item->id, $item->value);
                } else if ($item->isUpdate) {
                    Ab_CoreQuery::PhraseUpdate(Abricos::$db, $list->modName, $item->id, $item->value);
                }
                $item->isNew = $item->isUpdate = false;
            }
            $list->isNew = $list->isUpdate = false;
        }

    }
}


?>