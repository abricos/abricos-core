<?php
/**
 * Модуль "Карта сайта"
 * 
 * @version $Id$
 * @package Abricos
 * @subpackage Sitemap
 * @copyright Copyright (C) 2008 Abricos All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

$mod = new CMSModuleSitemap();
CMSRegistry::$instance->modules->Register($mod);

/**
 * Карта сайта.
 * 
 * Элементы сайта разделены на три типа:
 * 1) Главная страница
 * 2) Пункт меню и его страница index
 * 3) Страница не index
 * 4) Ссылка
 * 
 * @package Abricos
 * @subpackage Sitemap
 */
class CMSModuleSitemap extends CMSModule {
	
	/**
	 * CMSSitemapMenu
	 *
	 * @var CMSSitemapMenu
	 */
	private $menu = null;
	
	/**
	 * CMSSitemapMenu
	 *
	 * @var CMSSitemapMenu
	 */
	private $menuFull = null;
	
	function __construct(){
		$this->version = "0.2";
		$this->name = "sitemap";
		$this->defaultCSS = "sitemap.css";
	}

	/**
	 * Получить менеджер управления меню
	 *
	 * @return CMSSitemapMenu
	 */
	public function GetMenu($full = false){
		if (is_null($this->menu) && is_null($this->menuFull)){
			require_once CWD.'/modules/sitemap/includes/menu.php';
		}
		if ($full){
			if (is_null($this->menuFull)){
				$this->menuFull = new CMSSitemapMenu($this->registry, true);
			}
			return $this->menuFull;
		}else{
			if (is_null($this->menu)){
				$this->menu = new CMSSitemapMenu($this->registry, false);
			}
			return $this->menu;
		}
	}
	
	/**
	 * Подсчет кол-ва вложенных в меню элементов
	 *
	 * @param CMSSitemapMenuItem $menu
	 */
	public static function ChildMenuItemCount(CMSSitemapMenuItem $menu){
		$count = 0;
		foreach ($menu->child as $child){
			$count++;
			$count += CMSModuleSitemap::ChildMenuItemCount($child);
		}
		return $count;
	}
	
	/**
	 * Построение кирпича на основе полных данных структуры сайта
	 *
	 * @param CMSSysBrick $brick - кирпич 
	 */
	public static function BrickBuildFullMenu(CMSSysBrick $brick){
		$modSitemap = Brick::$modules->GetModule('sitemap');
		$mm = $modSitemap->GetMenu(true);
		if (empty($mm->menu->child)){
			$brick->content = "";
			return;
		}
		$brick->param->var['result'] = CMSModuleSitemap::BrickBuildFullMenuGenerate($mm->menu, $brick->param);
	}
	
	private static function BrickBuildFullMenuGenerate(CMSSitemapMenuItem $menu, $param){
		$prefix = ($menu->isSelected && $menu->id != 0) ? "sel" : "";
		
		$t = Brick::ReplaceVarByData($param->var['item'.$prefix], array(
			"tl" => $menu->title, "link" => $menu->link 
		));
		
		$lst = "";
		foreach ($menu->child as $child){
			$lst .= CMSModuleSitemap::BrickBuildFullMenuGenerate($child, $param);
		}
		if (!empty($lst)){
			$lst = Brick::ReplaceVar($param->var["root"], "rows", $lst);
		}
		if ($menu->id == 0){ return $lst; }
		$t = Brick::ReplaceVar($t, "child", $lst);
	
		return $t;
	}
	
	
}

/**
 * Статичные функции запросов к базе данных
 * 
 * @package Abricos 
 * @subpackage Sitemap
 */
class CMSQSitemap {

	/**
	 * Тип меню страница/раздел
	 *
	 */
	const MENUTYPE_PAGE = 0;
	/**
	 * Тип меню ссылка
	 *
	 */
	const MENUTYPE_LINK = 1;
	
	
	const FIELDS_MENU = "
		menuid as id,
		parentmenuid as pid,
		menutype as tp,
		name as nm,
		title as tl,
		descript as dsc,
		link as lnk,
		menuorder as ord,
		level as lvl,
		off
	";
	
	public static function PageCreate(CMSDatabase $db, $d){
		$contentid = CMSSqlQuery::CreateContent($db, $d->bd, 'sitemap');
		$sql = "
			INSERT INTO ".$db->prefix."sys_page
			(pagename, menuid, contentid, language, title, metakeys, metadesc, mods, dateline) VALUES (
				'".bkstr($d->nm)."',
				".bkint($d->mid).",
				'".bkstr($contentid)."',
				'".LNG."',
				'".bkstr($d->tl)."',
				'".bkstr($d->mks)."',
				'".bkstr($d->mdsc)."',
				'".bkstr($d->mods)."',
				".TIMENOW."
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	

	public static function PageUpdate(CMSDatabase $db, $d){
		CMSSqlQuery::ContentUpdate($db, $d->cid, $d->bd);
		$sql = "
			UPDATE ".$db->prefix."sys_page
			SET
				pagename='".bkstr($d->nm)."',
				title='".bkstr($d->tl)."',
				metakeys='".bkstr($d->mtks)."',
				metadesc='".bkstr($d->mtdsc)."',
				mods='".bkstr($d->mods)."',
				dateline='".TIMENOW."'
			WHERE pageid='".bkint($d->id)."'
		";
		$db->query_write($sql);
	}
	
	public static function MenuByPageId(CMSDatabase $db, $pageid){
		$sql = "
			SELECT
				b.menuid as id,
				b.parentmenuid as pid,
				b.menutype as tp,
				b.name as nm,
				b.title as tl,
				b.descript as dsc,
				b.link as lnk,
				b.menuorder as ord,
				b.level as lvl,
				b.off
			FROM ".$db->prefix."sys_page a
			LEFT JOIN ".$db->prefix."sys_menu b ON b.menuid=a.menuid
			WHERE a.pageid=".bkint($pageid)."
		";
		return $db->query_read($sql);
	}
	
	const FIELDS_PAGE = "
		a.pageid as id,
		a.menuid as mid,
		a.brickid as bkid,
		a.pagename as nm,
		a.title as tl,
		a.metakeys as mtks,
		a.metadesc as mtdsc,
		a.mods as mods,
		a.contentid as cid,
		c.body as bd
	";
	
	public static function PageByName(CMSDatabase $db, $menuid, $pagename, $returnTypeRow = false){
		$sql = "
			SELECT
				".CMSQSitemap::FIELDS_PAGE." 
			FROM ".$db->prefix."sys_page a
			LEFT JOIN ".$db->prefix."content c ON a.contentid=c.contentid
			WHERE a.menuid=".bkint($menuid)." AND a.pagename='".bkstr($pagename)."'
			LIMIT 1
		";
		if ($returnTypeRow){
			return $db->query_first($sql);
		}else{
			return $db->query_read($sql);
		}
	}
	
	public static function PageById(CMSDatabase $db, $pageid){
		$sql = "
			SELECT
				".CMSQSitemap::FIELDS_PAGE." 
			FROM ".$db->prefix."sys_page a
			LEFT JOIN ".$db->prefix."content c ON a.contentid=c.contentid
			WHERE a.pageid=".bkint($pageid)."
			LIMIT 1
		";
		return $db->query_read($sql);
	}
	
	public static function PageList(CMSDatabase $db){
		$rootPage = CMSQSitemap::PageByName($db, 0, 'index', true);
		if (empty($rootPage)){
			$d = new stdClass(); $d->nm = 'index'; $d->mid = 0; $d->tl = ''; $d->mks = ''; $d->mdsc = '';
			CMSQSitemap::PageCreate($db, $d);
		}
		$sql = "
			SELECT 
				pageid as id,
				menuid as mid,
				brickid as bkid,
				contentid as cid,
				pagename as nm
			FROM ".$db->prefix."sys_page
			WHERE deldate=0
		";
		return $db->query_read($sql);
	}
	
	public static function MenuCreate(CMSDatabase $db, $d){
		$sql = "
			INSERT INTO ".$db->prefix."sys_menu 
			(parentmenuid, name, link, title, descript, menutype) VALUES (
				".bkint($d->pid).", 
				'".bkstr($d->nm)."', 
				'".bkstr($d->lnk)."', 
				'".bkstr($d->tl)."',
				'".bkstr($d->dsc)."', 
				".bkint($d->tp)." 
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
	public static function MenuUpdate(CMSDatabase $db, $d){
		$sql = "
			UPDATE ".$db->prefix."sys_menu 
			SET
				parentmenuid=".bkint($d->pid).", 
				name='".bkstr($d->nm)."', 
				link='".bkstr($d->lnk)."', 
				title='".bkstr($d->tl)."',
				descript='".bkstr($d->dsc)."',
				menuorder=".bkint($d->ord)."
			WHERE menuid='".bkint($d->id)."'
		";
		$db->query_write($sql);
	}
	
	public static function MenuById(CMSDatabase $db, $menuid){
		$sql = "
			SELECT
				".CMSQSitemap::FIELDS_MENU." 
			FROM ".$db->prefix."sys_menu
			WHERE menuid=".bkint($menuid)."
			LIMIT 1
		";
		return $db->query_read($sql);
	}
	
	
	public static function MenuListByUrl(CMSDatabase $db, $dir){
		$names = array();
		foreach ($dir as $name){
			array_push($names, "name='".bkstr($name)."'");
		}
		$sql = "
			SELECT
				".CMSQSitemap::FIELDS_MENU." 
			FROM ".$db->prefix."sys_menu
			WHERE deldate=0 AND (".implode(" OR ", $names).")
			ORDER BY parentmenuid
		";
		return $db->query_read($sql);
	}
	
	public static function MenuList(CMSDatabase $db){
		$sql = "
			SELECT
				".CMSQSitemap::FIELDS_MENU." 
			FROM ".$db->prefix."sys_menu
			WHERE deldate=0
			ORDER BY menuorder
		";
		return $db->query_read($sql);
	}
	
	public static function PageRemove(CMSDatabase $db, $pageid){
		$sql = "
			SELECT pageid, contentid
			FROM ".$db->prefix."sys_page
			WHERE pageid='".bkint($pageid)."'
		";
		$row = $db->query_first($sql);
		$db->query_write("
			UPDATE ".$db->prefix."content
			SET deldate='".TIMENOW."'
			WHERE contentid='".bkint($row['contentid'])."'
		");
		$db->query_write("
			UPDATE ".$db->prefix."sys_page
			SET deldate='".TIMENOW."'
			WHERE pageid='".bkint($pageid)."'
		");
	}
	
	public static function MenuRemove(CMSDatabase $db, $menuid){
		// remove pages
		$sql = "
			SELECT pageid
			FROM ".$db->prefix."sys_page
			WHERE menuid=".bkint($menuid)."
		";
		$rows = $db->query_read($sql);
		while (($row = $db->fetch_array($rows))){
			CMSQSitemap::PageRemove($db, $row['pageid']);
		}
		
		// child list
		$sql = "
			SELECT menuid
			FROM ".$db->prefix."sys_menu
			WHERE parentmenuid=".bkint($menuid)."
		";
		$rows = $db->query_read($sql);
		while (($row = $db->fetch_array($rows))){
			CMSQSitemap::MenuRemove($db, $row['menuid']);
		}
		$db->query_write("
			UPDATE ".$db->prefix."sys_menu
			SET deldate='".TIMENOW."'
			WHERE menuid=".bkint($menuid)."
		");
	}
}

?>