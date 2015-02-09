<?php

$adress = Abricos::$adress;

$result = new AbricosAPIResponse400();

if ($adress->level === 1){

} else {
    $modName = $adress->dir[1];

    $mod = Abricos::GetModule($modName);

    if (!empty($mod)){
        $modManager = $mod->GetManager();

        $api = $modManager->API();
        $result = $api->Run();
    }

}

if ($result instanceof AbricosAPIResponse){
    foreach ($result->headers as $name => $value){
        header($value);
    }
    $sResult = json_encode($result->ToJSON());

} else {
    $sResult = json_encode($result);
}

echo $sResult;

Abricos::$db->close();

exit;

$pData = Abricos::CleanGPC('p', 'data', TYPE_STR);

$brick = Brick::$builder->brick;
if (empty($pData)){
    $data = new stdClass();
} else {
    $data = json_decode($pData);
}
$result = new stdClass();
if (empty($mod)){
    // TODO: Отправить в header код ошибки 500
    // $result->error = 500;
} else {
    if (!property_exists($data, 'do')){
        $data->do = '';
    }
    $result->data = $mod->GetManager()->AJAX($data);
}
$brick->content = json_encode($result);

/**/
?>