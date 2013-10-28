define('callback', function(require, exports, module) {
    module.exports = Callbacks;

    function Callbacks() {
        if (!(this instanceof Callbacks)) {
            return new Callbacks();
        }

        this.callbacks = [];
    }

    _.extend(Callbacks.prototype, {
        add: function(cb) {
            if (_.isArray(cb)) {
                this.callbacks = this.callbacks.concat(cb);
            } else {
                this.callbacks.push(cb);
            }
            return this;
        },
        fired: false,
        fire: function() {
            var args = arguments;
            _.each(this.callbacks, function(cb) {
                cb.apply(null, args);
            });
            this.fired = true;
            return this
        },
        fireWith: function() {
            var args = _.toArray(arguments);
            _.each(this.callbacks, function(cb) {
                cb.apply(args.shift(), args);
            });
            this.fired = true;
            return this;
        },
        empty: function() {
            this.callbacks = [];
            return this;
        },
        has: function(cb) {
            for (var i = 0, l = this.callbacks.length; i < l; ++i) {
                if (this.callbacks[i] === cb) {
                    return true;
                }
            }
            return false;
        },
        remove: function(cb) {
            for (var i = 0, l = this.callbacks.length; i < l; ++i) {
                if (this.callbacks[i] === cb) {
                    this.callbacks.splice(i, 1);
                    break;
                }
            }

            return this;
        }
    });
});
