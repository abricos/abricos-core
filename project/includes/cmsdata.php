<?php
/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * Протокол обмена данными между клиентом и сервером (формат данных JSON)
 * Запрос:
 * _ds: 
 * 	pfx: '[string]',					- дополнительный префикс таблиц
 * 	ss: '[time]',							- сессия DataSet
 * 	ts: [											- массив запрашиваемых таблиц
 * 	{													- объект таблица
 * 		nm: '[string]',					- имя таблицы
 * 		cmd: [									- массив комманд
 * 			'i',									- инициализация таблицы
 * 			'prm': [{...},...],		- массив параметров
 * 			'rc'									- очистить корзину (удаляет записи помеченные флагом удаления)
 * 		],
 * 		rs: [										- массив строк
 *			{
 * 				f: 'a|u|d',					-	флаг: a-добавить, u-обновить, d-удалить
 * 				d: [								- массив данных
 * 					'id': 'int',			- идентификатор записи
 * 					...								- прочии значения строки
 * 				]
 * 			},
 * 			...
 * 		]
 * 	}
 * ]
 * Ответ:
 * _ds: [											- массив возвращаемых таблиц
 * 	{													- объект таблица
 * 		nm: '',									- имя таблицы
 * Если cmd='i'								- в запросе была комманда инициализации
 * 		cols: ['[string]',...],	- список колонок
 *  	rs: [										- массив строк
 *			{
 *  			d: [								- массив данных
 * 					id: [int],	- идентификатор строки
 *  				...
 * 				]
 * 			} 			
 * 		]
 * 	}
 * ]
 */

/**
 * Класс по взаимодействию данных между клиентом и сервером
 *
 */
class CMSDataSet {
	
	/**
	 * Ядро движка
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	public $ds = null;
	
	public function __construct(CMSRegistry $registry, $ds){
		$this->registry = $registry;
		$this->ds = $ds;
	}
}

class CMSTable {
	
	/**
	 * Ядро движка
	 *
	 * @var CMSRegistry
	 */
	public $registry = null;
	
	public function __construct(CMSRegistry $registry, $table){
		$this->registry = $registry;
		
	}
}

?>