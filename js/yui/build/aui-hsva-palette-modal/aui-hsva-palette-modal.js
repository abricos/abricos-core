YUI.add('aui-hsva-palette-modal', function (A, NAME) {

/**
 * The Color Picker Component
 *
 * @module aui-color-picker
 * @submodule aui-hsv-palette-modal
 */

var AArray = A.Array,
    AWidget = A.Widget,
    Lang = A.Lang,

    getClassName = A.getClassName,

    CSS_HSV_PALETTE_MODAL = getClassName('hsv-palette-modal'),

    NAME = 'hsv-palette-modal',

    EMPTY = '',

    /**
     * A base class for `HSVAPaletteModal`.
     *
     * @class A.HSVAPaletteModal
     * @extends A.Modal
     * @param {Object} config Object literal specifying widget configuration
     *     properties.
     * @constructor
     */
    HSVAPaletteModal = A.Base.create(NAME, A.Modal, [A.WidgetCssClass, A.WidgetToggle], {

        /**
         * Construction logic executed during `HSVAPaletteModal` instantiation.
         * Lifecycle.
         *
         * @method initializer
         * @protected
         */
        initializer: function() {
            var instance = this;

            instance.after('render', instance._renderHSVAPalette, instance);

            instance.on('selectedChange', instance._onSelectionChange, instance);
        },

        /**
         * Returns the currently selected value of the `HSVPalette`.
         *
         * @method _getSelected
         * @return {String} selected hex color value
         * @protected
         */
        _getSelected: function() {
            var instance = this;

            return instance._hsvPalette.get('selected');
        },

        /**
         * Sets selected value of the `HSVPalette`.
         *
         * @method _onSelectionChange
         * @param {EventFacade} event
         * @protected
         */
        _onSelectionChange: function(event) {
            var instance = this;

            if (event.src !== AWidget.UI_SRC) {
                instance._hsvPalette.set('selected', event.newVal);
            }
        },

        /**
         * Renders the `HSVPalette`.
         *
         * @method _renderHSVAPalette
         * @protected
         */
        _renderHSVAPalette: function() {
            var instance = this,
                body,
                contentBox,
                hsvClass,
                hsvOptions,
                useAlpha;

            contentBox = instance.get('contentBox');

            hsvOptions = instance.get('hsv');

            useAlpha = hsvOptions.alpha;

            hsvClass = A.HSVPalette;

            if (useAlpha) {
                hsvClass = A.HSVAPalette;
            }

            contentBox.addClass(CSS_HSV_PALETTE_MODAL);

            body = instance.getStdModNode(A.WidgetStdMod.BODY);

            instance._hsvPalette = new hsvClass(hsvOptions).render(body);

            if (instance.get('centered')) {
                instance.align();
            }

            instance._hsvPalette.after(
                'selectedChange',
                function(event) {
                    instance.set('selected', event.newVal, {
                        src: AWidget.UI_SRC
                    });
                }
            );
        }
    }, {

        /**
         * Static property used to define the default attribute
         * configuration for the `HSVAPaletteModal`.
         *
         * @property ATTRS
         * @type {Object}
         * @static
         */
        ATTRS: {

            /**
             * Configuration options for the `HSVPalette`.
             *
             * @attribute hsv
             * @type {Object}
             */
            hsv: {
                validator: Lang.isObject,
                value: {
                    alpha: false
                }
            },

            /**
             * Currently `selected` color value.
             *
             * @attribute selected
             * @default ''
             * @type {String}
             */
            selected: {
                getter: '_getSelected',
                validator: Lang.isString,
                value: EMPTY
            }
        },

        /**
         * Static property provides a string to identify the CSS prefix.
         *
         * @property CSS_PREFIX
         * @type {String}
         * @static
         */
        CSS_PREFIX: getClassName(NAME),

        /**
         * Static property provides a string to identify the class.
         *
         * @property NAME
         * @type {String}
         * @static
         */
        NAME: NAME,

        /**
         * The namespace of the plugin.
         *
         * @property NS
         * @type {String}
         * @static
         */
        NS: NAME
    });

A.HSVAPaletteModal = HSVAPaletteModal;


}, '2.0.0', {"requires": ["aui-hsva-palette", "aui-modal"], "skinnable": true});
