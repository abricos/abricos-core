YUI.add("aui-datatype-date-parse",function(e,t){function o(e){var t=this;e&&t.compilePattern(e)}var n=e.Lang,r=n.String,i=function(e){e=parseInt(e,10);if(!isNaN(e))return e},s="locale";o.TOKEN_PREFIX="%",o.TWO_DIGIT_YEAR_BASE=2e3,e.mix(o.prototype,{compiled:null,compilePattern:function(e){var t=this,r,i,s=[],u,a,f,l=e.length,c;for(a=0;a<l;a++){r=e.charAt(a),i=e.charAt(a+1);if(r===o.TOKEN_PREFIX){c=t._getPatternHints(i);if(!c){s.push(r);continue}if(c.aggregates){e=t._expandPattern(e,a,i),l=e.length,a--;continue}u={hints:c,numeric:c.numericTokens&&c.numericTokens.indexOf(i)>-1,token:i},f=s[s.length-1],f&&!n.isString(f)&&(u.sequence=!0,f.sequence=!0),s.push(u),a++}else s.push(r)}t.compiled=s},parse:function(e,t){var r=this,i={},s=r.compiled,u,a=s.length,f,l,c,h=[0],p;e=n.trim(e),c=e.length;if(!c)return!1;for(u=0;u<a;u++){l=s[u],f=s[u+1];if(h[0]>c)break;if(n.isString(l)){h[0]++;continue}l.sequence?o.HINTS.TZ===l.hints?p=r._subparseTimeZone(e,h):l.numeric?(p=r._getNextNumericValue(e,h),p=r._subparseNumericBlob(p,h,u)):(p=r._getNextValue(e,h,null),p=r._subparseStringBlob(p,h,u)):p=r._getNextValue(e,h,f),l.hints.setter&&l.hints.setter.call(r,i,n.trim(p),l)}return r._getCalendarDate(i,t)},_expandPattern:function(t,n,r){var i=this,o=e.Date.aggregates[r];return o===s&&(o=i._getLangResource(r)),o?t.substring(0,n)+o+t.substring(n+2,t.length):t},_findBestStringMatch:function(e,t,n){var r=-1,i=0,s=t.length,o,u,a,f=e.length;e=e.toLowerCase();for(a=0;a<s;a++)o=t[a].toLowerCase(),u=o.length,f&&i<=u&&(n?e.indexOf(o):o.indexOf(e))===0&&(r=a,i=u);return r},_getCalendarDate:function(t,r){var i;return e.Object.isEmpty(t)?!1:(r=r||new Date,i=r.getDate(),n.isValue(t.year)&&r.setFullYear(t.year),r.setDate(1),n.isValue(t.month)&&r.setMonth(t.month),n.isValue(t.day)?r.setDate(t.day):r.setDate(i),n.isValue(t.hours)&&(t.isoTime||(t.ampm?t.hours<12&&(t.hours+=12):t.hours===12&&(t.hours=0)),r.setHours(t.hours)),n.isValue(t.minutes)&&r.setMinutes(t.minutes),n.isValue(t.seconds)&&r.setSeconds(t.seconds),n.isValue(t.tz),r)},_getNextValue:function(e,t,n,r){var i=e.length,s,o="";while(t[0]<i&&e.charAt(t)===n)t[0]++;while(t[0]<i){s=e.charAt(t);if(r&&!/\d/.test(s))break;if(t[0]<i&&n===s)break;o+=s,t[0]++}return o},_getNextNumericValue:function(e,t){var n=this;return n._getNextValue(e,t,null,!0)},_getPatternHints:function(e){switch(e){case"a":case"A":case"d":case"e":return o.HINTS.DAY;case"b":case"B":case"m":return o.HINTS.MONTH;case"H":case"I":case"k":case"l":return o.HINTS.HOURS;case"M":return o.HINTS.MINUTES;case"p":case"P":return o.HINTS.AMPM;case"S":return o.HINTS.SECONDS;case"c":case"C":case"D":case"F":case"h":case"n":case"r":case"R":case"T":case"x":case"X":return o.HINTS.AGGREGATES;case"y":case"Y":return o.HINTS.YEAR;case"z":case"Z":return o.HINTS.TZ;default:return!1}},_getLangResource:function(t){return e.Intl.get("datatype-date-format",t)},_subparseNumericBlob:function(e,t,n){var i=this,s=e.length,o=i.compiled,u=0,a,f=0,l=0;while((a=o[n++])&&a.sequence&&a.numeric)l++,f+=a.hints.size;return u=Math.round(f/l),t[0]-=s,e=r.padNumber(e,f),t[0]-=f-s,t[0]+=u,e.substring(0,u)},_subparseStringBlob:function(e,t,n){var r=this,i=r.compiled,s=-1,o,u;t[0]-=e.length;while((u=i[n++])&&u.sequence&&!u.numeric){o=r._getLangResource(u.token);if(!o)continue;s=r._findBestStringMatch(e,o,!0);if(s>-1)break}return s>-1&&(e=o[s],t[0]+=e.length),e},_subparseTimeZone:function(e,t){var n,r;return e=e.substring(t[0]),n=/\b[A-Z]{3}([+\-\s])?(\d{1,2})?:?(\d{1,2})?/.exec(e),n&&(r=n[0],t[0]+=e.indexOf(r)+r.length),r}}),o.HINTS={AGGREGATES:{aggregates:!0},AMPM:{setter:function(e,t){var n=this,r=n._findBestStringMatch(t.toLowerCase(),n._getLangResource("P"));r>-1&&(e.ampm=r)}},YEAR:{numericTokens:"yY",setter:function(e,t,r){var s=i(t);r.token==="y"&&n.isValue(s)&&(s+=s<0?-o.TWO_DIGIT_YEAR_BASE:+o.TWO_DIGIT_YEAR_BASE),n.isNumber(s)&&(e.year=s)},size:4},MONTH:{numericTokens:"m",setter:function(e,t){var r=this,i=parseInt(t,10);n.isNumber(i)?i-=1:i=r._findBestStringMatch(t,r._getLangResource("B")),n.isNumber(i)&&i>-1&&(e.month=i)},size:2},DAY:{numericTokens:"de",setter:function(e,t){t=i(t),n.isNumber(t)&&(e.day=t)},size:2},HOURS:{numericTokens:"HIkl",setter:function(e,t,n){e.hours=i(t),e.isoTime=!1;if(n.token==="H"||n.token==="k")e.isoTime=!0},size:2},MINUTES:{numericTokens:"M",setter:function(e,t){t=i(t),n.isNumber(t)&&(e.minutes=t)},size:2},SECONDS:{numericTokens:"S",setter:function(e,t){t=i(t),n.isNumber(t)&&(e.seconds=t)},size:2},TZ:{setter:function(e,t){e.tz=t}}},e.DateParser=o,e.Date.dateparser=new e.DateParser;var u=e.Date.parse;e.Date.parse=function(t,n,r){return arguments.length===1?u(arguments[0]):(e.Date.dateparser.compilePattern(t),e.Date.dateparser.parse(n,r))},e.Parsers.date=e.Date.parse},"2.0.0",{requires:["aui-base-lang","datatype-date-format","datatype-date-parse","intl"]});
