## 相关模块简要说明

--------------

### core
1. 核心模块，包含以下几个开源项目： 
	- [Sizzle](https://github.com/jquery/sizzle)： CSS选择器引擎。jQuery的选择器功能即由此模块实现。
	- [Underscore.js](https://github.com/documentcloud/underscore)：被广泛使用的基础函数类库，提供了许多常用的函数，为上层开发提供了极大便利。
2. 由于SeaJs遵循的是CMD模块规范，而Sizzle及Underscore.js并没有提供对CMD模块的支持，因此对其expose部分进行了修改以兼容CMD规范。
3. 在以上3个开源项目的基础上自主开发上层框架。目前基本实现的几个核心模块有：
	- dom.js：提供对DOM节点的操作。继承了event模块从而实现了事件在节点上的操作。API设计参考jQuery。
	- event.js：事件支持。
	- ajax.js：ajax支持。
	- util.js：一些帮助函数，例如getCookie、getViewportHeight等。

### widget
1. 在核心模块之上开发的组件们，快速开发的不二利器，帮你打天下的好基友。所有实现均不依赖HTML文档，通过DOM操作实现。样式主要通过CSS定义，以实现多系统的通用性。现有组件如下：
	- mask.js：遮罩浮层。
	- placeholder.js：……件如其名。
	- pop.js：通用浮层。支持多步骤浮层。
	- fileupload.js：文件上传。兼容IE6、7，可多文件选择。

### pages
1. 由于我们的需求大多是分散的页面，所以出现了这个分类——每个页面对应的入口文件们。例如电子传真的页面js全都在‘pages/efax/’文件夹下，发送页面对应send.js文件，设置页面对应setting.js文件。相当于C、Java等语言的main函数入口。（好像把一个简单的事说的好复杂……）

### base
1. 业务相关模块。每个系统一般都有不同页面通用的业务逻辑，将这部分抽取出来便于重用与维护。目前还没写到这个模块。

-------
以上模块之间的关系大致可以如下表示：

	base ----→ pages
	 ↑	   	  ↗  ↑
	 |	  	╱	  |
	 |	  ╱		  |
	 |	╱		  |
	core ----→ widget
