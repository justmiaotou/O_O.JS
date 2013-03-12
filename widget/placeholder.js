define('placeholder', function(require, exports, module) {
    'use strict';

    var $ = M.dom,
        _ = M._;

    function Placeholder(input, text) {
        input = $(input);
        var ph = $.create('<span class="placeholder">' + text + '</span>', true);
        input.after(ph);
        if (!input.val()) {
            ph.show();
        }
        ph.on('click', function() {
            input.focus();
        });
        // focus再hide掉placeholder，可防止某些情况下没有click而直接focus了input
        // 例如：tab键focus
        input.on('focus', function() {
            ph.hide();
        });
        input.on('blur', function() {
            if (!input.val()) {
                ph.show();
            }
        });
        setStyle();

        /**
         * 修改提示文案
         */
        this.value = function(value) {
            if (!value) {
                return ph.innerHTML;
            }
            ph.innerHTML = value;
        };

        /**
         * 由于容器`display:none`时无法正确定位，因此提供此方法
         * 在`display != 'none'`时调用可重置位置
         */
        this.reset = function() {
            setStyle();
        };

        this.css = function(styles) {
            ph.css(styles);
        };

        function setStyle() {
            var pos = input.position();

            _.each('Top Right Bottom Left'.split(' '), function(dir) {
                ph.css('padding' + dir, input.css('padding' + dir));
            });

            ph.css({
                position: 'absolute',
                top: pos.top + getCssNum('borderTopWidth') + getCssNum('marginTop') + 'px',
                left: pos.left + getCssNum('borderLeftWidth') + getCssNum('marginLeft') + 'px',
                //width: '100px', //input.width(),
                fontSize: input.css('fontSize'),
                fontFamily: input.css('fontFamily'),
                height: input.css('height'),
                lineHeight: input.css('lineHeight'),
                color: '#AAA',
                cursor: 'text'
            });
        }

        function getCssNum(attr) {
            return +input.css(attr).match(/^\d+/)[0];
        }
    }

    module.exports = Placeholder;
});
