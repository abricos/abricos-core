<?php
/**
 * @package Abricos
 * @subpackage Core
 * @copyright 2008-2016 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @link http://abricos.org
 */

/**
 * Ядро платформы Абрикос
 *
 * Содержит в себе все необходимые объекты и методы для полноценного
 * взаимодействия с платформой
 */
final class Abricos {

    /**
     * Стандартизированный адрес URI
     *
     * @var Ab_URI
     */
    public static $adress;

    /**
     * Current User
     *
     * @var UserItem
     */
    public static $user;

    /**
     * Обработчик глобальных переменных GET, POST..
     *
     * @var Ab_CoreInputCleaner
     */
    public static $inputCleaner;

    /**
     * База данных
     *
     * @var Ab_Database
     */
    public static $db;

    /**
     * Настройки из файла /includes/config.php
     *
     * @example includes/config.example.php
     * @var array
     */
    public static $config;

    /**
     * @var Ab_CoreModuleManager
     */
    public static $modules;

    /**
     * @var Ab_CorePhraseManager
     */
    public static $phrases;

    /**
     * Идентификатор языка контента
     *
     * @var string
     */
    public static $LNG = 'ru';

    /**
     * Поддерживаемые языки контента на сайте
     *
     * @var array
     */
    public static $supportLanguageList = array();

    /**
     * Язык интерфейса пользователя
     *
     * @var string
     */
    public static $locale = 'ru-RU';

    /**
     * Идентификатор домена (мультидоменная система)
     *
     * @var string
     */
    public static $DOMAIN = '';


    public function __construct(&$config){
        Abricos::$adress = new Ab_URI(Ab_URI::fetch_uri());
        Abricos::$inputCleaner = new Ab_CoreInputCleaner();
        Abricos::$phrases = new Ab_CorePhraseManager();

        if (!isset($config['module'])){
            $config['module'] = array();
        }

        if (!isset($config['JsonDB']['use']) || !$config['JsonDB']['use']){
            $config['JsonDB']['password'] = TIMENOW;
        }

        if (!isset($config['Misc']['language'])){
            $config['Misc']['language'] = 'ru';
        }

        Abricos::$LNG = $config['Misc']['language'];

        if (!isset($config['Misc']['locale'])){
            $config['Misc']['locale'] = 'ru-RU';
        }

        Abricos::$locale = $config['Misc']['locale'];

        Abricos::$DOMAIN = isset($config['Misc']['domain']) ? $config['Misc']['domain'] : '';

        $db = new Ab_DatabaseMySql($config['Database']['tableprefix']);
        $db->connect($config['Database']['dbname'], $config['Server']['servername'], $config['Server']['port'], $config['Server']['username'], $config['Server']['password']);
        $db->readonly = $config['Database']['readonly'];

        Abricos::$config = &$config;
        Abricos::$db = $db;

        $modules = new Ab_CoreModuleManager();
        Abricos::$modules = $modules;

        $modSysInfo = $modules->list->Get('sys');

        // TODO: временное решение в связи с переходом с CMSBrick на Abricos
        if (!empty($modSysInfo) && empty($modSysInfo->installDate)){
            Ab_CoreQuery::UpdateToAbricosPackage($db);
        }
        $modules->RegisterByName('sys');
        $modules->RegisterByName('user');

        Abricos::$user = UserModule::$instance->GetManager()->GetSessionManager()->Update();

        // проверка на наличие нового модуля в движке
        $smoddir = CWD."/modules/";
        $dir = dir($smoddir);
        while (($sDir = $dir->read()) !== false){
            if ($sDir != '.' && $sDir != '..' && is_dir($smoddir.$sDir)){
                $modInfo = $modules->list->Get($sDir);
                if (empty($modInfo)){ // модуль явно не зарегистрирован
                    // а модуль ли это?
                    if (file_exists($smoddir.$sDir."/module.php")){ // чтото похожее на него
                        // регистрируем его в системе
                        $modules->RegisterByName($sDir);
                    }
                }
            }
        }
        $this->BuildOutput();
    }

    private $_superContentFile;

    /**
     * Запрашивается ли супер-контент
     * Супер-контент должен располагаться по адресу /content/[lang]/...
     */
    public function IsSuperContent(){
        $adr = Abricos::$adress;

        $path = $adr->uri;

        $path = str_replace("\\", "/", $path);
        $path = str_replace("..", "", $path);
        $path = preg_replace("/[^0-9a-z\-_,\/\.]+/i", "", $path);

        if (!empty(Abricos::$config['supercontent']['path'])){
            $path = Abricos::$config['supercontent']['path']."/".Abricos::$locale.$path;
        } else {
            $path = CWD."/content/".Abricos::$LNG.$path;
        }

        if (!file_exists($path)){
            return false;
        }

        $this->_superContentFile = $path;

        return true;
    }

    private function BuildOutput(){
        // Определить модуль управления выводом
        $adress = Abricos::$adress;
        $modules = Abricos::$modules;
        $modman = null;

        $isSuperContent = false;

        // Основное управление сайтом ложится на системный модуль
        $modSys = Abricos::GetModule('sys');

        if ($this->IsSuperContent()){
            $modman = $modSys;
            $contentName = $this->_superContentFile;
            $isSuperContent = true;
        } else if ($adress->level >= 2 && $adress->dir[0] == 'ajax'){
            // TODO: remove
            $modman = $modSys;
            $contentName = 'ajax';
        } else if ($adress->level >= 2 && $adress->dir[0] == 'tajax'){
            // TODO: remove
            $modman = $modSys;
            $contentName = 'tajax';
        } else if ($adress->level >= 1 && $adress->dir[0] === 'api'){
            $modman = $modSys;
            $contentName = 'api';
        } else {
            $flagDevelopPage = $adress->level >= 2 && $adress->dir[1] == 'develop' && Abricos::$config['Misc']['develop_mode'];

            $aDir0 = isset($adress->dir[0]) ? $adress->dir[0] : "";

            for ($i = 0; $i < $modules->list->Count(); $i++){
                $info = $modules->list->GetByIndex($i);

                if ($aDir0 != $info->takelink || empty($info->takelink)){
                    continue;
                }
                $modman = $modules->RegisterByName($info->name);
                if (empty($modman)){
                    Abricos::SetPageStatus(PAGESTATUS_500);
                }
                break;
            }

            // сначало проверить в настройках
            if (is_null($modman)){
                $superModule = "";
                if (isset(Abricos::$config['Takelink']['__super']['module'])){
                    $superModule = Abricos::$config['Takelink']['__super']['module'];
                }
                if (!empty($superModule)){
                    $modman = $modules->RegisterByName($superModule);
                }
            }
            if (is_null($modman)){
                $modman = $modules->GetSuperModule();
            }
            if (is_null($modman)){
                $modman = $modSys;
            }

            // имя кирпича
            if ($flagDevelopPage){
                $contentName = 'develop';
            } else {
                $contentName = $modman->GetContentName();
            }
        }

        Brick::$modman = $modman;

        if (empty($contentName)){
            Abricos::$pageStatus = PAGESTATUS_404;
        }
        if (Abricos::$pageStatus != PAGESTATUS_OK){
            Brick::$modman = $modman = $modSys;
            $contentName = $modman->GetContentName();
            header("HTTP/1.1 404 Not Found");
        }

        $bm = new Ab_CoreBrickManager();

        Brick::$db = Abricos::$db;
        Brick::$input = Abricos::$inputCleaner;
        Brick::$modules = Abricos::$modules;
        Brick::$builder = new Ab_CoreBrickBuilder();
        Brick::$style = $modSys->GetPhrases()->Get('style', 'default');

        if (isset(Abricos::$config['module']['logs']['use'])
            && Abricos::$config['module']['logs']['use']
        ){
            $logsModule = $modules->RegisterByName('logs');
            if (!empty($logsModule)){
                /** @var LogsApp $logsApp */
                $logsApp = $this->GetApp('logs');
                $logsApp->AccessLogAppend();
            }
        }

        // возможно стиль предопределен в конфиге для этого урла

        if (!empty(Abricos::$config["Template"])){
            $uri = Abricos::$adress->requestURI;
            $cfg = &Abricos::$config["Template"];
            $find = false;

            if (!empty($cfg["ignore"])){
                foreach ($cfg["ignore"] as &$exp){
                    $find = $exp["regexp"] ? preg_match($exp["pattern"], $uri) : $exp["pattern"] == $uri;
                    if ($find){
                        break;
                    }
                }
            }
            if (!$find && !empty($cfg["exp"])){
                foreach ($cfg["exp"] as &$exp){
                    $find = $exp["regexp"] ? preg_match($exp["pattern"], $uri) : $exp["pattern"] == $uri;
                    if ($find){
                        Brick::$style = $exp["owner"];
                        break;
                    }
                }
            }
            if (!$find && !empty($cfg["default"])){
                Brick::$style = $cfg["default"]['owner'];
            }
        }


        if (is_array($contentName)){
            // поиск для перегруженных кирпичей
            $find = false;
            foreach ($contentName as $cname){
                if (file_exists(CWD."/tt/".Brick::$style."/override/".$modman->name."/content/".$cname.".html")){
                    $contentName = $cname;
                    $find = true;
                    break;
                }
            }
            if (!$find){
                foreach ($contentName as $cname){
                    if (file_exists(CWD."/modules/".$modman->name."/content/".$cname.".html")){
                        $contentName = $cname;
                        break;
                    }
                }
            }
        }

        $brick = $bm->BuildOutput($modman->name, $contentName, Brick::BRICKTYPE_CONTENT, null, null, $isSuperContent);

        if (Abricos::$pageStatus == PAGESTATUS_500){
            header("HTTP/1.1 500 Internal Server Error");
            exit;
        }

        // Любая сборка страницы начинается с кирпича BRICKTYPE_CONTENT
        // и обязательно содержит в себе шаблон, в который он будет входить.
        // Необходимо для дальнейшей компиляции страницы подчинить кирпич-контент
        // в кирпич-шаблон и определить его как последний собираемый кирпич
        $newChildren = array();
        $template = null;
        foreach ($brick->child as $childbrick){
            if ($childbrick->type == Brick::BRICKTYPE_TEMPLATE){
                $template = $childbrick;
            } else {
                $newChildren[] = $childbrick;
            }
        }

        if (is_null($template)){
            header("HTTP/1.1 500 Internal Server Error");
            print("Template not found. Add the started brick: [tt=main][/tt]");
            exit;
        }

        Brick::$builder->template = $template;
        $brick->child = $newChildren;
        $template->child[] = $brick;

        Brick::$builder->Compile($template);
    }


    /**
     * Статус собираемой странички
     *
     * @var string
     */
    public static $pageStatus = PAGESTATUS_OK;

    /**
     * Установка статуса страницы (производится единожды)
     *
     * @var $status
     */
    public static function SetPageStatus($status){
        if (Abricos::$pageStatus > PAGESTATUS_OK){
            return;
        }
        Abricos::$pageStatus = $status;
    }

    private static $_notification = null;

    /**
     * Менеджер доставки сообщений пользователям
     *
     * @return Ab_Notification
     */
    public static function Notify(){
        if (!is_null(Abricos::$_notification)){
            return Abricos::$_notification;
        }
        $modNotify = Abricos::GetModule('notify');
        if (empty($modNotify)){
            Abricos::$_notification = new Ab_Notification();
        } else {
            Abricos::$_notification = $modNotify->GetManager();
        }
        return Abricos::$_notification;
    }


    /**
     * Обработать глобальную переменную для безопасного использования
     *
     * @see Ab_CoreInputCleaner::clean_gpc()
     * @param string $source Тип глобальной переменной g, p, c, r or f (соответственно GET, POST, COOKIE, REQUEST и FILES)
     * @param string $varname Имя переменной
     * @param integer $vartype Тип переменной
     * @return mixed
     */
    public static function CleanGPC($source, $varname, $vartype = TYPE_NOCLEAN){
        return Abricos::$inputCleaner->clean_gpc($source, $varname, $vartype);
    }

    /**
     * Зарегистрировать модуль в платформе
     *
     * @see Ab_CoreModuleManager::Register()
     * @param Ab_Module $module Экземпляр класса модуля
     */
    public static function ModuleRegister(Ab_Module $module){
        Abricos::$modules->Register($module);
    }

    /**
     * Получить экземпляр модуля по его имени
     *
     * @see Ab_CoreModuleManager::GetModule()
     * @param string $modname имя модуля
     * @return Ab_Module зарегистрированный модуль в платформе
     */
    public static function GetModule($modname){
        return Abricos::$modules->GetModule($modname);
    }

    /**
     * Получить менеджер модуля
     *
     * @param string $modname имя модуля
     * @return Ab_ModuleManager менеджер модуля
     */
    public static function GetModuleManager($modname){
        $module = Abricos::GetModule($modname);
        if (empty($module)){
            return null;
        }
        return $module->GetManager();
    }

    /**
     * Парсер текста поступившего от пользователя (комментарии и т.п.)
     *
     * @return Ab_UserText
     */
    public static function TextParser($fullerase = false){
        require_once('usertext.php');
        return new Ab_UserText($fullerase);
    }


    private static $_json;

    /**
     * @return Services_JSON
     */
    public static function GetJSONManager(){
        if (empty(Abricos::$_json)){
            require_once CWD.'/includes/json/json.php';
            Abricos::$_json = new Services_JSON();
        }
        return Abricos::$_json;
    }

    private static $_appCache = array();

    public static function GetApp($moduleName){
        if (isset(Abricos::$_appCache[$moduleName])){
            return Abricos::$_appCache[$moduleName];
        }

        $module = Abricos::GetModule($moduleName);
        if (empty($module)){
            return null;
        }
        $manager = $module->GetManager();
        if (empty($manager)){
            return null;
        }
        $app = $manager->GetApp();
        Abricos::$_appCache[$moduleName] = $app;
        if (empty($app)){
            return null;
        }
        return $app;
    }

    /**
     * @var Ab_Structures
     */
    private static $_structures;

    /**
     * @param string $module
     * @param string $name
     *
     * @return Ab_Structure
     */
    public static function GetStructure($module, $name){
        if (!Abricos::$_structures){
            Abricos::$_structures = new Ab_Structures();
        }
        return Abricos::$_structures->Get($module, $name);
    }

}

define('PAGESTATUS_OK', 0);
define('PAGESTATUS_404', 404);
define('PAGESTATUS_500', 500);
