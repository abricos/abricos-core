YUI.add("widget-skin",function(e,t){var n="boundingBox",r="contentBox",i="skin",s=e.ClassNameManager.getClassName;e.Widget.prototype.getSkinName=function(e){var t=this.get(r)||this.get(n),o,u;return e=e||s(i,""),u=new RegExp("\\b"+e+"(\\S+)"),t&&t.ancestor(function(e){return o=e.get("className").match(u),o}),o?o[1]:null}},"release-v3.14.0",{requires:["widget-base"]});
