define('util', function(require, exports, module) {
    'use strict';

    var $ = M.dom,
        _ = M._,
        db = document.body,
        de = document.documentElement;

    module.exports = {
        /**
         * 获得可视高度
         */
        getViewportHeight: function(ctx) {
            ctx ? (ctx = ctx.document) : (ctx = document);
            return ctx.documentElement.clientHeight || ctx.body.clientHeight;
        },
        /**
         * 获得上卷的高度
         */
        getScrollTop: function() {
            return de.scrollTop || db.scrollTop;
        },
        /**
         * 获得左卷的宽度
         */
        getScrollLeft: function() {
            return de.scrollLeft || db.scrollLeft;
        },
        /**
         * 获得可视高度加上卷的高度
         */
        getTotalTop: function() {
            return (de.scrollTop || db.scrollTop) + (de.clientHeight || db.clientHeight);
        },
        /**
         * 获得可视宽度加左卷的宽度
         */
        getTotalLeft: function() {
            return (de.scrollLeft || db.scrollLeft) + (de.clientWidth || db.clientWidth);
        },
        /**
         * 获得某个cookie的值
         * @param {String} key 需要获得的cookie的名称
         */
        getCookie: function(key) {
            var search = key + "=",
                offset, end;
            if(document.cookie.length > 0) {
                offset = document.cookie.indexOf(search);
                if(offset != -1) {
                    offset += search.length;
                    end = document.cookie.indexOf(";", offset);
                    if(end == -1) {
                        end = document.cookie.length;
                    }
                    return unescape(document.cookie.substring(offset, end));
                }else{
                    return "";
                }
            }
        },
        /**
         * To format the query and return as Object
         * @return {Object} the query Object
         */
        getQuery: function(search) {
            if (typeof search == 'undefined') {
                search = location.search;
            }

            var query,
                result = {};

            if (search) {
                if (search.charAt(0) == '?') {
                    query = search.substring(1).split('&');
                } else {
                    query = search.split('&');
                }
            }

            if (query) {
                _.each(query, function(item, index) {
                    if (item == '') return;
                    var tmp = item.split('=');
                    result[tmp[0]] = tmp[1];
                });
            }

            return result;
        },
        /**
         * load and append a script element. When loaded finish, the callback function will be invoked
         * @param {String} url the script's url
         * @param {Function} callback called after the script is loaded
         * @param {String} charset specify the script's charset
         */
        getScript: function(url, callback, charset) {
            var script = document.createElement('script');
            script.onload = script.onreadystatechange = function() {
                if (!this.readyState || this.readyState == 'loaded' || this.readyState== 'complete') {
                    if (typeof callback == 'function') {
                        callback();
                    }
                }
            };
            charset && (script.charset = charset);
            script.src = url;
            $('head').append(script);
        },
        /**
         * 限制某个节点的输入内容长度，若超出长度，将只保留最长长度的内容，并调用回调函数
         * @param {Element} node 目标节点
         * @param {Number} length 最大长度
         * @param {Function} callback 超长时调用的回调函数
         */
        setMaxLength: function(node, length, callback) {
            node = $(node);
            node.on('keyup', function() {
                if (node.val().length > length) {
                    node.val(node.val().substring(0, length));
                    if (typeof callback == 'function') {
                        callback();
                    }
                }
            });
        },
        /**
         * Validate the phone number
         * @param {Number} num the phone number to validate
         */
        isValidMobileNumber: function(num) {
            //return /^0?(13[0-9]|15[012356789]|18[02356789]|14[57])[0-9]{8}$/.test(num);
            return /^0?1[3458][0-9]{9}$/.test(num);
        },
        isValidMailAddress: function(addr) {
            return  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(addr);
        },
        /**
         *  判断浏览器是否安装了flash，安装了则返回版本号
         *  若没有版本号，则返回是否安装了flash
         */
        flashChecker: function() {
            var hasFlash = false,       //是否安装了flash
                swf = null,
                flashVersion = null;    //flash版本

            if (document.all) {
                try {
                    swf = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
                    if (swf) {
                        hasFlash = true;
                        flashVersion = swf.GetVariable("$version");
                        flashVersion = parseInt(flashVersion.split(" ")[1].split(",")[0]);
                    }
                } catch(e) {
                    return false;
                }
            } else {
                if (navigator.plugins && navigator.plugins.length > 0) {
                    swf = navigator.plugins["Shockwave Flash"];
                    if (swf) {
                        hasFlash = true;
                        var words = swf.description.split(" ");
                        for (var i = 0; i < words.length; ++i) {
                            if (isNaN(parseInt(words[i]))) continue;
                            flashVersion = parseInt(words[i]);
                        }
                    }
                }
            }
            return flashVersion ? flashVersion : hasFlash;
        },
        /**
         * 显示loading图标，可选参数如下：
         * opt = {
         *      target : ndContainer,
         *      align: center' || 'right' || 'left' || 'none', // default: 'center'
         *      imgSize: 'big' || 'small', // default: 'big'
         *      title: '',
         *      isAppend: true || false // default: true
         * }
         */
        showLoading: function(opt) {
            if (!opt.target) return;

            var imgSize = opt.imgSize == 'small' ? [16, 16] : [32, 32], // 默认为big
                align = opt.align || 'left',
                target = $(opt.target),
                ndLoading = target.children('> .brick-loading'); // 只找第一级子节点

            if (ndLoading.length) {
                ndLoading.remove();
            }

            ndLoading = $.create('<div class="brick-loading"><img src="http://mimg.126.net/vip/fax/img/loading32x32.gif" width="' + imgSize[0] + '" height="' + imgSize[1] + '" alt="' + (opt.title || '') + '" /></div>', true);

            target[opt.isAppend === false ? 'prepend' : 'append'](ndLoading);

            ndLoading.css('height', target[0].clientHeight + 'px');

            var img = ndLoading.children('img');

            switch(align) {
                case 'left':
                    // 啥都不用做
                    break;
                case 'right':
                    ndLoading.css('textAlign', 'right');
                case 'center':
                    img.css({
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        marginLeft: (-imgSize[0] / 2) + 'px',
                        marginTop: (-imgSize[1] / 2) + 'px'
                    });
                    break;
            }

            return ndLoading;
        }
    };
});
