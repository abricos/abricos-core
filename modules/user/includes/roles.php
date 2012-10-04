<?php
/**
 * Обработка запросов DataSet 
 * 
 * @version $Id: js_data.php 1411 2012-02-02 07:57:25Z roosit $
 * @package Abricos
 * @subpackage User
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @ignore
 */

$brick = Brick::$builder->brick;
$rows = Abricos::$user->GetManager()->Permission();
$brick->content = Brick::ReplaceVarByData($brick->content, array("result" => json_encode($rows)));

?>