/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/
(function(){
	Brick.namespace('Catalog');
	Brick.namespace('Catalog.Data');

	var T, J, TId;

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang,
		W = YAHOO.widget,
		J = YAHOO.lang.JSON;

	var BC = Brick.util.Connection;

	var dateExt = Brick.dateExt;
	var elClear = Brick.elClear;
	var wWait = Brick.widget.WindowWait;
	var tSetVar = Brick.util.Template.setProperty;

	Brick.Loader.add({
		yahoo: ['json', 'tabview'],
		mod:[
		  {name: 'sys', files: ['data.js']},
		  {name: 'catalog', files: ['lib.js','catalog.js','eltype.js','catstruct.js','dictionary.js']}
		],
    onSuccess: function() {

			T = Brick.util.Template['catalog']['cp_config'];
			Brick.util.Template.fillLanguage(T);
			TId = new Brick.util.TIdManager(T);

			moduleInitialize();
			delete moduleInitialize;
	  }
	});
	
var moduleInitialize = function(){

(function(){
	
	var cpPage = function(container, mmPrefix){
		this.init(container, mmPrefix);
	};
	cpPage.prototype = {
		init: function(container, mmPrefix){
	
			if (!Brick.Catalog.Data[mmPrefix]){
				Brick.Catalog.Data[mmPrefix] = new Brick.util.data.byid.DataSet('catalog', mmPrefix);
			}

			container.innerHTML = T['panel'];
			
			var tabView = new YAHOO.widget.TabView(TId['panel']['id']);
			this.tabView = tabView;
	
			this.catalog = {
				'manager': new Brick.Catalog.Manager(Dom.get(TId['panel']['catalog']), mmPrefix)
			}
			this.element = {
				'type': {
					'manager': new Brick.Catalog.Element.Type.Manager(Dom.get(TId['panel']['tabeltype']), mmPrefix)
				}
			};

			/*
			this.dictionary = {
				'manager': new Brick.Catalog.Dictionary.Manager(Dom.get(TId['panel']['tabdictionary']), mmPrefix)
			};
			/**/
			this.structure = {
				'manager': new Brick.Catalog.Structure.Manager(Dom.get(TId['panel']['tabstructure']), mmPrefix)
			};
			var __self = this;
			E.on(container, 'click', function(e){
				if (__self.onClick(E.getTarget(e))){ E.stopEvent(e); }
			});

			Brick.Catalog.Data[mmPrefix].request();
		},
		onClick: function(el){
			if (this.catalog.manager.onClick(el)){ return true; }
			if (this.element.type.manager.onClick(el)){ return true; }
			/*
			if (this.dictionary.manager.onClick(el)){ return true; }
			/**/
			if (this.structure.manager.onClick(el)){ return true; }
			return false;
		}
	};
	Brick.Catalog.CPPage = cpPage;

})();
};
})();