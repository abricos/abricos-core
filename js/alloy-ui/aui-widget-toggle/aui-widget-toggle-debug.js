YUI.add('aui-widget-toggle', function (A, NAME) {

/**
 * Provides standard module support for toggle sivibility method through an
 * extension.
 * @module aui-widget-toggle
 */

var VISIBLE = 'visible';

/**
 * Widget extension, which can be used to add toggle visibility support to the
 * base Widget class, through the [Base.build](Base.html#method_build)
 * method.
 *
 * @class A.WidgetToggle
 * @param {Object} The user configuration object
 */

function WidgetToggle() {}

WidgetToggle.prototype = {
    /**
     * Toggles widget visibility.
     *
     * @method toggle
     * @param {Boolean} visible Force the widget to be visible.
     */
    toggle: function(visible) {
        var instance = this;

        if (!A.Lang.isBoolean(visible)) {
            visible = !instance.get(VISIBLE);
        }

        return instance.set(VISIBLE, visible);
    }
};

A.WidgetToggle = WidgetToggle;


}, '2.0.0');
