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
 * Class AbricosModelStructureField
 */
class AbricosModelStructureField extends AbricosItem {

    /**
     * @var AbricosModelManager
     */
    public $manager;

    /**
     * @var string
     */
    public $name;

    /**
     * Field type
     *
     * @var string Values: 'string|int|bool|double|date|multiLang|model|modelList|array|object'
     */
    public $type = 'string';

    /**
     * Parse method
     *
     * @var string Values: empty | 'standart|full'
     */
    public $parse = '';

    /**
     * @var string
     */
    public $typeClass;

    /**
     * @var string
     */
    public $typeModule;

    /**
     * Default value
     *
     * @var mixed
     */
    public $default;

    /**
     * JSON name
     *
     * @var string
     */
    public $json;

    /**
     * @var string
     */
    public $dbField;

    /**
     * @var bool
     */
    public $personal;

    /**
     * @var string
     */
    public $rolefn = null;

    /**
     * @var string
     */
    public $valid;

    public $notNULL;

    /**
     * @param AbricosModelManager $manager
     * @param string $name
     * @param null $data
     */
    public function __construct($manager, $name, $data = null){
        $this->manager = $manager;
        $this->name = $this->id = $name;

        if (empty($data)){
            return;
        }
        if (isset($data->type)){
            $type = trim($data->type);
            $a = explode(':', $type);
            if (count($a) === 3){
                $type = trim($a[0]);
                $this->typeModule = trim($a[1]);
                $this->typeClass = trim($a[2]);
            } else if (count($a) === 2){
                $type = trim($a[0]);
                $this->typeClass = trim($a[1]);
            }

            switch ($type){
                case 'string':
                case 'int':
                case 'bool':
                case 'double':
                case 'date':
                case 'array':
                case 'object':
                case 'multiLang':
                case 'model':
                case 'modelList':
                case 'list': // TODO: deprecated
                    $this->type = $type;
                    break;
            }
        }
        if (isset($data->default)){
            $this->default = $this->TypeVal($data->default);
        }
        if (isset($data->dbField)){
            $this->dbField = $data->dbField;
        }
        if (isset($data->json)){
            $this->json = $data->json;
        }
        if (isset($data->personal)){
            $this->personal = $data->personal;
        }
        if (isset($data->rolefn)){
            $this->rolefn = $data->rolefn;
        }
        if (isset($data->valid)){
            $this->valid = $data->valid;
        }
        if (isset($data->notNULL)){
            $this->notNULL = $data->notNULL;
        }
        if (isset($data->parse)){
            $this->parse = $data->parse;
        }
    }

    /**
     * @var Ab_UserText
     */
    private static $_utm;

    /**
     * @var Ab_UserText
     */
    private static $_utmf;

    public function TypeVal($value){
        if ($this->type === 'string'){
            $value = strval($value);

            if ($this->parse === 'standard'){
                if (empty(AbricosModelStructureField::$_utm)){
                    AbricosModelStructureField::$_utm = Abricos::TextParser();
                }
                $value = AbricosModelStructureField::$_utm->Parser($value);
            } else if ($this->parse === 'full'){
                if (empty(AbricosModelStructureField::$_utmf)){
                    AbricosModelStructureField::$_utmf = Abricos::TextParser(true);
                }
                $value = AbricosModelStructureField::$_utmf->Parser($value);
            }

            if (empty($this->valid)){
                return $value;
            }
            $a = explode(",", $this->valid);
            $count = count($a);
            for ($i = 0; $i < $count; $i++){
                if ($a[$i] === $value){
                    return $value;
                }
            }
            return null;
        }
        switch ($this->type){
            case 'bool':
                return !!$value;
            case 'int':
            case 'date':
                return intval($value);
            case 'double':
                return doubleval($value);
        }
        return $value;
    }

    public function ToJSON(){
        $ret = parent::ToJSON();
        unset($ret->id);
        $ret->name = $this->name;
        $ret->type = $this->type;
        if (isset($this->typeModule)){
            $ret->type .= ':'.$this->typeModule;
        }
        if (isset($this->typeClass)){
            $ret->type .= ':'.$this->typeClass;
        }
        if (isset($this->default)){
            $ret->default = $this->default;
        }
        if (isset($this->json)){
            $ret->json = $this->json;
        }
        if (isset($this->valid)){
            $ret->valid = $this->valid;
        }
        return $ret;
    }
}

class AbricosStructure extends AbricosList {
    /**
     * @var AbricosModelManager
     */
    public $manager;

    /**
     * AbricosStructure constructor.
     *
     * @param AbricosModelManager $manager
     * @param array|null $fields
     */
    public function __construct($manager, $fields = null){
        $this->manager = $manager;

        if (!empty($fields)){
            foreach ($fields as $fieldName => $value){
                $this->Add(new AbricosModelStructureField($this->manager, $fieldName, $value));
            }
        }

    }
}

/**
 * Class AbricosModelStructure
 *
 * @method AbricosModelStructureField GetByIndex(int $i)
 * @method AbricosModelStructureField Get(string $name)
 */
class AbricosModelStructure extends AbricosStructure {

    /**
     * @var string
     */
    public $name;

    /**
     * @var string
     */
    public $idField = 'id';

    /**
     * @var string
     */
    public $type = 'model';

    /**
     * @param AbricosModelManager $manager
     * @param string $name
     * @param mixed $data
     */
    public function __construct($manager, $name, $data = null){
        $this->name = $name;

        if (isset($data->idField)){
            $this->idField = $data->idField;
        }

        $fields = null;
        if (isset($data->fields)){
            $fields = $data->fields;
        }

        parent::__construct($manager, $fields);
    }

    public function DataFix($data, $isArray){
        if (!$isArray && is_array($data)){
            $data = array_to_object($data);
        }
        if ($isArray && is_object($data)){
            $data = get_object_vars($data);
        }
        $count = $this->Count();
        for ($i = 0; $i < $count; $i++){
            $field = $this->GetByIndex($i);
            $name = $field->name;

            if ($isArray){
                if (!isset($data[$name])){
                    $data[$name] = null;
                }
                $data[$name] = $field->TypeVal($data[$name]);
            } else {
                if (!isset($data->$name)){
                    $data->$name = null;
                }
                $data->$name = $field->TypeVal($data->$name);
            }
        }
        return $data;
    }

    public function DataFixToObject($data){
        return $this->DataFix($data, false);
    }

    public function DataFixToArray($data){
        return $this->DataFix($data, true);
    }

    public function ToJSON(){
        $ret = parent::ToJSON();
        $ret->name = $this->name;
        $ret->type = $this->type;
        $ret->fields = $ret->list;
        if ($this->idField !== 'id'){
            $ret->idField = $this->idField;
        }
        unset($ret->list);

        return $ret;
    }
}

class AbricosModelListStructure extends AbricosModelStructure {

    public $type = 'modelList';

    /**
     * @var string
     */
    public $itemType;

    public function __construct($manager, $name, $data = null){
        parent::__construct($manager, $name, $data);

        if (!isset($data->itemType)){
            throw new Exception("ItemType not set in ModelList Structure `$name`");
        }
        $this->itemType = $data->itemType;
    }
}

class AbricosResponseStructureCode extends AbricosItem {

    /**
     * @var int
     */
    public $code = 0;

    /**
     * @var string
     */
    public $msg = '';

    public function __construct($name, $data){
        $this->id = $name;

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
            throw new Exception('Code is not set in AbricosResponseStructureCode');
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

class AbricosResponseStructureCodeList extends AbricosList {

    public function __construct($codes = null){
        if (!empty($codes)){
            foreach ($codes as $name => $value){
                $this->Add(new AbricosResponseStructureCode($name, $value));
            }
        }
    }

    public function __get($name){
        /** @var AbricosResponseStructureCode $item */
        $item = $this->Get($name);
        if (empty($item)){
            throw new Exception("Code `$name` not found in AbricosResponseStructureCodeList");
        }
        return $item->code;
    }
}

class AbricosResponseStructure extends AbricosModelStructure {

    /**
     * @var AbricosStructure
     */
    public $vars;

    public $codes;

    public function __construct($manager, $name, $data){
        parent::__construct($manager, $name, $data);

        $this->type = 'response';

        $fields = isset($data->vars) ? $data->vars : null;
        $this->vars = new AbricosStructure($manager, $fields);


        $codes = isset($data->codes) ? $data->codes : null;
        $this->codes = new AbricosResponseStructureCodeList($codes);
    }

    public function ToJSON(){
        $ret = parent::ToJSON();
        $ret->vars = $this->vars->ToJSON()->list;
        $ret->codes = $this->codes->ToJSON()->list;
        return $ret;
    }
}
