/**
 * TODO List
 * 1、 创建一个对象池保存display:block的浮层，可用于还有浮层没有hide的时候不隐藏mask
 *      同时去除hide函数中第三个用来控制mask是否隐藏的参数，注意要修改sign-pops模块
 */
define('pop', function(require, exports, module) {
    'use strict';

    var _ = M.underscore,
        $ = M.dom,
        Mask = M.mask,
        hasOwn = Object.prototype.hasOwnProperty,
        E = M.event,
        popId = 0,
        
        // 页面上可见pop的对象池
        visiblePopPool = {};

    var mask = new Mask();

    module.exports = Pop;

    function Pop(option, tpls) {
        var _this = this,
            // custom configuration
            config = {option: option, tpls: tpls},
            // default configuration
            defaultConfig = {
                option: {
                    title: '',              // pop's title
                    id: 'pop-' + (popId++), // wrapper's id
                    wrapperClass: '',       // wrapper's classname
                    root: document.body,    // the node that pop append to
                    hasHeader: true,        // trigger to render the header
                    hasFooter: true,        // trigger to render the footer
                    draggable: false,       // if the pop draggable TODO
                    body: '',               // body content
                    buttons: [              // if given, the default will be override
                        {
                            text: '确定',
                            click: function(e) {
                                E.preventDefault(e);
                                _this.hide();
                            }
                        }
                    ],
                    before: null,           // call before init
                    after: null             // call after init
                },
                tpls: {
                    header: '<div class="pop-header"><h4><%= title %></h4><a class="pop-cls" href="javascript:void(0)"></a></div>',
                    body: '<div class="pop-body"><%= body %></div>',
                    footer: '<div class="pop-footer"><div class="btns"><%= buttons %></div></div>',
                    button: '<a class="ib footer-btn <%= className %>" href="javascript:void(0)"><%= text %></a>',
                    wrapper: '<div class="pop <%= wrapperClass %>" id="<%= wrapperId %>"><%= content %></div>'
                }
            };

        // extend from default configuration
        // do not override, then you can reuse it
        config = initConfig(defaultConfig, config);

        var stepConfigs = [],   // store every step's config
            stepTpls = [],      // store every step's content template
            stepCount = 0,      // flag the current step
            popTpl = '',
            MOUSE_EVENT = ['click', 'mouseup', 'mousedown', 'mouseover', 'mousemove', 'mouseout'],
            data = {};          // data object,sharing datas beyong steps

        this.pop = null;
        this.init = function() {
            var option = config.option,
                step;
            if (option.before && !option.before()) {
                return;
            }
            if (option.enableSteps) {
                // switch option to the first step's option
                option = stepConfigs[0].option;
                for (var i = 0, l = stepConfigs.length; i < l; ++i) {
                    stepTpls.push(render(stepConfigs[i]));
                }
                // Show the first step
                stepCount = 0;
                step = stepTpls[stepCount];
            } else {
                step = render(config);
            }

            var pagePop = $('#' + option.id);
            if (pagePop.length) {
                pagePop.remove();
            }

            popTpl = _.template(config.tpls.wrapper)({
                wrapperClass: option.wrapperClass || '',
                wrapperId: option.id,
                content: step
            });

            // append the pop to `config.root`
            this.pop = $.create(popTpl);
            $.append(config.option.root, this.pop);

            option.hasFooter && addBtnEvent(option.buttons);

            // delegate to the element that has `.pop-cls` to close the pop
            $(this.pop).delegate('.pop-cls, .footer-btn', 'click', function(e) {
                // prevent trigger the `onbeforeunload` event
                E.preventDefault(e);
                if ($.hasClass(this, 'pop-cls')) {
                    _this.hide();
                }
            });

            // if draggable, add the drag effact
            if (option.draggable) {
                drag($('.pop-header', this.pop), this.pop);
            }

            addStepClass();
            option.after && option.after();
        };

        function initConfig(srcConf, desConf) {
            if (desConf) {
                desConf.option = (desConf.option ? _.extend(_.clone(srcConf.option), desConf.option) : srcConf.option);
                desConf.tpls = (desConf.tpls ? _.extend(_.clone(srcConf.tpls), desConf.tpls) : srcConf.tpls);
            } else {
                desConf = { option: _.clone(srcConf.option), tpls: _.clone(srcConf.tpls) };
            }
            return desConf;
        }

        function render(config) {
            var tpls = config.tpls,
                option = config.option;

            return ((option.hasHeader ? compileHeader() : '') +
                    compileBody() +
                    (option.hasFooter ? compileFooter() : ''));

            function compileHeader() {
                return _.template(tpls.header)({
                    title: option.title
                });
            }

            function compileBody() {
                return _.template(tpls.body)({
                    body: option.body
                });
            }

            function compileFooter() {
                return _.template(tpls.footer)({
                    buttons: compileBtn()
                });
            }

            function compileBtn() {
                var compile = _.template(tpls.button),
                    output = '',
                    buttons = option.buttons;
                for (var i = 0, l = buttons.length; i < l; ++i) {
                    output += compile({
                        text: buttons[i]['text'],
                        // each btn has its own btn[id] class
                        className: (buttons[i]['className'] || '') + ' btn' + i
                    });
                }
                return output;
            }
        }

        function addBtnEvent(btnConfigs) {
            var btn, config;
            for (var i = 0, l = btnConfigs.length; i < l; ++i) {
                btn = $('.btn' + i, _this.pop);
                config = btnConfigs[i];
                _.each(MOUSE_EVENT, function(evt) {
                    if (evt in config) {
                        if (hasOwn.call(config, evt)) {
                            btn.on(evt, config[evt]);
                        }
                    }
                });
            }
        }

        /**
         * Override the default templates
         * It should be called before calling the `init` function
         * @param {Object} temps the templates prefer to used
         */
        this.setTpls = function(temps) {
            _.extend(config.tpls, temps);
        };
        
        this.setOpts = function(opts) {
            _.extend(config.option, opts);
        };

        if (config.option.enableSteps) {
            this.addStep = function(option, tpls) {
                var stepConfig = {option: option, tpls: tpls};
                // use the main config(not the default config) as the base config
                stepConfigs.push(initConfig(config, stepConfig));
            };
            this.nextStep = function(callback) {
                _this.toStep(stepCount + 1, callback);
            };
            this.previousStep = function(callback) {
                _this.toStep(stepCount - 1, callback);
            };
            /**
             * 将分步浮层跳到某一步。0为第一步
             * @param {Number} index 要跳到的步数
             * @param {Function} callback 允许在跳到该步骤后进行回调
             */
            this.toStep = function(index, callback) {
                if (index >= stepConfigs.length || index < 0) return;
                var option = stepConfigs[index].option;
                if (option.before && !option.before()) {
                    return;
                }
                stepCount = index;
                _this.pop.innerHTML = stepTpls[stepCount];
                option.hasFooter && addBtnEvent(option.buttons);
                addStepClass();

                option.after && option.after();
                callback && callback();
            };
        }
        function addStepClass() {
            var body;
            if (_this.pop) {
                body = $('.pop-body', _this.pop);
                if (body) {
                    if (~body[0].className.indexOf('step')) {
                        body[0].className = body[0].className.replace(/pop-step-\d/, 'pop-step-' + stepCount);
                    } else {
                        body[0].className = body[0].className + ' pop-step-' + stepCount;
                    }
                }
            }
        }

        /**
         * simple data model
         * sharing data between steps
         */
        this.set = function(key, value) {
            data[key] = value;
        };
        this.get = function(key) {
            return data[key];
        };

    };

    /**
     * show the pop widget
     * @param {Function} callback if given,invoke it before showing the pop
     *                          if return `false`,the pop will not show
     */
    Pop.prototype.show = function(before, after, showMask) {
        // if not initialized
        if (!this.pop) {
            this.init();
        }
        if (!before || (before() !== false)) {
            this.pop.style.display = 'block';
            showMask !== false && mask.show();
        }
        after && after();
    };

    /**
     * hide the pop widget
     * @param {Function} callback if given,invoke it before hidding the pop
     *                          if return `false`,the pop will not hide
     */
    Pop.prototype.hide = function(before, after, hideMask) {
        if (!before || (before() !== false)) {
            this.pop.style.display = 'none';
            hideMask !== false && mask.hide();
        }
        after && after();
    };

    /**
     * set or get the value of zIndex
     * @param {Number} value the `zIndex` attribute should be
     */
    Pop.prototype.zIndex = function(value) {
        if (this.pop && value && _.isNumber(+value) && !_.isNaN(+value)) {
            $(this.pop).css('zIndex', value);
            return this;
        } else {
            return $(this.pop).css('zIndex');;
        }
    };

    // drag the trigger then the target will move
    function drag(trigger, target) {
        var doc = $(document),
            target = $(target),
            trigger = $(trigger),
            startX, startY,
            targetOffset;
        trigger.css('cursor', 'move');
        trigger.on('mousedown', function(e) {
            startX = e.clientX;
            startY = e.clientY;
            targetOffset = target.position();
            document.onselectstart = function() {return false;};
            document.ondragstart = function() {return false;};
            doc.on('mousemove', moveHandler);
            doc.on('mouseup', upHandler);
        });
        function moveHandler(e) {
            E.stopPropagation(e);
            target.css({
                left: targetOffset.left + (e.clientX - startX) + 'px',
                top: targetOffset.top + (e.clientY - startY) + 'px'
            });
        }
        function upHandler(e) {
            E.stopPropagation(e);
            document.onselectstart = function() {return true;};
            document.ondragstart = function() {return true;};
            doc.off('mousemove', moveHandler);
            doc.off('mouseup', upHandler);
        }
    }

});