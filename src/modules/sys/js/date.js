/*
 @package Abricos
 @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 */

var Component = new Brick.Component();
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        L = Y.Lang;

    NS.getDate = function(){
        return new Date();
    };

    var lz = function(num){
        var snum = num + '';
        return snum.length == 1 ? '0' + snum : snum;
    };

    NS.TZ_OFFSET = NS.getDate().getTimezoneOffset();
    NS.TZ_OFFSET = 0;

    NS.dateToServer = function(date){
        if (L.isNull(date)){
            return 0;
        }
        var tz = NS.TZ_OFFSET * 60 * 1000;
        return (date.getTime() - tz) / 1000;
    };
    NS.dateToClient = function(unix){
        unix = unix * 1;
        if (unix == 0){
            return null;
        }
        var tz = NS.TZ_OFFSET * 60;
        return new Date((tz + unix) * 1000);
    };

    NS.dateToTime = function(date){
        return lz(date.getHours()) + ':' + lz(date.getMinutes());
    };

    var DPOINT = '.';
    NS.dateToString = function(date){
        if (!date){
            return '';
        }
        var day = date.getDate(),
            month = date.getMonth() + 1,
            year = date.getFullYear();
        return lz(day) + DPOINT + lz(month) + DPOINT + year;
    };

    NS.stringToDate = function(str){
        str = str.replace(/,/g, '.').replace(/\//g, '.');
        var aD = str.split(DPOINT);
        if (aD.length != 3){
            return null;
        }
        var day = aD[0] * 1, month = aD[1] * 1 - 1, year = aD[2] * 1;
        if (day > 31 || day < 0){
            return null;
        }
        if (month > 11 || month < 0){
            return null;
        }
        return new Date(year, month, day);
    };

    NS.timeToString = function(date, showSeconds){
        if (L.isNull(date)){
            return '';
        }
        var ret = lz(date.getHours()) + ':' + lz(date.getMinutes());
        if (showSeconds){
            ret += ':' + lz(date.getSeconds());
        }

        return ret;
    };

    NS.parseTime = function(str){
        var a = str.split(':');
        if (a.length < 2 || a.length > 3){
            return null;
        }
        var h = a[0] * 1, m = a[1] * 1, s = a.length == 2 ? 0 : a[2] * 1;
        if (!(h >= 0 && h <= 23 && m >= 0 && m <= 59 && s >= 0 && s <= 59)){
            return null;
        }

        return [h, m, s];
    };

    NS.timeDifference = function(d1, d2){
        var ret = {
            'error': false,
            'sign': '+', // + первый меньше/равен второго, - первый больше второго
            'days': 0,
            'hours': 0,
            'minutes': 0,
            'seconds': 0,
            'fullsec': 0
        };

        if (!(d1 && L.isFunction(d1.getTime)) && !(d2 && L.isFunction(d2.getTime))){
            ret['error'] = true;
            return ret;
        }

        var sd1 = d1.getTime() / 1000, sd2 = d2.getTime() / 1000,
            hr = Math.abs(sd1 - sd2);

        ret['sign'] = sd1 > sd2 ? '-' : '+';
        ret['fullsec'] = hr;

        var d = ret['days'] = Math.floor(hr / (60 * 60 * 24));
        if (d > 0){
            hr = hr - d * 60 * 60 * 24;
        }
        var h = ret['hours'] = Math.floor(hr / (60 * 60));
        if (h > 0){
            hr = hr - h * 60 * 60;
        }
        var m = ret['minutes'] = Math.floor(hr / 60);
        if (m > 0){
            hr = hr - m * 60;
        }
        ret['seconds'] = hr;

        return ret;
    };

    // кол-во дней, часов, минут (параметр в секундах)
    NS.timeToSSumma = function(hr){
        var ahr = [];
        var d = Math.floor(hr / (60 * 60 * 24));
        if (d > 0){
            hr = hr - d * 60 * 60 * 24;
            ahr[ahr.length] = d + 'д';
        }
        var h = Math.floor(hr / (60 * 60));
        if (h > 0){
            hr = hr - h * 60 * 60;
            ahr[ahr.length] = h + 'ч';
        }
        var m = Math.floor(hr / 60);
        if (m > 0){
            hr = hr - m * 60;
            ahr[ahr.length] = m + 'м';
        }
        return ahr.join(' ');
    };
};