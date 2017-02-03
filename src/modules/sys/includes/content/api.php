<?php

$adress = Abricos::$adress;

if ($adress->level === 1){
    // TODO: show api info
    header("HTTP/1.1 400 Invalid request");
    exit;
}

$module = Abricos::GetModule($adress->dir[1]);
if (empty($module)){
    header("HTTP/1.1 400 Invalid request");
    exit;
}

/** @var Ab_App $app */
$app = Abricos::GetApp($module->name);
if (empty($app)){
    header("HTTP/1.1 400 Invalid request");
    exit;
}

$api = $app->GetAPI();
if (empty($api)){
    header("HTTP/1.1 400 Invalid request");
    exit;
}

/** @var UserManager $userManager */
$userManager = Abricos::GetModuleManager('user');

$headers = array(
    "status" => "HTTP/1.1 200 OK",
    "type" => "Content-Type: application/json",
    "auth" => "Authorization: Session ".
        $userManager->GetSessionManager()->key
);

$status = 200;

$result = $api->Run();

if ($result instanceof Ab_ModelBase){
    if ($result->IsError()){
        $status = $result->GetError();
    }
    if ($result->GetCodes() > 0){
        $headers['code'] = "X-Extended-Code: ".$result->GetCodes();
    }
} else if (is_integer($result)){
    $status = $result;
}

if ($status !== 200){
    switch ($status){
        case AbricosResponse::ERR_BAD_REQUEST:
            $headers['status'] = 'HTTP/1.1 400 Invalid request';
            break;
        case AbricosResponse::ERR_FORBIDDEN:
            $headers['status'] = 'HTTP/1.1 403 Access denied';
            break;
        case AbricosResponse::ERR_NOT_FOUND:
            $headers['status'] = 'HTTP/1.1 404 Not Found';
            break;
        case AbricosResponse::ERR_SERVER_ERROR:
            $headers['status'] = 'HTTP/1.1 500 Internal Server Error';
            break;
        default:
            $headers['status'] = 'HTTP/1.1 422 Unprocessable Entity ';
            break;
    }
}

foreach ($headers as $name => $value){
    header($value);
}

if ($status === 200){
    if ($result instanceof Ab_ModelBase){
        echo json_encode($result->ToJSON());
    } else {
        echo json_encode($result);
    }
}

Abricos::$db->close();

exit;
