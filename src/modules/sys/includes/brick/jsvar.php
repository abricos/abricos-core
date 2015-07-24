<?php

$brick = Brick::$builder->brick;
$p = &$brick->param->param;
$v = &$brick->param->var;

$modSys = Abricos::GetModule('sys');

$template = SystemModule::$instance->GetPhrases()->Get('style', 'default');

$replace = array(
    "fullcssres" => "",
    "yuivs" => SystemModule::$YUIVersion,
    "jsvs" => "",
    "template" => $template->value,
    "locale" => Abricos::$locale,
    "language" => Abricos::$LNG,
    "languages" => json_encode(Abricos::$supportLanguageList),
    "userid" => Abricos::$user->id,
    "username" => Abricos::$user->username,
    "firstname" => Abricos::$user->firstname,
    "lastname" => Abricos::$user->lastname,
    "agr" => Abricos::$user->id > 0 ? (Abricos::$user->agreement ? 1 : 0) : 0,
    "session" => UserModule::$instance->GetManager()->GetSessionManager()->key
);

if ($p['fullcssforie'] === 'true' && is_browser('ie')){
    $replace['fullcssres'] = Brick::ReplaceVarByData($v['fullcsstpl'], $replace);
}

$isCache = !Abricos::$config['Misc']['develop_mode'];
$cacheFile = CWD."/cache/jsvar";
if ($isCache && file_exists($cacheFile)){
    $fdata = @file_get_contents($cacheFile);
    $farr = explode(",", $fdata);
    if (count($farr) === 3 && $farr[0] === '0.1'){
        $cVersion = $farr[0];
        $cTime = TIMENOW - intval($farr[1]);
        $cacheTime = 3 * 60;
        $cKey = $farr[2];
        if ($cTime < $cacheTime){
            $replace['jsvs'] = $cKey;
        }
    }
}

if (empty($replace['jsvs'])){
    $key = 0;
    $dir = dir(CWD."/modules");
    while (false !== ($entry = $dir->read())){
        if ($entry == "." || $entry == ".." || empty($entry)){
            continue;
        }

        $jsdir = CWD."/modules/".$entry."/js";

        $files = globa($jsdir."/*.js");
        foreach ($files as $file){
            $key += filemtime($file) + filesize($file) + 1;
        }

        $files = globa($jsdir."/*.htm");
        foreach ($files as $file){
            // если есть перегруженый шаблон, то чтение его версии
            $override = CWD."/tt/".$template."/override/".$entry."/js/".basename($file);

            if (file_exists($override)){
                $key += filemtime($override) + filesize($override) + 11;
            } else {
                $key += filemtime($file) + filesize($file) + 1;
            }
        }

        $files = globa($jsdir."/langs/*.js");
        foreach ($files as $file){
            $key += filemtime($file) + filesize($file) + 1;
        }

        $files = globa($jsdir."/langs/*.json");
        foreach ($files as $file){
            $key += filemtime($file) + filesize($file) + 1;
        }

        $files = globa($jsdir."/*.css");
        foreach ($files as $file){
            $key += filemtime($file) + filesize($file) + 1;
        }
    }

    // js модули шаблона
    $files = globa(CWD."/tt/".$template."/jsmod/*.js");
    foreach ($files as $file){
        $key += filemtime($file) + filesize($file) + 1;
    }

    $replace['jsvs'] = md5($key.Abricos::$locale);

    if ($isCache){
        @unlink($cacheFile);
        $fdata = "0.1,".TIMENOW.",".$replace['jsvs'];
        @file_put_contents($cacheFile, $fdata);
    }
}

$brick->content = Brick::ReplaceVarByData($brick->content, $replace);
?>