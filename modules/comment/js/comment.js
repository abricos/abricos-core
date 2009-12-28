/*
@version $Id$
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module Comment
 * @namespace Brick.mod.comment
 */

var Component = new Brick.Component();
Component.requires = {
	mod:[{name: 'sys', files: ['data.js']}]
};
Component.entryPoint = function(){
	
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;
	
	var NS = this.namespace;
	var __selfCT = this;

	if (!Brick.objectExists('Brick.mod.comment.data')){
		Brick.mod.comment.data = new Brick.util.data.byid.DataSet('comment');
	}
	var DATA = Brick.mod.comment.data;
	var tSetVar = Brick.util.Template.setProperty;
	var tSetVarA = Brick.util.Template.setPropertyArray;
	
	var _T = {};
	var _TId = {};
	
	/**
	 * Конструктор дерева комментариев на странице.
	 * 
	 * @class Builder
	 * @constructor
	 * @param {String} elementId Идентификатор HTML элемента, который содержит 
	 * в себе список комментариев: имя пользователя, идентификатор и текст комментария.
	 * @param {Integer} dbContentId Идентификатор из таблицы контента на сервера. 
	 * @param {Object} data Сопутствующие данные комментариев.
	 */
	var Builder = function(elementId, dbContentId, data){
		this.init(elementId, dbContentId, data);
	};

	/**
	 * Хеш таблица экземпляров Builder.
	 * 
	 * @private
	 * @static
	 * @property _instances
	 * @type Object
	 */
	Builder._instances = {};

	/**
	 * Получить объект Builder по HTML идентификатору.
	 * 
	 * @method getBuilderById
	 * @static
	 * @param {String} Идентификатор HTML элемента.
	 */
	Builder.getBuilderById = function(id) {
        if (Editor._instances[id]) {
            return Editor._instances[id];
        }
        return null;
    };


	Builder.prototype = {
		/**
		 * HTML элемент в котором будет построено дерево комментариев.
		 * 
		 * @property element
		 * @type HTMLElement
		 */
		element: null,
		
		/**
		 * Идентификатор из таблицы контента на сервера.
		 * 
		 * @property dbContentId
		 * @type Integer
		 */
		dbContentId: null,
		
		/**
		 * Идентификатор последнего комментария
		 * 
		 * @property lastCommentId
		 * @type Integer
		 */
		lastCommentId: 0,
		
		/**
		 * Кол-во комментариев.
		 * 
		 * @property count
		 * @type Integer
		 */
		count: 0,
		
		/**
		 * Открытый редактор комментария.
		 * 
		 * @property reply
		 * @type Brick.mod.comment.Reply
		 */
		reply: null,
		
		/**
		 * Инициализация конструктора дерева комментариев.
		 * 
		 * @method init
		 * @param {String} elementId Идентификатор HTML элемента, который содержит 
		 * в себе список начальных данных комментариев: имя пользователя, идентификатор 
		 * и текст комментария.
		 * @param {Integer} dbContentId Идентификатор из таблицы контента на сервера. 
		 * @param {Object} data Сопутствующие данные комментариев.
		 */
		init: function(elementId, dbContentId, data){
			this.dbContentId = dbContentId;
			this.element = Dom.get(elementId);
			if (L.isNull(this.element)){ return; }
			
			Builder._instances[elementId] = this;

			var template = __selfCT.template.get(elementId);
			_T[elementId] = template.data; 
			_TId[elementId] = template.idManager;
			this.build(data);
		},
		
		/**
		 * Построить HTML код комментария из шаблона.
		 * 
		 * @method _getHTMLNode
		 * @private 
		 * @param {Object} di Данные комментария. 
		 */
		_getHTMLNode: function(di){
			var T = _T[this.element.id];
			return tSetVarA(T['comment'], {
				'unm': di['unm'],
				'ttname': Brick.env.ttname,
				'reply': (Brick.env.user.isRegister() ? T['reply'] : ""),
				'de':  Brick.dateExt.convert(di['de']),
				'id': di['id'],
				'bd': di['st']>0?T['spam']: di['bd']
			});
		},
		
		/**
		 * Построить дерево комментариев.
		 * 
		 * @param data
		 * @return
		 */
		build: function(data){
			var el = this.element;
			
			// чтение данных
			var body = {};
			while(el.childNodes.length){
				var t = el.childNodes[0];
				if (t.childNodes.length == 3){
					body[t.childNodes[0].innerHTML] = t.childNodes[2].innerHTML;
				}
				el.removeChild(t);
			}
			var T = _T[el.id];
			var TId = _TId[el.id];
			
			el.innerHTML = tSetVarA(T['panel'], {'id': this.dbContentId, 'ttname': Brick.env.ttname });
			
			var getEl = function(name){ return Dom.get(TId['panel'][name]); };
			
			if (Brick.env.user.isRegister()){
				getEl('replyrootnone').style.display = 'none';
			}else{
				getEl('breplyroot').style.display = 'none';
			}

			var __self = this;
			var lastCommentId = 0;
			var _buildTree = function(container, pid){
				
				var i, di, lst = "";
				for (i=0;i<data.length;i++){
					di = data[i];
					if (di['id']*1 > lastCommentId){
						lastCommentId = di['id']*1;
					}
					if (di['pid'] == pid){
						di['bd'] = body[di['id']];
						lst += __self._getHTMLNode(di);
					}
				}
				if (lst.length == 0){ return; }
				var t = tSetVar(T['list'], 'id', pid);
				container.innerHTML = tSetVar(t, 'list', lst);
				
				for (i=0;i<data.length;i++){
					di = data[i];
					if (di['pid'] == pid){
						var child = Dom.get(TId['comment']['child']+'-'+di['id']);
						_buildTree(child, di['id']);
					}
				}
			};
			
			_buildTree(getEl('list'), 0);

			this.lastCommentId = lastCommentId;
			this.count = data.length;
			this.renderCount();
			
			var __self = this;
			E.on(el, 'click', function(e){if (__self.onClick(E.getTarget(e))){ E.stopEvent(e);}});
			
			var tables = {'comments': DATA.get('comments', true)};
			var rows = tables['comments'].getRows({'cid': this.dbContentId}, {'lid': lastCommentId});
			DATA.onComplete.subscribe(this.dsComplete, this, true);
		},
		
		/**
		 * Обработать событие DataSet.
		 * 
		 * @method dsComplete
		 * @param type
		 * @param args
		 */
		dsComplete: function(type, args){
			if (!args[0].checkWithParam('comments', {'cid': this.dbContentId})){ return; }
			
			var __self = this;
			var T = _T[this.element.id];
			var TId = _TId[this.element.id];
			var rows = DATA.get('comments').getRows({'cid': this.dbContentId});
			var lastid = this.lastCommentId;
			var count = this.count;
			rows.foreach(function(row){
				var di = row.cell;
				var pid = di['pid'];
				if (di['id']*1 > lastid){ lastid = di['id']*1; }
				var item = __self._getHTMLNode(di);
				var child = (count == 0 ? Dom.get(TId['panel']['list']) : Dom.get(TId['comment']['child']+'-'+pid));
				var list = Dom.get(TId['list']['id']+'-'+pid);
				if (L.isNull(list)){
					var t = tSetVar(T['list'], 'id', pid);
					child.innerHTML = tSetVar(t, 'list', item);
				}else{
					list.innerHTML += item;
				}
				count++;
			});
			
			this.count = count;
			this.lastCommentId = lastid;
			rows.overparam.lid = lastid;
			this.renderCount();
		},
		
		/**
		 * Перерисовать кол-во комментариев
		 * 
		 * @method renderCount
		 */
		renderCount: function(){
			var TId = _TId[this.element.id];
			var span = Dom.get(TId['panel']['count']);
			span.innerHTML = "("+this.count+")";
		},
		
		/**
		 * Обработать клик мыши.
		 * 
		 * @method onClick
		 * @param {HTMLElement} el
		 * @return {Boolean}
		 */
		onClick: function(el){
			if (!L.isNull(this.reply)){
				if (this.reply.onClick(el)){ return true; }
			}
			var TId = _TId[this.element.id];
			var tp = TId['panel'];
			switch(el.id){
			case tp['breplyroot']:
				this.showReply(0);
				return true;
			case tp['refresh']:
			case tp['refreshimg']:
				this.refresh();
				return true;
			}
			
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			if (prefix == TId['reply']['id']+'-'){
				this.showReply(numid); return true;
			}
			return false;
		},
		
		/**
		 * Написать комментарий.
		 * 
		 * @method showReply
		 * @param {Integer} parentCommentId Идентификатор комментария.
		 */
		showReply: function(parentCommentId){
			if (!L.isNull(this.reply)){
				this.reply.destroy();
			}
			this.reply = new Reply(this, parentCommentId);
		},
		
		/**
		 * Запросить сервер обновить дерево комментариев, а именно, 
		 * подгрузить новые комментарии, если таковые имеются.
		 * 
		 * @method refresh
		 */
		refresh: function(){
			var table = DATA.get('comments');
			var rows = table.getRows({'cid': this.dbContentId});
			rows.clear();
			DATA.request();
		}
	};
	
	Brick.mod.comment.Builder = Builder;	

	
	/**
	 * Виджет "Написать комментарий"
	 * 
	 * @class Reply
	 * @constructor
	 * @param {Brick.mod.comment.Builder} owner Конструктор дерева комментариев.
	 * @param {Integer} parentCommentId Идентификатор комментария родителя, в таблице 
	 * комментариев на сервера, на который будет дан ответ, если 0, то это будет 
	 * первый комментарий.  
	 */
	var Reply = function(owner, parentCommentId){
		parentCommentId = parentCommentId*1 || 0;
		this.init(owner, parentCommentId);
	};

	Reply.prototype = {
		
		/**
		 * Конструктор дерева комментариев.
		 * 
		 * @property owner
		 * @type Brick.mod.comment.Builder
		 */
		owner: null,
		
		/**
		 * Идентификатор комментария родителя, в таблице 
		 * комментариев на сервера, на который будет дан ответ, если 0, то это будет 
		 * первый комментарий.
		 * 
		 * @property parentCommentId
		 * @type Integer
		 */
		parentCommentId: 0,
		
		/**
		 * Шаблон компонента.
		 * 
		 * @property _T
		 * @private
		 * @type Object
		 */
		_T: null,

		/**
		 * Мененджер идентификаторов HTML элеменов из шаблона.
		 * 
		 * @property _TId
		 * @private
		 * @type Object
		 */
		_TId: null,
		
		/**
		 * Редактор комментария.
		 * 
		 * @property editor
		 * @type Brick.widget.Editor
		 */
		editor: null,
		
		/**
		 * Инициализировать редактор.
		 * 
		 * @method init
		 * @param {Brick.mod.comment.Builder} owner Конструктор дерева комментариев.
		 * @param {Integer} parentCommentId Идентификатор комментария родителя.
		 */
		init: function(owner, parentCommentId){
			this.owner = owner;
			this.parentCommentId = parentCommentId;
			
			var T = this._T = _T[this.owner.element.id];
			var TId = this._TId = _TId[this.owner.element.id];
			
			if (parentCommentId == 0){
				this.contbutton = Dom.get(TId['panel']['replycont']);
				this.panel = Dom.get(TId['panel']['reply']);
			}else{
				this.contbutton = Dom.get(TId['reply']['contbtn']+'-'+parentCommentId);
				this.panel = Dom.get(TId['reply']['reply']+'-'+parentCommentId);
			}
			this.contbutton.style.display = 'none';
			
			var __self = this;
			this.panel.innerHTML = T['replypanel'];
			Brick.Component.API.fireFunction('sys', 'editor', function(){
				var Editor = Brick.widget.Editor;
				__self.editor = new Editor(TId['replypanel']['editor'], {
					'mode': Editor.MODE_VISUAL,
					'toolbar': Editor.TOOLBAR_MINIMAL
				});
			});
		},
		
		/**
		 * Закрыть и разрушить панель.
		 * 
		 * @method destroy
		 */
		destroy: function(){
			this.editor.destroy();
			this.contbutton.style.display = "";
			Brick.elClear(this.panel);
			this.owner.reply = null;
		},
		
		/**
		 * Просмотреть комментарий как он будет выглядеть после отправки.
		 * 
		 * @method preview
		 */
		preview: function(){
			var table = DATA.get('preview', true);
			table.columns.update(["id","bd"]);
			var row = table.newRow();
			row.cell['bd'] = this.editor.getContent();
			var rows = table.getRows();
			rows.clear();
			rows.add(row);
			table.applyChanges();
			var TId = this._TId;
			var oncomplete = function(){
				Dom.get(TId['replypanel']['preview']).innerHTML = rows.getById(1).cell['bd'];
				DATA.onComplete.unsubscribe(oncomplete);
			};
			DATA.onComplete.subscribe(oncomplete);
			DATA.request();
		},
		
		/**
		 * Отправить комментарий.
		 * 
		 * @method send
		 */
		send: function(){
			var table = DATA.get('comments');
			var rows = table.getRows({'cid': this.owner.dbContentId});
			var row = table.newRow();
			row.cell['pid'] = this.parentCommentId;
			row.cell['bd'] = this.editor.getContent();
			rows.add(row);
			table.applyChanges();
			DATA.request();
			this.destroy();
		},
		
		/**
		 * Обработать клик мыши.
		 * 
		 * @method onClick
		 * @param {HTMLElement} el
		 * @return {Boolean}
		 */
		onClick: function(el){
			var tp = this._TId['replypanel'];
			switch(el.id){
			case tp['bcancel']: this.destroy(); return true;
			case tp['bsend']: this.send();	return true;
			case tp['bpreview']: this.preview(); return true;
			}
			return false;
		}
	};
	
	Brick.mod.comment.Reply = Reply;
	
};
