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
        addEvent = function(node, type, callback) {
            node.attachEvent('on' + type, callback);
        };
        removeEvent = function(node, type, callback) {
            node.detachEvent('on' + type, callback);
        };
    } else {
        console.error('do not support addEventListener or attachEvent');
        /*addEvent = function(node, type, callback) {
            node['on' + type] = callback;
        };
        removeEvent = function(node, type, callback) {
            node['on' + type] = null;
        };*/
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