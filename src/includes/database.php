<?php
/**
 * Абстрактный класс взаимодействия с базой данных
 * 
 * В текущей версии реализован провайдер по работе с {@link Ab_DatabaseMySql MySQL }
 * 
 * @todo Необходимо реализовать провайдеры для других типов БД
 * @todo Документирован на 50%
 * 
 * @package Abricos
 * @subpackage Core
 * @link http://abricos.org
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 * 
 * @category Database
 * @abstract
 */
abstract class Ab_Database {

	/**
	 * Включить/выключить режим "только для чтения".
	 * 
	 * Если режим "только для чтения" включен, то все запросы на запись
	 * в БД будут игнорированы
	 * 
	 * Примечание: режим не работает для СУПЕРАДМИНИСТРАТОРА
	 * 
	 * Включить/выключить режим можно в файле конфигурации платформы include/config.php
	 * 
	 * @example includes/config.example.php
	 * @var bool
	 */
	public $readonly = false;

	/**
	 * Имя базы данных
	 *
	 * @var string
	 */
	public $database = "";

	/**
	 * Указатель установленной связи с БД
	 *
	 * @var	string
	 */
	public $connection;

	/**
	 * Последний обработанный SQL запрос к базе данных
	 *
	 * @var	string
	 */
	protected $sql = '';
	
	/**
	 * Номер ошибки SQL запроса
	 * 
	 * @see Ab_Database::ClearError()
	 * @var	integer
	 */
	public $error = 0;
	
	/**
	 * Текст ошибки SQL запроса
	 * 
	 * @see Ab_Database::ClearError()
	 * @var	string
	 */
	public $errorText = '';
	
	/**
	 * Код ошибки: связь с базой данных не установлена
	 * 
	 * @var integer
	 */
	const ERROR_CONNECT			= 1;
	
	/**
	 * Код ошибки: база данных {@link Ab_Database::$database} не найдена
	 * 
	 * @var integer
	 */
	const ERROR_SELECT_DB		= 2; 
	
	/**
	 * Код ошибки: ошибка в SQL запросе, текст ошибки занесен в {@link Ab_Database::$errorText}
	 * 
	 * @var integer
	 */
	const ERROR_EXECUTE_QUERY	= 3; 
	
	/**
	 * Массив констант используемых в методе fetch_array()
	 *
	 * @see Ab_Database::fetch_array()
	 * @var	array
	 * @ignore
	 */
	protected $fetchtypes = array();
	
	/**
	 * Сформировать массив из результата запроса к БД по формату: Числовой и Ассоциативный ключ
	 *  
	 * @see Ab_Database::fetch_array()
	 * @var integer
	 */
	const DBARRAY_BOTH	= 0;
	
	/**
	 * Сформировать массив из результата запроса к БД по формату: Ассоциативный ключ
	 * 
	 * @see Ab_Database::fetch_array()
	 * @var integer
	 */
	const DBARRAY_ASSOC	= 1;

	/**
	 * Сформировать массив из результата запроса к БД по формату: Числовой
	 * 
	 * @see Ab_Database::fetch_array()
	 * @var integer
	 */
	const DBARRAY_NUM	= 2;
	
	/**
	 * Количество выполненых SQL запросов на текущий момент
	 *
	 * @var integer 
	 */
	public $querycount = 0;

	/**
	 * Префикс таблиц в БД
	 * 
	 * @var string
	 */
	public $prefix = 'cms_';
	
	private $serverName = '';
	private $port = '';
	private $userName = '';
	private $password = ''; 
	
	
	/**
	 * @param string $tablePrefix Префикс таблиц
	 */
	public function __construct($tablePrefix){
		$this->prefix = empty($tablePrefix) ? 'cms_' : $tablePrefix;
	}

	/**
	 * Очистить номер и текст ошибки, снять блокировку выполнения следующих SQL запросов
	 * 
	 * Если возникает ошибка в запросе к БД, то все последующие запросы блокируются. 	 
	 * Этот метод сбрасывает эту блокировку и очищает {@link Ab_Database::$error код} 
	 * и {@link Ab_Database::$errorText текст} ошибки.
	 */
	public function ClearError(){
		$this->errorText = ''; 
		$this->error = 0; 
	}
	
	/**
	 * Установить код ошибки
	 * 
	 * @param integer $error
	 * @abstract
	 */
	protected abstract function SetError($error);
	
	/**
	 * Возникла ли ошибка в SQL запросах к БД
	 * 
	 * @return bool true - возникла ошибка
	 */
	public function IsError(){return $this->error > 0;}
	
	/**
	 * Установить свзязь с базой данных
	 * 
	 * Если связь с БД будет успешно установлена, то указатель связи будет 
	 * занесен в переменную {@link Ab_Database::@connection} 
	 *
	 * @param string $database имя базы данных
	 * @param string $servername имя или IP адрес сервера базы данных
	 * @param integer $port порт сервера базы данных
	 * @param string $username имя пользователя базы данных 
	 * @param string $password пароль пользователя базы данных
	*/
	public function connect($database, $servername, $port, $username, $password){
		$this->serverName = $servername;
		$this->port = $port;
		$this->userName = $username;
		$this->password = $password;
		$this->database = $database;
		$link = $this->connect_pt($servername, $port, $username, $password); 
		if (!$link){
			$this->SetError(Ab_Database::ERROR_CONNECT);
			return;
		}
		$this->connection = $link;
		$this->select_db($this->database);
	}
	
	/**
	 * Абстрактный метод реализации {@link Ab_Database::connect()} в провайдере
	 * 
	 * @param string $servername имя или IP адрес сервера базы данных
	 * @param integer $port порт сервера базы данных
	 * @param string $username имя пользователя базы данных 
	 * @param string $password пароль пользователя базы данных
	 * @ignore
	 */
	protected abstract function connect_pt($servername, $port, $username, $password);
	
	/**
	 * Разорвать и установить связь с сервером базы данных повторно
	 */
	public function reConnect(){
		$this->connect($this->database, $this->serverName, $this->port, $this->userName, $this->password);
	}
	
	/**
	 * Выбрать базу данных 
	 *
	 * @param string $database имя базы данных
	 *
	 * @return bool true если база данных выбрана успешно
	 */
	public function select_db($database = ''){
		if ($database != '')		{
			$this->database = $database;
		}

		$check = $this->select_db_pt($database);
		
		if (!$check) {
			$this->SetError(Ab_Database::ERROR_SELECT_DB);
			return false;
		} 
		return false;
	}
	
	/**
	 * Абстрактный метод реализации {@link Ab_Database::select_db()} в провайдере
	 * 
	 * @param string $database имя базы данных
	 * @ignore
	 */
	protected abstract function select_db_pt($database = '');
	
	/**
	 * Вернуть идентификатор добавленой записи последнего SQL запроса INSERT  
	 * 
	 * @return integer
	 */
	public function insert_id(){
		return $this->insert_id_pt(); 
	}

	/**
	 * Абстрактный метод реализации {@link Ab_Database::insert_id()} в провайдере
	 * 
	 * @ignore
	 */
	protected abstract function insert_id_pt();
	
	private function &execute_query(){
		$this->querycount++;
		$result = $this->execute_query_pt();
		if (!$result){
			$this->SetError(Ab_Database::ERROR_EXECUTE_QUERY);
		}
		return $result;
	}
	
	/**
	 * Абстрактный метод выполнения SQL запроса
	 * 
	 * @ignore
	 */
	protected abstract function &execute_query_pt();
	
	/**
	 * Сформировать массив из строки результата SQL запроса SELECT
	 * 
	 * Значение $type определяет какой тип массива сформировать: числовой или ассоциативный ключ, или оба
	 * 
	 * Например:
	 * <code>
	 * $rows = Abricos::$db->query_read("SELECT * FROM mytable");
	 * while (($row = Abricos::$db->fetch_array($rows))){
	 *   $out .="<row>";
	 *   $out .= "<id>".$row['id']."</id>";
	 *   $out .= "<title>".$row['tl']."</title>";
	 *   $out .= "</row>";
	 * }
	 * </code>
	 * 
	 * @param integer $queryresult указатель на результат SQL запроса
	 * @param integer $type одно из значений {@link Ab_Database::DBARRAY_ASSOC} / {@link Ab_Database::DBARRAY_NUM} / {@link Ab_Database::DBARRAY_BOTH}
	 */
	public function fetch_array($queryresult, $type = Ab_Database::DBARRAY_ASSOC){
		if ($this->IsError()) return null;
		$ret = $this->fetch_array_pt($queryresult, $type);
		return $ret;
	}
	/**
	 * @ignore
	 */
	protected abstract function fetch_array_pt($queryresult, $type = Ab_Database::DBARRAY_ASSOC);

	/**
	 * Вернуть первую запись из SQL запроса SELECT в виде ассоциативного массива
	 * 
	 * @param string $sql SQL запрос SELECT 
	 * @param $type
	 * 
	 * @return array|null
	 */
	public function &query_first($sql, $type = Ab_Database::DBARRAY_ASSOC) {
		if ($this->IsError()) return null;
		$this->sql =& $sql;
		$queryresult = $this->execute_query();
		
		$returnarray = $this->fetch_array($queryresult, $type);
		
		$this->free_result($queryresult);
		return $returnarray;
	}
	
	/**
	 * Выполнить SQL запрос
	 * 
	 * Не рекомендуется использовать этот метод, потому что не него не действует 
	 * режим "только для чтение" 
	 * 
	 * Лучше использовать метод {@link Ab_Database::query_read() query_read} 
	 * для запросов чтение данных из БД и метод 
	 * {@link Ab_Database::query_write() query_write} для записи данных в БД
	 * 
	 * 
	 * 
	 * @param string $sql SQL запрос
	 * @return integer указатель на результат запроса
	 */
	public function query($sql) {
		if ($this->IsError()) return null;
		$this->sql =& $sql;
		return $this->execute_query();
	}

	/**
	 * Выполнить SQL запрос на чтение (SELECT)
	 * 
	 * @param string $sql SQL запрос
	 * @return integer указатель на результат запроса
	 */
	public function query_read($sql) {
		if ($this->IsError()) return null;
		$this->sql =& $sql;
		return $this->execute_query();
	}
	
	/**
	 * Выполнить SQL запрос на запись (INSERT, UPDATE, DELETE и т.п.) 
	 * 
	 * Если параметр $ignoreReadOnly = true, то игнорировать свойство {@link Ab_Database::$readonly}
	 *  
	 * @param $sql SQL запрос
	 * @param $ignoreReadOnly игнорировать режим "только для чтения"
	 * 
	 * @return integer идентификатор указателя на результат SQL запроса
	 */
	public function query_write($sql, $ignoreReadOnly = false) {
		if ($this->IsError()) return null;
		if ($this->readonly){
			if (!$ignoreReadOnly)
				return null;
		}
		$this->sql =& $sql;
		return $this->execute_query();
	}
	
	/**
	 * Вернуть кол-во записей из результата SQL запроса
	 * @param integer $queryresult идентификатор указателя на результат SQL запроса
	 * @return integer
	 */
	public function num_rows($queryresult) {
		if ($this->IsError()) return 0;
		return $this->num_rows_pt($queryresult);
	}
	
	/**
	 * @ignore
	 */
	protected abstract function num_rows_pt($queryresult);
	
	/**
	 * Вернуть кол-во полей таблицы из указанного результата SQL запроса
	 * 
	 * @param integer $queryresult идентификатор указателя на результат SQL запроса
	 * @return integer
	 */
	public function num_fields($queryresult) {
		return $this->num_fields_pt($queryresult);
	}
	/**
	 * @ignore
	 */
	protected abstract function num_fields_pt($queryresult);

	public function field_name($queryresult, $index){
		return $this->field_name_pt($queryresult, $index);
	}
	/**
	 * @ignore
	 */
	protected abstract function field_name_pt($queryresult, $index);

	public function client_encoding() {
		return $this->client_encoding_pt();
	}
	/**
	 * @ignore
	 */
	protected abstract function client_encoding_pt();
	
	public function close() {
		return $this->close_pt();
	}
	/**
	 * @ignore
	 */
	protected abstract function close_pt();

	public function fetch_row($queryresult) {
		return $this->fetch_row_pt($queryresult);
	}
	/**
	 * @ignore
	 */
	protected abstract function fetch_row_pt($queryresult);

	public function fetch_field($queryresult)	{
		return $this->fetch_field_pt($queryresult);
	}
	/**
	 * @ignore
	 */
	protected abstract function fetch_field_pt($queryresult);	

	/**
	 * Освободить всю память связанную с указанным результатом SQL запроса
	 *
	 * @param string $queryresult указатель на результат SQL запроса
	 *
	 * @return bool
	 */
	public function free_result($queryresult) {
		$this->sql = '';
		return $this->free_result_pt($queryresult);
	}
	/**
	 * @ignore
	 */
	protected abstract function free_result_pt($queryresult);

	/**
	 * Вернуть кол-во задействованных строк в последнем запросе insert/replace/update
	 *
	 * @return integer
	 */
	public function affected_rows() {
		$this->rows = $this->affected_rows_pt(); 
		return $this->rows;
	}	
	
	/**
	 * @ignore
	 */
	protected abstract function affected_rows_pt();
	
	public function system_query($sqls){
		if (empty($sqls)){
			return;
		}
		$this->system_query_pt($sqls);
	}
	/**
	 * @ignore
	 */
	protected abstract function system_query_pt($sqls);
}

?>