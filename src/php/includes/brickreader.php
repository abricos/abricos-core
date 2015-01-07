<?php

/**
 * Загрузчик кирпича
 *
 * @package Abricos
 * @subpackage Core
 * @link http://abricos.org
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */
class Ab_CoreBrickReader {

    const FILE_EXT = ".json";

    public $isAdmin = false;

    /**
     * Database
     *
     * @var Ab_Database
     */
    public $db = null;

    public function __construct() {
        $this->db = Abricos::$db;
        Abricos::GetModule('sys')->GetManager();
        $this->isAdmin = Ab_CoreSystemManager::$instance->IsAdminRole();
    }

    /**
     * Проверка на изменение кирпичей движка
     *
     */
    public function CheckBrickVersion() {
        $this->checkTemplateFiles();
        $this->checkBrickFiles();
        $this->checkContentFiles();
    }

    private function checkBrickFiles() {
        if (!$this->isAdmin) {
            return;
        }

        $brickdb = array();
        $db = Abricos::$db;

        $rows = Ab_CoreQuery::BrickListFromParser($db, Brick::BRICKTYPE_BRICK);
        while (($row = $db->fetch_array($rows))) {
            $brickdb[$row['own'].".".$row['nm']] = $row;
        }

        $mods = Abricos::$modules->RegisterAllModule();
        foreach ($mods as $module) {
            $files = array();
            $files1 = globa(CWD."/modules/".$module->name."/brick/pub_*".Ab_CoreBrickReader::FILE_EXT);
            $files2 = globa(CWD."/modules/".$module->name."/brick/p_*".Ab_CoreBrickReader::FILE_EXT);

            if (!empty($files1)) {
                foreach ($files1 as $file) {
                    $files[] = $file;
                }
            }
            if (!empty($files2)) {
                foreach ($files2 as $file) {
                    $files[] = $file;
                }
            }
            foreach ($files as $file) {
                $bname = basename($file, Ab_CoreBrickReader::FILE_EXT);
                $key = $module->name.".".$bname;
                if (empty($brickdb[$key])) {
                    $brick = Ab_CoreBrickReader::ReadBrickFromFile($file, $module->name);
                    $brickid = Ab_CoreQuery::BrickAppendFromParser($this->db, $module->name, $bname, $brick->body, Brick::BRICKTYPE_BRICK, $brick->hash);
                    Ab_CoreQuery::BrickParamAppendFromParser($this->db, $brickid, $brick->param);
                } else {
                    $bk = $brickdb[$key];
                    if (empty($bk['ud'])) {
                        $brick = Ab_CoreBrickReader::ReadBrickFromFile($file, $module->name);
                        if ($bk['hh'] != $brick->hash) {
                            Ab_CoreQuery::BrickSaveFromParser($this->db, $bk['id'], $brick->body, $brick->hash);
                            Ab_CoreQuery::BrickParamAppendFromParser($this->db, $bk['id'], $brick->param);
                        }
                    }
                }
            }
        }
    }

    private function checkContentFiles() {
        if (!$this->isAdmin) {
            return;
        }

        $brickdb = array();
        $db = Abricos::$db;

        $rows = Ab_CoreQuery::BrickListFromParser($db, Brick::BRICKTYPE_CONTENT);
        while (($row = $db->fetch_array($rows))) {
            $brickdb[$row['own'].".".$row['nm']] = $row;
        }

        $mods = Abricos::$modules->RegisterAllModule();
        foreach ($mods as $module) {
            $files = globa(CWD."/modules/".$module->name."/content/*".Ab_CoreBrickReader::FILE_EXT);
            foreach ($files as $file) {
                $bname = basename($file, Ab_CoreBrickReader::FILE_EXT);
                $key = $module->name.".".$bname;
                if (empty($brickdb[$key])) {
                    $brick = Ab_CoreBrickReader::ReadBrickFromFile($file, $module->name);
                    $brickid = Ab_CoreQuery::BrickAppendFromParser($this->db, $module->name, $bname, $brick->body, Brick::BRICKTYPE_CONTENT, $brick->hash);
                    Ab_CoreQuery::BrickParamAppendFromParser($this->db, $brickid, $brick->param);
                } else {
                    $bk = $brickdb[$key];
                    if (empty($bk['ud'])) {
                        $brick = Ab_CoreBrickReader::ReadBrickFromFile($file, $module->name);
                        if ($bk['hh'] != $brick->hash) {
                            Ab_CoreQuery::BrickSaveFromParser($this->db, $bk['id'], $brick->body, $brick->hash);
                            Ab_CoreQuery::BrickParamAppendFromParser($this->db, $bk['id'], $brick->param);
                        }
                    }
                }
            }
        }
    }

    private function checkTemplateFiles() {
        if (!$this->isAdmin) {
            return;
        }

        $template = array();
        $db = Abricos::$db;

        $rows = Ab_CoreQuery::BrickListFromParser($db, Brick::BRICKTYPE_TEMPLATE);
        while (($row = $db->fetch_array($rows))) {
            $template[$row['own'].".".$row['nm']] = $row;
        }

        $dir = dir(CWD."/template/");
        while (($dirname = $dir->read())) {
            if ($dirname == "." || $dirname == ".." || empty($dirname)) {
                continue;
            }
            if ($dirname == "_sys" || $dirname == "_my") {
                continue;
            }

            $files = globa(CWD."/template/".$dirname."/*".Ab_CoreBrickReader::FILE_EXT);
            foreach ($files as $file) {
                $bname = basename($file, Ab_CoreBrickReader::FILE_EXT);
                $key = $dirname.".".$bname;

                if (empty($template[$key])) {
                    $brick = Ab_CoreBrickReader::ReadBrickFromFile($file);
                    $brickid = Ab_CoreQuery::BrickAppendFromParser($this->db, $dirname, $bname, $brick->body, Brick::BRICKTYPE_TEMPLATE, $brick->hash);
                    Ab_CoreQuery::BrickParamAppendFromParser($this->db, $brickid, $brick->param);
                } else {
                    $bk = $template[$key];
                    if (empty($bk['ud'])) {
                        $brick = Ab_CoreBrickReader::ReadBrickFromFile($file);
                        if ($bk['hh'] != $brick->hash) {
                            Ab_CoreQuery::BrickSaveFromParser($this->db, $bk['id'], $brick->body, $brick->hash);
                            Ab_CoreQuery::BrickParamAppendFromParser($this->db, $bk['id'], $brick->param);
                        }
                    }
                }
            }
        }
    }

    public static function SyncParamFromDB(Ab_CoreBrickParam $param, $customParam) {
        foreach ($customParam as $p) {
            switch ($p['tp']) {
                case Brick::BRICKPRM_CSS:
                    Ab_CoreBrickReader::SyncParamVar($param->css, $p['v']);
                    break;
                case Brick::BRICKPRM_GLOBALVAR:
                    $param->gvar[$p['nm']] = $p['v'];
                    break;
                case Brick::BRICKPRM_JSFILE:
                    Ab_CoreBrickReader::SyncParamVar($param->jsfile, $p['v']);
                    break;
                case Brick::BRICKPRM_JSMOD:
                    if (!is_array($param->jsmod[$p['nm']])) {
                        $param->jsmod[$p['nm']] = array();
                    }
                    Ab_CoreBrickReader::SyncParamVar($param->jsmod[$p['nm']], $p['v']);
                    break;

                case Brick::BRICKPRM_CSSMOD:
                    if (!is_array($param->cssmod[$p['nm']])) {
                        $param->cssmod[$p['nm']] = array();
                    }
                    Ab_CoreBrickReader::SyncParamVar($param->cssmod[$p['nm']], $p['v']);
                    break;

                case Brick::BRICKPRM_MODULE:
                    if (!is_array($param->module[$p['nm']])) {
                        $param->module[$p['nm']] = array();
                    }
                    // модуль и его параметры
                    $tmp = explode("|", $p['v']);
                    // если кирпич обявляется несколько раз с разными параметрами, то
                    // необходимо идентифицировать его по id
                    $brickname = $tmp[0];
                    $inparam = array();
                    $cnt = count($tmp);
                    for ($i = 1; $i < $cnt; $i++) {
                        $ttmp = explode("=", $tmp[$i]);
                        $inparam[$ttmp[0]] = $ttmp[1];
                    }
                    $bmod = new stdClass();
                    $bmod->name = $brickname;
                    if (count($inparam) > 0) {
                        $bmod->param = $inparam;
                    }
                    $param->module[$p['nm']][] = $bmod;
                    break;
                case Brick::BRICKPRM_PARAM:
                    if (!is_array($param->param[$p['nm']])) {
                        $param->param[$p['nm']] = array();
                    }
                    Ab_CoreBrickReader::SyncParamVar($param->param[$p['nm']], $p['v']);
                case Brick::BRICKPRM_PHRASE:
                    $param->phrase[$p['nm']] = $p['v'];
                    break;
                case Brick::BRICKPRM_SCRIPT:
                    Ab_CoreBrickReader::SyncParamVar($param->script, $p['v']);
                    break;
                case Brick::BRICKPRM_TEMPLATE:
                    $param->template['name'] = $p['nm'];
                    $param->template['owner'] = $p['v'];
                    break;
                case Brick::BRICKPRM_VAR:
                    $param->var[$p['nm']] = $p['v'];
                    break;
            }
        }
    }

    private static function SyncParamVar(&$arr, $val) {
        $find = false;
        foreach ($arr as $inval) {
            if ($inval == $val) {
                $find = true;
                break;
            }
        }
        if (!$find) {
            $arr[] = $val;
        }
    }

    public static function ReadBrick($owner, $name, $type) {
        $partPath = "";
        if ($type == Brick::BRICKTYPE_TEMPLATE) {
            // загрузка шаблона поставляемого с модулем
            if ($owner == "_my") {
                $path = CWD."/modules/".Brick::$modman->name."/template/".$name.Ab_CoreBrickReader::FILE_EXT;

                // возможность перегрузить шаблон поставляемый с модулем
                $override = CWD."/template/".Brick::$style."/override/".Brick::$modman->name."/template/".$name.Ab_CoreBrickReader::FILE_EXT;
                if (file_exists($override)) {
                    $path = $override;
                }
            } else {
                $path = CWD."/template/".$owner."/".$name.Ab_CoreBrickReader::FILE_EXT;
            }
        } else {
            $nextpath = "";
            $nextPartPath = "";
            switch ($type) {
                case Brick::BRICKTYPE_BRICK:
                    $nextpath = "brick/";
                    $nextPartPath = "brick-part/";
                    break;
                case Brick::BRICKTYPE_CONTENT:
                    $nextpath = "content/";
                    $nextPartPath = "content-part/";
                    break;
            }
            $path = CWD."/modules/".$owner."/".$nextpath.$name.Ab_CoreBrickReader::FILE_EXT;

            // возможно c поставляемым шаблоном есть перегруженный кирпич
            $override = CWD."/template/".Brick::$style."/override/".$owner."/".$nextpath.$name.Ab_CoreBrickReader::FILE_EXT;
            if (file_exists($override)) {
                $path = $override;
            }

            $overridePart = CWD."/template/".Brick::$style."/override/".$owner."/".$nextPartPath.$name.Ab_CoreBrickReader::FILE_EXT;
            if (file_exists($overridePart)) {
                $partPath = $overridePart;
            }

            if ($type == Brick::BRICKTYPE_CONTENT && !file_exists($path)) {
                Abricos::$pageStatus = PAGESTATUS_500;
            }

        }
        return Ab_CoreBrickReader::ReadBrickFromFile($path, $owner, $partPath);
    }

    public static function ReadBrickFromFile($file, $modname = '', $partPath = '') {

        $p = new Ab_CoreBrickParam();
        $ret = new stdClass();
        $ret->isError = false;
        $ret->param = $p;

        if (!file_exists($file)) {
            $ret->isError = true;
            $ret->body = "File not found: ".$file;
            return $ret;
        } else {
            $filebody = file_get_contents($file);
        }

        // чтение и обработка языковых фраз в контенте кирпича
        $lngs = array();
        preg_match_all("/\{#[0-9a-zA-Z_.]+\}/", $filebody, $lngs);

        if (is_array($lngs) && is_array($lngs[0]) && count($lngs[0]) > 0) {
            $mod = Abricos::GetModule($modname);
            if (!empty($mod)) {
                foreach ($lngs[0] as $value) {
                    $key = str_replace("{#", "", $value);
                    $key = str_replace("}", "", $key);

                    $lang = $mod->GetI18n();

                    $arr = explode(".", $key);

                    $ph = null;
                    foreach ($arr as $s) {
                        if (!isset($lang) || !isset($lang[$s]) ){
                            break;
                        }
                        if (is_array($lang[$s])) {
                            $lang = &$lang[$s];
                        } else if (is_string($lang[$s])) {
                            $ph = $lang[$s];
                            break;
                        }
                    }
                    if (!is_null($ph)) {
                        $ph = addslashes($ph);
                        $filebody = str_replace("{#".$key."}", $ph, $filebody);
                    }
                }
            }
        }

        $data = json_decode($filebody);

        $ret->hash = "";
        if (file_exists($file)) {
            $ret->hash = md5("sz".filesize($file)."tm".filemtime($file));
        }

        $ret->body = $data->content;

        // локальные переменные кирпича
        if (isset($data->var)){
            $p->var = object_to_array($data->var);
        }

        // глобальные переменные
        if (isset($data->globalVar)){
            $p->gvar = object_to_array($data->globalVar);
        }

        // подключаемые модули
        // объявление может быть из нескольких кирпичей с параметрами
        // например: [mod=mymod]mybrick1|p1=mystr|p2=10,mybrick2[/mod]
        if (isset($data->module)){
            foreach ($data->module as $modName => $modObj){
                $p->module[$modName] = array();
                if (isset($modObj->brick)){
                    $bmod = new stdClass();
                    for ($i = 0; $i < count($modObj->brick); $i++){
                        if (is_string($modObj->brick[$i])){
                            $bmod->name = $modObj->brick[$i];
                        }else{
                            $bmod->name = $modObj->brick[$i]->name;
                            if (isset($modObj->brick[$i]->args)){
                                $bmod->param = object_to_array($modObj->brick[$i]->args);
                            }
                        }
                    }
                    $p->module[$modName][] = $bmod;
                }
                // Фразы
                if (isset($modObj->phrase)){
                    foreach ($modObj->phrase as $phName => $phVal){
                        $p->phrase[$modName.":".$phName] = $phVal;
                    }
                }
                // CSS файлы модуля
                if (isset($modObj->css)){
                    $p->cssmod[$modName] = array();
                    for ($i = 0; $i < count($modObj->css); $i++){
                        $p->cssmod[$modName][] = $modObj->css[$i];
                    }
                }
                // JavaScript модули
                if (isset($modObj->js)){
                    $p->jsmod[$modName] = $modObj->js;
                }
            }
        }

        // шаблон
        if (isset($data->template)){
            $p->template['name'] = $data->template->name;
            $p->template['owner'] = $data->template->owner;
        }

        // параметры
        if (isset($data->parameter)){
            $p->param = object_to_array($data->parameter);
        }

        if (isset($data->script)){
            $p->script = $data->script;
        }

        // JavaScript файлы
        if (isset($data->jsFile)){
            $p->jsfile = $data->jsFile;
        }

        // Свободные CSS файлы шаблона
        if (isset($data->cssFile)){
            $p->css = $data->cssFile;
        }

        // CSS файлы шаблона
        if (isset($data->templateCSSFile)){
            $p->tcss = $data->templateCSSFile;
        }

        if (empty($partPath)) {
            return $ret;
        }

        $oData = Ab_CoreBrickReader::ReadBrickFromFile($partPath, $modname);

        if (is_array($oData->param->param)) {
            $oP = &$oData->param->param;
            foreach ($oP as $name => $key) {
                $ret->param->param[$name] = $key;
            }
        }
        if (is_array($oData->param->var)) {
            $oP = &$oData->param->var;
            foreach ($oP as $name => $key) {
                $ret->param->var[$name] = $key;
            }
        }
        return $ret;
    }



}

?>