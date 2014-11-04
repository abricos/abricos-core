<?php

require_once 'admin_structure.php';
require_once 'admin_dbquery.php';

class SystemManager_Admin {

    /**
     * @var SystemManager
     */
    public $manager;

    /**
     * @var Ab_Database
     */
    public $db;

    public function __construct(SystemManager $manager) {
        $this->manager = $manager;
        $this->db = $manager->db;
    }

    public function IsAdminRole() {
        return $this->manager->IsAdminRole();
    }

    public function AJAX($d) {
        switch ($d->do) {
            case "coreConfig":
                return $this->CoreConfigToAJAX();
            case "coreConfigSave":
                return $this->CoreConfigSaveToAJAX($d->coreConfig);
        }
        return null;
    }


    public function ModuleList() {
        if (!$this->IsAdminRole()) {
            return null;
        }

        Abricos::$modules->RegisterAllModule();
        $modules = Abricos::$modules->GetModules();
        $ret = array();
        foreach ($modules as $name => $mod) {
            if ($name == 'user' || $name == 'ajax') {
                continue;
            }
            array_push($ret, array(
                "id" => $name,
                "nm" => $name,
                "vs" => $mod->version,
                "rv" => $mod->revision
            ));
        }
        return $ret;
    }


    public function TemplateList() {
        if (!$this->IsAdminRole()) {
            return null;
        }

        $rows = array();
        $dir = dir(CWD."/tt");
        while (false !== ($entry = $dir->read())) {
            if ($entry == "." || $entry == ".." || empty($entry) || $entry == "_sys" || $entry == "_my") {
                continue;
            }
            if (!file_exists(CWD."/tt/".$entry."/main.html")) {
                continue;
            }
            array_push($rows, $entry);
        }

        return $rows;
    }

    public function CoreConfigToAJAX() {
        $config = $this->CoreConfig();
        if (empty($config)) {
            return 403;
        }

        $ret = new stdClass();
        $ret->coreConfig = $config;
        return $ret;
    }

    public function CoreConfig() {
        if (!$this->IsAdminRole()) {
            return null;
        }
        $phs = SystemModule::$instance->GetPhrases();

        $ret = new stdClass();
        $ret->site_name = $phs->Get('site_name')->value;
        $ret->site_title = $phs->Get('site_title')->value;
        $ret->admin_mail = $phs->Get('admin_mail')->value;
        $ret->meta_title = $phs->Get('meta_title')->value;
        $ret->meta_keys = $phs->Get('meta_keys')->value;
        $ret->meta_desc = $phs->Get('meta_desc')->value;
        $ret->style = $phs->Get('style')->value;
        $ret->styles = $this->TemplateList();

        return $ret;
    }

    public function CoreConfigSaveToAJAX($d){
        if (!$this->IsAdminRole()) {
            return null;
        }
        $phs = SystemModule::$instance->GetPhrases();
        $phs->Set('site_name', $d->site_name);
        $phs->Set('site_title', $d->site_title);
        $phs->Set('admin_mail', $d->admin_mail);
        $phs->Set('meta_title', $d->meta_title);
        $phs->Set('meta_keys', $d->meta_keys);
        $phs->Set('meta_desc', $d->meta_desc);
        $phs->Set('style', $d->style);

        Abricos::$phrases->Save();

        return $this->CoreConfigToAJAX();
    }

}

?>