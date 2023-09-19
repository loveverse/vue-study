## 目录设计

- compiler: vue 编译相关的代码，包括将模板解析成 ast 语法树
- core: vue 核心代码，内置组件、全局 api、vue 实例化、观察者、虚拟 dom 等
- platform: 跨平台相关(web 和 weex)
- server: 服务端相关，跑在服务端 nodejs 上的
- sfc: 将 vue 文件内容解析成一个 javascript 对象
- shared: 浏览器 vue 和服务端 vue 共享的工具方法

## vue 准备工作

- 入口在`core/index.js`,这里主要看`initGlobalAPI`和引入的`instance/index`文件
- `instance/index`文件主要是将多个功能混入到 Vue 实例中,`Vue`实际上是一个类,只能通过`new`关键字初始化
- `initGlobalAPI`主要在`Vue`上扩展一些静态方法和属性(set,delete,util)
- `z/init`文件主要是合并配置,初始化声明周期,事件,渲染,状态等

## Vue 实例挂载的实现

- `platforms/web/entry-runtime-with-compiler`: 先缓存了原型上的`$mount`方法,然后重新定义。这里对 el 做了一点限制,不允许绑定在 body 和 html 上。同时判断配置上是否有 render 方法,没有会先将 el 或者 template 转换为 render,过程是通过`compileToFunctions`实现。`$mount`第二个参数是关于服务端渲染的.
- 在`$mount`挂载时,会去调用`mountComponent`方法,声明在`core/instance/lifecycle`,主要作用创建一个 Watcher 对象,初始化时和数据发生变化时执行`updateComponent`回调,最后判断 vm.$vnode 是否是根 Vue 的实例

## 虚拟 DOM

- 虚拟 dom:使用 javascript 对象去描述一个 dom 节点,vue 中的虚拟 dom 借鉴了[snabbdom](https://github.com/snabbdom/snabbdom)
- `core/vdom/vnode`文件主要对真实 dom 的一种抽象描述，主要是关键属性，标签名，数据，子节点，键值等。
- vnode 创建在`core/vnode/create-element`中，**\_createElement**函数是实际执行 vnode 创建的函数，处理了一些数据的预处理和异常情况的判断。因为虚拟 dom 是一个树状结构，每一个 vnode 可能会有很多子节点，子节点也应该是 vnode 类型。`normalizeChildren`和 `simpleNormalizeChildren`函数用于规范化子节点。其中函数式组件返回的是一个数组而不是一个根节点，需要通过 concat 将整个 children 数组打平。`normalizeChildren`方法调用的场景有 2 种：用户手写 render 和编译 slot、v-for。编译 slot 使用`normalizeArrayChildren`,主要就是遍历 children，获得单个节点 c,如果是数组则递归调用本身，如果是基础类型，则和用户手写一样，通过 createTextVNode 方法转成 vnode 类型。
- vm.\_render 创建 vnode 节点后，需要通过 vm.\_update 将 vnode 渲染成真实 dom。\_update 核心就是调用`vm.__patch__`方法，且在不同平台定义不一样，服务端渲染不需要将 vnode 转换成 dom。web 端指向了`patch`方法，定义在`core/vdom/patch`中,其中的`createPatchFunction`定义了一系列的辅助方法。`platforms/web/runtime/patch`中`createPatchFunction`里两个参数(nodeOps 和 modules)是关于不同平台的模块。不同平台的 patch 主要逻辑是相同的，差异化只需要通过参数来区别，这里使用了函数柯里化的技巧。

### 渲染流程图

![](https://note.loveverse.top/static/dcfcceda8b8e255a4458d60fd9384ad742926d83.png)

## 组件化

- 创建组件的主要模块在`core/vdom/create-component`中，定义了一些在组件初始化、更新、销毁的钩子函数
- 编写组件时，通常都是创建一个普通对象，实际是`createComponent`里`baseCtor.extend(Ctor)`,其中 baseCtor 实际上就是 Vue，在`core/global-api/index`中有这段逻辑

  ```js
  Vue.options._base = Vue;
  ```

  这里的`Vue.options`与`createComponent`取的是`context.$options`,实际上在`core/instance/init`中将 Vue 上的一些 option 扩展到了`vm.$options`。初始化 component 类型的 vnode 过程中实现了几个钩子函数。

- `installComponentHooks`安装组件钩子函数,整个过程是把`componentVNodeHooks`合并到`data.hook`中。在合并过程中，如果某个时机的钩子已经存在`data.hook`中，则执行 mergeHook 做合并，也就是依次执行两个钩子函数。
- 实例化 vnode，通过 new VNode 实例化一个 vnode 并返回，与普通元素节点的 vnode 不同，组件 vnode 没有 children

### patch

- 通过 createComponent 创建了组件 vnode 后，会走到`vm._update`,通过`vm.__patch__`将 vnode 转换为真正的 dom 节点。
- patch 过程会调用`core/vdom/patch`中`createElm`创建元素节点，会判断 createComponent 返回值，如果 vnode 是一个组件 vnode，条件会满足，并且得到 i 就是 init 钩子函数，init 定义在`core/vdom/create-component`中。init 主要是通过`createComponentInstanceForVnode`创建一个 Vue 的实例，然后调用$mount方法挂载子组件。其中`vnode.componentOptions.Ctor`对应的就是子组件的构造函数。它实际是继承于Vue的一个构造器Sub，也就是`new Sub`，组件实例化实际就是在这个时机执行的。`core/instance/init`会执行_init方法，同时判断_isComponent是否是组件，是组件时调用`initInternalComponent`，它的主要作用是传入的几个参数合并到内部的$options 里。
- 组件自己初始化是不需要传 el,它是自己接管了$mount过程(child.$mount)，它最终会调用 mountComponent，进而执行`vm._render()`方法，执行完 vm.\_render 生成 vnode 后，会去执行`vm._update`渲染 vnode，`vm._update`中使用`activeInstance`保存当前上下文的 vue 实例，它暴露给了`createComponentInstanceForVnode`当作参数传入，因为 vue 整个初始化是一个深度遍历的过程，在实例化子组件时，需要知道当前上下文的 vue 实例是什么，并把它作为自组件的父 vue 实例。子组件实例化会先调用`initInternalComponent(vm, options)`合并 options,将 parent 存储在 vm.$options中，用来保留当前vm的父实例，并且将当前vm存储到父实例的$children 中。
- 在`vm._update`过程中，将`activeInstance`赋值给`prevActiveInstance`，当 vm 实例完成他的所有子树的 patch 或者 update 过程后，`activeInstance`会回到它的父实例。`createComponentInstanceForVnode`深度遍历过程中，在实例化子组件的时候传入当前子组件的父实例，并在\_init 中保存整个父子关系，然后回到\_update,最后调用**patch**渲染 vndode
- 负责渲染 dom 的是 createElm,这里会判断传入的节点是组件还是普通 vnode，当是组件时，会重复组件初始化的逻辑，通过递归的方式完整的构建整个组件树。在组件完成整个 patch 后，会通过`insert`完成组件的 dom 插入，如果 patch 过程中又创建了组件，dom 插入顺序是先子后父。

### 合并配置

