<?php
/**
 * Формирование базовых данных для работы системы BrickJSEngine
 *
 * @package Abricos
 * @link http://abricos.org
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @ignore
 */

$brick = Brick::$builder->brick;
$param = $brick->param;

$modSys = Abricos::GetModule('sys');

$template = SystemModule::$instance->GetPhrases()->Get('style', 'default');

$replace = array(
    'lang' => Abricos::$LNG,
    'uid' => intval(Abricos::$user->id),
    'unm' => Abricos::$user->username,
    'fnm' => Abricos::$user->firstname,
    'lnm' => Abricos::$user->lastname,
    'ttname' => $template,
    'jsyui' => SystemModule::$YUIVersion,
    's' => UserModule::$instance->GetManager()->GetSessionManager()->key,
    'agr' => Abricos::$user->id > 0 ? (Abricos::$user->agreement ? 1 : 0) : 1
);

if ($param->param['fullcssforie'] == 'true' && is_browser('ie')){
    $param->var['fullcssres'] = Brick::ReplaceVarByData($param->var['fullcsstpl'], $param->var);
}

$iscache = !Abricos::$config['Misc']['develop_mode'];
$cacheFile = CWD."/cache/jsvar";
if ($iscache && file_exists($cacheFile)){

    $handle = fopen($cacheFile, 'r');
    $fdata = '';
    if ($handle){
        $fdata = fread($handle, filesize($cacheFile));
        fclose($handle);
    }
    $farr = explode(",", $fdata);
    $cVersion = $farr[0];
    $cTime = TIMENOW - intval($farr[1]);
    $cacheTime = 3 * 60;
    $cKey = $farr[2];
    if (count($farr) == 3 && $farr[0] == '0.1'){
        if ($cTime < $cacheTime){
            $param->var['jsv'] = $cKey;
            return;
        }
    }
}

$key = '';
$dir = dir(CWD."/modules");
while (false !== ($entry = $dir->read())) {
    if ($entry == "." || $entry == ".." || empty($entry)){
        continue;
    }

    $jsFilesInfo = CWD."/modules/".$entry."/js/files.json";
    if (!file_exists($jsFilesInfo)){
        continue;
    }

    $filebody = file_get_contents($jsFilesInfo);
    $data = json_decode($filebody);
    $key .= $data->version;
}

$jsv = md5($key.Abricos::$LNG);
$jsv = substr($jsv, strlen($jsv)-8);
$replace['jsv'] = $jsv;

if ($iscache){

    @unlink($cacheFile);

    $handle = fopen($cacheFile, 'w');
    if ($handle){
        fwrite($handle, "0.1,".TIMENOW.",".$cKey);
        fclose($handle);
    }
}

$langid = Abricos::$LNG;
if ($langid === 'ru'){
    $langid = 'ru-RU';
}

$replace["langid"] = $langid;
$brick->content = Brick::ReplaceVarByData($brick->content, $replace);

?>