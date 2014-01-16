<?php
/**
 * Парсер пользовательского текста
 * 
 * Вырезает лишние теги
 * 
 * @package Abricos
 * @subpackage Core
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
*/
class Ab_UserText {
	
	/**
	 * Типограф
	 *
	 * @var Jevix
	 */
	public $jevix = null;
	
	public function __construct($fullerase = false){
		
		require_once 'jevix/jevix.class.php';
		
		$this->JevixConfigure($fullerase);
	}
	
	/**
	 * 
	 * Enter description here ...
	 * @param unknown_type $mode
	 */
	public function JevixConfigure($fullerase = false){
		$jevix = new Jevix();
		
		// Включаем или выключаем режим XHTML. (по умолчанию включен)
		$jevix->cfgSetXHTMLMode(true);
		// Включаем или выключаем режим замены переноса строк на тег <br/>. (по умолчанию включен)
		$jevix->cfgSetAutoBrMode(false);
		
		if (!$fullerase){
			
			// Устанавливаем теги, которые необходимо вырезать из текста вместе с контентом.
			$jevix->cfgSetTagCutWithContent(array('script', 'style'));
			
			// Устанавливаем разрешённые теги. (Все не разрешенные теги считаются запрещенными.)
			$jevix->cfgAllowTags(array(
				'cut', 'a', 'p', 'img', 'i', 'b', 'u', 's', 'video', 'em',  'strong', 'nobr', 'li', 'ol', 'ul', 'sup', 'abbr', 'sub', 'acronym', 'h4', 'h5', 'h6', 'br', 'hr', 'pre', 'code', 'object', 'param', 'embed', 'blockquote', 'iframe','table','th','tr','td'
			));
			
			// Устанавливаем коротие теги. (не имеющие закрывающего тега)
			$jevix->cfgSetTagShort(array('br','img', 'hr', 'cut'));
			
			// Устанавливаем преформатированные теги. (в них все будет заменятся на HTML сущности)
			$jevix->cfgSetTagPreformatted(array('pre', 'code', 'video'));
			
			// Устанавливаем разрешённые параметры тегов. Также можно устанавливать допустимые значения этих параметров.
			$jevix->cfgAllowTagParams('a', array('title', 'href', 'rel' => '#text', 'name' => '#text', 'target' => array('_blank')));
			$jevix->cfgAllowTagParams('img', array('src', 'alt' => '#text', 'title', 'align' => array('right', 'left', 'center', 'middle'), 'width' => '#int', 'height' => '#int', 'hspace' => '#int', 'vspace' => '#int', 'class'=> array('image-center')));
			$jevix->cfgAllowTagParams('cut', array('name'));
			$jevix->cfgAllowTagParams('object', array('width' => '#int', 'height' => '#int', 'data' => array('#domain'=>array('youtube.com','rutube.ru','vimeo.com')), 'type' => '#text'));
			$jevix->cfgAllowTagParams('param', array('name' => '#text', 'value' => '#text'));
			$jevix->cfgAllowTagParams('embed', array('src' => array('#domain'=>array('youtube.com','rutube.ru','vimeo.com')), 'type' => '#text','allowscriptaccess' => '#text', 'allowfullscreen' => '#text','width' => '#int', 'height' => '#int', 'flashvars'=> '#text', 'wmode'=> '#text'));
			$jevix->cfgAllowTagParams('acronym', array('title'));
			$jevix->cfgAllowTagParams('abbr', array('title'));
			$jevix->cfgAllowTagParams('iframe', array('width' => '#int', 'height' => '#int', 'src' => array('#domain'=>array('youtube.com','rutube.ru','vimeo.com'))));
			$jevix->cfgAllowTagParams('td', array('colspan'=>'#int','rowspan'=>'#int','align'=>array('right', 'left', 'center', 'justify'),'height'=>'#int','width'=>'#int'));
			$jevix->cfgAllowTagParams('table', array('border'=>'#int','cellpadding'=>'#int','cellspacing'=>'#int','align'=>array('right', 'left', 'center'),'height'=>'#int','width'=>'#int'));
			$jevix->cfgAllowTagParams('pre', array('class' => '#text', 'value' => '#text'));
			$jevix->cfgAllowTagParams('code', array('class' => '#text', 'value' => '#text'));
				
			// Устанавливаем параметры тегов являющиеся обязательными. Без них вырезает тег оставляя содержимое.
			$jevix->cfgSetTagParamsRequired('img', 'src');
			$jevix->cfgSetTagParamsRequired('a', 'href');
			
			// Устанавливаем теги которые может содержать тег контейнер
			$jevix->cfgSetTagChilds('ul', array('li'), false, true);
			$jevix->cfgSetTagChilds('ol', array('li'), false, true);
			$jevix->cfgSetTagChilds('object', array('param'), false, true);
			$jevix->cfgSetTagChilds('object', array('embed'), false, false);
			$jevix->cfgSetTagChilds('table', array('tr'), false, true);
			$jevix->cfgSetTagChilds('tr', array('td','th'), false, true);

			// Устанавливаем автозамену
			$jevix->cfgSetAutoReplace(array('+/-', '(c)', '(с)', '(r)', '(C)', '(С)', '(R)'), array('±', '©', '©', '®', '©', '©', '®'));

			// Устанавливаем атрибуты тегов, которые будут добавлятся автоматически
			$jevix->cfgSetTagParamDefault('a', 'rel', 'nofollow', true);
			$jevix->cfgSetTagParamDefault('embed', 'wmode', 'opaque', true);
				
			// Включаем или выключаем режим автоматического определения ссылок. (по умолчанию включен)
			$jevix->cfgSetAutoLinkMode(true);
			
			// Отключаем типографирование в определенном теге
			$jevix->cfgSetTagNoTypography(array('code','video','object'));
			
			$jevix->cfgSetLinkProtocolAllow(array('http','https','ftp'));
			
			$jevix->cfgSetTagParamCombination('param', 'name', 
					array('allowScriptAccess' => array(
						'value' => array('sameDomain'),
					),
					'movie' => array(
						'value'=>array('#domain'=>array('youtube.com','rutube.ru','vimeo.com'))
					),
					'align' => array('value'=>array('bottom','middle','top','left','right')),
					'base' => array('value'=>true),
					'bgcolor' => array('value'=>true),
					'border' => array('value'=>true),
					'devicefont' => array('value'=>true),
					'flashVars' => array('value'=>true),
					'hspace' => array('value'=>true),
					'quality' => array(
						'value'=>array('low','medium','high','autolow','autohigh','best')
					),
					'salign' => array('value'=>array('L','T','R','B','TL','TR','BL','BR')),
					'scale' => array('value'=>array('scale','showall','noborder','exactfit')),
					'tabindex' => array('value'=>true),
					'title' => array('value'=>true),
					'type' => array('value'=>true),
					'vspace' => array('value'=>true),
					'wmode' => array('value'=>array('window','opaque','transparent'))),
			true);
		}else{
			// Устанавливаем теги, которые необходимо вырезать из текста вместе с контентом.
			$jevix->cfgSetTagCutWithContent(array('script', 'object', 'iframe', 'style'));

			// Устанавливаем разрешённые теги. (Все не разрешенные теги считаются запрещенными.)
			$jevix->cfgAllowTags(array());
			// Устанавливаем коротие теги. (не имеющие закрывающего тега)
			$jevix->cfgSetTagShort(array());
				
			// Включаем или выключаем режим автоматического определения ссылок. (по умолчанию включен)
			$jevix->cfgSetAutoLinkMode(false);
			
			// Теги, после которых необходимо пропускать одну пробельную строку
			$jevix->cfgSetTagBlockType(array('h4','h5','h6','ol','ul','blockquote','pre','table','iframe'));
				
		}
		
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
	public function VideoParser($sText) {
		/**
		 * youtube.com
		 */
		$sText = preg_replace('/<video>http:\/\/(?:www\.|)youtube\.com\/watch\?v=([a-zA-Z0-9_\-]+)(&.+)?<\/video>/Ui', '<iframe width="560" height="315" src="http://www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe>', $sText);
		/**
		 * vimeo.com
		 */
		$sText = preg_replace('/<video>http:\/\/(?:www\.|)vimeo\.com\/(\d+).*<\/video>/i', '<iframe src="http://player.vimeo.com/video/$1" width="500" height="281" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>', $sText);
		/**
		 * rutube.ru
		 */
		$sText = preg_replace('/<video>http:\/\/(?:www\.|)rutube\.ru\/tracks\/(\d+)\.html.*<\/video>/Ui', '<OBJECT width="470" height="353"><PARAM name="movie" value="http://video.rutube.ru/$1"></PARAM><PARAM name="wmode" value="window"></PARAM><PARAM name="allowFullScreen" value="true"></PARAM><EMBED src="http://video.rutube.ru/$1" type="application/x-shockwave-flash" wmode="window" width="470" height="353" allowFullScreen="true" ></EMBED></OBJECT>', $sText);
		/**
		 * video.yandex.ru
		 */
		$sText = preg_replace('/<video>http:\/\/video\.yandex\.ru\/users\/([a-zA-Z0-9_\-]+)\/view\/(\d+).*<\/video>/i', '<object width="467" height="345"><param name="video" value="http://video.yandex.ru/users/$1/view/$2/get-object-by-url/redirect"></param><param name="allowFullScreen" value="true"></param><param name="scale" value="noscale"></param><embed src="http://video.yandex.ru/users/$1/view/$2/get-object-by-url/redirect" type="application/x-shockwave-flash" width="467" height="345" allowFullScreen="true" scale="noscale" ></embed></object>', $sText);
		return $sText;
	}

	/**
	 * Флеш парсинг
	 */
	public function FlashParamParser($sText) {
		if (preg_match_all("@(<\s*param\s*name\s*=\s*(?:\"|').*(?:\"|')\s*value\s*=\s*(?:\"|').*(?:\"|'))\s*/?\s*>(?!</param>)@Ui",$sText,$aMatch)) {
			foreach ($aMatch[1] as $key => $str) {
				$str_new=$str.'></param>';
				$sText=str_replace($aMatch[0][$key],$str_new,$sText);
			}
		}
		if (preg_match_all("@(<\s*embed\s*.*)\s*/?\s*>(?!</embed>)@Ui",$sText,$aMatch)) {
			foreach ($aMatch[1] as $key => $str) {
				$str_new=$str.'></embed>';
				$sText=str_replace($aMatch[0][$key],$str_new,$sText);
			}
		}
		/**
		 * Удаляем все <param name="wmode" value="*"></param>
		 */
		if (preg_match_all("@(<param\s.*name=(?:\"|')wmode(?:\"|').*>\s*</param>)@Ui",$sText,$aMatch)) {
			foreach ($aMatch[1] as $key => $str) {
				$sText=str_replace($aMatch[0][$key],'',$sText);
			}
		}
		/**
		 * А теперь после <object> добавляем <param name="wmode" value="opaque"></param>
		 */
		if (preg_match_all("@(<object\s.*>)@Ui",$sText,$aMatch)) {
			foreach ($aMatch[1] as $key => $str) {
				$sText=str_replace($aMatch[0][$key],$aMatch[0][$key].'<param name="wmode" value="opaque"></param>',$sText);
			}
		}
		return $sText;
	}
	
	private function SourceCodeUnparser($sText){
		// заменить <pre class="prettyprint"><code class="..."> на <code class="...">
		if (preg_match_all("#<pre(.*)><code(.*)>(.*)</code></pre>#sUi", $sText, $aMatch)) {
			for($i=0; $i<count($aMatch[0]); $i++){
				$sText = str_replace($aMatch[0][$i], 
						"<code".$aMatch[2][$i].">".$aMatch[3][$i]."</code>", 
						$sText
				);
			}
		}
		return $sText;
	}
	
	/**
	 * Подцветка кода
	 *
	 * @param string $sText
	 * @return string
	 */
	public function SourceCodeParser($sText) {
		if (preg_match_all("#<code(.*)>(.*)</code>#sUi", $sText, $aMatch)) {
			for($i=0; $i<count($aMatch[0]); $i++){
				$sText = str_replace($aMatch[0][$i],
						'<pre class="prettyprint"><code'.$aMatch[1][$i].">".$aMatch[2][$i]."</code></pre>",
						$sText
				);
			}
		}
		
		return $sText;
	}
	
	/**
	 * Парсит текст
	 *
	 * @param string $text
	 */
	public function Parser($text) {
		$text = $this->SourceCodeUnparser($text); // заплатка в лоб возможного бага при повторном сохранении
		$text = $this->FlashParamParser($text);
		$text = $this->JevixParser($text);
		$text = $this->VideoParser($text);
		$text = $this->SourceCodeParser($text);
		return $text;
	}
	
	/**
	 * Разрезать текст по тегу cut
	 * Возвращаем массив вида:
	 * <pre>
	 * array(
	 * 		$sTextShort - текст до тега <cut>
	 *      $sTextBody	- текст после тега <cut>
	 * 		$sTextNew   - весь текст за исключением удаленного тега
	 * 		$sTextCut   - именованное значение <cut>
	 * )
	 * </pre>
	 *
	 * @param  string $sText Исходный текст
	 * @return array
	 */
	public function Cut($sText) {

		// вынести тег cut из p
		$sTextTemp = $sText;
		$sTextTemp=str_replace("\r\n",'[<rn>]',$sTextTemp);
		$sTextTemp=str_replace("\n",'[<n>]',$sTextTemp);
		
		if (preg_match_all("#<p>(.*)</p>#sUi", $sTextTemp, $aTMatch)) {
				
			for ($i=0;$i<count($aTMatch[0]);$i++){
				if (preg_match("/^(.*)<cut(.*)\/>(.*)$/Ui",$aTMatch[0][$i], $aMatch)) {

					// выносим cut за пределы тега p
					$sNewLine = "<cut".$aMatch[2]."/>";
					if ($aMatch[1].$aMatch[3] != "<p></p>"){
						$sNewLine .= $aMatch[1]." ".$aMatch[3];
					}
					$sTextTemp = str_replace($aMatch[0], $sNewLine, $sTextTemp);
				}
			}
			$sTextTemp=str_replace('[<rn>]', "\r\n",$sTextTemp);
			$sTextTemp=str_replace('[<n>]',"\n",$sTextTemp);
			$sText = $sTextTemp;
		}

		$sTextShort = $sText;
		$sTextBody	= "";
		$sTextNew   = $sText;
		$sTextCut   = null;
	
		$sTextTemp=str_replace("\r\n",'[<rn>]',$sText);
		$sTextTemp=str_replace("\n",'[<n>]',$sTextTemp);
	
		if (preg_match("/^(.*)<cut(.*)\/>(.*)$/Ui",$sTextTemp,$aMatch)) {
			$aMatch[1]=str_replace('[<rn>]',"\r\n",$aMatch[1]);
			$aMatch[1]=str_replace('[<n>]',"\r\n",$aMatch[1]);
			$aMatch[3]=str_replace('[<rn>]',"\r\n",$aMatch[3]);
			$aMatch[3]=str_replace('[<n>]',"\r\n",$aMatch[3]);
			$sTextShort=$aMatch[1];
			$sTextBody=$aMatch[3];
			$sTextNew=$aMatch[1].' <a name="cut"></a> '.$aMatch[3];
			if (preg_match('/^\s*name\s*=\s*"(.+)"\s*\/?$/Ui',$aMatch[2],$aMatchCut)) {
				$sTextCut=trim($aMatchCut[1]);
			}
		}
	
		return array($sTextShort, $sTextBody, $sTextNew, $sTextCut ? htmlspecialchars($sTextCut) : null);
	}
	
}

/**
 * Устарел, оставлен для совместимости
 * 
 * @package Abricos
 * @subpackage Deprecated
 * @deprecated устарел начиная с версии 0.5.5, необходимо использовать {@link Ab_UserText}
 * @ignore
 */
final class CMSUserText extends Ab_UserText {
}


?>