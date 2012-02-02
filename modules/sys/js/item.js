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
	
	var ItemList = function(d, itemClass){
		d = d || [];
		itemClass = itemClass || Item;
		this.init(d, itemClass);
	};
	ItemList.prototype = {
		init: function(d, itemClass){
			this._itemClass = itemClass;
			this.list = [];
			this.update(d);
		},
		add: function(item){
			if (!L.isNull(this.get(item.id))){ return; }
			this.list[this.list.length] = item;
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
			
			if (!isRemove){ return; }
			
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
		},
		foreach: function(f){
			if (!L.isFunction(f)){ return; }
			for (var i=0;i<this.list.length;i++){
				if (f(this.list[i])){ return; }
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