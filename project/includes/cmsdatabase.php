<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * Менеджер Базы данных
 */
abstract class CMSDatabase extends CMSBaseClass {
	/**
	 * Главный класс управление движком
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	/**
	 * Режим "Только для чтения"
	 *
	 * @var boolean
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
	* Последний вызываемый запрос к БД
	*
	* @var	string
	*/
	protected $sql = '';
	
	/**
	 * Номер ошибки
	 * @var	integer	Номер ошибки
	 */
	public $error = 0;
	
	/**
	 * Текст ошибки
	 * @var	string
	 */
	public $errorText = '';
	
	const ERROR_CONNECT = 1;
	const ERROR_SELECT_DB = 2; 
	const ERROR_EXECUTE_QUERY = 3; 
	
	/**
	 * Массив констант используемых в fetch_array
	 *
	 * @var	array
	 */
	public $fetchtypes = array();
	
	const DBARRAY_BOTH	= 0;
	const DBARRAY_ASSOC = 1;
	const DBARRAY_NUM		= 2;
	
	/**
	* Number of queries executed
	*
	* @var	integer	The number of SQL queries run by the system
	*/
	protected $querycount = 0;
	
	public $prefix = 'cms_';
	
	public function __construct(CMSRegistry $registry){
		$this->registry = $registry;
	}
	
	public function ClearError(){
		$this->errorText = ''; 
		$this->error = 0; 
	}
	
	protected abstract function SetError($error);
	/**
	 * Есть ли ошибка
	 *
	 * @return boolean
	 */
	public function IsError(){return $this->error > 0;}
	
	/**
	* Соединение с БД
	*
	* @param	string	Имя БД
	* @param	string	Имя сервера (по умолчанию 'localhost') или IP адрес
	* @param	integer	Порт
	* @param	string	Имя пользователя
	* @param	string	Пароль
	*
	* @return	none
	*/
	public function connect($database, $servername, $port, $username, $password){
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
	
	/**
	* Selects a database to use
	*
	* @param	string	The name of the database located on the database server(s)
	*
	* @return	boolean
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
		// echo($this->sql."\n");
		if (!$result){
			$this->SetError(CMSDatabase::ERROR_EXECUTE_QUERY);
		}
		// echo("error=".$this->errorText."\n");
		return $result;
	}
	
	public function insert_id(){
		return $this->insert_id_pt(); 
	}
	protected abstract function insert_id_pt();
	
	protected abstract function &execute_query_pt();
	
	/**
	 * Преобразование результата запроса в массив
	 * Значение $type определяет тип возвращаемого результата
	 * 
	 * @param	string	ID результата
	 * @param	integer	одно из значений CMSDatabase::DBARRAY_ASSOC / CMSDatabase::DBARRAY_NUM / CMSDatabase::DBARRAY_BOTH
	 */
	public function fetch_array($queryresult, $type = CMSDatabase::DBARRAY_ASSOC){
		if ($this->IsError()) return null;
		$ret = $this->fetch_array_pt($queryresult, $type);
		return $ret;
	}
	protected abstract function fetch_array_pt($queryresult, $type = CMSDatabase::DBARRAY_ASSOC);

	public function &query_first($sql, $type = CMSDatabase::DBARRAY_ASSOC) {
		if ($this->IsError()) return null;
		$this->sql =& $sql;
		$queryresult = $this->execute_query();
		
		$returnarray = $this->fetch_array($queryresult, $type);
		
		$this->free_result($queryresult);
		return $returnarray;
	}
	
	public function query($sql) {
		if ($this->IsError()) return null;
		$this->sql =& $sql;
		return $this->execute_query();
	}

	public function query_read($sql) {
		if ($this->IsError()) return null;
		$this->sql =& $sql;
		return $this->execute_query();
	}
	
	public function query_write($sql, $ignoreReadOnly = false) {
		if ($this->IsError()) return null;
		if ($this->readonly){
			if (!$ignoreReadOnly)
				return null;
		}
		$this->sql =& $sql;
		return $this->execute_query();
	}
	
	public function num_rows($queryresult) {
		if ($this->IsError()) return 0;
		return $this->num_rows_pt($queryresult);
	}
	
	protected abstract function num_rows_pt($queryresult);
	
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
	* Frees all memory associated with the specified query result
	*
	* @param	string	The query result ID we are dealing with
	*
	* @return	boolean
	*/
	public function free_result($queryresult) {
		
		$this->sql = '';
		return $this->free_result_pt($queryresult);
	}
	
	protected abstract function free_result_pt($queryresult);

	/**
	* Retuns the number of rows affected by the most recent insert/replace/update query
	*
	* @return	integer
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