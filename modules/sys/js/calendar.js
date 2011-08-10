/*
@version $Id: calendar.js 954 2011-03-30 11:07:47Z roosit $
@package Abricos
@copyright Copyright (C) 2011 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	yahoo:['calendar']
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace, 
		TMG = this.template,
		API = NS.API;
	
	var initCSS = false,
		buildTemplate = function(w, ts){
		if (!initCSS){
			Brick.util.CSS.update(Brick.util.CSS['sys']['calendar']);
			delete Brick.util.CSS['sys']['calendar'];
			initCSS = true;
		}
		w._TM = TMG.build(ts); w._T = w._TM.data; w._TId = w._TM.idManager;
	};
	
	var YDate = YAHOO.widget.DateMath;

	NS.isCurrentDay = function(date){
		return YDate.clearTime(date).getTime() == YDate.clearTime(NS.getDate()).getTime(); 
	};
	
	NS.dateToKey = function(date){
		date = new Date(date.getTime());
		var d = new Date(date.setHours(0,0,0,0));
		var tz = TZ_OFFSET*60*1000;
		var key = (d.getTime()-tz)/YDate.ONE_DAY_MS ; 
		return key;
	};
	
	NS.calendarLocalize = function(cal){
		var cfg = cal.cfg;
		
		var lng = Brick.util.Language.getc('mod.sys.calendar');
		
		var dict = [];
		for (var i=1; i<=12; i++){
			dict[dict.length] = lng['month'][i]; 
		}
		cfg.setProperty("MONTHS_LONG", dict);

		dict = [];
		for (var i=0; i<7; i++){
			dict[dict.length] = lng['week']['short'][i]; 
		}
		cfg.setProperty("WEEKDAYS_SHORT", dict);
	};
	
	
	var dialog = null,
		elementParent = null;

	var dialogHide = function(){
		dialog.hide();
		dialog.destroy();
		dialog = null;
		elementParent = null;
	};
	
	E.on(document, "click", function(e) {
		var el = E.getTarget(e);
		if (el == elementParent || L.isNull(dialog)){ return; }
		
		var dialogEl = dialog.element;
		
		if (Dom.isAncestor(dialogEl, el)){ return; }
		dialogHide();
	});

	NS.showCalendar = function(elInput, callback){
		if (!L.isNull(dialog)){ return; }
		
		elementParent = elInput;
		
		dialog = new YAHOO.widget.Overlay(Dom.generateId(), {
			context: [elInput.id, "tl", "bl"], 
			visible: true,
			zindex: 100000
		});
		dialog.setBody("&#32;");
		dialog.body.id = Dom.generateId();
		dialog.render(document.body);

		var oCalendar = new YAHOO.widget.Calendar(Dom.generateId(), dialog.body.id);
		NS.calendarLocalize(oCalendar);
		
		var date = NS.stringToDate(elInput.value);
		if (!L.isNull(date)){
			oCalendar.select(date);
			oCalendar.cfg.setProperty("pagedate", (date.getMonth()+1) + "/" + date.getFullYear());
		}

		oCalendar.render();
		
		oCalendar.selectEvent.subscribe(function() {
			if (oCalendar.getSelectedDates().length > 0) {
				var selDate = oCalendar.getSelectedDates()[0];
				if (L.isFunction(callback)){
					callback(selDate);
				}
				dialogHide();
			}
		});
	};
	
	var DateInputWidget = function(container, config){
		this.init(container, config);
	};
	DateInputWidget.prototype = {
		init: function(container, cfg){
			
			cfg = L.merge({
				'date': null,
				'showTime': false
			}, cfg || {});
			this.cfg = cfg;
		
			buildTemplate(this, 'input');
			container.innerHTML = this._TM.replace('input');
			var __self = this;
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
	        });
			
			if (!L.isNull(cfg.date)){
				this.setDate(cfg.date);
			}
		},
		getValue: function(){
			var ret = {'date': null, 'showTime': false };
			var date = NS.stringToDate(this._TM.getEl('input.date').value),
				st = this.cfg.showTime,
				time = NS.parseTime(this._TM.getEl('input.time').value);

			if (st && L.isNull(time)){ st = false; }
			if (L.isNull(date)){ return ret; }
			
			if (st){
				date.setHours(time[0]);
				date.setMinutes(time[1]);
			}
			return { 'date': date, 'showTime': st};
		},
		setValue: function(date){
			this.setDate(date);
		},
		setDate: function(date){
			if (L.isNull(date)){
				this.clear();
				return;
			}
			
			var TM = this._TM,
				elTime = TM.getEl('input.time');
			
			TM.getEl('input.date').value = NS.dateToString(date);
			if (this.cfg.showTime){
				this.showTime();
				elTime.value = NS.timeToString(date);
			}else{
				elTime.value = "";
				this.hideTime();
			}
		},
		onClick: function(el){
			var tp = this._TId['input'];
			switch(el.id){
			case tp['date']: this.showCalendar(); return true;
			case tp['clear']: this.clear(); return true;
			case tp['timeshow']: this.showTime(); return true;
			case tp['timehide']: this.hideTime(); return true;
			}
			return false;
		},
		showCalendar: function(){
			var __self = this;
			NS.showCalendar(this._TM.getEl('input.date'), function(dt){
				__self.setDate(dt);
			});
		},
		showTime: function(){ this._shTime(false); },
		hideTime: function(){ this._shTime(true); },
		_shTime: function(hide){
			var TM = this._TM, hide = hide || false;
			this.cfg.showTime = !hide;
			var txtTime = TM.getEl('input.time');
			if (!hide && txtTime.value.length == 0){
				txtTime.value = "12:00";
			}
			Dom.setStyle(txtTime, 'display', !hide ? '' : 'none');
			Dom.setStyle(TM.getEl('input.timeshow'), 'display', hide ? '' : 'none');
			Dom.setStyle(TM.getEl('input.timehide'), 'display', !hide ? '' : 'none');
		},
		clear: function(){
			var TM = this._TM;
			TM.getEl('input.date').value = "";
			TM.getEl('input.time').value = "";
		}
	};
	
	NS.DateInputWidget = DateInputWidget;
	
	
	NS.getDate = function(){ return new Date(); };
	
	var lz = function(num){
		var snum = num+'';
		return snum.length == 1 ? '0'+snum : snum; 
	};
	
	var TZ_OFFSET = NS.getDate().getTimezoneOffset();
	TZ_OFFSET = 0;
	
	NS.dateToServer = function(date){
		if (L.isNull(date)){ return 0; }
		var tz = TZ_OFFSET*60*1000;
		return (date.getTime()-tz)/1000; 
	};
	NS.dateToClient = function(unix){
		unix = unix * 1;
		if (unix == 0){ return null; }
		var tz = TZ_OFFSET*60;
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