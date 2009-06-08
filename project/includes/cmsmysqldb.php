<?php
/**
* @version $Id: cmsmysqldb.php 741 2009-04-07 13:28:45Z AKuzmin $
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * База данных MySql
 */
class CMSMySqlDB extends CMSDatabase {

	/**
	 * Массив констант используемых в fetch_array
	 *
	 * @var	array
	 */
	public $fetchtypes = array(
		CMSDatabase::DBARRAY_NUM   => MYSQL_NUM,
		CMSDatabase::DBARRAY_ASSOC => MYSQL_ASSOC,
		CMSDatabase::DBARRAY_BOTH  => MYSQL_BOTH
	);
	
	/**
	* SQL Query String
	*
	* @var	integer	The maximum size of query string permitted by the master server
	*/
	private $maxpacket = 0;

	protected function SetError($error){
		$this->error = $error;
		$this->errorText = mysql_error().
			"(SQL: ".$this->sql.")";
	}
	
 	protected function connect_pt($servername, $port, $username, $password){
 		$lnk = mysql_connect("$servername:$port", $username, $password);
 		@mysql_query ("SET NAMES `utf8`");
		return $lnk;
	}

	protected function select_db_pt($database = '')	{
		return mysql_select_db($database, $this->connection);
	}
	
	protected function &execute_query_pt() {
		return mysql_query($this->sql);
	}
	
	public function fetch_array_pt($queryresult, $type = CMSDatabase::DBARRAY_ASSOC) {
		return @mysql_fetch_array($queryresult, $this->fetchtypes["$type"]);
	}
	
	protected function num_rows_pt($queryresult){
		return @mysql_num_rows($queryresult);
	}
	
	protected function num_fields_pt($queryresult){
		return @mysql_num_fields($queryresult);
	}
	
	protected function field_name_pt($queryresult, $index){
		return @mysql_field_name($queryresult, $index);
	}
	
	protected function insert_id_pt(){
		return @mysql_insert_id($this->connection);
	}
	
	protected function client_encoding_pt(){
		return @mysql_client_encoding($this->connection);
	}
	protected function close_pt(){
		return @mysql_close($this->connection);
	}
	
	protected function fetch_row_pt($queryresult){
		return @mysql_fetch_row($queryresult);
	}

	protected function fetch_field_pt($queryresult){
		return @mysql_fetch_field($queryresult);
	}
	
	protected function free_result_pt($queryresult){
		return @mysql_free_result($queryresult);
	}
	
	protected function affected_rows_pt(){
		return @mysql_affected_rows($this->connection);
	}
	
	protected function system_query_pt($sqls){
		for ($i=0;$i<count($sqls);$i++){
			$this->query_write($sqls[$i]);
		}
	}
}

?>