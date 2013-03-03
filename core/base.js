define('base', function(require, exports, module) {
    var _ = require('underscore');

    _.extend(M, {
        underscore: _,
        ajax: require('ajax'),
        dom: require('dom'),
        event: require('event'),
        util: require('util')
    });
});
