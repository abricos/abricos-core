<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage Blog
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$brick = Brick::$builder->brick;
$limit = 30;

$rows = CMSQBlog::CommentOnlineList(Brick::$db, 5);
$mod = Brick::$modules->GetModule('blog');
$baseUrl = "/".$mod->takelink."/";

$p_do = Brick::$input->clean_gpc('g', 'do', TYPE_STR);
$upd = $p_do == 'updcmtonl';

$lst = "";
$cids = array();
while (($row = Brick::$db->fetch_array($rows))){
	
	/* fixed bug */
	if (empty($row['catph']) || empty($row['title'])){
		continue;
	}
	$tt = "";
	$tt .= str_replace('#unm#', $row['unm'], $brick->param->var['tu']);

	$lnk = $baseUrl;
	
	$lnk .= $row['catnm']."/";
	$t = str_replace('#ph#', $row['catph'], $brick->param->var['tc']);
	$t = str_replace('#lnk#', $lnk, $t);
	$tt .= $t;
	
	$lnk .= $row['topicid']."/";
	$t = str_replace('#lnk#', $lnk, $brick->param->var['tt']); 
	$t = str_replace('#tl#', $row['title'], $t); 
	$tt .= $t;
	
	array_push($cids, $row['contentid']);
	$t = str_replace('#cnt#', $row['cnt'], $brick->param->var['tcmt']);
	$t = str_replace('#cid#', $row['contentid'], $t);
	$tt .= $t;

	$tt =  str_replace('#c#', $tt, $brick->param->var['ti']);
	
	$lst .= $tt;
}

$brick->param->var['s'] = str_replace('#ids#', implode(',', $cids), 
	$brick->param->var[($upd ? 's2' : 's')]
);

$lst = str_replace('#c#', $lst, $brick->param->var['t']);

if ($upd){
	$brick->content = $lst.$brick->param->var['s'];
}else{
	$brick->param->var['lst'] = $lst;
}

unset($brick->param->var['t']);
?>