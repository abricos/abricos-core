<?php
$mod = Brick::$modules->GetModule('faq');
$brick = Brick::$builder->brick;
$dateFormat = Brick::$builder->phrase->Get('faq', 'date_format', "Y-m-d");
$rows = CMSQFaq::AllQuestions(Brick::$db);
$result = "";

while(($row = Brick::$db->fetch_array($rows))){
$t = $brick->param->var['item'];	
$t = str_replace("{v#fio}", $row['fio'], $t);
$t = str_replace("{v#question}", $row['message'], $t);
$t = str_replace("{v#qdate}", date($dateFormat, $row['qdate']), $t);
$t = str_replace("{v#answer}", $row['body'], $t);
$t = str_replace("{v#adate}", date($dateFormat, $row['adate']), $t);
$result .= $t;
$brick->param->var['lst'] = $result;
}
?>