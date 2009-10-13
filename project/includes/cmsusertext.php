<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

class CMSUserText {
	
	/**
	 * Типограф
	 *
	 * @var Jevix
	 */
	public $jevix = null;
	
	public function CMSUserText(){
		
		require_once CWD.'/includes/jevix/jevix.class.php';
		require_once CWD.'/includes/geshi/geshi.php';
		
		$this->JevixConfigure();
	}
	
	public function JevixConfigure(){
		$jevix = new Jevix();
		
		// 1. Устанавливаем разрешённые теги. (Все не разрешенные теги считаются запрещенными.)
		$jevix->cfgAllowTags(array('cut', 'p', 'a', 'img', 'i', 'b', 'u', 's', 'video', 'em',  'strong', 'nobr', 'li', 'ol', 'ul', 'sup', 'abbr', 'sub', 'acronym', 'h4', 'h5', 'h6', 'br', 'hr', 'pre', 'code'));
		// 2. Устанавливаем коротие теги. (не имеющие закрывающего тега)
		$jevix->cfgSetTagShort(array('br','img', 'hr', 'cut'));
		// 3. Устанавливаем преформатированные теги. (в них все будет заменятся на HTML сущности)
		$jevix->cfgSetTagPreformatted(array('pre','code'));
		// 4. Устанавливаем теги, которые необходимо вырезать из текста вместе с контентом.
		$jevix->cfgSetTagCutWithContent(array('script', 'object', 'iframe', 'style'));
		// 5. Устанавливаем разрешённые параметры тегов. Также можно устанавливать допустимые значения этих параметров.
		$jevix->cfgAllowTagParams('a', array('title', 'href'));
		$jevix->cfgAllowTagParams('img', array('src', 'alt' => '#text', 'title', 'align' => array('right', 'left', 'center'), 'width' => '#int', 'height' => '#int', 'hspace' => '#int', 'vspace' => '#int'));
		// 6. Устанавливаем параметры тегов являющиеся обязяательными. Без них вырезает тег оставляя содержимое.
		$jevix->cfgSetTagParamsRequired('img', 'src');
		$jevix->cfgSetTagParamsRequired('a', 'href');
		// 7. Устанавливаем теги которые может содержать тег контейнер
		$jevix->cfgSetTagChilds('ul', array('li'), false, true);
		$jevix->cfgSetTagChilds('ol', array('li'), false, true);
		// 8. Устанавливаем атрибуты тегов, которые будут добавлятся автоматически
		$jevix->cfgSetTagParamsAutoAdd('a', array('rel' => 'nofollow'));
		// 9. Устанавливаем автозамену
		$jevix->cfgSetAutoReplace(array('+/-', '(c)', '(r)'), array('±', '©', '®'));
		// 10. Включаем или выключаем режим XHTML. (по умолчанию включен)
		$jevix->cfgSetXHTMLMode(true);
		// 11. Включаем или выключаем режим замены переноса строк на тег <br/>. (по умолчанию включен)
		$jevix->cfgSetAutoBrMode(false);
		// 12. Включаем или выключаем режим автоматического определения ссылок. (по умолчанию включен)
		$jevix->cfgSetAutoLinkMode(true);
		// 13. Отключаем типографирование в определенном теге
		$jevix->cfgSetTagNoTypography('code');
		
		$this->jevix = $jevix;
	}
	
	/**
	 * Парсинг текста с помощью Jevix
	 *
	 * @param string $text
	 * @param array $error
	 * @return string
	 */
	public function JevixParser($text, &$error=null) {
		return $this->jevix->parse($text, $error);		
	}
	
	/**
	 * Парсинг текста на предмет видео
	 *
	 * @param string $sText
	 * @return string
	 */
	public function VideoParser($text) {
		$result = $text;
		/**
		 * youtube.com
		 */
		$result = preg_replace('/<video>http:\/\/youtube\.com\/watch\?v=([a-zA-Z0-9_\-]+)<\/video>/Ui', '<object width="425" height="344"><param name="movie" value="http://www.youtube.com/v/$1&hl=en"></param><param name="wmode" value="transparent"></param><embed src="http://www.youtube.com/v/$1&hl=en" type="application/x-shockwave-flash" wmode="transparent" width="425" height="344"></embed></object>', $result);
		$result = preg_replace('/<video>http:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_\-]+)<\/video>/Ui', '<object width="425" height="344"><param name="movie" value="http://www.youtube.com/v/$1&hl=en"></param><param name="wmode" value="transparent"></param><embed src="http://www.youtube.com/v/$1&hl=en" type="application/x-shockwave-flash" wmode="transparent" width="425" height="344"></embed></object>', $result);		
		/**
		 * rutube.ru
		 */
		$result = preg_replace('/<video>http:\/\/rutube.ru\/tracks\/\d+.html\?v=([a-zA-Z0-9_\-]+)<\/video>/Ui', '<OBJECT width="470" height="353"><PARAM name="movie" value="http://video.rutube.ru/$1"></PARAM><PARAM name="wmode" value="window"></PARAM><PARAM name="allowFullScreen" value="true"></PARAM><PARAM name="flashVars" value="uid=662118"></PARAM><EMBED src="http://video.rutube.ru/$1" type="application/x-shockwave-flash" wmode="window" width="470" height="353" allowFullScreen="true" flashVars="uid=662118"></EMBED></OBJECT>', $result);
		$result = preg_replace('/<video>http:\/\/www\.rutube.ru\/tracks\/\d+.html\?v=([a-zA-Z0-9_\-]+)<\/video>/Ui', '<OBJECT width="470" height="353"><PARAM name="movie" value="http://video.rutube.ru/$1"></PARAM><PARAM name="wmode" value="window"></PARAM><PARAM name="allowFullScreen" value="true"></PARAM><PARAM name="flashVars" value="uid=662118"></PARAM><EMBED src="http://video.rutube.ru/$1" type="application/x-shockwave-flash" wmode="window" width="470" height="353" allowFullScreen="true" flashVars="uid=662118"></EMBED></OBJECT>', $result);				
		return $result;
	}
	
	
	/**
	 * Подцветка кода
	 *
	 * @param string $sText
	 * @return string
	 */
	public function GeshiParser($text) {
		$textTemp=str_replace("\r\n",'[!rn!]',$text);
		$textTemp=str_replace("\n",'[!n!]',$textTemp);
		if (preg_match_all("/<code>(.*)<\/code>/Ui", $textTemp, $aMatch, PREG_SET_ORDER)) {
			$oGeshi = new GeSHi('','php');
			$oGeshi->set_header_type(GESHI_HEADER_DIV);
			$oGeshi->enable_classes();
			$oGeshi->set_overall_style('color: #000066; border: 1px solid #d0d0d0; background-color: #f0f0f0;', false);
			$oGeshi->set_line_style('color: #003030;', 'font-weight: bold; color: #006060;', true);
			$oGeshi->set_code_style('color: #000020;', true);
			$oGeshi->enable_keyword_links(false);
			$oGeshi->set_link_styles(GESHI_LINK, 'color: #000060;');
			$oGeshi->set_link_styles(GESHI_HOVER, 'background-color: #f0f000;');
			foreach ($aMatch as $aCode) {
				$sCode=html_entity_decode($aCode[1]);
				$sCode=str_replace("[!rn!]","\r\n",$sCode);
				$sCode=str_replace("[!n!]","\n",$sCode);
				$oGeshi->set_source($sCode);
				$sCodeGeshi=$oGeshi->parse_code();
				$textTemp=str_replace($aCode[0],$sCodeGeshi,$textTemp);
			}
			$textTemp=str_replace("[!rn!]","\r\n",$textTemp);
			$textTemp=str_replace("[!n!]","\n",$textTemp);
			$textTemp='<style type="text/css">'.$oGeshi->get_stylesheet(true).'</style>'."\r\n".$textTemp;
			return $textTemp;
		}
		return $text;
	}
	
	/**
	 * Парсит текст
	 *
	 * @param string $text
	 */
	public function Parser($text) {
		$result = $text;
		$result=$this->JevixParser($result);	
		$result=$this->VideoParser($result);		
		$result=$this->GeshiParser($result);
		return $result;
	}
	
}

?>