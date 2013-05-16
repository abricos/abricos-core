/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.entryPoint = function(NS){
	var L = YAHOO.lang;
	
	var Item = function(d){
		d = L.merge({'id': 0}, d || {});
		this.init(d);
	};
	Item.prototype = {
		init: function(d){
			this.id = d['id'];
			this.update(d);
		},
		update: function(d){ }
	};
	NS.Item = Item;
	
	var ItemList = function(d, itemClass, cfg){
		d = d || [];
		itemClass = itemClass || Item;
		
		cfg = L.merge({
			'order': null
		}, cfg || {});
		
		this.init(d, itemClass, cfg);
	};
	ItemList.prototype = {
		init: function(d, itemClass, cfg){
			this._itemClass = itemClass;
			this.list = [];
			this.cfg = cfg;
			this.update(d);
		},
		add: function(item){
			if (!L.isNull(this.get(item.id))){ return; }
			this.list[this.list.length] = item;
			
			if (!this._isDisableOrder){
				this.setOrder(this.cfg['order']);
			}
		},
		get: function(id){
			var lst = this.list;
			for (var i=0;i<lst.length;i++){
				if (lst[i].id == id){ return lst[i];}
			}
			return null;
		},
		getByIndex: function(index){
			index = index*1;
			if (index < 0 || index >= this.count()){ return null; }
			return this.list[index];
		},
		clear: function(){
			this.list = [];
		},
		createItem: function(di){
			return new this._itemClass(di);
		},
		update: function(d, isRemove){
			if (!L.isArray(d)){ return; }
			
			this._isDisableOrder = true;
			
			var ids = {};
			for (var i=0;i<d.length;i++){
				var di = d[i],
					item = this.get(di['id']);
				
				ids[di['id']] = true;
				
				if (L.isNull(item)){
					this.add(this.createItem(di));
				}else{
					item.update(di);
				}
			}
			
			if (isRemove){ 
				var lst = this.list, rem = [];
				for (var i=0;i<lst.length;i++){
					var item = lst[i];
					if (!ids[item.id]){
						rem[rem.length] = item;
					}
				}
				for (var i=0;i<rem.length;i++){
					this.remove(rem[i].id);
				}
			}
			this._isDisableOrder = false;

			this.setOrder(this.cfg['order']);
		},
		sort: function(order){ // вернуть отсортированный список
			if (this._isDisableOrder){ return null; }

			var list = null;
			
			if (L.isString(order)){
				var sort = [], a = order.split(',');
				for (var i=0;i<a.length;i++){
					 var st = L.trim(a[i]), si = {};
					 
					 if (st[0] == '!'){
						 si['desc'] = true;
						 si['field'] = L.trim(st.substring(1));
					 }else{
						 si['field'] = st;
					 }
					 sort[sort.length] = si;
				}
				order = sort;
			}
			
			if (L.isArray(order)){
				list = this.list.sort(function(item1, item2){
					var si;
					for (var i=0; i<order.length; i++){
						si = order[i];
						
						if (item1[si['field']] > item2[si['field']]){ 
							return si['desc'] ? -1 : 1; 
						}
						
						if (item1[si['field']] < item2[si['field']]){ 
							return si['desc'] ? 1 : -1; 
						}
					}
					return 0;
				});
			}
			
			if (L.isFunction(order)){
				list = this.list.sort(order);
			}
			
			return list;
		},
		setOrder: function(order){ // сортировать текущий список
			this.cfg['order'] = order;
			var list = this.sort(order);
			if (!L.isArray(list)){ return; }
			this.list = list;
		},
		reorder: function(){
			this.setOrder(this.cfg['order']);
		},
		foreach: function(f, order){
			if (!L.isFunction(f)){ return; }

			var list = this.sort(order);
			if (L.isNull(list)){
				list = this.list;
			}
			
			for (var i=0;i<list.length;i++){
				if (f(list[i])){ return; }
			}
		},
		count: function(){
			return this.list.length;
		},
		remove: function(id){
			var nlst = [];
			for (var i=0;i<this.list.length;i++){
				var item = this.list[i];
				if (item.id != id){
					nlst[nlst.length] = item;
				}
			}
			this.list = nlst;
		}
	};
	NS.ItemList = ItemList;
	
};