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
            $files1 = globa(CWD."/modules/".$module->name."/brick/pub_*.html");
            $files2 = globa(CWD."/modules/".$module->name."/brick/p_*.html");

            if (!empty($files1)) {
                foreach ($files1 as $file) {
                    array_push($files, $file);
                }
            }
            if (!empty($files2)) {
                foreach ($files2 as $file) {
                    array_push($files, $file);
                }
            }
            foreach ($files as $file) {
                $bname = basename($file, ".html");
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
            $files = globa(CWD."/modules/".$module->name."/content/*.html");
            foreach ($files as $file) {
                $bname = basename($file, ".html");
                $key = $module->name.".".$bname;
                if (empty($brickdb[$key])) {
                    $brick = Ab_CoreBrickReader::ReadBrickFromFile($file, $module->name);
                    $brickid = Ab_CoreQuery::BrickAppendFromParser($this->db, $module->name, $bname, $brick->body,
                        Brick::BRICKTYPE_CONTENT, $brick->hash);
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

        $dir = dir(CWD."/tt/");
        while (($dirname = $dir->read())) {
            if ($dirname == "." || $dirname == ".." || empty($dirname)) {
                continue;
            }
            if ($dirname == "_sys" || $dirname == "_my") {
                continue;
            }

            $files = globa(CWD."/tt/".$dirname."/*.html");
            foreach ($files as $file) {
                $bname = basename($file, ".html");
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
                    array_push($param->module[$p['nm']], $bmod);
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
            array_push($arr, $val);
        }
    }

    public static function ReadBrick($owner, $name, $type) {
        $partPath = "";
        if ($type == Brick::BRICKTYPE_TEMPLATE) {
            // загрузка шаблона поставляемого с модулем
            if ($owner == "_my") {
                $path = CWD."/modules/".Brick::$modman->name."/tt/".$name.".html";

                // возможность перегрузить шаблон поставляемый с модулем
                $override = CWD."/tt/".Brick::$style."/override/".Brick::$modman->name."/tt/".$name.".html";
                if (file_exists($override)) {
                    $path = $override;
                }
            } else {
                $path = CWD."/tt/".$owner."/".$name.".html";
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
            $path = CWD."/modules/".$owner."/".$nextpath.$name.".html";

            // возможно c поставляемым шаблоном есть перегруженный кирпич
            $override = CWD."/tt/".Brick::$style."/override/".$owner."/".$nextpath.$name.".html";
            if (file_exists($override)) {
                $path = $override;
            }

            $overridePart = CWD."/tt/".Brick::$style."/override/".$owner."/".$nextPartPath.$name.".html";
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
        $ret = new stdClass();
        $ret->isError = false;
        if (!file_exists($file)) {
            $filebody = "File not found: ".$file;
            $ret->isError = true;
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

                    $arr = explode(".", $key);

                    $lang = & $mod->GetI18n();
                    $ph = null;
                    foreach ($arr as $s) {

                        if (is_array($lang[$s])) {
                            $lang = & $lang[$s];
                        } else if (is_string($lang[$s])) {
                            $ph = $lang[$s];
                            break;
                        }
                    }
                    if (!is_null($ph)) {
                        $filebody = str_replace("{#".$key."}", $ph, $filebody);
                    }
                }
            }
        }

        $pattern = "#<!--\[\*\](.+?)\[\*\]-->#is";
        $mathes = array();
        preg_match($pattern, $filebody, $mathes);
        $param = $mathes[1];

        $ret->hash = "";
        if (file_exists($file)) {
            $ret->hash = md5("sz".filesize($file)."tm".filemtime($file));
        }

        $ret->body = preg_replace($pattern, '', $filebody);
        $p = new Ab_CoreBrickParam();

        // локальные переменные кирпича
        $p->var = Ab_CoreBrickReader::BrickParseVar($param, "bkvar");
        $var = Ab_CoreBrickReader::BrickParseVar($param, "v");
        foreach ($var as $key => $value) {
            $p->var[$key] = $value;
        }

        // глобальные переменные
        $p->gvar = Ab_CoreBrickReader::BrickParseVar($param, "var");

        // подключаемые модули
        // объявление может быть из нескольких кирпичей с параметрами
        // например: [mod=mymod]mybrick1|p1=mystr|p2=10,mybrick2[/mod]
        $arr = Ab_CoreBrickReader::BrickParseVar($param, "mod");
        foreach ($arr as $key => $value) {
            if (!is_array($p->module[$key])) {
                $p->module[$key] = array();
            }

            $mods = explode(',', $value);
            foreach ($mods as $modstr) {
                // модуль и его параметры
                $tmp = explode("|", $modstr);
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
                array_push($p->module[$key], $bmod);
            }
        }

        // шаблон
        $arr = Ab_CoreBrickReader::BrickParseVar($param, "tt");
        foreach ($arr as $key => $value) {
            $p->template['name'] = $key;
            $p->template['owner'] = $value;
            break;
        }

        // Фразы
        $p->phrase = Ab_CoreBrickReader::BrickParseVar($param, "ph");
        $p->param = Ab_CoreBrickReader::BrickParseVar($param, "p");
        $p->script = Ab_CoreBrickReader::BrickParseValue($param, "script");

        // JavaScript модули
        $arr = Ab_CoreBrickReader::BrickParseVar($param, "mjs");
        foreach ($arr as $key => $value) {
            $p->jsmod[$key] = explode(',', $value);
        }

        // CSS файлы модуля
        $arr = Ab_CoreBrickReader::BrickParseVar($param, "mcss");
        foreach ($arr as $key => $value) {
            $p->cssmod[$key] = explode(',', $value);
        }

        // JavaScript файлы
        $p->jsfile = Ab_CoreBrickReader::BrickParseValue($param, "js");
        $p->css = Ab_CoreBrickReader::BrickParseValue($param, "css");

        $ret->param = $p;

        if (empty($partPath)) {
            return $ret;
        }

        $oData = Ab_CoreBrickReader::ReadBrickFromFile($partPath, $modname);

        if (is_array($oData->param->param)) {
            $oP = & $oData->param->param;
            foreach ($oP as $name => $key) {
                $ret->param->param[$name] = $key;
            }
        }
        if (is_array($oData->param->var)) {
            $oP = & $oData->param->var;
            foreach ($oP as $name => $key) {
                $ret->param->var[$name] = $key;
            }
        }
        return $ret;
    }

    private static function BrickParseValue($text, $name) {
        $array = array();

        /* Разбор - переменные кирпича */
        $pattern = "#\[".$name."\](.+?)\[/".$name."\]#is";
        while (true) {
            $mathes = array();
            if (preg_match($pattern, $text, $mathes) == 0)
                break;

            $array[$mathes[1]] = trim($mathes[1]);

            $text = preg_replace($pattern, "", $text, 1);
        }
        return $array;
    }

    private static function BrickParseVar($text, $name) {
        $array = array();

        /* Разбор - переменные кирпича */
        $pattern = "#\[".$name."=(.+?)\](.*?)\[/".$name."\]#is";

        while (true) {
            $mathes = array();

            if (preg_match($pattern, $text, $mathes) == 0)
                break;

            $array[$mathes[1]] = trim($mathes[2]);

            $text = preg_replace($pattern, "", $text, 1);
        }
        return $array;
    }

}

?>