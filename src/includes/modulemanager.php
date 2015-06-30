<?php

/**
 * Абстрактный класс модуля в платформе Абрикос
 *
 * Структура модуля
 *
 * Модуль в платформе Абрикос — это самостоятельная сущность, со своим шаблоном,
 * стилями css, картинками, серверными скриптами и прочими необходимыми для его
 * работы компонентами. Все модули в платформе Абрикос располагаются в папке modules.
 *
 * Главным файлом любого модуля в платформе является скрипт module.php,
 * который должен находиться в корневой папке модуля. Когда ядро платформы просматривает
 * доступные модули, то она смотрит именно этот файл.
 *
 * @package Abricos
 * @copyright Copyright (C) 2008-2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @example modules/example/module.php
 */
abstract class Ab_Module {

    /**
     * Ошибка модуля. Если true, модуль не инициализируется в ядре
     *
     * @var boolean
     */
    public $error = false;

    /**
     * Политика безопасности модуля
     *
     * @var Ab_UserPermission
     */
    public $permission = null;

    /**
     * Версия модуля
     *
     * @var string
     */
    public $version = "0.0.0";

    /**
     * Наименование модуля латинскими буквами и цифрами
     *
     * Используется в качестве уникального идентификатора модуля
     * в платформе Абрикос
     *
     * @var string
     */
    public $name = "";

    /**
     * Перехват линка модуля.
     * Если имеет значение "__super", то модуль берет на себя
     * управление с главной страницы.
     *
     * @var string
     */
    public $takelink = "";

    /**
     * CSS по умолчанию (имя файла в папке css модуля).
     * @deprecated
     */
    private $defaultCSS = "";

    /**
     * Список зависимых модулей и их версии
     * Например:
     * <code>
     * array(
     *   'sys' => '0.5.5',
     *   'uprofile' => '0.1.2'
     * );
     * </code>
     * Примечание: модуль 'core' является синонимом 'sys'
     *
     * @var array
     */
    public $depends = array();

    /**
     * TODO: remove
     *
     * @deprecated
     */
    private $lang;

    private $_i18n = null;

    public function GetI18n() {
        if (is_array($this->_i18n)) {
            return $this->_i18n;
        }
        $this->_i18n = array();

        $file = CWD."/modules/".$this->name."/i18n/".Abricos::$LNG.".php";
        if (!file_exists($file)) {
            // TODO: remove
            $file = CWD."/modules/".$this->name."/language/".Abricos::$LNG.".php";
        }

        if (file_exists($file)) {
            $arr = include($file);
            if (is_array($arr)) {
                $this->_i18n = $arr;
            }
        }

        return $this->_i18n;
    }

    /**
     * Когда управление по формированию ответа сервера переходит модулю,
     * происходит вызов этого метода, который должен вернуть имя
     * контент файла (стартового кирпича).
     *
     * Стартовые кирпичи находяться в папке модуля content и содержат в себе
     * всю необходимую информацию для формирования ответа.
     *
     * Если метод возвращает пустую строку, платформа выдает 404 ошибку.
     *
     * Если файл контент не найден, то платформа выдает 500 ошибку.
     *
     * @return string
     */
    public function GetContentName() {
        return Abricos::$adress->contentName;
    }

    /**
     * Явно указать информацию о шаблоне, тем самым игнорируя шаблон
     * указанный в стартовом кирпиче.
     * Для определения необходимо возвращать массив в формате:
     * array(
     *   'owner' => 'имя стиля',
     *   'name' => 'имя шаблона'
     * )
     *
     * @return null || array
     */
    public function GetTemplate() {
        return null;
    }

    /**
     * Получить менеджер модуля
     *
     * Пример из модуля Example:
     * <code>
     * class ExampleModule extends Ab_Module {
     *    // экземпляр менеджера модуля
     *    private $_manager = null;
     *    ...
     *    public function GetManager(){
     *        if (is_null($this->_manager)){
     *            require_once 'includes/manager.php';
     *            $this->_manager = new ExampleManager($this);
     *        }
     *        return $this->_manager;
     *    }
     *    ...
     * }
     * </code>
     *
     * @return Ab_ModuleManager
     */
    public function GetManager() {
        return null;
    }

    /**
     * @return Ab_CorePhraseList
     */
    public function GetPhrases() {
        return Abricos::$phrases->GetList($this->name);
    }
}

/**
 * Абстрактный класс менеджера модуля в платформе Абрикос
 *
 * Все AJAX запросы и прочие функции внешнего взаимодействия
 * с этим модулей поступают именно в этот класс.
 *
 * Вызов и инициализацию менеджера необходимо осуществлять в
 * методе {@link Ab_Module::GetManager()}
 *
 * @package Abricos
 * @example modules/example/includes/manager.php
 */
abstract class Ab_ModuleManager {

    /**
     * База данных
     *
     * @var AbricosDatabase
     */
    public $db;


    /**
     * Пользователь
     *
     * @var UserItem
     */
    protected $user;

    /**
     * Идентификатор пользователя
     *
     * @var integer
     */
    protected $userid = 0;

    /**
     * Модуль
     *
     * @var Ab_Module
     */
    public $module = null;

    public function __construct(Ab_Module $module) {
        $this->module = $module;
        $this->db = Abricos::$db;

        if ($module->name !== 'user') {
            $this->user = Abricos::$user;
            $this->userid = Abricos::$user->id;
        }
    }

    public function AJAX($data) {
        return "";
    }

    private $_isRolesDisable = false;

    public function IsRolesDisable() {
        return $this->_isRolesDisable;
    }

    public function RolesDisable() {
        $this->_isRolesDisable = true;
    }

    public function RolesEnable() {
        $this->_isRolesDisable = false;
    }

    /**
     * Получить значение роли текущего пользователя в политики безопасиности модуля
     *
     * Вызывает метод $this->module->permission->CheckAction($action)
     *
     * @var integer идентификатор роли
     *
     * @return integer -1 - запрещено, 0 - отсутсвует, 1 - разрешено
     */
    public function GetRoleValue($action) {
        return $this->module->permission->CheckAction($action);
    }

    /**
     * Разрешено ли действие @action текущего пользователя в политики безопасности модуля
     *
     * @param integer $action идентификатор роли
     *
     * @return boolean true действие разрешено
     */
    public function IsRoleEnable($action) {
        if ($this->IsRolesDisable()) {
            return true;
        }
        return $this->GetRoleValue($action) > 0;
    }
}


/**
 * Менеджер модулей в платформе Абрикос
 *
 * @package Abricos
 * @subpackage Core
 */
class Ab_CoreModuleManager {

    /**
     * TODO: remove
     *
     * @deprecated
     */
    private $table = array();

    /**
     * TODO: remove
     *
     * @deprecated
     */
    private $modulesInfo = array();

    /**
     * Пользовательская настройка работы модулей (из config.php)
     *
     * @var boolean
     */
    public $customTakelink = false;

    /**
     * Текущий модуль управления
     *
     * @var Ab_Module
     */
    public $managesModule = null;

    public $checkManagesModule = false;

    private $_firstError = false;

    /**
     * @var Ab_ModuleInfoList
     */
    public $list;

    /**
     * Конструктор
     *
     * @ignore
     */
    public function __construct() {
        $this->list = new Ab_ModuleInfoList();

        $this->FetchModulesInfo();
    }

    private function AddModuleInfo($d) {
        $name = $d['name'];

        $file = $this->GetModuleFileName($name);
        if (!file_exists($file)) {
            return;
        }

        $item = $this->list->Get($name);
        if (empty($item)) {
            $item = new Ab_ModuleInfo($d);
            $this->list->Add($item);
        } else {
            $item->Update($d);
        }
        return $item;
    }

    private function FetchModulesInfo() {
        $db = Abricos::$db;

        $rows = Ab_CoreQuery::ModuleList($db);
        if ($db->IsError() && !$this->_firstError) { // возникла ошибка, вероятнее всего идет первый запуск движка
            $db->ClearError();
            Ab_CoreQuery::ModuleCreateTable($db);
            if (!$db->IsError()) { // таблица была создана успешно, значит можно регистрировать все модули
                $rows = Ab_CoreQuery::ModuleList($db);
            } else {
                // проблемы в настройках сайта или коннекта с БД
                die('<strong>Configuration</strong>: DataBase error<br />'.$db->errorText);
            }
        }
        $this->_firstError = true;

        $cfg = isset(Abricos::$config["Takelink"]) ? Abricos::$config["Takelink"] : '';
        $adress = Abricos::$adress;
        $link = $adress->level === 0 ? "__super" : $adress->dir[0];
        $mainLink = null;
        if (is_array($cfg) && count($cfg) > 0 && !empty($link)) {
            $cfgLink = isset($cfg[$link]) ? $cfg[$link] : array();
            $modName = isset($cfgLink["module"]) ? $cfgLink["module"] : "";
            $enmod = isset($cfgLink["enmod"]) && is_array($cfgLink["enmod"]) ? $cfgLink["enmod"] : array();
            while (($row = $db->fetch_array($rows))) {
                $name = $row['name'];
                if ($name == $modName) {
                    $row["takelink"] = $link;
                    $mainLink = $row;
                }
                if ($name != "sys" && $name != "ajax" && $name != "user" && count($enmod) > 0 && $modName != $name) {

                    $find = false;
                    foreach ($enmod as $key) {
                        if ($key == $name) {
                            $find = true;
                            break;
                        }
                    }
                    if (!$find) {
                        continue;
                    }
                }
                $this->AddModuleInfo($row);
            }
            $this->customTakelink = true;
            if (!is_null($mainLink)) {
                for ($i = 0; $i < $this->list->Count(); $i++) {
                    $item = $this->list->GetByIndex($i);
                    if ($mainLink['name'] != $item->name && $mainLink['takelink'] == $item->takelink) {
                        $item->takelink = '';
                    }
                }
            }
        } else {
            while (($row = $db->fetch_array($rows))) {
                $this->AddModuleInfo($row);
            }
        }
    }

    /**
     * Зарегистрировать все модули
     *
     * @return array
     */
    public function RegisterAllModule() {
        // первым регистрируется системный модуль
        $this->RegisterByName('sys');

        // Регистрация всех имеющихся модулей в системе
        $modRootDir = dir(CWD."/modules");
        while (false !== ($entry = $modRootDir->read())) {
            if ($entry == "." || $entry == ".." || empty($entry)) {
                continue;
            }
            $modFile = CWD."/modules/".$entry."/module.php";
            if (!file_exists($modFile)) {
                continue;
            }
            $this->RegisterByName($entry);
        }

        return $this->GetModules();
    }

    function GetModuleFileName($name) {
        $name = preg_replace("/[^0-9a-z\-_,\/\.]+/i", "", $name);
        return CWD."/modules/".$name."/module.php";
    }

    /**
     * Регистрация модуля по имени
     *
     * @param string $name
     * @return Ab_Module
     */
    public function RegisterByName($name) {
        $info = $this->list->Get($name);

        if (!empty($info) && !empty($info->instance)) {
            return $info->instance;
        }

        $file = $this->GetModuleFileName($name);
        if (!file_exists($file)) {
            return null;
        }
        require_once($file);
        $info = $this->list->Get($name);
        return $info->instance;
    }

    /**
     * Регистрация модуля.
     *
     * @param Ab_Module $module
     */
    public function Register(Ab_Module $module) {
        if (empty($module)) {
            return;
        }

        $modName = $module->name;

        $info = $this->list->Get($modName);
        if (empty($info)) {
            Ab_CoreQuery::ModuleAppend(Abricos::$db, $module);
            $this->FetchModulesInfo();
        }

        $info = $this->list->Get($modName);
        if (Abricos::$db->error > 0) {
            die(Abricos::$db->errorText);
        }

        $serverVersion = $info->version;
        $newVersion = $module->version;

        require_once 'updatemanager.php';
        $cmp = Ab_UpdateManager::CompareVersion($serverVersion, $newVersion);

        if ($cmp == -1) {
            return;
        } // downgrade модуля запрещен

        $info->instance = $module;

        if ($cmp == 0) {
            return;
        }

        Ab_UpdateManager::$current = new Ab_UpdateManager($module, $info);

        $shema = CWD."/modules/".$modName."/includes/shema.php";
        if (file_exists($shema)) {
            require_once($shema);
        }
        Ab_CoreQuery::ModuleUpdateVersion(Abricos::$db, $module);
        $this->FetchModulesInfo();

        Ab_UpdateManager::$current = null;
        $this->updateManager = null;
        // Удалить временные файлы
        $chFiles = globa(CWD."/cache/*.gz");
        foreach ($chFiles as $rfile) {
            @unlink($rfile);
        }
    }

    /**
     * Получить модуль
     *
     * @param string $name - имя модуля
     * @return Ab_Module
     */
    public function GetModule($name) {
        if (empty($name)) {
            return null;
        }
        $info = $this->list->Get($name);

        if (!empty($info) && !empty($info->instance)) {
            return $info->instance;
        }
        /* попытка зарегистрировать модуль */
        $this->RegisterByName($name);

        $info = $this->list->Get($name);
        if (!empty($info) && !empty($info->instance)) {
            return $info->instance;
        }
        return null;
    }

    /**
     * @return Ab_Module|null
     */
    public function GetSuperModule() {
        for ($i = 0; $i < $this->list->Count(); $i++) {
            $info = $this->list->GetByIndex($i);
            if ($info->takelink === '__super') {
                return $this->RegisterByName($info->name);
            }
        }
        return null;
    }

    public function GetModules() {
        $ret = array();

        for ($i = 0; $i < $this->list->Count(); $i++) {
            $info = $this->list->GetByIndex($i);
            if (empty($info->instance)) {
                continue;
            }
            $ret[$info->name] = $info->instance;
        }
        return $ret;
    }
}

?>