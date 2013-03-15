/*
    json2.js
    2012-10-08

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

define('ajax', function(require, exports, module) {
    var _ = M._;

    /*========================
     * Ajax 相关
     *========================*/
    /**
     * 封装ajax的相关操作
     * ajax({
     *        method: 'get' // default: 'post'
     *      , url: '/example'
     *      , async: false // default: true
     *      , form: form
     *      , useDisabled: true // default: false
     *      , blackList: ['select-one'] // array of `name` attribute
     *      // 不接受的头参见《Javascript权威指南》中文版P489
     *      , requestHeader: {
     *          'Content-Type', 'text/plain'
     *      }
     *      , data: {   // data: 'a=1&b=2'
     *            a: 1
     *          , b: 2
     *      }
     *      , on: {
     *            start: function() {}
     *          , complete: function() {}
     *      }
     *      , arguments: {
     *          start: 'hey'
     *          , complete: [1, 2]
     *      }
     * });
     */
    var ajax = (function(){
        var xhr = createXHR();

        return function (config) {
            config.method = config.method ? config.method.toLowerCase() : 'post';
            _.defaults(config, {
                async: true,
                on: {},
                arguments: {}
            });

            var form = config.form,
                data = form ? serialize(form, config.useDisabled, config.blackList) : '';
            if (config.data) {
                if (_.isObject(config.data)) {
                    config.data = ajax.param(config.data);
                }
                data === '' ? (data = config.data) : (data += '&' + config.data);
            }

            // XHR对象重用小技巧：open放在onreadystatechange事件之前
            // http://keelypavan.blogspot.com/2006/03/reusing-xmlhttprequest-object-in-ie.html
            xhr.open(config.method, config.url, false);//config.async);

            // 对于post请求，都模拟为form请求
            if (form || config.method == 'post') {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            }

            if (config.requestHeader) {
                for (var j in config.requestHeader) {
                    if (_.has(config.requestHeader, j)) {
                        xhr.setRequestHeader(j, config.requestHeader[j]);
                    }
                }
            }
            xhr.onreadystatechange = function() {
                switch (xhr.readyState) {
                    case 1:
                        // TODO 第二次调用才进入处理函数？？？？start函数中使用xhr.abort()将导致Dom Exception
                        config.on.start && config.on.start(xhr, data, config.arguments.start);
                        break;
                    case 2:
                        break;
                    case 3:
                        break;
                    case 4:
                        config.on.complete && config.on.complete(JSON.parse(xhr.responseText), xhr, config.arguments.complete);
                        break;
                }
            };
            xhr.send(data);
        }
    }());

    /**
     * @description 获得XMLHttpRequest对象。
     * 摘自《Javascript高级程序设计》 P444
     */
    function createXHR() {
        if (typeof window.XMLHttpRequest != 'undefined') {
            return new window.XMLHttpRequest();
        } else if (typeof ActiveXObject != 'undefined') {
            if (typeof arguments.callee.activeXString != 'string') {
                var version = ['MSXML2.XMLHttp.6.0', 'MSXML2.XMLHttp.3.0', 'MSXML2.XMLHttp'];
                for (var i = 0, l = version.length; i < l; ++i) {
                    try {
                        var xhr = new ActiveXObject(version[i]);
                        arguments.callee.activeXString = version[i];
                        return xhr;
                    } catch(ex) { }
                }
            }

            return new ActiveXObject(arguments.callee.activeXString);
        } else {
            throw new Error("No XHR object available.");
        }
    }
    /**
     * 对表单进行序列化
     * 修改自《Javascript高级程序设计》 P356
     * @param {Object} form 进行序列号的表单对象
     * @param {Boolean} useDisabled 是否包含`disabled`元素。可选，默认不包含。
     * @param {Array} blackList 表单元素的name数组，存在于该数组的表单元素将不包含进序列化。
     */
    function serialize(form, useDisabled, blackList) {
        var parts = [],
            field = null,
            inBlackList;
        if (form.nodeType !== 1) return '';
        for (var i = 0, l = form.elements.length; i < l; ++i) {
            inBlackList = false;
            field = form.elements[i];
            // 默认不包含disabled的元素
            // 若想包含disabled元素，则设置useDisabled = true
            if (field.disabled && !useDisabled) {
                continue;
            }
            // 若元素名称属于黑名单中，则不包含该元素
            if (blackList && blackList.length > 0) {
                for (var j = 0, k = blackList.length; j < k; ++j) {
                    if (field.name == blackList[j]) {
                        inBlackList = true;
                        break;
                    }
                }
                if (inBlackList) continue;
            }
            switch(field.type) {
                case 'select-one':
                case 'select-multiple':
                    var option = null;
                    for (var j = 0, optLen = field.options.length; j < optLen; ++j) {
                        option = field.options[j];
                        if (option.selected) {
                            var optValue = '';
                            if (option.hasAttribute) {
                                optValue = (option.hasAttribute('value') ?
                                           option.value : option.text);
                            } else {
                                optValue = (option.attributes['value'].specified ?
                                           option.value : option.text);
                            }
                            parts.push(encodeURIComponent(field.name) + '=' +
                                       encodeURIComponent(optValue));
                        }
                    }
                    break;
                case undefined:
                case 'file':
                case 'submit':
                case 'reset':
                case 'button':
                    break;
                case 'radio':
                case 'checkbox':
                    if (!field.checked) {
                        break;
                    }
                default:
                    parts.push(encodeURIComponent(field.name) + '=' +
                               encodeURIComponent(field.value));
            }
        }
        return parts.join('&');
    }

    _.extend(ajax, {
        /**
         * 将对象转化为url参数。数组或函数对象则返回空字符串。
         * @param {Object} obj 字面量对象。不接受数组或函数。
         * @return {String} 只有当obj为字面量对象时，返回序列化的参数。其它返回空字符串。
         */
        param: function(obj) {
            var tmp = [];
            if (_.isString(obj)) return obj;
            if (_.isObject(obj) && !_.isArray(obj) && !_.isFunction(obj)) {
                for (var i in obj) {
                    if (_.has(obj, i)) {
                        tmp.push(i + '=' + obj[i]);
                    }
                }
            }
            return tmp.join('&');
        },
        serialize: serialize,
        getJSON: function(url, data, success) {
            if (typeof data == 'function') {
                success = data;
                data = null;
            }
            ajax({
                url: url
                , data: this.param(data)
                , on: {
                    complete: function(data, xhr) {
                        success(data, xhr); 
                    }
                }
            });
        },
        /**
         * JSONP({
         *      id: 'jsonp-id'          // default: 'brick-jsonp-' + (++suffix)
         *      url: 'http://host/',
         *      callback: function() {},
         *      callbackKey: 'callbackKey',         // defalut: 'callback'
         *      charset: 'utf-8'             // default: ''
         *  })
         *  => <script id="jsonp-id" src="http://host/?callbackKey=jsonpidCallback" charset="utf-8"></script>
         */
        JSONP: (function() {
            var suffix = 0;

            return function(option) {
                if (!option.url) {
                    return;
                }
                // 初始化参数
                !option.id && (option.id = 'brick-jsonp-' + (++suffix));
                !option.callbackKey && (option.callbackKey = 'callback');

                var scriptEl = $('#' + option.id),
                    callbackName = option.id.replace(/-/g, '') + 'Callback',
                    head = document.getElementsByTagName('head')[0];

                if (typeof option.callback == 'function') {
                    window[callbackName] = option.callback;
                }

                // 页面上已存在该script，则移除
                if (scriptEl.length) {
                    scriptEl.remove();
                }

                // 新建script发送JSONP请求
                scriptEl = document.createElement('script');
                scriptEl.id = option.id;
                scriptEl.src = option.url + (option.url.indexOf('?') ? '&' : '?') + option.callbackKey + '=' + callbackName;
                if (option.charset) {
                    scriptEl.charset = option.charset;
                }
                head.insertBefore(scriptEl, head.firstChild);
            };
        })()
    });

    module.exports = ajax;
});
