/**
* @version $Id$
* @package CMSBrick
* @copyright Copyright (C) 2008 CMSBrick. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

(function(){
	Brick.namespace('Subscribe');

	var Dom, E,	L;
	var BC = Brick.util.Connection;
	var wWait = Brick.widget.WindowWait;

	Brick.Loader.add({
		yahoo: ['json'],
    onSuccess: function() {
			Dom = YAHOO.util.Dom;
			E = YAHOO.util.Event;
			L = YAHOO.lang;
	  }
	});
	
/* * * * * * * * * * * * Subscribe API * * * * * * * * * * */
(function(){

	Brick.Subscribe.API = function(){
		return {
			
			_loadlib: function(callback){
				if (!Brick.objectExists('Brick.Subscribe.Message')){
					wWait.show();
					Brick.Loader.add({
						mod:[{name: 'subscribe', files: ['message.js']}],
				    onSuccess: function() {
							wWait.hide();
							callback();
					  }
					});
				}else{
					callback();
				}
			},
			edit: function(obj){
				this._loadlib(function(){ new Brick.Subscribe.Message.Editor(obj); })
			},
			editById: function(msgid){
				BC.sendCommand('subscribe', 'js_message', {json: {id: msgid, act: 'edit'} });
			},
			preview: function(obj){
				this._loadlib(function(){ Brick.Subscribe.Message.Preview.show(obj); })
			},
			previewById: function(msgid){
				BC.sendCommand('subscribe', 'js_message', {json: {id: msgid, act: 'preview'} });
			},
			add: function(obj){
				obj['act'] = 'add';
				obj['module'] = obj['module'] || '';
				BC.sendCommand('subscribe', 'api', {json: obj });
			},
			remove: function(obj){
				obj['act'] = 'remove';
				BC.sendCommand('subscribe', 'api', {json: obj });
			}
		}
	}();
	
})();

})();