<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage Blog
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

$query = Brick::$input->clean_gpc('p', 'query', TYPE_STR);

header('Content-type: text/plain');

$rows = CMSQBlog::TagAC(Brick::$db, $query);

while (($row = Brick::$db->fetch_array($rows))){
	print $row['ph']."\n";
}
exit;
	
?>