define('fileupload', function(require, exports, module) {
    'use strict';

    var $ = M.dom,
        U = M.util,
        hasFlash = U.flashChecker(),
        FLASH_ID = 0;

    module.exports = FileUploader;

    /**
     * new FileUploader({
     *      [id: String,]       // default: 'fileupload-' + FLASH_ID
     *      [flashUrl: String,] // default: http://mimg.127.net/vip/xm/MailMarketing/swf/MailMarketFileUploader.swf
     *      [isMulti: Boolean,] // default: true
     *      target: HTMLElement,
     *      on: {
     *          selected: Function,
     *          open: Function,
     *          progress: Function,
     *          complete: Function,
     *          loaded: Function,
     *          error: Function
     *      }
     * });
     */
    function FileUploader(option) {
        var state,
            that = this,
            id = option.id || 'fileupload' + FLASH_ID++,
            listenerName = id + 'Listener';

        if (hasFlash) {
            // 若flash已存在，则直接返回
            if ($('#' + id)[0]) return;

            createUploadFlash({
                id: id,
                flashUrl: 'http://mimg.127.net/vip/xm/MailMarketing/swf/MailMarketFileUploader.swf',
                isMulti: option.multi === false ? false : true,
                target: option.target
            });

            this.uploader = $('#' + id)[0];

            this.removeFile = function(srcId) {
                that.uploader.removeFile(srcId);
            };

            this.start = function(fileId, url) {
                that.uploader.startUpload(fileId, url, null, "Filedata");
            };
        
        }

        window[listenerName] = function(oParam) {
            var type = oParam.type,
                on = option.on;
            switch(type){
                case "onSelected":  // 选择好文件后调用
                    // oParam.files
                    on.selected && on.selected(oParam);
                    break;
                case "onOpen":      // 当上载操作开始时调度
                    on.open && on.open(oParam);
                    break;
                case "onProgress":  // 当上载操作开始时调度
                    // oParam.bytesLoaded
                    // oParam.bytesTotal
                    on.progress && on.progress(oParam);
                    break;
                case "onComplete":  // 当上载操作开始时调度
                    on.complete && on.complete(oParam);
                    break;
                case "onCompleteData":  // 成功上载文件并从服务器接收数据之后调度
                    // oParam.data
                    on.loaded && on.loaded(JSON.parse(oParam.data));
                    break;
                case "onHttpError":
                case "onIoError":
                case "onSecurityError":
                    // onIoError, onSecurityError: type, error
                    // onHttpError: type, code
                    on.error && on.error(oParam);
                    break;
                default:
                    //console.log(oParam);
            }
        }

        /**
         * 创建一个flash。主要是在ie7里边需要用鼠标点击才能激活flash，通过动态生成flash的方式可以绕过这一点。
         */
        function createUploadFlash(option){
            //var t = new Date().getTime();&apiMulti=0
            var code,
                rdm = Math.random();
            if(document.all){
                code = [];
                code.push('<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=8,0,0,0" width="100%" height="100%"  id="' + option.id + '" name="' + option.id + '" align="middle" >');
                code.push('<param name="allowScriptAccess" value="always" />');
                code.push('<param name="wmode" value="transparent">');
                code.push('<param name="FlashVars" value="apiHost='+location.host+'&apiMulti=' + (option.isMulti === false ? 0 : 1) + '&apiListener=' + listenerName + '" />');
                // 添加随机数解决IE下无法调用flash提供的接口的问题
                code.push('<param name="movie" value="' + option.flashUrl + '?' + Math.random() + '" />');
                code.push('<param name="quality" value="high" />');
                code.push('</object>');
                code = code.join('');
            }else{
                var code = '<embed src="' + option.flashUrl + '?' + Math.random() + '" wmode="transparent" FlashVars="apiHost='+location.host+'&apiMulti=' + (option.isMulti === false ? 0 : 1) + '&apiListener=' + listenerName + '" id="' + option.id + '" name="' + option.id + '" swLiveConnect=true quality="high" width="100%" height="100%" align="middle" allowScriptAccess="always"  type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" />'
            }
            $(option.target).html(code);
        }
    }

});
