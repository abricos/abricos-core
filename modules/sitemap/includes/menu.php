<?php
/**
 * Классы управления меню
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Sitemap
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

/**
 * Конструктор меню 
 * @package Abricos
 * @subpackage Sitemap
 */
class CMSSitemapMenu {
	
	/**
	 * Ядро
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	/**
	 * Root menu item
	 *
	 * @var CMSSitemapMenuItem
	 */
	public $menu = null;
	
	/**
	 * Массив пути из меню
	 *
	 * @var mixed
	 */
	public $menuLine = array();
	
	public function __construct(CMSRegistry $registry, $full = false){
		$this->registry = $registry;
		$db = $registry->db;
		$data = array();
		$rows = CMSQSitemap::MenuList($db);
		while (($row = $db->fetch_array($rows))){
			$row['id'] = intval($row['id']);
			$row['pid'] = intval($row['pid']);
			$data[$row['id']] = $row;
		}
		$this->menu = new CMSSitemapMenuItem(null, 0, -1, 0, 'root', 'root', '/', 0);
		array_push($this->menuLine, $this->menu);
		$this->Build($this->menu, $data, 0, $full);
	}
	
	private function Build(CMSSitemapMenuItem $parent, $data, $level, $full){
		$lastChildMenu = null;
		foreach ($data as $row){
			if ($row['pid'] != $parent->id){ continue; }
			$child = new CMSSitemapMenuItem($parent, $row['id'], $row['pid'], $row['tp'], $row['nm'], $row['tl'], $row['lnk'], $level+1);
			if ($child->type == CMSQSitemap::MENUTYPE_LINK){
				if ($this->registry->adress->requestURI == $child->link){
					$child->isSelected = true;
				}
			}else{
				if (strpos($this->registry->adress->requestURI, $child->link) === 0){
					$child->isSelected = true;
				}
			}
			array_push($parent->child, $child);
			if ($child->isSelected){
				if ($child->type != CMSQSitemap::MENUTYPE_LINK){
					array_push($this->menuLine, $child);
				}
			}
			if ($full || $child->isSelected){
				$this->Build($child, $data, $level+1, $full);
			}
			
			$lastChildMenu = $child;
		}
		if (!is_null($lastChildMenu)){
			$lastChildMenu->isLast = true;
		}
	}
}

/**
 * Элемент меню 
 * @package Abricos 
 * @subpackage Sitemap
 */
class CMSSitemapMenuItem {
	
	public $id;
	public $pid;
	public $type;
	public $name;
	public $title;
	public $link;
	public $parent = null;
	public $child = array();
	public $level = 0;
	
	/**
	 * Меню является последним на этом уровне в списке
	 *
	 * @var boolean
	 */
	public $isLast = false;
	
	/**
	 * Активный пункт меню
	 *
	 * @var boolean
	 */
	public $isSelected = false;
	
	public function __construct($parent, $id, $pid, $type, $name, $title, $link, $level = 0){
		if (is_null($parent)){
			$link = $link;
		}else{
			$link = empty($link) ? $parent->link.$name."/" : $link;
		}
		
		$this->id = $id;
		$this->pid = $pid;
		$this->type = $type;
		$this->name = $name;
		$this->title = $title;
		$this->link = $link;
		$this->level = $level;
	}
}

?>