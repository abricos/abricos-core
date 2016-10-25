<?php
/**
 * @package Abricos
 * @subpackage Core
 * @copyright 2008-2016 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 * @link http://abricos.org
 */

/**
 * Парсер URI
 *
 * В идеологии платформы Абрикос адрес URI имеет ключевое значение.
 *
 * Разбирая адрес URI платформа Абрикос определяет
 * какой модуль будет отвечать за выдачу контента страницы
 * и передает ему управление.
 *
 * Например, в адресе http://mydomain.tld/news/page2/ управление получит
 * модуль "Новости"(news).
 * Получив управление, на основе полученных данных определит какой контент
 * необходимо выдать в браузер клиента.
 *
 * Например:
 * <code>
 * $adress = new Ab_URI("/news/page2/");
 * if ($adress->level == 2 && substr($adress->dir[1], 0, 4) == "page"){
 *   // сборка определенной страницы списка новостей
 *   ...
 * }
 *
 * // в результате print_r($adress) на localhost будет:
 * // Ab_URI Object
 * // (
 * //     [dir] => Array
 * //         (
 * //             [0] => news
 * //             [1] => page2
 * //         )
 * //     [contentName] => index
 * //     [level] => 2
 * //     [contentDir] => /news/page2
 * //     [requestURI] => /news/page2/
 * //     [requestURINonParam] => /news/page2/index.html
 * //     [host] => http://localhost
 * // )
 * </code>
 *
 * <b>Стандартизация адреса</b>
 *
 * Любой адрес URI используемый в платформе Абрикос приводится к виду: <i>/[modname/[param1/[paramN/]]]][contentname].html</i>,
 *
 * где: <br />
 * <i>modname</i> имя управляющего модуля;<br />
 * <i>param1[N]</i> параметры;<br />
 * <i>contentname</i> идентификатор контента. В основном используется
 * модулем "Структура сайта (sitemap)" для идентификации отдельных страниц.
 *
 * Например эти адреса эквивалентны:
 * <pre>
 * /news/page
 * /news/page/
 * /news/page/index.html
 * </pre>
 */
class Ab_URI {


    /**
     * Массив параметров стандартизированного URI
     *
     * Например:
     * <code>
     * $adress = new Ab_URI("/news/page2/index.html");
     * if ($adress->dir[0] == "news"){
     *  ...
     * }
     * </code>
     * В данном примере $adress->dir будет иметь значение в виде массива из двух элементов ["news", "page2"]
     *
     * @var Array
     */
    public $dir = array();

    /**
     * Идентификатор страницы контанта стандартизированного URI
     *
     * Например:
     * <code>
     * $adress = new Ab_URI("/news/page2/myindex.html");
     * if ($adress->contentName == "myindex"){
     *  ...
     * }
     * </code>
     * В данном примере $adress->contentName будет иметь значение "myindex"
     *
     * @var string
     */
    public $contentName = "index";

    /**
     * Кол-во параметров стандартизированного URI
     *
     * Например:
     * <code>
     * $adress = new Ab_URI("/news/page2/myindex.html");
     * if ($adress->level >= 2){
     *  ...
     * }
     * </code>
     * В данном примере $adress->level будет иметь значение равное 2-м
     *
     * @var integer
     */
    public $level = 0;

    /**
     * Запрашиваемый путь к скрипту
     *
     * Практически не используется, оставлен для совместимости
     *
     * @var string
     * @ignore
     * @deprecated
     */
    public $contentDir = "/";

    /**
     * Стандартизированный URI
     *
     * Например:
     * <code>
     * $adress = new Ab_URI("/news/page2/myindex.html?prm=qwerasdf");
     * </code>
     * В данном примере $adress->uri будет иметь значение "/news/page2/myindex.html"
     *
     * @var integer
     */
    public $uri = "";

    /**
     * Стандартизированный URI без идентификатора страницы контента, если он явно не указан
     *
     * Например:
     * <code>
     * $adress1 = new Ab_URI("/news/page2/myindex.html?param=2");
     * $adress2 = new Ab_URI("/news/page2");
     * </code>
     * В данном примере $adress1->requestURI будет иметь значение "/news/page2/myindex.html", <br />
     * a $adress2->requestURI будет иметь значение "/news/page2"
     *
     * @var integer
     */
    public $requestURI = "";

    public $requestURINonParam = "";

    /**
     * Хост этого сервера
     *
     * Не используется, оставлен для совместимости
     *
     * @deprecated
     * @ignore
     */
    public $host = "";

    /**
     * Конструктор
     *
     * @param string $uri идентификатор ресурса на хосте
     */
    public function __construct($uri){
        $this->Build($uri);
    }

    /**
     * Получить адрес директории начиная с $sublevel
     *
     * Не используется, оставлен для совместимости
     *
     * @deprecated
     * @ignore
     */
    public function GetDir($sublevel = -1){
        if ($sublevel == -1){
            $sublevel = $this->level - 1;
        }
        $path = "";
        for ($i = $sublevel; $i < $this->level; $i++){
            $path .= "/".$this->dir[$i];
        }
        return $path;
    }

    /**
     * Переход на нулевой уровень в урле и пересборка адреса
     *
     * Не используется, оставлен для совместимости
     *
     * @deprecated
     * @ignore
     */
    public function MoveTop(){
        $this->Build($this->host);
    }

    /**
     * Стандартизировать URI
     *
     * @param string $suri исходный uri
     */
    public function Build($suri){
        $a = parse_url($suri);
        $requestUri = $a['path'];

        $this->host = "http://".Ab_URI::fetch_host();
        // $requestUri = strtolower($requestUri);
        $this->requestURI = $requestUri;
        $arr = parse_url($requestUri);
        $script = $arr['path'];

        if (substr($script, strlen($script) - 5) != ".html"){
            $script .= substr($script, strlen($script) - 1) == "/" ? "" : "/";
            $script .= "index.html";
        }

        $this->requestURINonParam = $script;
        $dir = explode('/', $script);
        $this->contentName = array_pop($dir);
        $this->contentName = substr($this->contentName, 0, strlen($this->contentName) - 5);
        $this->contentDir = implode('/', $dir);

        $i = 0;
        foreach ($dir as $d){
            if (empty($d)){
                continue;
            }
            $this->dir[$i++] = $d;
        }
        $this->level = count($this->dir);

        $this->uri = $this->requestURINonParam;
    }

    public static function Site(){
        $site = !empty($_SERVER['HTTPS']) ? 'https' : 'http';
        $site .= "://".$_SERVER['HTTP_HOST'];
        return $site;
    }

    /**
     * Получить имя хоста этого сервера
     *
     * @static
     * @return string имя хоста текущего запроса
     */
    public static function fetch_host(){
        return $_SERVER['HTTP_HOST'];
    }

    /**
     * Получить URI из текущего запроса к серверу
     *
     * @static
     * @return string uri текущего запроса
     */
    public static function fetch_uri(){
        $scriptPath = "";
        if ($_SERVER['REQUEST_URI'] OR $_ENV['REQUEST_URI']){
            $scriptPath = $_SERVER['REQUEST_URI'] ? $_SERVER['REQUEST_URI'] : $_ENV['REQUEST_URI'];
        } else {
            if ($_SERVER['PATH_INFO'] OR $_ENV['PATH_INFO']){
                $scriptPath = $_SERVER['PATH_INFO'] ? $_SERVER['PATH_INFO'] : $_ENV['PATH_INFO'];
            } else if ($_SERVER['REDIRECT_URL'] OR $_ENV['REDIRECT_URL']){
                $scriptPath = $_SERVER['REDIRECT_URL'] ? $_SERVER['REDIRECT_URL'] : $_ENV['REDIRECT_URL'];
            } else {
                $scriptPath = $_SERVER['PHP_SELF'] ? $_SERVER['PHP_SELF'] : $_ENV['PHP_SELF'];
            }
            if ($_SERVER['QUERY_STRING'] OR $_ENV['QUERY_STRING']){
                $scriptPath .= '?'.($_SERVER['QUERY_STRING'] ? $_SERVER['QUERY_STRING'] : $_ENV['QUERY_STRING']);
            }
        }
        return $scriptPath;
    }
}
