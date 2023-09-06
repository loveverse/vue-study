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
- `core/vdom/vnode`文件主要对真实dom的一种抽象描述，主要是关键属性，标签名，数据，子节点，键值等。
- vnode创建在`core/vnode/create-element`中，**_createElement**函数是实际执行vnode创建的函数，处理了一些数据的预处理和异常情况的判断。因为虚拟dom是一个树状结构，每一个vnode可能会有很多子节点，子节点也应该是vnode类型。`normalizeChildren`和 `simpleNormalizeChildren`函数用户规范化子节点。其中函数式组件返回的是一个数组而不是一个根节点，需要通过concat将整个children数组打平。`normalizeChildren`方法调用的场景有2种：用户手写render和编译slot、v-for。编译slot使用`normalizeArrayChildren`,主要就是遍历children，获得单个节点c,如果是数组则递归调用本身，如果是基础类型，则和用户手写一样，通过createTextVNode方法转成vnode类型。
- vm._render创建vnode节点后，需要通过vm._update将vnode渲染成真实dom。_update核心就是调用vm.__patch__方法，且在不同平台定义不一样，服务端渲染不需要将vnode转换成dom。web端指向了`patch`方法，定义在`core/vdom/patch`中,其中的`createPatchFunction`定义了一系列的辅助方法。`platforms/web/runtime/patch`中`createPatchFunction`里两个参数(nodeOps和modules)是关于不同平台的模块。不同平台的patch主要逻辑是相同的，差异化只需要通过参数来区别，这里使用了函数柯里化的技巧。

### 渲染流程图
![]( https://note.loveverse.top/static/dcfcceda8b8e255a4458d60fd9384ad742926d83.png)

## 组件化
- 创建组件的主要模块在`core/vdom/create-component`中，定义了一些在组件初始化、更新、销毁的钩子函数
- 编写组件时，通常都是创建一个普通对象，实际是`createComponent`里`baseCtor.extend(Ctor)`,其中baseCtor实际上就是Vue，在`core/global-api/index`中有这段逻辑 

  ```js
  Vue.options._base = Vue
  ```
这里的`Vue.options`与`createComponent`取的是`context.$options`,实际上在`core/instance/init`中将Vue上的一些option扩展到了`vm.$options`。初始化component类型的vnode过程中实现了几个钩子函数。
- `installComponentHooks`安装组件钩子函数,整个过程是把`componentVNodeHooks`合并到`data.hook`中。在合并过程中，如果某个时机的钩子已经存在`data.hook`中，则执行mergeHook做合并，也就是依次执行两个钩子函数。
- 实例化vnode，通过new VNode实例化一个vnode并返回，与普通元素节点的vnode不同，组件vnode没有children

### patch
- 通过createComponent创建了组件vnode后，会走到`vm._update`,通过`vm.__patch__`将vnode转换为真正的dom节点。
- patch过程会调用`core/vdom/patch`中`createElm`创建元素节点，会判断createComponent返回值，如果vnode是一个组件vnode，条件会满足，并且得到i就是init钩子函数，init定义在`core/vdom/create-component`中。init主要是通过`createComponentInstanceForVnode`创建一个Vue的实例，然后调用$mount方法挂载子组件。其中`vnode.componentOptions.Ctor`对应的就是子组件的构造函数。它实际是继承于Vue的一个构造器Sub，也就是`new Sub`，组件实例化实际就是在这个时机执行的。`core/instance/init`会执行_init方法。


  