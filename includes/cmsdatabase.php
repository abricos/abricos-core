<?php
/**
* @version $Id$
* @package Abricos
* @copyright Copyright (C) 2008 Abricos. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * Абстрактный класс взаимодействия с базой данных.
 * 
 */
abstract class CMSDatabase {
	/**
	 * Ядро платформы BrickCMS
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	/**
	 * Режим "Только для чтения".
	 * Если значение установлено в TRUE, то все запросы, которые подразумевают внесения 
	 * изменений в таблицы базы данных, будут игнорированы. 
	 *
	 * @var bool
	 */
	public $readonly = false;

	/**
	 * Имя базы
	 *
	 * @var string
	 */
	public $database = "";

	/**
	 * Ссылка коннекта к БД
	 *
	 * @var	string
	 */
	public $connection = null;

	/**
	 * Последний обработанный SQL запрос к базе данных
	 *
	 * @var	string
	 */
	protected $sql = '';
	
	/**
	 * Номер ошибки
	 * @var	integer
	 */
	public $error = 0;
	
	/**
	 * Текст ошибки
	 * @var	string
	 */
	public $errorText = '';
	
	/**
	 * Ошибка - Связь с базой данных не установлена
	 * @var integer
	 */
	const ERROR_CONNECT			= 1;
	/**
	 * Ошибка - База данных {@link $database} не найдена
	 * @var integer
	 */
	const ERROR_SELECT_DB		= 2; 
	/**
	 * Ошибка в SQL запросе, текст ошибки в {@link $errorText}
	 * @var integer
	 */
	const ERROR_EXECUTE_QUERY	= 3; 
	
	/**
	 * Массив констант используемых в fetch_array
	 *
	 * @var	array
	 */
	public $fetchtypes = array();
	
	/**
	 * Тип массива результата SQL запроса: Числовой и Ассоциативный ключ 
	 * @var integer
	 */
	const DBARRAY_BOTH		= 0;
	/**
	 * Тип массива результата SQL запроса: Ассоциативный ключ 
	 * @var integer
	 */
	const DBARRAY_ASSOC		= 1;
	/**
	 * Тип массива результата SQL запроса: Числовой 
	 * @var integer
	 */
	const DBARRAY_NUM		= 2;
	
	/**
	* Количество выполненых SQL запросов за текущую сессию
	*
	* @var integer 
	*/
	protected $querycount = 0;

	/**
	 * Префикс таблиц
	 * 
	 * @var string
	 */
	public $prefix = 'cms_';
	
	private $serverName = '';
	private $port = '';
	private $userName = '';
	private $password = ''; 
	
	
	/**
	 * Конструктор  
	 * 
	 * @param CMSRegistry $registry 
	 */
	public function CMSDatabase(CMSRegistry $registry){
		$this->registry = $registry;
	}
	
	public function ClearError(){
		$this->errorText = ''; 
		$this->error = 0; 
	}
	
	protected abstract function SetError($error);
	
	/**
	 * Если возникла ошибка в процессе работы с базой данных, то вернет TRUE
	 *
	 * @return bool
	 */
	public function IsError(){return $this->error > 0;}
	
	/**
	* Установка соединения с базой данных 
	*
	* @param string имя базы данных
	* @param string адрес сервера (имя или IP адрес)
	* @param integer порт сервера
	* @param string имя пользователя
	* @param string пароль пользователя
	*/
	public function connect($database, $servername, $port, $username, $password){
		$this->serverName = $servername;
		$this->port = $port;
		$this->userName = $username;
		$this->password = $password;
		$this->database = $database;
		$link = $this->connect_pt($servername, $port, $username, $password); 
		if (!$link){
			$this->SetError(CMSDatabase::ERROR_CONNECT);
			return;
		}
		$this->connection = $link;
		$this->select_db($this->database);
	}
	
	protected abstract function connect_pt($servername, $port, $username, $password);
	
	public function reConnect(){
		$this->connect($this->database, $this->serverName, $this->port, $this->userName, $this->password);
	}
	
	/**
	 * Выбрать базу данных 
	 *
	 * @param string имя базы данных
	 *
	 * @return bool TRUE - если база данных выбрана
	 */
	public function select_db($database = ''){
		if ($database != '')		{
			$this->database = $database;
		}

		$check = $this->select_db_pt($database);
		
		if (!$check) {
			$this->SetError(CMSDatabase::ERROR_SELECT_DB);
			return false;
		} 
		return false;
	}
	
	protected abstract function select_db_pt($database = '');
	
	private function &execute_query(){
		$this->querycount = $this->querycount + 1;
		$result = $this->execute_query_pt();
		if (!$result){
			$this->SetError(CMSDatabase::ERROR_EXECUTE_QUERY);
		}
		return $result;
	}
	
	/**
	 * Функция возвращает идентификатор добавленной записи выполненого последнего SQL запроса insert  
	 * 
	 * @return integer
	 */
	public function insert_id(){
		return $this->insert_id_pt(); 
	}
	protected abstract function insert_id_pt();
	
	protected abstract function &execute_query_pt();
	
	/**
	 * Выбирает строку из результата запроса и возвращает значения из этой строки в виде массива
	 * 
	 * Значение $type определяет будет ли массив иметь числовой или ассоциативный ключ, или оба
	 * 
	 * @param	string	ID результата SQL запроса
	 * @param	integer	одно из значений CMSDatabase::DBARRAY_ASSOC / CMSDatabase::DBARRAY_NUM / CMSDatabase::DBARRAY_BOTH
	 */
	public function fetch_array($queryresult, $type = CMSDatabase::DBARRAY_ASSOC){
		if ($this->IsError()) return null;
		$ret = $this->fetch_array_pt($queryresult, $type);
		return $ret;
	}
	protected abstract function fetch_array_pt($queryresult, $type = CMSDatabase::DBARRAY_ASSOC);

	/**
	 * Функция возвращает первую запись из SQL запроса в виде ассоциативного массива
	 * 
	 * @param string $sql SQL запрос 
	 * @param $type
	 * @return mixed
	 */
	public function &query_first($sql, $type = CMSDatabase::DBARRAY_ASSOC) {
		if ($this->IsError()) return null;
		$this->sql =& $sql;
		$queryresult = $this->execute_query();
		
		$returnarray = $this->fetch_array($queryresult, $type);
		
		$this->free_result($queryresult);
		return $returnarray;
	}
	
	/**
	 * Выполнить SQL запрос
	 * @param string $sql SQL запрос
	 * @return integer идентификатор указателя на результат
	 */
	public function query($sql) {
		if ($this->IsError()) return null;
		$this->sql =& $sql;
		return $this->execute_query();
	}

	/**
	 * Выполнить SQL запрос на чтение
	 * @param string $sql SQL запрос
	 * @return integer идентификатор указателя на результат
	 */
	public function query_read($sql) {
		if ($this->IsError()) return null;
		$this->sql =& $sql;
		return $this->execute_query();
	}
	
	/**
	 * Выполнить SQL запрос на запись. 
	 * 
	 * Если параметр $ignoreReadOnly = true, то игнорировать свойство {@link $readonly} 
	 * @param $sql
	 * @param $ignoreReadOnly
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
	
	protected abstract function num_rows_pt($queryresult);
	
	/**
	 * Вернуть кол-во полей таблицы из указанного результата SQL запроса
	 * @param integer $queryresult идентификатор указателя на результат SQL запроса
	 * @return integer
	 */
	public function num_fields($queryresult) {
		return $this->num_fields_pt($queryresult);
	}
	protected abstract function num_fields_pt($queryresult);

	public function field_name($queryresult, $index){
		return $this->field_name_pt($queryresult, $index);
	}
	protected abstract function field_name_pt($queryresult, $index);

	public function client_encoding() {
		return $this->client_encoding_pt();
	}
	protected abstract function client_encoding_pt();
	
	public function close() {
		return $this->close_pt();
	}
	protected abstract function close_pt();

	public function fetch_row($queryresult) {
		return $this->fetch_row_pt($queryresult);
	}
	
	protected abstract function fetch_row_pt($queryresult);

	public function fetch_field($queryresult)	{
		return $this->fetch_field_pt($queryresult);
	}
	
	protected abstract function fetch_field_pt($queryresult);	

	/**
	 * Освободить всю память связанную с указанным результатом запроса
	 *
	 * @param string $queryresult идентификатор указателя на результат SQL запроса
	 *
	 * @return bool
	 */
	public function free_result($queryresult) {
		$this->sql = '';
		return $this->free_result_pt($queryresult);
	}
	
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
	
	protected abstract function affected_rows_pt();
	
	public function system_query($sqls){
		if (empty($sqls)){
			return;
		}
		$this->system_query_pt($sqls);
	}
	protected abstract function system_query_pt($sqls);
}
?>