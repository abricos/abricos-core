YUI.add("slider-value-range",function(e,t){function o(){this._initSliderValueRange()}var n="min",r="max",i="value",s=Math.round;e.SliderValueRange=e.mix(o,{prototype:{_factor:1,_initSliderValueRange:function(){},_bindValueLogic:function(){this.after({minChange:this._afterMinChange,maxChange:this._afterMaxChange,valueChange:this._afterValueChange})},_syncThumbPosition:function(){this._calculateFactor(),this._setPosition(this.get(i))},_calculateFactor:function(){var e=this.get("length"),t=this.thumb.getStyle(this._key.dim),i=this.get(n),s=this.get(r);e=parseFloat(e)||150,t=parseFloat(t)||15,this._factor=(s-i)/(e-t)},_defThumbMoveFn:function(e){e.source!=="set"&&this.set(i,this._offsetToValue(e.offset))},_offsetToValue:function(e){var t=s(e*this._factor)+this.get(n);return s(this._nearestValue(t))},_valueToOffset:function(e){var t=s((e-this.get(n))/this._factor);return t},getValue:function(){return this.get(i)},setValue:function(e){return this.set(i,e)},_afterMinChange:function(e){this._verifyValue(),this._syncThumbPosition()},_afterMaxChange:function(e){this._verifyValue(),this._syncThumbPosition()},_verifyValue:function(){var e=this.get(i),t=this._nearestValue(e);e!==t&&this.set(i,t)},_afterValueChange:function(e){var t=e.newVal;this._setPosition(t,{source:"set"})},_setPosition:function(e,t){this._uiMoveThumb(this._valueToOffset(e),t),this.thumb.set("aria-valuenow",e),this.thumb.set("aria-valuetext",e)},_validateNewMin:function(t){return e.Lang.isNumber(t)},_validateNewMax:function(t){return e.Lang.isNumber(t)},_setNewValue:function(t){return e.Lang.isNumber(t)?s(this._nearestValue(t)):e.Attribute.INVALID_VALUE},_nearestValue:function(e){var t=this.get(n),i=this.get(r),s;return s=i>t?i:t,t=i>t?t:i,i=s,e<t?t:e>i?i:e}},ATTRS:{min:{value:0,validator:"_validateNewMin"},max:{value:100,validator:"_validateNewMax"},minorStep:{value:1},majorStep:{value:10},value:{value:0,setter:"_setNewValue"}}},!0)},"release-v3.14.0",{requires:["slider-base"]});
