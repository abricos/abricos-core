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
     * @var mysqli
     */
    public $mysqli;

    /**
     * Массив констант используемых в fetch_array
     *
     * @var    array
     */
    public $fetchtypes = array(
        Ab_Database::DBARRAY_NUM => MYSQLI_NUM,
        Ab_Database::DBARRAY_ASSOC => MYSQLI_ASSOC,
        Ab_Database::DBARRAY_BOTH => MYSQLI_BOTH
    );

    protected function SetError($error){
        $this->error = $error;
        $this->errorText = $this->mysqli->error.
            "(SQL: ".$this->sql.")";
    }

    protected function connect_pt($server, $port, $username, $password){
        $mysqli = new mysqli($server, $username, $password, $this->database, $port);
        if ($mysqli->connect_errno){
            $this->SetError(Ab_Database::ERROR_CONNECT);
            return null;
        }
        $mysqli->set_charset('utf8');
        $this->mysqli = $mysqli;
        return $mysqli;
    }

    protected function select_db_pt($database = ''){
        return true;
    }

    protected function execute_query_pt(){
        return $this->mysqli->query($this->sql);
    }

    public function fetch_array_pt($result, $type = Ab_Database::DBARRAY_ASSOC){
        if (!$result){
            return null;
        }
        return $result->fetch_array($this->fetchtypes["$type"]);
    }

    protected function num_rows_pt($result){
        if (!$result){
            return 0;
        }
        return $result->num_rows;
    }

    /**
     * @param mysqli_result $result
     * @return int
     */
    protected function num_fields_pt($result){
        if (!$result){
            return 0;
        }
        return $result->field_count;
    }

    /**
     * @param mysqli_result $result
     * @param $index
     * @return string
     */
    protected function field_name_pt($result, $index){
        if (!$result){
            return '';
        }
        $properties = mysqli_fetch_field_direct($result, $index);
        return is_object($properties) ? $properties->name : null;
    }

    protected function insert_id_pt(){
        return $this->mysqli->insert_id;
    }

    protected function close_pt(){
        return $this->mysqli->close();
    }

    /**
     * @param mysqli_result $result
     * @return array
     */
    protected function fetch_row_pt($result){
        return $result->fetch_row();
    }

    /**
     * @param mysqli_result $result
     * @return object
     */
    protected function fetch_field_pt($result){
        return $result->fetch_field();
    }

    protected function free_result_pt($result){
        if (!$result){
            return null;
        }

        return $result->free_result();
    }

    protected function affected_rows_pt(){
        return $this->mysqli->affected_rows();
    }

    protected function system_query_pt($sqls){
        for ($i = 0; $i < count($sqls); $i++){
            $this->query_write($sqls[$i]);
        }
    }
}
