<?php

abstract class AbricosAPI {

    public $apiMethods = array();

    public function AddAPIMethods($version, $methods){
        $this->apiMethods[$version] = $methods;
    }


    public function Run(){
        $adress = Abricos::$adress;
        $aGetURL = array_slice($adress->dir, 2);

        if (count($aGetURL) === 0){
            return new AbricosAPIResponse400();
        }

        $version = $aGetURL[0];

        if (!isset($this->apiMethods[$version])){
            return (new AbricosAPIResponse400())->BadVersion($version);
        }

        $aGetURL = array_slice($aGetURL, 1);

        $methods = $this->apiMethods[$version];

        $funcName = $methods->GetFuncName($aGetURL);

        if (empty($funcName) || !method_exists($methods, $funcName)){
            return (new AbricosAPIResponse400())->MethodNotDefined($funcName);
        }

        $result = $methods->$funcName();

        if ($result instanceof AbricosAPIResponse){
            return $result;
        }

        $response = new AbricosAPIResponse();
        $response->data = $result;
        return $response;
    }
}

abstract class AbricosAPIMethods {
    public $routes = array();

    public function AddGetRoute($url, $funcName){

        $this->routes[$url] = $funcName;

        return $this;
    }

    public function AddPostRoute($url, $funcName){

        $this->routes[$url] = $funcName;

        return $this;
    }

    public function GetFuncName($aURL){
        foreach ($this->routes as $key => $funcName){
            $a = explode("/", $key);
            $find = true;
            for ($i = 0; $i < count($a); $i++){
                if (!isset($aURL[$i]) || $aURL[$i] !== $a[$i]){
                    $find = false;
                    continue;
                }
            }
            if ($find){
                return $funcName;
            }
        }
        return "";
    }

    public function GetPostParam($paramName){
        $val = Abricos::CleanGPC('p', $paramName, TYPE_STR);
        return $val;
    }

    public function GetPostParams($params){
        $ret = new stdClass();
        foreach ($params as $paramName){
            $ret->$paramName = $this->GetPostParam($paramName);
        }
        return $ret;
    }

}

class AbricosAPIResponse {

    public $headers = array(
        "status" => "HTTP/1.1 200 OK",
        "type" => "Content-Type: application/json"
    );

    public $errorCode = "";

    public $message = "";

    public $data = null;

    public function __construct(){
        $this->headers['auth'] =
            'Authorization: Session '.
            UserModule::$instance->GetManager()->GetSessionManager()->key;
    }

    public function ToJSON(){

        if (!empty($this->data)){
            return $this->data;
        }

        $ret = new stdClass();
        if (!empty($this->errorCode)){
            $ret->err = $this->errorCode;
        }
        if (!empty($this->message)){
            $ret->msg = $this->message;
        }
        if (!empty($this->message)){
            $ret->msg = $this->message;
        }

        return $ret;
    }
}

class AbricosAPIResponse400 extends AbricosAPIResponse {

    public $errorCode = "BAD_REQUEST";
    public $message = "Invalid URL-address";
    public $data = null;

    public function __construct(){
        parent::__construct();
        $this->headers['status'] = 'HTTP/1.1 400 Invalid request';
    }

    public function BadVersion($version){
        $this->errorCode = "BAD_VERSION";
        $this->message = "API version `".$version."` not defined";

        return $this;
    }

    public function MethodNotDefined($mName){
        $this->errorCode = "METHOD_NOT_DEFINED";
        $this->message = "API method `".$mName."` not defined";

        return $this;
    }
}

class AbricosAPIResponse403 extends AbricosAPIResponse {

    public $errorCode = "ACCESS_DENIED";
    public $message = "Access denied";
    public $data = null;

    public function __construct(){
        parent::__construct();
        $this->headers['status'] = 'HTTP/1.1 403 Access denied';
    }
}

class AbricosAPIResponseError extends AbricosAPIResponse {

    public $errorCode = "UNKNOW";
    public $message = "";

    private $_errors;

    public function __construct($errors){
        parent::__construct();
        $this->_errors = $errors;
        $this->data = null;
        $this->headers['status'] = 'HTTP/1.1 422 Unprocesable entity';
    }

    public function SetError($errorNum){
        $errors = $this->_errors;

        if (!isset($errors[$errorNum])){
            if (!isset($errors['unknow'])){
                return $this;
            }
            $item = $errors['unknow'];
        }
        if (empty($item)){
            $item = $errors[$errorNum];
        }
        $this->errorCode = $item[0];
        $this->message = $item[1];

        return $this;
    }
}


?>