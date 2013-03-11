define('mask', function(require, exports, module) {
    'use strict';

    var _ = M.underscore,
        E = M.event,
        $ = M.dom,
        U = M.util;

    module.exports = function(config) {
        var defaultConfig = {
            id: 'brick-mask',
            zIndex: 100,
            root: document.body
        };
        config = _.extend(defaultConfig, config);

        var mask = document.getElementById(config.id);

        if (!mask) {
            mask = $.create('<div id="' + config.id + '" class="tst-02-all"></div>');
        }

        /**
         * 设置mask的z-index值
         */
        this.setZIndex = function(num) {
            if (_.isNaN(num)) return;

            config.zIndex = num;

            mask.style.zIndex = num;
        };
        /**
         * 显示mask
         */
        this.show = function() {
            if ($('#' + config.id).length) {
                return;
            }

            $.append(document.body, mask);

            this.setZIndex(config.zIndex);

            // IE6、7针对不支持position:fixed的情况
            if ($.css(mask, 'position') == 'absolute') {
                mask.style.height = U.getViewportHeight() + 'px';
                onScroll();
                E.on(window, 'scroll', onScroll);
                E.on(window, 'resize', onResize);
            }
        };
        /**
         * 隐藏mask
         */
        this.hide = function() {
            if ($.css(mask, 'position') == 'absolute') {
                E.off(window, 'scroll', onScroll);
                E.off(window, 'resize', onResize);
            }

            $(mask).remove();
        };

        function onScroll() {
            mask.style.top = U.getScrollTop();
            mask.style.left = U.getScrollLeft();
        }
        function onResize() {
            // 防止resize时底部留空白
            mask.style.height = U.getViewportHeight() + 'px';
        }
    }
});
