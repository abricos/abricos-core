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
 * Класс по работе с БД MySql
 */
class Ab_DatabaseMySql extends Ab_Database {

    /**
     * Массив констант используемых в fetch_array
     *
     * @var    array
     */
    public $fetchtypes = array(
        Ab_Database::DBARRAY_NUM => MYSQL_NUM,
        Ab_Database::DBARRAY_ASSOC => MYSQL_ASSOC,
        Ab_Database::DBARRAY_BOTH => MYSQL_BOTH
    );

    protected function SetError($error){
        $this->error = $error;
        $this->errorText = mysql_error().
            "(SQL: ".$this->sql.")";
    }

    protected function connect_pt($servername, $port, $username, $password){
        $lnk = @mysql_connect("$servername:$port", $username, $password);
        @mysql_query("SET NAMES `utf8`");
        return $lnk;
    }

    protected function select_db_pt($database = ''){
        $ret = mysql_select_db($database, $this->connection);
        return $ret;
    }

    protected function &execute_query_pt(){
        $ret = mysql_query($this->sql);
        return $ret;
    }

    public function fetch_array_pt($queryresult, $type = Ab_Database::DBARRAY_ASSOC){
        $ret = @mysql_fetch_array($queryresult, $this->fetchtypes["$type"]);
        return $ret;
    }

    protected function num_rows_pt($queryresult){
        $ret = @mysql_num_rows($queryresult);
        return $ret;
    }

    protected function num_fields_pt($queryresult){
        $ret = @mysql_num_fields($queryresult);
        return $ret;
    }

    protected function field_name_pt($queryresult, $index){
        $ret = @mysql_field_name($queryresult, $index);
        return $ret;
    }

    protected function insert_id_pt(){
        $ret = @mysql_insert_id($this->connection);
        return $ret;
    }

    protected function client_encoding_pt(){
        $ret = @mysql_client_encoding($this->connection);
        return $ret;
    }

    protected function close_pt(){
        $ret = @mysql_close($this->connection);
        return $ret;
    }

    protected function fetch_row_pt($queryresult){
        $ret = @mysql_fetch_row($queryresult);
        return $ret;
    }

    protected function fetch_field_pt($queryresult){
        $ret = @mysql_fetch_field($queryresult);
        return $ret;
    }

    protected function free_result_pt($queryresult){
        $ret = @mysql_free_result($queryresult);
        return $ret;
    }

    protected function affected_rows_pt(){
        $ret = @mysql_affected_rows($this->connection);
        return $ret;
    }

    protected function system_query_pt($sqls){
        for ($i = 0; $i < count($sqls); $i++){
            $this->query_write($sqls[$i]);
        }
    }
}
