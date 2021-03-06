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
 * Менеджер системного модуля
 */
class SystemManager extends Ab_ModuleManager {

    /**
     * @var SystemManager
     */
    public static $instance;

    public function __construct(SystemModule $module){
        parent::__construct($module);

        SystemManager::$instance = $this;
    }

    public function IsAdminRole(){
        if ($this->IsRolesDisable()){
            return true;
        }
        return $this->IsRoleEnable(Ab_CoreSystemAction::ADMIN);
    }

    private $_adminManager = null;

    public function GetAdminManager(){
        if (empty($this->_adminManager)){
            require_once 'classes/admin.php';
            $this->_adminManager = new SystemManager_Admin($this);
        }
        return $this->_adminManager;
    }


    public function AJAX($d){
        $ret = $this->GetAdminManager()->AJAX($d);

        if (empty($ret)){
            $ret = new stdClass();
            $ret->err = 500;
        }

        return $ret;
    }

    public function Bos_MenuData(){
        if (!$this->IsAdminRole()){
            return null;
        }
        $i18n = $this->module->I18n();
        return array(
            array(
                "name" => "config",
                "title" => $i18n->Translate('bosmenu.config'),
                "icon" => "/modules/user/images/cpanel-24.png",
                "url" => "sys/wspace/ws",
                "parent" => "controlPanel"
            )
        );
    }

    public function Bos_SummaryData(){
        if (!$this->IsAdminRole()){
            return;
        }

        $i18n = $this->module->I18n();
        return array(
            array(
                "module" => "sys",
                "component" => "summary",
                "widget" => "SummaryWidget",
                "title" => $i18n->Translate('bosmenu.config'),
            )
        );
    }
}
