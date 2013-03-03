define('mask', function(require, exports, module) {
    'use strict';

    var _ = M.underscore,
        E = M.event,
        D = M.dom,
        U = M.util;

    module.exports = function(config) {
        var defaultConfig = {
            id: 'brick-mask',
            zIndex: 100,
            root: document.body
        };
        config = _.extend(defaultConfig, config);

        var mask = document.getElementById(config.id);

        /**
         * 设置mask的z-index值
         */
        this.setZIndex = function(num) {
            if (_.isNaN(num)) return;
            mask.style.zIndex = num;
        };
        /**
         * 显示mask
         */
        this.show = function() {
            mask.style.display = 'block';
        };
        /**
         * 隐藏mask
         */
        this.hide = function() {
            mask.style.display = 'none';
        };

        if (!mask) {
            mask = D.create('<div id="' + config.id + '"></div>');
            D.append(document.body, mask);
            this.setZIndex(config.zIndex);
        }

        // IE6、7针对不支持position:fixed的情况
        if (D.css(mask, 'position') == 'absolute') {
            mask.style.height = U.getViewportHeight() + 'px';
            E.on(window, 'scroll', function() {
                mask.style.top = U.getScrollTop();
                mask.style.left = U.getScrollLeft();
            });
            // 防止resize时底部留空白
            E.on(window, 'resize', function() {
                mask.style.height = U.getViewportHeight() + 'px';
            });
        }
    }
});
