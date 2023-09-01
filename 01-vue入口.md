## vue准备工作
- 入口在`core/index.js`,这里主要看`initGlobalAPI`和引入的`instance/index`文件
- `instance/index`文件主要是将多个功能混入到Vue实例中,`Vue`实际上是一个类,只能通过`new`关键字初始化
- `initGlobalAPI`主要在`Vue`上扩展一些静态方法和属性(set,delete,util)
- `instance/init`文件主要是合并配置,初始化声明周期,事件,渲染,状态等

## Vue实例挂载的实现
- `platforms/web/entry-runtime-with-compiler`: 先缓存了原型上的`$mount`方法,然后重新定义。这里对el做了一点限制,不允许绑定在body和html上。同时判断配置上是否有render方法,没有会先将el或者template转换为render,过程是通过`compileToFunctions`实现。`$mount`第二个参数是关于服务端渲染的.
- 在`$mount`挂载时,会去调用`mountComponent`方法,声明在`core/instance/lifecycle`,主要作用创建一个Watcher对象,初始化时和数据发生变化时执行`updateComponent`回调,最后判断vm.$vnode是否是跟Vue的实例
## 虚拟DOM
- 虚拟dom:使用javascript对象去描述一个dom节点,vue中的虚拟dom借鉴了[snabbdom](https://github.com/snabbdom/snabbdom)

  