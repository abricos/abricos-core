/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008-2011 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.entryPoint = function(NS){

	YAHOO.util.Number = {

	    format : function(n, cfg) {
	        if (!isFinite(+n)) {
	            return '';
	        }

	        n   = !isFinite(+n) ? 0 : +n;
	        cfg = YAHOO.lang.merge(YAHOO.util.Number.format.defaults, (cfg || {}));

	        var neg    = n < 0,        absN   = Math.abs(n),
	            places = cfg.decimalPlaces,
	            sep    = cfg.thousandsSeparator,
	            s, bits, i;

	        if (places < 0) {
	            // Get rid of the decimal info
	            s = absN - (absN % 1) + '';
	            i = s.length + places;

	            // avoid 123 vs decimalPlaces -4 (should return "0")
	            if (i > 0) {
	                    // leverage toFixed by making 123 => 0.123 for the rounding
	                    // operation, then add the appropriate number of zeros back on
	                s = Number('.' + s).toFixed(i).slice(2) +
	                    new Array(s.length - i + 1).join('0');
	            } else {
	                s = "0";
	            }
	        } else {        // There is a bug in IE's toFixed implementation:
	            // for n in {(-0.94, -0.5], [0.5, 0.94)} n.toFixed() returns 0
	            // instead of -1 and 1. Manually handle that case.
	            s = absN < 1 && absN >= 0.5 && !places ? '1' : absN.toFixed(places);
	        }

	        if (absN > 1000) {
	            bits  = s.split(/\D/);
	            i  = bits[0].length % 3 || 3;

	            bits[0] = bits[0].slice(0,i) +
	                      bits[0].slice(i).replace(/(\d{3})/g, sep + '$1');

	            s = bits.join(cfg.decimalSeparator);
	        }

	        s = cfg.prefix + s + cfg.suffix;

	        return neg ? cfg.negativeFormat.replace(/#/,s) : s;
	    }
	};
	YAHOO.util.Number.format.defaults = {
	    decimalSeparator : '.',
	    decimalPlaces    : null,
	    thousandsSeparator : '',
	    prefix : '',
	    suffix : '',
	    negativeFormat : '-#'
	};
		
};