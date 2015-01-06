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
            case "moduleList":
                return $this->ModuleListToAJAX();
        }
        return null;
    }


    public function ModuleListToAJAX() {
        if (!$this->IsAdminRole()) {
            return 403;
        }
        Abricos::$modules->RegisterAllModule();
        $ret = new stdClass();
        $ret->moduleList = Abricos::$modules->list->ToAJAX();
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
            $rows[] = $entry;
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

    public function CoreConfigSaveToAJAX($d) {
        if (!$this->CoreConfigSave($d)) {
            return 403;
        }
        return $this->CoreConfigToAJAX();
    }

    public function CoreConfigSave($d) {
        if (!$this->IsAdminRole()) {
            return false;
        }
        $d = array_to_object($d);

        $phs = SystemModule::$instance->GetPhrases();
        if (isset($d->site_name)) {
            $phs->Set('site_name', $d->site_name);
        }
        if (isset($d->site_title)) {
            $phs->Set('site_title', $d->site_title);
        }
        if (isset($d->admin_mail)) {
            $phs->Set('admin_mail', $d->admin_mail);
        }
        if (isset($d->meta_title)) {
            $phs->Set('meta_title', $d->meta_title);
        }
        if (isset($d->meta_keys)) {
            $phs->Set('meta_keys', $d->meta_keys);
        }
        if (isset($d->meta_desc)) {
            $phs->Set('meta_desc', $d->meta_desc);
        }
        if (isset($d->style)) {
            $phs->Set('style', $d->style);
        }

        Abricos::$phrases->Save();

        return true;
    }


}

?>