define('event', function(require, exports, module) {
    'use strict';
    var sizzle = M.sizzle;

    var elTester = document.createElement('div'),
        addEvent,
        removeEvent;
    // 通过探测特性来初始化事件函数
    // IE6/7/8在使用node.onclick这种方式添加监听函数时，
    // 只能通过window.event来获得事件对象。只要使用attachEvent
    // 来添加监听函数即可通过参数来获得事件对象
    if (elTester.addEventListener) {
        addEvent = function(node, type, callback) {
            node.addEventListener(type, callback, false);
        };
        removeEvent = function(node, type, callback) {
            node.removeEventListener(type, callback, false);
        };
    } else if (elTester.attachEvent) {
        /**
         * IE6/7/8下，attachEvent和detachEvent的回调函数的作用域为window
         * 为了使作用域为触发节点，可以使用这样的方法：
         *      node.attachEvent(type, function() {
         *          callback.apply(node, arguments);
         *      });
         * 但作为匿名函数，则无法将该回调函数detach
         * 于是这里使用这样数据结构来保存用户定义的回调函数与包装后的回调函数的引用：
         * node[ieEventPatchName] = {
         *      click: {
         *          origin: [callback1, callback2],
         *          wrapped: [wrapped1, wrapped2]
         *      },
         *      mouseup: {
         *          origin: [],
         *          wrapped: []
         *      }
         * }
         * origin与wrapped数组中的对象分别对应用户定义的与包装后的回调函数，且顺序保持一致
         * attach的时候使用的是wrapped函数
         * 这样在detach的时候只要找到origin函数在origin数组中的位置
         * 就能找到wrapped函数在wrapped数组中的位置
         * 从而将wrapped函数detach
         */
        var ieEventPatchName = 'ieEventHandlerContextPatch';
        addEvent = function(node, type, callback) {
            var wrapped = function() {
                // IE6 的callback函数体内，通过this无法引用到node
                // 故这里使用apply来修复
                callback.apply(node, arguments);
            };

            !node[ieEventPatchName] && (node[ieEventPatchName] = {});
            !node[ieEventPatchName][type] && (node[ieEventPatchName][type] = {});
            !node[ieEventPatchName][type]['origin'] && (node[ieEventPatchName][type]['origin'] = []);
            !node[ieEventPatchName][type]['wrapped'] && (node[ieEventPatchName][type]['wrapped'] = []);

            // 保存用户定义callback以及包装函数wrapped，且他们在各自数组中的索引位置是一样的
            node[ieEventPatchName][type]['origin'].push(callback);
            node[ieEventPatchName][type]['wrapped'].push(wrapped);

            node.attachEvent('on' + type, wrapped);
        };
        removeEvent = function(node, type, callback) {
            var patch = node[ieEventPatchName],
                originArr, wrappedArr, index;

            // 没有函数备份说明还未attach这个event，直接返回
            if (!patch || !patch[type] || !patch[type]['origin']) return;

            originArr = patch[type]['origin'];
            wrappedArr = patch[type]['wrapped'];
            for (index = 0, l = originArr.length; index < l; ++index) {
                if (originArr[index] === callback) break;
            }

            // origin数组中找不到callback的引用，说明还没有为这个事件类型attach这个callback
            if (index == originArr.length) return;

            node.detachEvent('on' + type, wrappedArr[index]);

            // detach后将引用删除
            wrappedArr.splice(index, 1);
            originArr.splice(index, 1);
        };
    }

    elTester = null;

    /**
     * 获得事件对象
     * @param {Event} event
     */
    function formatEvent(event) {
        event = event || window.event;
        // 严格模式下不允许为不可编辑对象赋值
        //event.target = event.target || event.srcElement;
        return event;
    }

    /**
     * 获得mouseover、mouseout事件中的关联元素
     * @param {Event} event
     */
    function getRelatedTarget(event) {
        if (event.relatedTarget) {
            return event.relatedTarget;
        } else if (event.toElement) {
            return event.toElement;
        } else if (event.fromElement) {
            return event.fromElement;
        }
    }

    function stopPropagation(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        } else {
            e.cancelBubble = true;
        }
    }

    function preventDefault(e) {
        if (e.preventDefault) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }
    }

    // https://github.com/addyosmani/jquery.parts/blob/master/jquery.documentReady.js
    var ready = (function( window ) {
        "use strict";

        // Define a local copy of $
        var $ = function( callback ) {
                readyBound = false;
                $.isReady = false;
                if ( typeof callback === "function" ) {
                    DOMReadyCallback = callback;
                }
                bindReady();
            },

            // Use the correct document accordingly with window argument (sandbox)
            document = window.document,
            readyBound = false,
            DOMReadyCallback = function() {},

            // The ready event handler
            DOMContentLoaded = function() {
                if ( document.addEventListener ) {
                        document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
                } else {
                        // we're here because readyState !== "loading" in oldIE
                        // which is good enough for us to call the dom ready!
                        document.detachEvent( "onreadystatechange", DOMContentLoaded );
                }
                DOMReady();
            },

            // Handle when the DOM is ready
            DOMReady = function() {
                // Make sure that the DOM is not already loaded
                if ( !$.isReady ) {
                    // Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
                    if ( !document.body ) {
                        return setTimeout( DOMReady, 1 );
                    }
                    // Remember that the DOM is ready
                    $.isReady = true;
                    // If there are functions bound, to execute
                    DOMReadyCallback();
                    // Execute all of them
                }
            }, // /ready()

            bindReady = function() {
                var toplevel = false;

                if ( readyBound ) {
                    return;
                }
                readyBound = true;

                // Catch cases where $ is called after the
                // browser event has already occurred.
                if ( document.readyState !== "loading" ) {
                    DOMReady();
                }

                // Mozilla, Opera and webkit nightlies currently support this event
                if ( document.addEventListener ) {
                    // Use the handy event callback
                    document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );
                    // A fallback to window.onload, that will always work
                    window.addEventListener( "load", DOMContentLoaded, false );
                    // If IE event model is used
                } else if ( document.attachEvent ) {
                    // ensure firing before onload,
                    // maybe late but safe also for iframes
                    document.attachEvent( "onreadystatechange", DOMContentLoaded );
                    // A fallback to window.onload, that will always work
                    window.attachEvent( "onload", DOMContentLoaded );
                    // If IE and not a frame
                    // continually check to see if the document is ready
                    try {
                        toplevel = window.frameElement == null;
                    } catch (e) {}
                    if ( document.documentElement.doScroll && toplevel ) {
                        doScrollCheck();
                    }
                }
            },

            // The DOM ready check for Internet Explorer
            doScrollCheck = function() {
                if ( $.isReady ) {
                    return;
                }
                try {
                    // If IE is used, use the trick by Diego Perini
                    // http://javascript.nwbox.com/IEContentLoaded/
                    document.documentElement.doScroll("left");
                } catch ( error ) {
                    setTimeout( doScrollCheck, 1 );
                    return;
                }
                // and execute any waiting functions
                DOMReady();
            };

        // Is the DOM ready to be used? Set to true once it occurs.
        $.isReady = false;

        // Expose $ to the global object
        //window.$ = $;

        return $;
    })( window );

    module.exports = {
        on: addEvent,
        off: removeEvent,
        once: function(node, type, callback) {
            this.on(node, type, function(e) {
                callback && callback(e);
                removeEvent(node, type, callback);
            });
        },
        fire: function() {

        },
        delegate: function(node, selector, type, callback) {
            var _this = this;
            this.on(node, type, function(e) {
                var target = _this.getTarget(e);
                if (sizzle.matchesSelector(target, selector)) {
                    callback && callback.call(target, e);
                }
            });
        },
        ready: ready,
        getTarget: function(evt) {
            return evt.target || evt.srcElement;
        },
        getRelatedTarget: getRelatedTarget,
        stopPropagation: stopPropagation,
        preventDefault: preventDefault
    };
});
