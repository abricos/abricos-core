/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	
	Brick.namespace('Catalog.Data');
	Brick.namespace('Catalog.Element.Type.Option');
	Brick.Loader.add({yahoo: ['json'],mod:[{name: 'sys', files: ['data.js']}]});
	
	var BCat = Brick.Catalog; 
	var DATA = Brick.Catalog.Data;


	BCat.Element.activeEditor = null;

	BCat.Element.edit = function(catalogId, catElementId, elementId, elementTypeId, mmPrefix){
		checkManager(function(){
			
			checkDataSet(mmPrefix);
			var ds = DATA[mmPrefix];
			// alert(elementTypeId);
			var tables = elementTables(ds, elementTypeId);
			tables['fotos'] = ds.get('fotos', true);
			tables['fotos'].getRows({'elid': elementId, 'eltid': elementTypeId});
			tables['catelement'] = ds.get('catelement', true);
			var rows = tables['catelement'].getRows({'id': catElementId});
			
			var onLoad = function(){
				var row = rows.getByIndex(0);
				BCat.Element.activeEditor = new Brick.Catalog.Element.Editor(mmPrefix, row, function(){
					var catelements = ds.get('catelements'); 
					if (catelements){
						catelements.getRows({'catid': catalogId}).clear();
						catelements.applyChanges();
					}
					
					var catelement = ds.get('catelement', true);
					catelement.applyChanges();
					ds.request();
				});
			};

			var complete = function(type, args){
				ds.onComplete.unsubscribe(complete);
				onLoad();
			}; 
			if (ds.isFill(tables)){ 
				onLoad(); 
			}else{
				ds.onComplete.subscribe(complete);
				ds.request();
			}
		});
	};
	

	BCat.Element.create = function(catalogId, elementTypeId, mmPrefix){
		checkManager(function(){
			
			checkDataSet(mmPrefix);
			var ds = DATA[mmPrefix];
			var tables = elementTables(ds, elementTypeId);
			
			var onLoad = function(){
				
				var row = tables['catelement'].newRow(); 
				row.update({
					'catid': catalogId,
					'eltid': elementTypeId
				});
				BCat.Element.activeEditor = new Brick.Catalog.Element.Editor(mmPrefix, row, function(){
					var catelements = ds.get('catelements'); 
					if (catelements){
						catelements.getRows({'catid': catalogId}).clear();
					}
					var catelement = ds.get('catelement', true);
					catelement.getRows().add(row);
					catelement.applyChanges();
					ds.request();
				});
			};

			var complete = function(type, args){
				ds.onComplete.unsubscribe(complete);
				onLoad();
			}; 
			if (ds.isFill(tables)){ 
				onLoad(); 
			}else{
				ds.onComplete.subscribe(complete);
				ds.request();
			}
		});
	};
	
	var elementTables = function(ds, elementTypeId){
		var tables = {
			'fotos': ds.get('fotos', true), // фотографии
			'catelement': ds.get('catelement', true),
			'eltype': ds.get('eltype', true),
			'eloption': ds.get('eloption', true),
			'eloptgroup': ds.get('eloptgroup', true)
		};
		var elType = tables['eltype'].getRows().getById(elementTypeId);
		var rows = tables['eloption'].getRows().filter({'eltid': elementTypeId, 'fldtp': 5});
		rows.foreach(function(row){
			if (!tables['eloptionfld']){
				tables['eloptionfld'] = ds.get('eloptionfld', true);
			}
			tables['eloptionfld'].getRows({'eltpnm': elType.cell['nm'], 'fldnm': row.cell['nm']});
		});
		return tables;
	};
	
	var checkDataSet = function(mmPrefix){
		if (!DATA[mmPrefix]){DATA[mmPrefix] = new Brick.util.data.byid.DataSet('catalog', mmPrefix);}
	};
	
	var checkManager = function(callback){
		if (Brick.objectExists('Brick.Catalog.Element.Editor')){ callback(); return; }
		Brick.Loader.add({ mod:[{name: 'catalog', files: ['element.js']}],
	    onSuccess: function() { callback (); }
		});
	};
	
	var elementTablesChecker = function(param){
		var mmPrefix = param['pfx'];
		var catalogId = param['catid'];
		var elementTypeId = param['eltid'];
		var elementId = param['elid'];

		checkDataSet(mmPrefix);
		var ds = DATA[mmPrefix];

		var tables = {
			'catelement': ds.get('catelement', true),
			'eloptionfld': ds.get('eloptionfld', true),
			'eltype': ds.get('eltype', true),
			'eloption': ds.get('eloption', true),
			'eloptgroup': ds.get('eloptgroup', true),
			'fotos': ds.get('fotos', true)
		};
		// запрос справочников
		var elementRows = tables['catelement'].getRows({'elid':elementId, 'eltid': elementTypeId});
		
		tables['fotos'].getRows({'elid':elementId, 'eltid': elementTypeId});
		
		var onSuccess = function(){
			var row;
			if (elementId > 0){
				row = elementRows.getById(elementId);
			}else{
				row = tables['catelement'].newRow();
				row.cell['catid'] = catalogId;
				row.cell['eltid'] = elementTypeId;
			}
			var obj = {
				'tables': tables,
				'row': row,
				'pfx': mmPrefix 
			};
			BCat.Element.activeEditor = new BCat.Element.Editor(obj);
		};
		

	};
	
})();
