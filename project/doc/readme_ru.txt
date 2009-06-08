/* * * * * * * * * * * * * * * * * * * * * * * * * * * 
/* Brick CMS (open source project)
/* Copyright © 2008 Kuzmin Alexander
/* Site: http://cmsbrick.ru
/* License: GNU GENERAL PUBLIC LICENSE version 2
/* * * * * * * * * * * * * * * * * * * * * * * * * * * 

Brick CMS version 1.0.2

Для работы системы необходимы следующие хар-ки вашего сайта:
	PHP не ниже 5 версии
	MySql не ниже 4 версии
	Apache версии 2 и выше с загруженными модулями: mod_rewrite

Установка:
1) Создайте базу данных на вашем сайте в кодировке utf8 сравнение utf8_general_ci
2) Скачайте последнюю версию системы с официального сайта http://cmsbrick.ru
3) Извлеките архив в нужный каталог вашего сайта
4) Переименуйте файл includes/config.new.php в includes/config.php  
5) Настройте Brick CMS для работы с базой данных MySql в этом файле (config.php):
	
	$config['Database']['dbname'] = 'имя_базы_данных';
	$config['Server']['username'] = 'имя_пользователя';
	$config['Server']['password'] = 'пароль';
	
6) Установите права 777 папке temp системы Brick CMS 
7) Откройте главную страницу вашего сайта в браузере, в этот момент движок утсановит все таблицы и откроет главную страницу
По умолчанию создается пользователь: 
имя: admin 
пароль: admin  
 