/*
 @version $Id$
 @copyright Copyright (C) 2008 Abricos. All rights reserved.
 @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 */

/**
 * @module Sys
 */
var Component = new Brick.Component();
Component.requires = { };
Component.entryPoint = function(){

    Brick.namespace('util');

    var form = function(){};
    form.prototype = {
        isName: function(text, showalert){
            if (this.isEmpty(text, showalert)){
                return false;
            }
            var ntext = Brick.util.Translite.ruen(text);
            var ret = text == ntext;
            if (showalert && !ret){
                // alert(text+'\n'+ntext);
                this.showError(this.isNameError());
            }
            return ret;
        },
        isNameError: function(){
            return Brick.util.Language.getc('form.error.name');
        },
        isEmpty: function(text, showalert){
            text = YAHOO.lang.trim(text);
            var ret = text.length == 0;
            if (showalert && ret){
                this.showError(this.isEmptyError());
            }
            return ret;
        },
        isEmptyError: function(){
            return Brick.util.Language.getc('form.error.empty');
        },
        isEmail: function(email, showalert){
            email = email.toLowerCase();

            var ret = /^[a-z0-9_\-]+(\.[_a-z0-9\-]+)*@([_a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel)$/.test(email);
            if (showalert && !ret){
                this.showError(this.isEmailError());
            }
            return ret;
        },
        isEmailError: function(){
            return Brick.util.Language.getc('form.error.email');
        },
        showError: function(text){
            var s = Brick.util.Language.getc('form.error.error');
            alert(s+text);
        },
        setValue: function(el, value){
            value = value || "";
            var tag = el.tagName.toLowerCase();
            if (tag == 'input'){
                var type = el.type.toLowerCase();
                if (type == 'checkbox'){
                    switch(value){
                        case "0":
                            break;
                        default:
                            el.checked = value ? "checked" : "";
                            break;
                    }
                    return;
                }
            }else if (tag == 'label'){
                el.innerHTML = value;
                return;
            }
            el.value = value;
        },
        getValue: function(el){
            var tag = el.tagName.toLowerCase();
            if (tag == 'textarea' || tag == 'select'){
                return el.value;
            }else if (tag == 'input'){
                var type = el.type.toLowerCase();
                if (type == 'checkbox'){
                    return (el.checked ? 1 : 0);
                }
                return el.value;
            }
            return null;
        }
    };

    Brick.util.Form = new form();

    Brick.util.Form.DefaultRule = {
        'username': {
            error: 'Недопустимый символ в значение поля "%field%"',
            fcheck: function(value){
                var value = value.toLowerCase();
                var ret = /[^а-яА-Яa-z0-9_\-]+/.test(value);
                return !ret;
            }
        },
        'empty':{
            error: 'Поле "%field%" является обязательным.',
            fcheck: function(value){
                if (typeof value != 'string' || value.length == 0){
                    return false;
                }
                return true;
            }
        },
        'unixname': {
            error: 'Неверное значение. Допускаются символы: "[a-z][A-Z][0-9]-_"',
            fcheck: function(value){
                var value = value.toLowerCase();
                var ntext = Brick.util.Translite.ruen(value);
                return value == ntext;
            }
        },
        'email': {
            error: 'E-mail введен неверно',
            fcheck: function(value){
                var email = value.toLowerCase();
                var ret = /^[a-z0-9_\-]+(\.[_a-z0-9\-]+)*@([_a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel)$/.test(email);
                return ret;
            }
        },
        'tags': {
            error: '',
            fcheck: function(value){
                return true;
            }
        }
    };

    /*
     * Менеджер проверки формы.
     * входные данные: элементы формы и правила их проверки.
     * пример:
     * var rules = {
     * 	elements: {
     * 		'username':{
     * 			obj: Dom.get(username),
     * 			args: {"field":"Имя пользователя"},
     * 			rules: ["empty","unixname"]
     * 		}
     * 	},
     * 	rules: {
     * 		'empty': {
     * 			error: 'Поле "%fieldname%" является обязательным.',
     * 			fcheck: function(){ ... }
     * 		},
     * 		'unixname':{ ...}
     * 	}
     * }
     */
    var validator = function(rule){

        this.els = {};
        this.rules = {};

        this.init(rule);
    };
    validator.prototype = {
        init: function(rule){
            var name, i, el, rulesHash = {};

            for (name in rule.elements){
                el = rule.elements[name];
                el.args = el.args || {};
                this.els[name] = el;

                for (i=0;i<el.rules.length;i++){
                    rulesHash[el.rules[i]] = true;
                }
            }

            var rules = rule['rules'] || {};
            for(name in rulesHash){
                if (typeof rules[name] != 'undefined'){
                    this.rules[name] = rules[name];
                }else if(typeof Brick.util.Form.DefaultRule[name] != 'undefined'){
                    this.rules[name] = Brick.util.Form.DefaultRule[name];
                }else{
                    this.rules[name] = {
                        error: 'Rule "'+name+'" in validator not found',
                        fcheck: function(value){
                            return false;
                        }
                    };
                }
            }
        },
        check: function(){
            var errors = [];
            var i, name, el, value, rule, j;
            for (name in this.els){
                el = this.els[name];
                value = el.obj.value;

                if (!el.args['field']){
                    var label = YAHOO.util.Dom.get(el.obj.id+"-lbl");
                    if (label){
                        el.args['field'] = label.innerHTML;
                    }
                }
                if (!el.args['field']){
                    el.args['field'] = "";
                }

                for (i=0;i<el.rules.length;i++){
                    rule = this.rules[el.rules[i]];

                    if (!rule.fcheck(value)){
                        errors[errors.length] = {
                            name: name,
                            obj: el.obj,
                            error: this._replargs(el.args, rule.error)
                        };
                    }
                }
            }

            if (errors.length > 0){
                alert(errors[0].error);
                errors[0].obj.focus();
            }

            return errors;
        },
        _replargs: function(args, s){
            for (var n in args){
                s = s.replace('%'+n+'%', args[n]);
            }
            return s;
        }
    };

    Brick.util.Form.Validator = validator;

    Brick.util.Form.encode = function(s) {
        return s ? ('' + s).replace(/[<>&\"]/g, function (c, b) {
            switch (c) {
                case '&': return '&amp;';
                case '"': return '&quot;';
                case '<': return '&lt;';
                case '>': return '&gt;';
            }
            return c;
        }) : s;
    };


    // Translite
    Brick.util.Translite = {
        rusBig: new Array( "Э", "Ч", "Ш", "Ё", "Ё", "Ж", "Ю", "Ю", "\Я", "\Я", "А", "Б", "В", "Г", "Д", "Е", "З", "И", "Й", "К", "Л", "М", "Н", "О", "П", "Р", "С", "Т", "У", "Ф", "Х", "Ц", "Щ", "Ъ", "Ы", "Ь"),
        rusSmall: new Array("э", "ч", "ш", "ё", "ё","ж", "ю", "ю", "я", "я", "а", "б", "в", "г", "д", "е", "з", "и", "й", "к", "л", "м", "н", "о", "п", "р", "с", "т", "у", "ф", "х", "ц", "щ", "ъ", "ы", "ь" ),
        engBig: new Array("E\'", "CH", "SH", "YO", "JO", "ZH", "YU", "JU", "YA", "JA", "A","B","V","G","D","E", "Z","I","J","K","L","M","N","O","P","R","S","T","U","F","H","C", "W","~","Y", "\'"),
        engSmall: new Array("e\'", "ch", "sh", "yo", "jo", "zh", "yu", "ju", "ya", "ja", "a", "b", "v", "g", "d", "e", "z", "i", "j", "k", "l", "m", "n", "o", "p", "r", "s",  "t", "u", "f", "h", "c", "w", "~", "y", "\'"),
        rusRegBig: new Array( /Э/g, /Ч/g, /Ш/g, /Ё/g, /Ё/g, /Ж/g, /Ю/g, /Ю/g, /Я/g, /Я/g, /А/g, /Б/g, /В/g, /Г/g, /Д/g, /Е/g, /З/g, /И/g, /Й/g, /К/g, /Л/g, /М/g, /Н/g, /О/g, /П/g, /Р/g, /С/g, /Т/g, /У/g, /Ф/g, /Х/g, /Ц/g, /Щ/g, /Ъ/g, /Ы/g, /Ь/g),
        rusRegSmall: new Array( /э/g, /ч/g, /ш/g, /ё/g, /ё/g, /ж/g, /ю/g, /ю/g, /я/g, /я/g, /а/g, /б/g, /в/g, /г/g, /д/g, /е/g, /з/g, /и/g, /й/g, /к/g, /л/g, /м/g, /н/g, /о/g, /п/g, /р/g, /с/g, /т/g, /у/g, /ф/g, /х/g, /ц/g, /щ/g, /ъ/g, /ы/g, /ь/g),
        engRegBig: new Array( /E'/g, /CH/g, /SH/g, /YO/g, /JO/g, /ZH/g, /YU/g, /JU/g, /YA/g, /JA/g, /A/g, /B/g, /V/g, /G/g, /D/g, /E/g, /Z/g, /I/g, /J/g, /K/g, /L/g, /M/g, /N/g, /O/g, /P/g, /R/g, /S/g, /T/g, /U/g, /F/g, /H/g, /C/g, /W/g, /~/g, /Y/g, /'/g),
        engRegSmall: new Array(/e'/g, /ch/g, /sh/g, /yo/g, /jo/g, /zh/g, /yu/g, /ju/g, /ya/g, /ja/g, /a/g, /b/g, /v/g, /g/g, /d/g, /e/g, /z/g, /i/g, /j/g, /k/g, /l/g, /m/g, /n/g, /o/g, /p/g, /r/g, /s/g, /t/g, /u/g, /f/g, /h/g, /c/g, /w/g, /~/g, /y/g, /'/g),
        ruen: function(text){
            var ret = text;
            var rett = "";
            if (ret) {
                for (i=0; i<this.rusRegSmall.length; i++) {
                    ret = ret.replace(this.rusRegSmall[i], this.engSmall[i]);
                }
                for (var i=0; i<this.rusRegBig.length; i++) {
                    ret = ret.replace(this.rusRegBig[i], this.engSmall[i]);
                }
                rett = ret.toLowerCase();
            }
            rett = rett.replace(/[\/\\'\.,\t\|\+&\?%#@!;:*\(\)=~`\$"\^\*<>\[\]{}]*/g, "");
            rett = rett.replace(String.fromCharCode(8470), "");
            rett = rett.replace(/[ ]+/g, "_");
            return rett;
        }
    };
};