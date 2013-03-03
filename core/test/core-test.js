define('dom-test', function(require, exports, module) {
    var $ = require('dom'),
        qunit = $('#qunit');

    qunit.on('click', function() {
        console.log('qunit block: click');
    });

    test('dom.js', function() {
        equal(typeof qunit, 'object', 'dom返回包装过的对象');
        equal(qunit.length, 1, '该对象包含length属性，但不是数组');
        equal(typeof qunit.on, 'function', '该对象原型链中包含事件方法：on');
        equal(typeof $.contain, 'function', 'dom包含静态方法：contain');
    });
});

define('ajax-test', function(require, exports, module) {
    var ajax = require('ajax');

    test('ajax.js', function() {
        equal(ajax.param({a:1, b:2, c:3}), 'a=1&b=2&c=3', 'ajax.param({a:1, b:2, c:3}) => \'a=1&b=2&c=3\'');
        equal(ajax.param([1, 2, 3]), '', 'ajax.param([1, 2, 3]) => \'\'');
    });
});

seajs.use('dom-test');
