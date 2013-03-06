define('dom', function(require, exports, module) {
    'use strict';

    var $ = M.sizzle,
        _ = M.underscore,
        E = M.event;

    // Borrow from JQuery
	// We have to close these tags to support XHTML (#13200)
	var rTagName = /<([\w:]+)/,
        wrapMap = {

            // Support: IE 9
            option: [ 1, "<select multiple='multiple'>", "</select>" ],

            thead: [ 1, "<table>", "</table>" ],
            tr: [ 2, "<table><tbody>", "</tbody></table>" ],
            td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

            _default: [ 0, "", "" ]
        };

    // Support: IE 9
    wrapMap.optgroup = wrapMap.option;

    wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.col = wrapMap.thead;
    wrapMap.th = wrapMap.td;

    /**
     * 获得节点的ComputedStyle
     * TODO 有些属性在不同浏览器下获得的值不同，例如IE6/7中，width值
     *      如果没有设置则有可能返回`auto`，此时需要用clientWidth。
     */
    var getComputedStyle;
    // 对于IE，优先使用currentStyle来获得computedStyle
    if (document.body.currentStyle) {
        getComputedStyle = function(node) {
            return node.currentStyle;
        };
    } else if (window.getComputedStyle) {
        getComputedStyle = function(node) {
            return window.getComputedStyle(node, null);
        };
    }

    var common = {
        /**
         * 判断parentNode是否包含childNode
         * 注：parentNode == childNode时返回false
         * @param {Element} parentNode
         * @param {Element} childNode
         */
        contains: function(parentNode, childNode) {
            return parentNode.contains ?
                parentNode != childNode && parentNode.contains(childNode) :
                    !!(parentNode.compareDocumentPosition(childNode) & 16);
        },
        /**
         * 将节点插入父节点末尾
         */
        append: function(parent, node) {
            parent.appendChild(node);
            return this;
        },
        /**
         * 将节点插入父节点首部
         */
        prepend: function(parent, node) {
            if (parent.childNodes.length) {
                parent.insertBefore(node, parent.childNodes[0]);
            } else {
                this.append(parent, node);
            }
            return this;
        },
        /**
         * 将节点插入到目标节点之前
         */
        before: function(target, newEl) {
            target.parentNode.insertBefore(newEl, target);
            return this;
        },
        /**
         * 将节点插入到目标节点之后
         */
        after: function(target, newEl) {
            var parent = target.parentNode;
            if (parent.lastChild === target) {
                parent.appendChild(newEl);
            } else {
                parent.insertBefore(newEl, target.nextSibling);
            }
            return this;
        },
        /**
         * 使用传入的HTML代码创建Node节点并返回
         * 若HTML代码包含多个根节点，只返回第一个根节点及其下节点
         * @param {String} tpl 转化为Node节点的HTML代码
         * @param {Boolean} wrapped 是否返回包装对象
         */
        create: function(tpl, wrapped) {
            var tmpNode,
                tag, wrapper,
                fragment = document.createDocumentFragment();

            // 直接传进来元素名
            if (/^\w+$/.exec(tpl)) {
                return document.createElement(tpl);
            }

            tag = (rTagName.exec(tpl) || ['', ''])[1].toLowerCase();
            // 根据要创建节点的根节点来判断是否需要使用额外元素进行包装
            // Tabular元素都需要进行包装
            // 例如：<tbody></tbody> 要用<table></table>包装起来
            wrapper = wrapMap[tag] || wrapMap._default;

            tmpNode = fragment.appendChild(document.createElement('div'));

            // TODO jQuery中，对tpl中元素为自闭合元素进行了额外处理
            tmpNode.innerHTML = wrapper[1] + tpl + wrapper[2];

            // 降级获得正确的节点
            var j = wrapper[0];
            while(j) {
                tmpNode = tmpNode.firstChild;
                j--;
            }

            tmpNode = tmpNode.childNodes[0].cloneNode(true);

            return wrapped ? DOM(tmpNode) : tmpNode;
        },
        /**
         * 删除节点
         * @param {Element} node
         */
        remove: function(node) {
            if (node && node.nodeType === 1) {
                node.parentNode.removeChild(node);
            }
            return node;
        },
        /**
         * 替换节点
         * @param {Element} newNode
         * @param {Element} oldNode
         */
        replace: function(newNode, oldNode) {
            return oldNode.parentNode.replaceChild(newNode, oldNode);
        },
        /**
         * 显示元素
         * @param {Elmement} node
         */
        show: function(node) {
            if (node && node.nodeType === 1) {
                node.style.display = 'block';
            }
            return this;
        },
        /**
         * 隐藏元素
         * @param {Element} node
         */
        hide: function(node) {
            if (node && node.nodeType === 1) {
                node.style.display = 'none';
            }
            return this;
        },
        visibility: function(node, trigger) {
            var VISIBLE = 'vvisible',
                HIDDEN = 'vhidden';
            if (trigger) {
                common.removeClass(node, HIDDEN).addClass(node, VISIBLE);
            } else {
                common.removeClass(node, VISIBLE).addClass(node, HIDDEN);
            }
        },
        isShow: function(node) {
            return common.css(node, 'display') === 'block';
        },
        /**
         * 获得父节点。若不传入selector，则直接返回第一个父节点
         * 若传入selector，则逐级向上寻找第一个符合selector的父节点
         * @param {Element} node 子节点
         * @param {String} selector 父节点需要符合的selector
         * @return {Element}
         */
        parent: function(node, selector) {
            var p = node.parentNode;
            if (typeof selector == 'undefined') {
                return node.parentNode;
            }
            while(p) {
                if ($.matchesSelector(p, selector)) {
                    break;
                }
                p = p.parentNode;
            }
            return p;
        },
        /**
         * 获得子节点。若不传入selector，则直接返回childNodes组成的数组（只包含Element节点）
         * 若传入selector，则返回符合selector的所有子节点组成的数组
         * @param {Element} node 子节点
         * @param {String} selector 父节点需要符合的selector
         * @return {Array}
         */
        children: function(node, selector) {
            var arr = [];
            if (typeof selector == 'undefined') {
                var cn = node.childNodes;
                _.each(cn, function(item) {
                    // 剔除text节点、comment等
                    if (item.nodeType == 1) {
                        arr.push(item);
                    }
                });
                return arr;
            }
            return $(selector, node);
        },
        /**
         * 设置节点属性
         */
        attr: function(node, key, val) {
            if (node.nodeType == 1 || node.nodeType == 9 || node.nodeType == 11) {
                if (val) {
                    node.setAttribute(key, val);
                    return this;
                } else {
                    return node.getAttribute(key);
                }
            }
        },
        /**
         * css(node) 获取node的computedStyle
         * css(node, attr) 获取node的attr样式值
         * css(node, attr, value) 设置node的attr样式值
         * css(node, { attr: value, ... }) 设置多个node的样式值
         */
        css: function(node, attr, value) {
            var styles = getComputedStyle(node);
            if (arguments.length == 1) {
                return styles;
            }
            if (typeof value != 'undefined') {
                node.style[attr] = value;
                return this;
            } else if (typeof attr == 'object') {
                _.each(attr, function(value, key) {
                    node.style[key] = value;
                });
                return this;
            } else {
                return styles[attr];
            }
        },
        /**
         * 判断是否含有某个class
         */
        hasClass: function(node, className) {
            if (!~className.indexOf('.')) {
                className = '.' + className;
            }
            return $.matchesSelector(node, className);
        },
        /**
         * 替换className中的某[几]个[相邻]class
         * 若不存在要替换的class，则添加新class
         */
        replaceClass: function(node, className, newClassName) {
            common.removeClass(node, className).addClass(node, newClassName);
            return this;
        },
        /**
         * 移除某[几]个class
         */
        removeClass: function(node, className) {
            var reg,
                fullClass = node.className,
                classes = className.split(/\s+/);
            _.each(classes, function(className) {
                // 对应四种情况：'a', 'a b', 'b a', 'b a c'
                // 如果要remove的class有重复，将一并去掉
                reg = new RegExp(' ' + className + ' |' + '^' + className + '$|' + ' ' + className + '$|' + '^' + className + ' ', 'g');
                fullClass = fullClass.replace(reg, ' ');
            });

            node.className = fullClass;
            return this;
        },
        /**
         * 添加class
         */
        addClass: function(node, className) {
            var classes = className.split(/\s+/);
            _.each(classes, function(className) {
                if (!common.hasClass(node, className)) {
                    node.className = node.className + ' ' + className;
                }
            });
            return this;
        },
        /**
         * 获得某个节点相对于其已定位父节点的位置
         * Copy from jQuery(v1.9.0 pre)
         * TODO
         */
        position: function(node) {
            if (!node) {
                return;
            }

            var offsetParent, offset,
                parentOffset = { top: 0, left: 0 },
                elem = node,
                elemStyle;

            elemStyle = common.css(elem);
            // fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is it's only offset parent
            if (elemStyle.position === 'fixed') {
                // we assume that getBoundingClientRect is available when computed position is fixed
                offset = elem.getBoundingClientRect();
            } else {
                // Get *real* offsetParent
                offsetParent = common.offsetParent(node);

                // Get correct offsets
                offset = this.offset(node);
                if (!(offsetParent.nodeName == 'html')) {
                    parentOffset = common.offset(offsetParent);
                }

                // Add offsetParent borders
                parentOffset.top += parseFloat(common.css(offsetParent, 'borderTopWidth')) || 0;
                parentOffset.left += parseFloat(common.css(offsetParent, 'borderLeftWidth')) || 0;
            }

            // Subtract parent offsets and element margins
            // note: when an element has margin: auto the offsetLeft and marginLeft
            // are the same in Safari causing offset.left to incorrectly be 0
            return {
                top: offset.top - parentOffset.top - (parseFloat(elemStyle.marginTop) || 0),
                left: offset.left - parentOffset.left - (parseFloat(elemStyle.marginLeft) || 0)
            };
        },
        /**
         * 获得已定位的父节点
         */
        offsetParent: function(node) {
            var offsetParent = node.offsetParent || document.documentElement;
            while (offsetParent && (!(offsetParent.nodeName == 'html') && this.css(offsetParent, 'position' === 'static'))) {
                offsetParent = offsetParent.offsetParent;
            }
            return offsetParent || document.documentElement;
        },
        /**
         * 获得页面坐标
         */
        offset: function(node) {
            var docElem, win,
                box = { top: 0, left: 0 },
                elem = node,
                doc = elem && elem.ownerDocument;

            if (!doc) {
                return;
            }

            docElem = doc.documentElement;

            // Make sure it's not a disconnected DOM node
            if (!this.contains(docElem, elem)) {
                return box;
            }

            // If we don't have gBCR, just use 0,0 rather than error
            // BlackBerry 5, iOS 3 (original iPhone)
            if (typeof elem.getBoundingClientRect !== 'undefined') {
                box = elem.getBoundingClientRect();
            }
            win = getWindow(doc);
            return {
                top: box.top + (win.pageYOffset || docElem.scrollTop) - (docElem.clientTop || 0),
                left: box.left + (win.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0)
            };
        }
    };

    function getWindow(elem) {
                // isWindow
        return elem != null && elem.window === window ?
            elem :
            elem.nodeType === 9 ?
                elem.defaultView || elem.parentWindow :
                false;
    }

    // 对原生对象进行封装，不修改原生对象
    // 接口以jQuery为参考
    function FakeNodeList(nodeList) {
        // TODO 支持window对象的封装，以重用Event方法。或者不支持window，需要则直接使用event模块？
        if (nodeList.nodeType == 1 || nodeList.nodeType == 9 || nodeList.nodeType == 11 || nodeList === window) {
            this[0] = nodeList;
            this.length = 1;
        } else {
            for (var i = 0, l = nodeList.length; i < l; i++) {
                this[i] = nodeList[i];
            }
            this.length = nodeList.length;
        }
    }

    FakeNodeList.prototype = {
        constructor: FakeNodeList,
        // TODO 添加事件方法 代码太难看
        on: function(type, callback) {
            E.on(this[0], type, callback);
            return this;
        },
        once: function(type, callback) {
            E.once(this[0], type, callback);
            return this;
        },
        off: function(type, callback) {
            E.off(this[0], type, callback);
            return this;
        },
        delegate: function(selector, type, callback) {
            E.delegate(this[0], selector, type, callback);
            return this;
        },
        onAll: function(type, callback) {
            for (var i = 0, l = this.length; i < l; i++) {
                E.on(this[i], type, callback);
            }
            return this;
        },
        // 辅助方法
        /**
         *  获得包装对象
         *  @param {Number} index 要获取的包装对象的序号
         */
        eq: function(index) {
            return new FakeNodeList(this[index]);
        },
        /**
         *  获取或设置首元素的innerHTML
         *  @param {String} content [Optional] 若传入此参数，则将innerHTML设为该值
         */
        html: function(content) {
            if (typeof content != 'undefined') {
                this[0].innerHTML = content;
                return this;
            }
            return this[0].innerHTML;
        },
        /**
         * 显示元素
         */
        show: function() {
            DOM.show(this);
            return this;
        },
        /**
         * 隐藏元素
         */
        hide: function() {
            DOM.hide(this);
            return this;
        },
        isShow: function() {
            return DOM.isShow(this);
        },
        visibility: function(trigger) {
            DOM.visibility(this, trigger);
            return this;
        },
        parent: function(selector) {
            return DOM(DOM.parent(this, selector));
        },
        children: function(selector) {
            return DOM(DOM.children(this, selector));
        },
        contains: function(node) {
            return DOM.contains(this, node);
        },
        append: function(node) {
            DOM.append(this, node);
            return this;
        },
        prepend: function(node) {
            DOM.prepend(this, node);
            return this;
        },
        before: function(node) {
            DOM.before(this, node);
            return this;
        },
        after: function(node) {
            DOM.after(this, node);
            return this;
        },
        remove: function() {
            DOM.remove(this);
            return this;
        },
        removeAll: function() {
            for (var i = 0, l = this.length; i < l; i++) {
                DOM.remove(this[i]);
            }
            return this;
        },
        replace: function(node) {
            DOM.replace(node, this);
            return this;
        },
        attr: function(key, val) {
            return DOM.attr(this, key, val);
        },
        hasClass: function(className) {
            return DOM.hasClass(this, className);
        },
        addClass: function(className) {
            return _.bind(DOM.addClass, this)(this, className);
        },
        removeClass: function(className) {
            return _.bind(DOM.removeClass, this)(this, className);
        },
        replaceClass: function(desClass, newClass) {
            return _.bind(DOM.replaceClass, this)(this, desClass, newClass);
        },
        /**
         * node.css()
         * node.css(styleObj)
         * node.css(attr, value)
         * node.css(attr)
         */
        css: function(attr, value) {
            return _.bind(DOM.css, this)(this, attr, value);
        },
        val: function(str) {
            if (typeof str == 'string' || typeof str == 'number') {
                this[0].value = str;
                return this;
            } else if (!str) {
                return this[0].value;
            }
        },
        focus: function() {
            try {
                this[0].focus();
            } catch (e) {}
            return this;
        },
        position: function() {
            return DOM.position(this);
        },
        offset: function() {
            return DOM.offset(this);
        }
    };

    function DOM(selector, ctx) {
        var nodes;
        if (selector instanceof FakeNodeList) {
            return selector;
        }
        if (typeof selector == 'string') {
            if (ctx instanceof FakeNodeList) {
                ctx = ctx[0];
            }
            nodes = $(selector, ctx);
        } else if (typeof selector == 'object' &&
                   (selector.nodeType == 1 || selector.nodeType == 9 || selector.nodeType == 11)) {
            nodes = selector;
        } else if (_.isArray(selector)) {
            nodes = selector;
        }
        // 返回包装对象
        return new FakeNodeList(nodes);
    }

    // 为DOM扩展common的静态方法
    _.each(common, function(func, funName, collect) {
        DOM[funName] = function() {
            var args = _.toArray(arguments);
            // 对参数进行过滤，将FakeNodeList实例对象都由原生对象代替
            _.each(args, function(arg, index, args) {
                if (arg instanceof FakeNodeList) {
                    args[index] = arg[0];
                }
            });
            return func.apply(this, args);
        };
    });

    module.exports = DOM;
});
