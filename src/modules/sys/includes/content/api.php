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
