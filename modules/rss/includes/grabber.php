<?php
/**
 * @version $Id$
 * @package CMSBrick
 * @subpackage RSS
 * @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@cmsbrick.ru)
 */

/**
 * RSS Grabber
 * @package CMSBrick
 * @subpackage RSS
 */
class CMSRssGrabber {
	
	/**
	 * Ядро
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	/**
	 * 
	 * @var CMSRssWriter2_0
	 */
	public $writer = null;
	
	public $chanelid = 0;
	
	public $chanel = null;
	
	public function __construct(CMSRssWriter2_0 $writer, $chanel) {
		$this->registry = CMSRegistry::$instance;
		$this->writer = $writer;
		$this->chanelid = $chanel['id'];
		$this->chanel = $chanel;
	}
	
	public function Write() {
		if (is_null($this->chanel)) { return; }
		$this->Grabber();
		$rows = CMSQRss::RecordList($this->registry->db, $this->chanelid, $this->chanel['gcnt']);
		while (($row = $this->registry->db->fetch_array($rows))) {
			$title = $row['tl'];
			if (!empty($row['pfx'])){
				$title = $row['pfx'].": ".$title;
			}
			$item = new CMSRssWriter2_0Item($title, $row['lnk'], $row['body']);
			$item->pubDate = $row['pdt'];
			$this->writer->WriteItem($item);
		}
	}
	
	private function Grabber() {
		$chanel = $this->chanel;
		$sec = $chanel ['chm'] * 60;
		$lastupdate = $chanel ['chl'] * 1;
		if ($lastupdate > 0 && TIMENOW - $sec < $lastupdate) { return; }
		$rows = CMSQRss::SourceListByChanelId($this->registry->db, $this->chanelid);
		while (($row = $this->registry->db->fetch_array($rows))) {
			$this->GrabberSource($row);
		}
		CMSQRss::ChanelUpdateLastGrabber($this->registry->db, $chanel['id'], TIMENOW);
	}
	
	private function GrabberSource($source) {
		$xml_parser = xml_parser_create("UTF-8");
		$rss_parser = new CMSRssParser($this->registry, $source);

		xml_set_object($xml_parser, $rss_parser);
		xml_set_element_handler($xml_parser, "startElement", "endElement" );
		xml_set_character_data_handler ($xml_parser, "characterData" );
		$fp = fopen ($source['url'], "r" );
		if (!$fp){ return; }
		while (($data = fread($fp, 4096))){
			xml_parse($xml_parser, $data, feof($fp));
		}
		fclose($fp);
		xml_parser_free($xml_parser);
	}
}

/**
 * Парсер rss новостей
 * @package CMSBrick
 * @subpackage RSS
 */
class CMSRssParser {
	public $insideItem = false;
	public $tag = "";
	public $title = "";
	public $description = "";
	public $originalLink = "";
	public $dt = "";
	
	/**
	 * @var CMSDatabase
	 */
	public $db = null;
	
	public $source = null;
	
	public function __construct(CMSRegistry $registry, $source){
		$this->db = $registry->db;
		$this->source = $source;
	}
	
	public function startElement($parser, $tagName, $attrs) {
		if ($this->insideItem) {
			$this->tag = $tagName;
		} elseif ($tagName == "ITEM") {
			$this->insideItem = true;
		}
	}
	public function endElement($parser, $tagName) {
		if ($tagName == "ITEM") {
			$pubdate = strtotime($this->dt);
			CMSQRss::RecordAppend($this->db, $this->source['id'], $this->originalLink, $this->title, $this->description, '', $pubdate, '');
			$this->title = "";
			$this->originalLink = "";
			$this->description = "";
			$this->dt = "";
			$this->insideItem = false;
		}
	}
	public function characterData($parser, $data) {
		if ($this->insideItem) {
			switch ($this->tag) {
				case "TITLE" :
					$this->title .= $data;
					break;
				case "DESCRIPTION" :
					$this->description .= $data;
					break;
				case "LINK" :
					$this->originalLink .= $data;
					break;
				case "PUBDATE" :
					$this->dt .= $data;
					break;
			}
		}
	}
}

?>