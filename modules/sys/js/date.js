/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008-2011 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.entryPoint = function(NS){
	
	var L = YAHOO.lang;
	
	NS.getDate = function(){ return new Date(); };
	
	var lz = function(num){
		var snum = num+'';
		return snum.length == 1 ? '0'+snum : snum; 
	};
	
	NS.TZ_OFFSET = NS.getDate().getTimezoneOffset();
	NS.TZ_OFFSET = 0;
	
	NS.dateToServer = function(date){
		if (L.isNull(date)){ return 0; }
		var tz = NS.TZ_OFFSET*60*1000;
		return (date.getTime()-tz)/1000; 
	};
	NS.dateToClient = function(unix){
		unix = unix * 1;
		if (unix == 0){ return null; }
		var tz = NS.TZ_OFFSET*60;
		return new Date((tz+unix)*1000);
	};
	
	NS.dateToTime = function(date){
		return lz(date.getHours())+':'+lz(date.getMinutes());
	};
	
	var DPOINT = '.';
	NS.dateToString = function(date){
		if (L.isNull(date)){ return ''; }
		var day = date.getDate();
		var month = date.getMonth()+1;
		var year = date.getFullYear();
		return lz(day)+DPOINT+lz(month)+DPOINT+year;
	};
	NS.stringToDate = function(str){
		str = str.replace(/,/g, '.').replace(/\//g, '.');
		var aD = str.split(DPOINT);
		if (aD.length != 3){ return null; }
		var day = aD[0]*1, month = aD[1]*1-1, year = aD[2]*1;
		if (day > 31 || day < 0){ return null; }
		if (month > 11 || month < 0) { return null; }
		return new Date(year, month, day);
	};
	
	NS.timeToString = function(date){
		if (L.isNull(date)){ return ''; }
		return lz(date.getHours()) +':'+lz(date.getMinutes());
	};
	NS.parseTime = function(str){
		var a = str.split(':');
		if (a.length != 2){ return null; }
		var h = a[0]*1, m = a[1]*1;
		if (!(h>=0 && h<=23 && m>=0&&m<=59)){ return null; }
		return [h, m];
	};
	
	// кол-во дней, часов, минут (параметр в секундах)
	NS.timeToSSumma = function(hr){
		var ahr = [];
		var d = Math.floor(hr / (60*60*24));
		if (d > 0){
			hr = hr-d*60*60*24;
			ahr[ahr.length] = d+'д';
		}
		var h = Math.floor(hr / (60*60));
		if (h > 0){
			hr = hr-h*60*60;
			ahr[ahr.length] = h+'ч';
		}
		var m = Math.floor(hr / 60);
		if (m > 0){
			hr = hr-m*60;
			ahr[ahr.length] = m+'м';
		}
		return ahr.join(' ');
	};
};