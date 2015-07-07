<?php

/*
class Ab_CoreI18nData {
    public $locale;

    public function __construct($data){

    }
}
/**/

class Ab_CoreI18n {

    /**
     * @var Ab_Module
     */
    public $module;

    /**
     * @var array
     */
    private $_locales = array();

    /**
     * @param $module Ab_Module
     */
    public function __construct($module){
        $this->module = $module;
    }

    private function _LoadLocale($locale){

        if ($locale === 'ru'){
            $locale = 'ru-RU';
        } else if ($locale === 'en'){
            $locale = 'en-EN';
        }

        $file = realpath(CWD."/modules/".$this->module->name."/i18n/".$locale.".php");

        $arr = array();
        if (file_exists($file)){
            $tarr = include($file);
            if (is_array($tarr)){
                $arr = $arr;
            }
        }

        $this->_locales[$locale] = $arr;
    }

    /**
     * @param string $locale
     * @return array
     */
    public function &GetData($locale = ''){
        if (empty($locale)){
            $locale = Abricos::$locale;
        }
        if (!isset($this->_locales[$locale])){
            $this->_LoadLocale($locale);
        }
        return $this->_locales[$locale];
    }

    private $_isSyncDefLocale = false;

    private function _SyncData(&$srcData, &$destData){
        foreach ($srcData as $key => $value){
            if (isset($destData[$key])){
                continue;
            }
            if (is_array($srcData[$key])){
                $destData[$key] = array();
                $this->_SyncData($srcData[$key], $destData[$key]);
            } else if (is_string($srcData[$key])){
                $destData[$key] = $srcData[$key];
            }
        }
    }

    private function _SyncDefLocale($locale){
        if ($this->_isSyncDefLocale){
            return;
        }
        $defLocale = $this->module->defaultLocale;
        if ($defLocale === $locale){
            $this->_isSyncDefLocale = true;
            return;
        }
        $this->_isSyncDefLocale = true;

        $this->_LoadLocale($defLocale);
        $defData = $this->GetData($defLocale);
        $data = $this->GetData($locale);
        $this->_SyncData($defData, $data);
    }

    public function Translate($phraseId, $locale = ''){
        if (empty($locale)){
            $locale = Abricos::$locale;
        }
        $data = $this->GetData($locale);

        $aPhrases = explode(".", $phraseId);
        for ($i = 0; $i < count($aPhrases); $i++){
            $id = $aPhrases[$i];

            if (!isset($data[$id])){
                if (!$this->_isSyncDefLocale){
                    $this->_SyncDefLocale($locale);
                    return $this->Translate($phraseId, $locale);
                }
                return '';
            }

            $data = $data[$id];
        }
        return $data;
    }
}


?>