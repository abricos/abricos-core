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
 * Class Ab_CoreI18n
 */
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

    public function LocaleNormalize($locale){
        if (empty($locale)){
            $locale = Abricos::$locale;
        }
        if ($locale === 'ru'){
            $locale = 'ru-RU';
        } else if ($locale === 'en'){
            $locale = 'en-EN';
        }
        return $locale;
    }

    private function _LoadLocale($locale){
        $locale = $this->LocaleNormalize($locale);
        if (array_key_exists($locale, $this->_locales)){
            return;
        }
        $file = CWD."/modules/".$this->module->name."/i18n/".$locale.".php";

        if (!file_exists($file)){
            // TODO: support for older versions
            if ($locale === 'ru-RU'){
                $file = CWD."/modules/".$this->module->name."/i18n/ru.php";
            } else if ($locale === 'en-EN'){
                $file = CWD."/modules/".$this->module->name."/i18n/en.php";
            }
        }

        $arr = array();
        if (file_exists($file)){
            $tarr = include($file);
            if (is_array($tarr)){
                $arr = $tarr;
            }
        }
        $this->_locales[$locale] = &$arr;
    }

    public function LoadBrickLocale($type, $name, $locale = ''){
        $defLocale = $this->module->defaultLocale;
        if ($locale !== $defLocale){
            $this->LoadBrickLocale($type, $name, $defLocale);
        }

        $locale = $this->LocaleNormalize($locale);
        $file = CWD."/modules/".$this->module->name."/";
        switch ($type){
            case Brick::BRICKTYPE_BRICK:
                $typeName = "brick";
                break;
            case Brick::BRICKTYPE_CONTENT:
                $typeName = "content";
                break;
            default:
                return;
        }
        $file .= $typeName."/i18n/".$name."_".$locale.".json";

        if (!file_exists($file)){
            return;
        }

        $this->_LoadLocale($locale);

        $data = &$this->_locales[$locale];

        if (!isset($data[$typeName])){
            $data[$typeName] = array();
        }

        $json = file_get_contents($file);
        $data[$typeName][$name] = json_decode($json, true);
    }

    /**
     * @param string $locale
     * @return array
     */
    public function &GetData($locale = ''){
        $locale = $this->LocaleNormalize($locale);
        if (!isset($this->_locales[$locale])){
            $this->_LoadLocale($locale);
        }
        return $this->_locales[$locale];
    }

    public function Translate($phraseId, $locale = ''){
        $locale = $this->LocaleNormalize($locale);
        $data = $this->GetData($locale);

        $aPhrases = explode(".", $phraseId);
        for ($i = 0; $i < count($aPhrases); $i++){
            $id = $aPhrases[$i];

            if (!isset($data[$id])){
                $defLocale = $this->module->defaultLocale;
                if ($locale !== $defLocale){
                    return $this->Translate($phraseId, $defLocale);
                }
                return '';
            }

            $data = $data[$id];
        }
        return $data;
    }
}
