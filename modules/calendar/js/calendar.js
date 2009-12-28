/*
@version $Id: calendar.js 55 2009-09-20 11:57:32Z roosit $
@copyright Copyright (C) 2008 Abricos. All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	yahoo:['calendar'],
	mod:[
		{name: 'sys', files: ['data.js', 'form.js', 'container.js']},
		{name: 'calendar', files: ['api.js']}
	]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace,
		TMG = this.template;
	
	var API = NS.API;

	if (!Brick.objectExists('Brick.mod.calendar.data')){
		Brick.mod.calendar.data = new Brick.util.data.byid.DataSet('calendar');
	}
	var DATA = null;
	
	var YDate = YAHOO.widget.DateMath;
	
(function(){
	Brick.util.CSS.update(Brick.util.CSS['calendar']['calendar']);
	delete Brick.util.CSS['calendar']['calendar'];
})();

	var DayBoardWidget, MonthBoardWidget, WeekBoardWidget, NavigateBoardWidget;
	
	NS.getDate = function(){
		return new Date();
	};
	
	var isCurrentDay = function(date){
		return YDate.clearTime(date).getTime() == YDate.clearTime(NS.getDate()).getTime(); 
	};
	
	var dateToTime = function(date){
		return lz(date.getHours())+':'+lz(date.getMinutes());
	};
	
	var lz = function(num){
		var snum = num+'';
		return snum.length == 1 ? '0'+snum : snum; 
	};
	
	var TZ_OFFSET = (NS.getDate()).getTimezoneOffset(); 
	
	var dateClientToServer = function(date){
		var tz = TZ_OFFSET*60*1000;
		return (date.getTime()-tz)/1000; 
	};
	
	NS.dateClientToServer = dateClientToServer;
	
	var dateServerToClient = function(unix){
		unix = unix * 1;
		var tz = TZ_OFFSET*60;
		return new Date((tz+unix)*1000);
	};
	
	NS.dateServerToClient = dateServerToClient;
	
	var dateToKey = function(date){
		date = new Date(date.getTime());
		var d = new Date(date.setHours(0,0,0,0));
		var tz = TZ_OFFSET*60*1000;
		var key = (d.getTime()-tz)/YDate.ONE_DAY_MS ; 
		return key;
	};
	
	var BOARD_HEIGHT = 1008;
	var MINUTE_ROUND = 30;
	
(function(){
	
	var Plugin = function(module, calWidget){
		this.module = module;
		this.calWidget = calWidget;
	};
	Plugin.prototype = {
		onLoadCalendar: function(){},
		destroy: function(){}
	};
	NS.Plugin = Plugin;
	
	NS.PluginManager = new (function(){
		var plugins = [];
		// зарегистрировать плагин
		this.register = function(plugin){
			plugins[plugins.length] = plugin;
		};
		this.foreach = function(func){
			for (var i=0;i<plugins.length;i++){
				func(plugins[i]);
			}
		};
	});
	
})();
	
(function(){
	
	var loadPlugins = function(callback){
		var list = [];

		// сформировать список модулей имеющих компонент 'app' в наличие
		for (var m in Brick.Modules){
			if (Brick.componentExists(m, 'calendar_plugin') && !Brick.componentLoaded(m, 'calendar_plugin')){
				list[list.length] = {name: m, files:['calendar_plugin.js']};
			}
		}
		if (list.length == 0){
			callback();
			return; 
		}
		var __self = this;
		Brick.Loader.add({mod: list, onSuccess: function() {
			callback();
		}});
	};
	
	var CalendarWidget = function(container){
		var __self = this;
		loadPlugins(function(){
			__self.init(container);
		});
	};
	CalendarWidget.prototype = {
		_isInitializeWidget: false,
		init: function(container){
			this.container = container;
			var TM = TMG.build('widget'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T['widget'];
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e), e)){ E.stopEvent(e); }
			});
			
			this.elPlugins = TM.getEl('widget.plugins');

			// инициализация плагинов
			var plugins = [];
			NS.PluginManager.foreach(function(plugin){
				plugins[plugins.length] = new plugin(__self);
			});
			this.plugins = plugins;
			
			DATA = CalendarWidget.DATA || API.getDataManager();
			
			// инициализация календаря
			this._initComponent();
			
			// вызов уведомления плагина об инициализации календаря
			for (var i=0;i<plugins.length;i++){
				plugins[i].onLoadCalendar();
			}
			this._isInitializeWidget = true;
			this._dsRequest();
			this.updateSize();
		},
		_initComponent: function(){
			var TM = this._TM;
			
			var cal = new YAHOO.widget.Calendar("calendar",TM.getElId('widget.calendar'), {
				'START_WEEKDAY': 1,
				'pagedate': NS.getDate(),
				today: NS.getDate()
			}); 
			this.calendar = cal;
			NS.calendarLocalize(cal);
			cal.render();
			cal.select(NS.getDate());
			
			var __self = this;
			cal.selectEvent.subscribe(function(){
				__self.refresh();
			}, this, true);
			
			this.taskManager = new NS.TaskListManager(function(){
				__self.navBoard.selectedBoard.renderTaskList();
			});
			
			this.dayBoard = new DayBoardWidget(TM.getEl('widget.dayboard'), this);
			this.weekBoard = new WeekBoardWidget(TM.getEl('widget.weekboard'), this);
			this.monthBoard = new MonthBoardWidget(TM.getEl('widget.monthboard'), this);
			
			this.navBoard = new NavigateBoardWidget(TM.getEl('widget.navboard'), this);
			
			this.navBoard.showDayBoard();
			this.refresh();
			this._startThread();

			var dayBoard = this.dayBoard;
            setTimeout(function () {
            	dayBoard.scrollByTime();
            }, 100);
		},
		destroy: function(){
			this._stopThread();
			for (var i=0;i<this.plugins.length;i++){
				this.plugins[i].destroy();
				this.plugins[i] = null;
			}
			this.taskManager.destroy();
		},
		
		updateSize: function(){
			var rg = Dom.getRegion(this.container);
			var height = rg.height - 40;
			var board = this._TM.getEl('widget.board');
			Dom.setStyle(board, 'height', height+'px');
			this.dayBoard.updateSize(height);
			this.weekBoard.updateSize(height);
			this.monthBoard.updateSize(height);
		},
		
    	onClick: function(el, e){
			if (this.navBoard.onClick(el, e)){ return true; }
			if (this.dayBoard.onClick(el, e)){ return true; }
			if (this.weekBoard.onClick(el, e)){ return true; }
			if (this.monthBoard.onClick(el, e)){ return true; }
				
			return false;
    	},
    	
    	createTask: function(bdate, edate, callback){
    		var __self = this;
    		
    		callback = callback || function(){
				__self.taskManager.hash[Brick.env.user.id].removeTaskList(bdate);
				__self.refresh();
			}; 
    		
    		var taskEditor = new NS.TaskEditPanel({
    				calc: {
		    			bdt: bdate, 
		    			edt: edate
		    		}
    			}, callback
    		);
    		return taskEditor;
    	},
    	
    	showTask: function(task, callback){
    		var __self = this;
    		
    		callback = callback || function(){
				__self.taskManager.hash[Brick.env.user.id].removeTaskList(task.calc.bdt);
				__self.refresh();
			}; 

    		var taskEditor = new NS.TaskEditPanel(task, callback);
    		return taskEditor;
    	},
    	
    	_thread: null,
    	_thread5min: null,
    	
    	_startThread: function(){
    		if (L.isNull(this._thread)){
    			var __self = this;
    			this._thread = setInterval(function(){
    				__self._run();
    			}, 60*1000); 
    		}
    		if (L.isNull(this._thread5min)){
    			var __self = this;
    			this._thread5min = setInterval(function(){
    				__self._run5min();
    			}, 5*60*1000); 
    		}
    	},
    	_stopThread: function(){
            clearInterval(this._thread);
            clearInterval(this._thread5min);
    	},
    	_run: function(){
    		this.dayBoard.updateMarker();
    		this.weekBoard.updateMarker();
    	},
    	
    	_run5min: function(){
    		this.refresh(true);
    	},
    	
		getUsers: function(){
			return [Brick.env.user.id];
		},
		
		getTaskColor: function(userid){
			return {
				'title': '41, 82, 163',
				'body': '102, 140, 217'
			}; 
		},
		refresh: function(clear){
			clear = clear || false;
			if (clear){
				this.taskManager.clear();
			}
			
			var board = this.navBoard.selectedBoard; 
			board.renderDate();
			var period = board.getPeriod();
			this.taskManager.load(period, this.getUsers());
			this._dsRequest();
		},
		_dsRequest: function(){
			if (!this._isInitializeWidget){ return; }
			this.dsRequest();
		},
		dsRequest: function(){
			API.dsRequest();
		},
		showBoard: function(name){
			switch(name){
			case 'day': this.navBoard.showDayBoard(); break;
			case 'week': this.navBoard.showWeekBoard(); break;
			case 'month': this.navBoard.showMonthBoard(); break;
			}
			this.refresh();
		}

	};
	
	NS.CalendarWidget = CalendarWidget;
})();

(function(){
	
	DayBoardWidget = function(el, owner){
		this.init(el, owner);
	};
	DayBoardWidget.prototype = {
		init: function(el, owner){
			this.el = el;
			this.owner = owner;
			
			var TM = TMG.build('day,dmarker,dhour'), 
				T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			this.el.innerHTML = TM.replace('day', {
				'markers': function(){
					var s = '';
					for(var ii=0;ii<24;ii++){ s += T['dmarker']; }
					return s;
				}(),
				'hours': function(){
					var s = '';
					for(var ii=0;ii<24;ii++){ 
						s += TM.replace('dhour', {'hour': (ii < 10 ? '0'+ii : ii)}); 
					}
					return s;
				}()
			});
			
			this.renderDate();
		},
		show: function(){ 
			this.el.style.display = '';
			this.scrollByTime();
			this.updateMarker();
		},
		hide: function(){ this.el.style.display = 'none'; },
		isShow: function(){ return this.el.style.display == '';},
		scrollByTime: function(d){
			d = d || NS.getDate();
			var hour = Math.max(d.getHours() - 2, 0);
			
			var board = this._TM.getEl('day.board');
			var hourDY = BOARD_HEIGHT / 24;
			board.scrollTop = hourDY * hour;
		},
		updateSize: function(height){
			height = height - 20;
			var board = this._TM.getEl('day.board');
			Dom.setStyle(board, 'height', height+'px');
		},
		
    	onClick: function(el, e){
			if (el.id == this._TM.getElId('day.col')){
				this._createTask(e);
				return false;
			}
			
			var tlst = this._taskList;
			for (var i=0;i<tlst.length;i++){
				if (tlst[i].onClick(el)){
					this.owner.showTask(tlst[i].task);
					return true;
				}
			}
			
			return false;
    	},
    	_createTask: function(e){
    		var elCol = this._TM.getEl('day.col');
    		
			var pos = E.getXY(e);
			var reg = Dom.getRegion(elCol);
			var x = pos[0] - reg.left;
			var y = pos[1] - reg.top;
			
			var hourDY = BOARD_HEIGHT / 24;
			var minDY = hourDY / 60;
			
			var hour = Math.ceil(y / hourDY) - 1;
			
			var minute = Math.ceil((y - hour * hourDY)/minDY);
			minute = Math.round(minute*0.1)*10;
			minute = minute < 31 ? 0 : 30;
			
			this.createTask(hour, minute);
    	},
    	createTask: function(hour, minute){
    		var pd = this.getPeriod();
    		
    		var beginDate = new Date(pd.bdt.setHours(hour, minute, 0, 0));
    		var endDate = new Date(pd.bdt.setHours(hour+1, minute, 0, 0));
    		
    		this.owner.createTask(beginDate, endDate);
    	},
		
		getPeriod: function(){
			var date = this.owner.calendar.getSelectedDates()[0];
			date = new Date(date.setHours(0, 0, 0, 0));
			return {'bdt': date, 'edt': YDate.add(date, YDate.DAY, 1)};
		},
		
		_lastBTime: 0,
		
		// если дата изменилась, перерисовать ее 
		renderDate: function(){
			var TM = this._TM;
			
			var pd = this.getPeriod();
			
			var date = pd.bdt;
			if (this._lastBTime == date.getTime()){ return; }
			this._lastBTime = date.getTime();
			
			var lng = Brick.util.Language.getc('mod.calendar.dict');
			TM.getEl('day.title').innerHTML = lng['week'][date.getDay()] +
				', '+date.getDate()+'/'+ (date.getMonth()+1);
			
			var elTitleCont = TM.getEl('day.titlecont');
			var elBoardSt = TM.getEl('day.boardstat');
			var elMarker = TM.getEl('day.marker');
			var elMarkerPoint = TM.getEl('day.markerpoint');
			
			if (isCurrentDay(date)){
				Dom.addClass(elTitleCont, 'wk-today');
				Dom.addClass(elBoardSt, 'tg-today');
				elMarker.style.display = '';
				elMarkerPoint.style.display = '';
			}else{
				Dom.removeClass(elTitleCont, 'wk-today');
				Dom.removeClass(elBoardSt, 'tg-today');
				elMarker.style.display = 'none';
				elMarkerPoint.style.display = 'none';
			}
		},
		
    	_taskList: [],
		
    	clearTaskList: function(){
    		var lst = this._taskList;
    		for (var i=0;i<lst.length;i++){
    			lst[i].destroy(); 
    		}
    		this._taskList = [];
    	},
    	
    	renderTaskList: function(){
    		
    		this.clearTaskList();

    		var users = this.owner.getUsers();
    		
    		var pd = this.getPeriod();
    		var tlm = this.owner.taskManager;
    		var key = dateToKey(pd.bdt);
    		
    		tlm.calcData(key, users);
    		
    		for (var i=0;i<users.length;i++){
    			
        		var userid = users[i];

        		var tasks = tlm.hash[userid]['map'][key];
        		
        		var elTaskList = this._TM.getEl('day.tasklist');
        		
        		for (var n in tasks){
        			var task = tasks[n];
    				this.renderTask(elTaskList, task, userid);
        		}
    		}
    	},

    	renderTask: function(container, task, userid){
    		var widget = new NS.TaskBoardWidget(container, task, this.owner.getTaskColor(userid));
    		this._taskList[this._taskList.length] = widget;
    		widget.show();
    	},
    	
    	updateMarker: function(){
    		if (!this.isShow()){ return; }
    		
    		var d = NS.getDate();
    		
			var hourDY = BOARD_HEIGHT / 24;
			var minDY = hourDY / 60;
			
			var elBoard = this._TM.getEl('day.board');
			var elMarkerPoint = this._TM.getEl('day.markerpoint');
			var elMarker = this._TM.getEl('day.markerline');
			
			var offset = Dom.getY(elBoard);

			var y = d.getHours() * hourDY + d.getMinutes() * minDY - elBoard.scrollTop+offset;
			
			Dom.setY(elMarker, y);
			Dom.setY(elMarkerPoint, y);
			
			var tlst = this._taskList;
			for (var i=0;i<tlst.length;i++){
				tlst[i].updateActualy();
			}

    	}
	};
})();

(function(){
	
	WeekBoardWidget = function(el, owner){
		this.init(el, owner);
	};
	WeekBoardWidget.prototype = {
		init: function(el, owner){
			this.owner = owner;
			this.el = el;
			
			var TM = TMG.build('week,wdtlrow,wmarker,whour,wcol'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			this.el.innerHTML = TM.replace('week', {
				'tlrows': function(){
					var s = '';
					for(var ii=0;ii<7;ii++){ 
						s += TM.replace('wdtlrow',{'id': ii}); 
					}
					return s;
				}(),
				'markers': function(){
					var s = '';
					for(var ii=0;ii<24;ii++){ s += T['wmarker']; }
					return s;
				}(),
				'hours': function(){
					var s = '';
					for(var ii=0;ii<24;ii++){ 
						s += TM.replace('whour', {
							'hour': (ii < 10 ? '0'+ii : ii)
						}); 
					}
					return s;
				}(),
				'cols': function(){
					var s = '';
					for(var ii=0;ii<7;ii++){ 
						s += TM.replace('wcol',{'id': ii}); 
					}
					return s;
				}()
			});
			
			this.renderDate();
		},
		show: function(){ 
			this.el.style.display = '';
			this.scrollByTime();
			this.updateMarker();
		},
		hide: function(){ this.el.style.display = 'none'; },
		isShow: function(){ return this.el.style.display == ''; },
		scrollByTime: function(d){
			d = d || NS.getDate();
			var hour = Math.max(d.getHours() - 2, 0);
			
			var board = this._TM.getEl('week.board');
			var hourDY = BOARD_HEIGHT / 24;
			board.scrollTop = hourDY * hour;
		},
		updateSize: function(height){
			height = height - 25;
			var board = this._TM.getEl('week.board');
			Dom.setStyle(board, 'height', height+'px');
		},
		getPeriod: function(){
			var date = this.owner.calendar.getSelectedDates()[0];

			var bdt = YDate.getFirstDayOfWeek(date, 1);
			var edt = YDate.add(bdt, YDate.DAY, 7);
			
			return {
				'bdt': bdt,
				'edt': new Date(edt.setHours(23, 59, 59, 0)) 
			};
		},
		
		_lastBTime: 0,
		
		renderDate: function(){
			var pd = this.getPeriod();
			if (this._lastBTime == pd.bdt.getTime()){ return; }
			this._lastBTime = pd.bdt.getTime();

			var TM = this._TM, TId = this._TId;
			var lng = Brick.util.Language.getc('mod.calendar.dict');

			var i, dt, wnum, day, month;
			for (var i=0;i<7;i++){
				dt = YDate.add(pd.bdt, YDate.DAY, i);
				var elCol = Dom.get(TId['wdtlrow']['tl']+'-'+i);
				elCol.innerHTML = lng['week']['short'][dt.getDay()]+', '+dt.getDate()+'/'+(dt.getMonth()+1);
				
				var elColToday = Dom.get(TId['wcol']['today']+'-'+i);
				var elColMarker = Dom.get(TId['wcol']['markercol']+'-'+i);
				
				if (isCurrentDay(dt)){
					elColToday.style.display = '';
					// elColMarker.style.display = ''; 
				}else{
					elColToday.style.display = 'none';
					elColMarker.style.display = 'none'; 
				}
			}
		},
    	
    	_taskList: [],
    	
    	clearTaskList: function(){
    		var lst = this._taskList;
    		for (var i=0;i<lst.length;i++){
    			lst[i].destroy();
    		}
    		this._taskList = [];
    	},
    	
    	renderTaskList: function(){
    		this.clearTaskList();
    		
    		var users = this.owner.getUsers();
    		var pd = this.getPeriod();
    		var tlm = this.owner.taskManager;
    		
    		var TId = this._TId;
    		for (var ui=0;ui<users.length;ui++){
    			
        		var userid = users[ui], dt;
        		for (var i=0;i<7;i++){
    				dt = YDate.add(pd.bdt, YDate.DAY, i);
    				var wd = dt.getDay();
    	    		var key = dateToKey(dt);
    	    		tlm.calcData(key, users);
    	    		var tasks = tlm.hash[userid]['map'][key];
    	    		
    	    		var elTaskList = Dom.get(TId['wcol']['tasklist']+'-'+i);

    	    		for (var n in tasks){
    	    			var task = tasks[n];
    					this.renderTask(elTaskList, task, userid);
    	    		}
        		}    			
    		}
    	},

    	renderTask: function(container, task, userid){
    		var widget = new NS.TaskBoardWidget(container, task, this.owner.getTaskColor(userid));
    		this._taskList[this._taskList.length] = widget;
    		widget.show();
    	},
    	
    	onClick: function(el, e){
    		var TId = this._TId;
    		
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['wcol']['id']+'-'):
				this._createTask(numid, e);
				return true;
			}
			
			var tlst = this._taskList;
			for (var i=0;i<tlst.length;i++){
				if (tlst[i].onClick(el)){
					this.owner.showTask(tlst[i].task);
					return true;
				}
			}
			return false;
    	},
    	_createTask: function(numCol, e){
    		var TId = this._TId;
    		var elCol = Dom.get(TId['wcol']['id']+'-'+numCol); 
    		
			var pos = E.getXY(e);
			var reg = Dom.getRegion(elCol);
			var x = pos[0] - reg.left;
			var y = pos[1] - reg.top;
			
			var hourDY = BOARD_HEIGHT / 24;
			var minDY = hourDY / 60;
			
			var hour = Math.ceil(y / hourDY) - 1;
			
			var minute = Math.ceil((y - hour * hourDY)/minDY);
			minute = Math.round(minute*0.1)*10;
			minute = minute < 31 ? 0 : 30;
			
			this.createTask(numCol, hour, minute);
    	},
    	createTask: function(numCol, hour, minute){
    		var pd = this.getPeriod();
    		var dt = YDate.add(pd.bdt, YDate.DAY, numCol*1);
    		
    		var bdt = new Date(dt.setHours(hour, minute, 0, 0));
    		var edt = new Date(dt.setHours(hour+1, minute, 0, 0));
    		
    		this.owner.createTask(bdt, edt);
    	},
    	updateMarker: function(){
			var tlst = this._taskList;
			for (var i=0;i<tlst.length;i++){
				tlst[i].updateActualy();
			}

    		return; 
    		/*
    		if (!this.isShow()){ return; }
    		
    		var d = NS.getDate();
    		
			var hourDY = BOARD_HEIGHT / 24;
			var minDY = hourDY / 60;
			
			var elBoard = this._TM.getEl('day.board');
			var elMarkerPoint = this._TM.getEl('day.markerpoint');
			var elMarker = this._TM.getEl('day.markerline');
			
			var offset = Dom.getY(elBoard);

			var y = d.getHours() * hourDY + d.getMinutes() * minDY - elBoard.scrollTop+offset;
			
			Dom.setY(elMarker, y);
			Dom.setY(elMarkerPoint, y);
			*/
    	}
    };
})();


(function(){
	
	MonthBoardWidget = function(el, owner){
		this.init(el, owner);
	};
	MonthBoardWidget.prototype = {
		init: function(container, owner){
			
			var TM = TMG.build('month,mcols,mrow,mdt,mdtdaynum,mdtday,mtasks'),
				T = TM.data, TId = TM.idManager;

			this._TM = TM; this._T = T; this._TId = TId;
			
			this.el = container;
			this.owner = owner;
			
			var lst = "", top = 0;
			for (var i=0;i<5;i++){
				var dt = TM.replace('mdt', {
					'dayn': function(){
						var s = '';
						for(var ii=0;ii<7;ii++){
							s += TM.replace('mdtdaynum', {'id': i+'_'+ii});
						}
						return s;
					}(),
					'day': function(){
						var s = '';
						for(var ii=0;ii<7;ii++){
							s += TM.replace('mdtday', {'id': i+'_'+ii});
						}
						return s;
					}()
				});
				lst += TM.replace('mrow', { 
					'top': top,
					'cols': TM.replace('mcols', {'id': i}),
					'dt': dt
				});
				top += 20;
			}
			
			this.el.innerHTML = TM.replace('month', { 'rows': lst });
		},
		show: function(){ this.el.style.display = ''; },
		hide: function(){ this.el.style.display = 'none'; },
		updateSize: function(height){ },
		getPeriod: function(){
			var cal = this.owner.calendar;
			var dates = cal.cellDates;
			var bdd = dates[0];
			var edd = dates[dates.length-1];
			
			return {
				'bdt': new Date(bdd[0], bdd[1]-1, bdd[2], 0, 0, 0),
				'edt': new Date(edd[0], edd[1]-1, edd[2], 23, 59, 59) 
			};
		},
		
		_cache: {},
		
		_lastBTime: 0,
		
		renderDate: function(){
			var pd = this.getPeriod();
			if (this._lastBTime == pd.bdt.getTime()){ return; }
			this._lastBTime = pd.bdt.getTime();

			var cal = this.owner.calendar;
			var dates = cal.cellDates;
			var date = cal.getSelectedDates()[0];
			var numMonth = date.getMonth()+1;

			var TM = this._TM, T = this._T, TId = this._TId;
			
			var lng = Brick.util.Language.getc('mod.calendar.dict');
			var cd, day, mnt, index = 0, el, cellDate;
			var currentDate = (NS.getDate()).setHours(0, 0, 0, 0);
			var cache = this._cache;

			for (var i=0;i<5;i++){
				for(var ii=0;ii<7;ii++){
					cd = dates[index];
					day = cd[2]; mnt = cd[1];
					cellDate = (new Date(cd[0], cd[1]-1, cd[2], 0, 0, 0)).getTime();
					
					if (!cache[index]){
						cache[index] = Dom.get(TId['mdtdaynum']['id']+'-'+i+'_'+ii);
					}
					el = cache[index];
					el.innerHTML = day + (day == 1 ? ' '+lng['month']['short'][mnt] : '');
					
					if (numMonth != mnt){
						Dom.addClass(el.parentNode, 'st-dtitle-nonmonth');
					}else{
						Dom.removeClass(el.parentNode, 'st-dtitle-nonmonth');
					}
					if (cellDate == currentDate){
						Dom.addClass(el.parentNode, 'st-dtitle-today');
					}else{
						Dom.removeClass(el.parentNode, 'st-dtitle-today');
					}
						
					index++;
				}
			}
		},
		_cacheDay: {},
		
    	clearTaskList: function(){
			var index = 0;
			var cache = this._cacheDay;
			for (var i=0;i<5;i++){
				for(var ii=0;ii<7;ii++){
					if (cache[index]){
						var el = cache[index];
						el.innerHTML = "";
					}
					index++;
				}
			}
    	},
		
    	renderTaskList: function(){
    		this.clearTaskList();
    		
    		var tlm = this.owner.taskManager;
    		var pd = this.getPeriod();
			var cal = this.owner.calendar;
			var dates = cal.cellDates;
			var TM = this._TM, T = this._T, TId = this._TId;
			
			var day, mnt, index = 0, el;
			var cache = this._cacheDay;
			
    		var users = this.owner.getUsers();

			for (var i=0;i<5;i++){
				for(var ii=0;ii<7;ii++){
					
					var cd = dates[index];
					var cellDate = new Date(cd[0], cd[1]-1, cd[2], 0, 0, 0);
					var key = dateToKey(cellDate);
		    		tlm.calcData(key, users);
					
					if (!cache[index]){
						cache[index] = Dom.get(TId['mdtday']['id']+'-'+i+'_'+ii);
					}
					el = cache[index];
					var count = 0;
					
		    		for (var ui=0;ui<users.length;ui++){
		        		var userid = users[ui];
						
			    		var tasks = tlm.hash[userid]['map'][key];
						
						for (var n in tasks){
							count++;
			    		}
					}
					if (count > 0){
						el.innerHTML = TM.replace('mtasks', {
							'id': index,
							'count':count
						});
					}
		    		
					index++;
				}
    		}
		},
    	onClick: function(el){
    		var TId = this._TId;
    		
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['mtasks']['id']+'-'):
				this.showDayBoard(numid);
				return true;
			}

			return false;
    	},
    	showDayBoard: function(index){
			var dates = this.owner.calendar.cellDates;
			cd = dates[index];
			this.owner.navBoard.showDayBoard();
			this.owner.calendar.select(new Date(cd[0], cd[1]-1, cd[2], 0, 0, 0));
    	}
	};
})();

(function(){
	var MonthBoardWidget = function(container, tasks){
		this.init(container, tasks);
	};
	MonthBoardWidget.prototype = {
		init: function(container, tasks){
			this.container = container;
			this.tasks = tasks;
			
			var TM = TMG.build('mtasks'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T['mtasks'];
		},
		destroy: function(){
			this.container.innerHTML = "";
		}
	};
	NS.MonthBoardWidget = MonthBoardWidget;
})();

(function(){
	
	var TaskBoardWidget = function(container, task, style){
		this.init(container, task, style);
	};
	TaskBoardWidget.prototype = {
		init: function(container, task, style){
			this.task = task;
			
			var TM = TMG.build('taskwidget'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			var div = document.createElement('div');
			div.innerHTML = TM.replace('taskwidget', {
				'clrtitle': style['title'],
				'clrbody': style['body']
			});
			var el = div.childNodes[0];
			div.removeChild(el);
			
			container.appendChild(el);
			this.el = el;
			this.hide();
			this.render();
		},
		onClick: function(el){
			var TId = this._TId;
			
			for (var i=0;i<4;i++){
				if (el.id == TId['taskwidget']['id']){
					return true;
				}
				el = el.parentNode;
			}
			
			return false;
		},
		destroy: function(){
			this.el.parentNode.removeChild(this.el);
		},
		isShow: function(){
			return this.el.style.display == '';
		},
		show: function(){
			this.el.style.display = '';
		},
		hide: function(){
			this.el.style.display = 'none';
		},
		render: function(){
    		var hourDY = BOARD_HEIGHT / 24;
			var minDY = hourDY / 60;
			
			var calc = this.task.calc;
			
			var bdt = calc['bdt'];
			var edt = calc['edt'];
			
			var y = bdt.getHours() * hourDY + bdt.getMinutes() * minDY;
			var y1 = edt.getHours() * hourDY + edt.getMinutes() * minDY ;
			var h = Math.max(y1 - y -3, 25);
			
			var el = this.el;
			
			Dom.setStyle(el, 'top', y+'px');
			Dom.setStyle(el.childNodes[0], 'height', h+'px');
			Dom.setStyle(el, 'left', calc['x']+'%');
			Dom.setStyle(el, 'width', calc['w']+'%');

			this._TM.getEl('taskwidget.tl').innerHTML = this.task.tl;
			this._TM.getEl('taskwidget.tm').innerHTML = dateToTime(bdt)+' - '+dateToTime(edt);
			this.updateActualy();
		},
		updateActualy: function(){
			if (this.task.calc.edt.getTime() < (NS.getDate()).getTime()){
				Dom.setStyle(this.el, 'opacity', 0.5);
			}
		}
	};
	NS.TaskBoardWidget = TaskBoardWidget;
})();

(function(){
	
	NavigateBoardWidget = function(el, owner){
		this.init(el, owner);
	};
	NavigateBoardWidget.prototype = {
		selectedBoard: null,
		init: function(el, owner){
			this.el = el; 
			this.owner = owner;
			
			var TM = TMG.build('navboard,navboardcol'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			el.innerHTML = TM.replace('navboard', {
				'col': T['navboardcol']
			});
		},
		_navButSetStatus: function(name, status){
			var el = this._TM.getEl('navboard.'+name).parentNode;
			if (status){
				Dom.replaceClass(el, 'modelinkOff', 'modelinkOn');
			}else{
				Dom.replaceClass(el, 'modelinkOn', 'modelinkOff');
			}
		},
		_hideAllBoard: function(){
			this.owner.dayBoard.hide();
			this.owner.monthBoard.hide();
			this.owner.weekBoard.hide();
			this._navButSetStatus('bselday', false);
			this._navButSetStatus('bselweek', false);
			this._navButSetStatus('bselmonth', false);
		},
		showDayBoard: function(){
			this._hideAllBoard();
			this.owner.dayBoard.show();
			this._navButSetStatus('bselday', true);
			this.selectedBoard = this.owner.dayBoard;
		},
		showWeekBoard: function(){
			this._hideAllBoard();
			this.owner.weekBoard.show();
			this._navButSetStatus('bselweek', true);
			this.selectedBoard = this.owner.weekBoard;
		},
		showMonthBoard: function(){
			this._hideAllBoard();
			this.owner.monthBoard.show();
			this._navButSetStatus('bselmonth', true);
			this.selectedBoard = this.owner.monthBoard;
		},
    	onClick: function(el){
			var tp = this._TId['navboard'];
			switch(el.id){
			case tp['bselday']:
				this.owner.showBoard('day');
				return true;
			case tp['bselweek']:
				this.owner.showBoard('week');
				return true;
			case tp['bselmonth']: 
				this.owner.showBoard('month');
				return true;
			case tp['brefresh']: 
				this.owner.refresh(true);
				return true;
			}
			return false;
    	}
	};
})();

(function(){
	
	var CalendarPanel = function(){
		this._TM = TMG.build('panel');
		this._T = this._TM.data;
		this._TId = this._TM.idManager;
		
		CalendarPanel.superclass.constructor.call(this, {
			width: "800px", height: "650px",
			fixedcenter: true,
			controlbox: 1,
			state: Brick.widget.Panel.STATE_MAXIMIZED,
			overflow: false,
			minwidth: 600,
			minheight: 500
		});
	};
	
	YAHOO.extend(CalendarPanel, Brick.widget.Panel, {
		initTemplate: function(){
			return this._T['panel'];
		},
		onLoad: function(){
			this.calendarWidget = new NS.CalendarWidget(this._TM.getEl('panel.container'));
		},
		destroy: function(){
			CalendarPanel.superclass.destroy.call(this);
			this.calendarWidget.destroy();
		},
		onResize: function(){
			this.calendarWidget.updateSize();
		}
		
	});

	NS.CalendarPanel = CalendarPanel; 	
})();

(function(){
	
	var TN = {
		'widget': 'datetimewidget',
		'date': 'datetimewidget.date',
		'time': 'datetimewidget.time',
		'datecont': 'datetimewidget.datecont'
	}; 
	
	var DateTimeWidget = function(container, date){
		date = date || NS.getDate();
		this.init(container, date);
	};
	
	DateTimeWidget.prototype = {
		el: function(name){ return Dom.get(this._TId[TN['widget']][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		init: function(container, date){
			this.date = date;

			var TM = TMG.build(TN['widget']), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			container.innerHTML = T[TN['widget']];
			this.setDateTime(this.date);
		},
		setDateTime: function(date){
			this.setDay(date);
			this.setTime(date);
		},
		setDay: function(date){
			var day = date.getDate();
			var month = date.getMonth()+1;
			var year = date.getFullYear();
			this._TM.getEl(TN['date']).value = lz(day)+"/"+lz(month)+'/'+year;
		},
		setTime: function(date){
			var hour = date.getHours();
			var min = date.getMinutes();
			this._TM.getEl(TN['time']).value = lz(hour)+":"+lz(min);
		},
		
		checkDate: function(){
			var re = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
			
			var sD = this.elv('date');
			if (!sD.match(re)){
				return 1;
			}
			re = /^\d{1,2}:\d{2}([ap]m)?$/; 
			var sT = this.elv('time');
			if (!sT.match(re)){
				return 2;
			}
			return 0;
		},
		
		getDate: function(){
			
			var sD = this.elv('date');
			var aD = sD.split('/');
			
			var sT = this.elv('time');
			var aT = sT.split(':');

			return new Date(aD[2], aD[1]*1-1, aD[0], aT[0], aT[1], 0);
		}
	};
	
	NS.DateTimeWidget = DateTimeWidget;
	
	var TaskEditPanel = function(task, callback, config){
		
		this.task = task;
		this.callback = callback;
		
		config = L.merge({
			width: "550px", height: "260px",
			fixedcenter: true,
			overflow: false, resize: false, modal: true
		}, config || {});
		
		TaskEditPanel.superclass.constructor.call(this, config);
	};
	
	YAHOO.extend(TaskEditPanel, Brick.widget.Panel, {
		initTemplate: function(){
			var TM = TMG.build('taskeditpanel'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;

			return this._T['taskeditpanel'];
		},
		onLoad: function(){
			
			var TM = this._TM, TId = this._TId;
			var __self = this;
			NS.TaskEditWidget.prototype.startDataLoadEvent = function(){
				__self.actionDisable(TId['taskeditpanel']['bcancel']);
			};
			NS.TaskEditWidget.prototype.completeDataLoadEvent = function(){
				__self.actionEnable();
			};
			this.taskWidget = new NS.TaskEditWidget(this._TM.getEl('taskeditpanel.container'), this.task);
			var task = this.task = this.taskWidget.task;
			
			var elBSave = TM.getEl('taskeditpanel.bsave'),
				elBRemove = TM.getEl('taskeditpanel.bremove'),
				elBCreate = TM.getEl('taskeditpanel.bcreate'),
				elBCancel = TM.getEl('taskeditpanel.bcancel'),
				elBClose = TM.getEl('taskeditpanel.bclose');
			
			elBSave.style.display = 'none';
			elBRemove.style.display = 'none';
			elBCreate.style.display = 'none';
			elBCancel.style.display = 'none';
			elBClose.style.display = 'none';
			
			if (task.id == 0){
				elBCreate.style.display = '';
				elBCancel.style.display = '';
			}else if (task.uid == Brick.env.user.id){
				elBSave.style.display = '';
				elBRemove.style.display = '';
				elBCancel.style.display = '';
			}else{
				elBClose.style.display = '';
			}
		},
		onClose: function(){
			this.taskWidget.destroy();
		},
		onClick: function(el){
			if (this.taskWidget.onClick(el)){ return true; }
			
			var tp = this._TId['taskeditpanel'];
			switch(el.id){
			case tp['bcancel']: 
			case tp['bclose']: this.close(); return true;
			case tp['bcreate']:
			case tp['bsave']: this.save(); return true;
			case tp['bremove']: this.remove(); return true;
			}
		},
		remove: function(){
			var table = DATA.get('task');
			var rows = table.getRows({taskid: this.task.id});
			var row = rows.getByIndex(0);
			
			var __self = this;
			new NS.TaskRemovePanel(row.cell['tl'], function(){
				row.remove();
				table.applyChanges();
				__self.close();
				__self.callback();
			});
		},
		save: function(){
			if (!this.taskWidget.save()){
				return;
			}
			this.close();
			this.callback();
		}
	});
	NS.TaskEditPanel = TaskEditPanel;
	
	var TaskEditWidget = function(container, task){
		this.init(container, task);
	};
	TaskEditWidget.prototype = {
		el: function(name){ return Dom.get(this._TId['taskeditwidget'][name]); },
		elv: function(name){ return Brick.util.Form.getValue(this.el(name)); },
		setelv: function(name, value){ Brick.util.Form.setValue(this.el(name), value); },
		
		initTemlate: function(){
			var TM = TMG.build('taskeditwidget'), T = TM.data, TId = TM.idManager;
			this._TM = TM; this._T = T; this._TId = TId;
			
			return T['taskeditwidget'];
		},
		
		init: function(container, task){
			task = L.merge({
				id: 0,
				calc: {
					bdt: NS.getDate(),
					edt: NS.getDate()
				}
			}, task || {});
			this.task = task;
			
			this.initElements(container);
			
			if (task.id == 0){
				this.renderElements();
				return; 
			}
			
			this.initTables();
			DATA.onComplete.subscribe(this.onDSUpdate, this, true);
			if (DATA.isFill(this.tables)){
				this.renderElements();
			}else{
				this.renderAwaitElements();
				this.startDataLoadEvent();
				API.dsRequest();
			}
		},
		initElements: function(container){
			container.innerHTML = this.initTemlate(); 
			
			this.beginDate = new DateTimeWidget(this.el('bdate'), this.task.calc.bdt); 
			this.endDate = new DateTimeWidget(this.el('edate'), this.task.calc.edt);
		},
		startDataLoadEvent: function(){},
		completeDataLoadEvent: function(){},
		initTables: function(){
			DATA.get('task', true).getRows({taskid: this.task.id});
		},
		onDSUpdate: function(type, args){
			if (!args[0].checkWithParam('task', {taskid: this.task.id})){ return; }
			this.completeDataLoadEvent();
			this.renderElements(); 
		},
		destroy: function(){
			DATA.onComplete.unsubscribe(this.onDSUpdate, this);
		},
		renderAwaitElements: function(){ },
		renderElements: function(){
			
			if (this.task.id == 0){
				this.updateElements(null);
			}else{
				var row = DATA.get('task').getRows({taskid: this.task.id}).getByIndex(0);
				this.updateElements(row);
			}
		},
		updateElements: function(row){
			if (L.isNull(row)){ return; }
			var di = row.cell; 
			this.setelv('title', di['tl']);
			this.setelv('desc', di['dsc']);
		},
		updateRow: function(row){
			row.update({
				'tl': this.elv('title'),
				'dsc': this.elv('desc'),
				'bdt': dateClientToServer(this.beginDate.getDate()),
				'edt': dateClientToServer(this.endDate.getDate())
			});
		},
		
		checkForm: function(){
			// check form
			var err = 0;
			var lng = Brick.util.Language.getc('mod.calendar.error');
			if ((err = this.beginDate.checkDate()) > 0){
				alert(lng[err]);
				return false;
			}
			if ((err = this.endDate.checkDate()) > 0){
				alert(lng[err]);
				return false;
			}
			var bdt = this.beginDate.getDate();
			var edt = this.endDate.getDate();
			if (bdt.getTime() >= edt.getTime() || bdt.getDate() != edt.getDate()){
				alert(lng[3]);
				return false;
			}
			return true;
		},
		save: function(){

			if (!this.checkForm()){
				return false;
			}
			
			this.initTables();
			var table = DATA.get('task');
			var rows = table.getRows({taskid: this.task.id});
			var row = this.task.id > 0 ? rows.getByIndex(0) : table.newRow();

			this.updateRow(row);
			
			if (row.isNew()){
				rows.add(row);
			}
			table.applyChanges();
			return true;
		},
		onClick: function(el){
			return false;
		}
	};

	NS.TaskEditWidget = TaskEditWidget;
	
})();

(function(){
	
	var TM = TMG.build('taskremovepanel'), T = TM.data, TId = TM.idManager;
	
	var TaskRemovePanel = function(filename, callback){
		this.filename = filename;
		this.callback = callback;
		
		TaskRemovePanel.superclass.constructor.call(this, {
			width: '400px', modal: true, fixedcenter: true
		});
	};
	YAHOO.extend(TaskRemovePanel, Brick.widget.Panel, {
		initTemplate: function(){
			return TM.replace('taskremovepanel', {
				'nm': this.filename
			});
		},
		onClick: function(el){
			if (el.id == TM.getElId('taskremovepanel.bremove')){
				this.close();
				this.callback();
				return true;
			}else if (el.id == TM.getElId('taskremovepanel.bcancel')){
				this.close();
			}
			return false;
		}
	});
	
	NS.TaskRemovePanel = TaskRemovePanel;
})();


(function(){
	
	var session = 1;
	
	var TaskListManager = function(callback){
		this.callback = callback;
		
		this.init();
	};
	TaskListManager.prototype = {
		config: null,
		hash: null,
		init: function(){
			this.hash = {};
			this.session = session++;
			DATA.onComplete.subscribe(this.completeDataHandler, this, true);
		},
		destroy: function(){
			DATA.onComplete.unsubscribe(this.completeDataHandler);
		},
		completeDataHandler: function(type, args){
			if (!args[0].check(['days'])){ return; }
			
			var rowsParam = DATA.get('days').getAllRows();
			for (var n in rowsParam){
				var rows = rowsParam[n];
				if (rows.param['ss']*1 != this.session){
					return;
				}
				this.hash[rows.param.uid].update(rows);
			}
			DATA.remove('days');
			this.callback();
		},
		toString: function(){
			return 'TaskListManager-'+this.session;
		},
		clear: function(){
			for (var uid in this.hash){
				this.hash[uid].destroy();
				delete this.hash[uid];
			}
			this.hash = {};
		},
		load: function(sprm, users){
			users = users || [Brick.env.user.id];

			var beginLoad = false;
			for (var i=0;i<users.length;i++){
				var prm = L.merge({
					bdt: NS.getDate(),
					edt: new Date,
					uid: users[i]
				}, sprm || {});
				
				var hash = this.hash;
				if (!hash[prm.uid]){
					hash[prm.uid] = new TaskList(this, prm.uid);
				}
				var taskList = hash[prm.uid];
				if (taskList.load(prm)){
					beginLoad = true;
				}
			}
			if (beginLoad){
				return true;
			}
			
			this.callback();
			return false;
		},
    	calcData: function(key, users){
    		var pds = [];
    		
    		users = users || [];
    		
    		var calcKey = users.join('-');

    		for (var nuid =0; nuid<users.length; nuid++){
    			
        		var mapItem = this.hash[users[nuid]].map[key];

        		for (var i in mapItem){
    				var task = mapItem[i];
    				
    				if (task['calc']){
    					// if (task['calc']['k'] == calcKey){ return; }
    				}
    				
    				var bdt = task.bdt * 1;
    				var edt = bdt + (task.edt*60);
    				
    				var find = false;
    				for (var ii=0;ii<pds.length;ii++){
    					var pd = pds[ii];
    					
    					if ((pd.bdt <= bdt && edt <= pd.edt) 
    						|| (pd.bdt > bdt && edt > pd.bdt && edt <= pd.edt) 
    						|| (pd.bdt < bdt && bdt < pd.edt && edt > pd.edt) 
    						|| (pd.bdt >= bdt && edt >= pd.edt)){
    						
    						find = true;
    						pd.bdt = Math.min(pd.bdt, bdt);
    						pd.edt = Math.max(pd.bdt, edt);
    						pd.els[pd.els.length] = task;
    					}
    				}
    				if (!find){
    					pds[pds.length] = {
    						bdt: bdt, edt: edt, els: [task]
    					};
    				}
        		}
    		}

			for (var i=0;i<pds.length;i++){
				var pd = pds[i];
				
				var cnt = pd.els.length;
				var allw = 0;
				var w = Math.floor(100 / cnt);
				for (var ii=0;ii<cnt;ii++){
					var task = pd.els[ii];
					var bdt = dateServerToClient(task.bdt); 
					var edt = dateServerToClient(task.bdt + task.edt * 60);

					task['calc'] = {
						'k': calcKey,
						'x': w*ii,
						'bdt': bdt ,
						'edt': edt
					};
					
					if (ii == cnt-1){ w = 100-allw; }
					task['calc']['w'] = w;

					allw += w;
				}
			}
    	}
	};
	
	NS.TaskListManager = TaskListManager;
	
	var TaskList = function(owner, userid){
		this.init(owner, userid);
	};
	TaskList.prototype = {
		map: null,
		bdt: null,
		edt: null,
		
		init: function(owner, userid){
			this.owner = owner;
			this.userid = userid;
			this.map = {};
			this.bdt = NS.getDate();
			this.edt = NS.getDate();
		},
		
		destroy: function(){
			this.owner = null;
			this.userid = null;
			for (var key in this.map){
				delete this.map[key];
			}
			this.map = null;
			this.bdt = null;
			this.edt = null;
		},
		
		update: function(rows){
			var days = rows.param['days'];
			
			for (var i=0;i<days.length;i++){
				var b = days[i]['b'];
				var e = days[i]['e'];
				
				for (var key=b; key<=e; key++){
					if (!this.map[key]){
						this.map[key] = {};
					}
				}
			}
			
			var keys = {},  __self = this, key;
			rows.foreach (function(row){
				key = __self.addTask(row.cell);
				keys[key] = key;
			});
		},
		
		addTask: function(task){
			var d = dateServerToClient(task.bdt);
			
			var key = dateToKey(d);
			
			if (!this.map[key]){
				this.map[key] = {};
			}
			task.bdt = task.bdt * 1;
			task.edt = task.edt * 1;
			
			if (task.edt > 60*24){
				var eh = 23-d.getHours();
				task.edt = eh*60+59;
			}
			
			this.map[key][task.id] = task;
			
			return key;
		},
		
		getTaskList: function(date){
			var key = dateToKey(date);
			return this.map[key];
		},
		
		removeTaskList: function(date){
			var key = dateToKey(date);
			delete this.map[key];
		},
		
		removeAll: function(){
			this.map = {};
		},
		
		load: function(period){
			var tbdt = period.bdt.getTime(),
				tedt = period.edt.getTime();

			var bday = dateToKey(period.bdt);
			var eday = dateToKey(period.edt);
			
			var mp = function(d){
				this.b = d; this.e = d;
				
				this.check = function(d){ return !(d - this.e > 1); };
				this.set = function(d){
					this.b = Math.min(this.b, d);
					this.e = Math.max(this.e, d);
				};
				/*
				this.toString = function(){
					return this.b + '-' + this.e;
				};*/
			};
			
			var necDays = [];
			var curMP = null;
			for (var i=bday;i<eday;i++){
				if (!this.map[i]){
					if (L.isNull(curMP)){
						curMP = new mp(i);
						necDays[necDays.length] = curMP;
					}else{
						if (curMP.check(i)){
							curMP.set(i);
						}else{
							curMP = new mp(i);
							necDays[necDays.length] = curMP;
						}
					}
				}
			}
			if (necDays.length == 0){ return false; }
			/*
			necDays.toString = function(){
				var arr = [];
				for (var i=0;i<necDays.length;i++){
					arr[arr.length] = necDays[i].toString();
				}
				return arr.join('-');
			};*/
			var rowsParam = {
				days: necDays,
				uid: this.userid,
				ss: this.owner.session
			};
			DATA.get('days', true).getRows(rowsParam);
			return true;
		}
	};
	
	NS.TaskList = TaskList;
	
})();

(function(){
	
	NS.calendarLocalize = function(cal){
		var cfg = cal.cfg;
		
		var lng = Brick.util.Language.getc('mod.calendar.dict');
		
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

})();

};
