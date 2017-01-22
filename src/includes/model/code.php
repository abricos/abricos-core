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
 * Class Ab_Code
 */
class Ab_Code extends AbricosItem {

    public $code;
    public $msg = '';

    public function __construct($id, $data){
        $this->id = $id;

        $code = null;

        if (is_integer($data)){
            $code = $data;
        } else if (is_object($data)){
            if (isset($data->code)){
                $code = intval($data->code);
            }
            if (isset($data->msg)){
                $this->msg = strval($data->msg);
            }
        }

        if (!is_integer($code)){
            throw new Exception('Code is not set in Ab_Code');
        }
        $this->code = $code;
    }

    public function ToJSON(){
        $ret = parent::ToJSON();
        $ret->code = $this->code;
        if (!empty($this->msg)){
            $ret->msg = $this->msg;
        }
        return $ret;
    }
}

class Ab_Codes extends AbricosList {

    public function __construct($codes = null){
        if (empty($codes)){
            return;
        }

        foreach ($codes as $id => $data){
            $this->Add(new Ab_Code($id, $data));
        }
    }

    public function __get($name){
        /** @var Ab_Code $item */
        $item = $this->Get($name);
        if (empty($item)){
            throw new Exception("Code `$name` not found in Ab_Codes");
        }
        return $item->code;
    }
}