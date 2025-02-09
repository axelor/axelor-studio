# Axelor Studio

Axelor Studio 和 BPM 的主要仓库

## 在使用 Nexus 依赖的项目中安装

将以下内容添加到项目的 `build.gradle` 文件的依赖部分：

```groovy
implementation 'com.axelor.addons:axelor-studio:x.y.z'
```

## 作为 Git 子模块在项目中安装

首先，在您的 webapp 模块中克隆该项目。

然后，将以下行添加到项目的 `settings.gradle` 文件中：

```groovy
include 'modules:axelor-studio'
```

接着，将以下行添加到项目的 `build.gradle` 文件的依赖部分：

```groovy
implementation project(':modules:axelor-studio')
```

## 必要配置

将以下行添加到项目的 `axelor-config.properties` 文件中：

```properties
# 安装应用程序。这取代了旧的 'aos.apps.install-apps' 属性
studio.apps.install = all

# 启用工具 API。这取代了旧的 'aos.api.enable' 属性
utils.api.enable = true

# 自定义上下文值
# ~~~~~
context.app = com.axelor.studio.app.service.AppService

# 启用 BPMN 日志记录
studio.bpm.logging = true

# 配置工具进程超时时间
utils.process.timeout = 10

# 控制空闲数据库连接的最大数量（默认为 10）
studio.bpm.max.idle.connections = 10

# 活动数据库连接的最大数量（默认为 50）
studio.bpm.max.active.connections = 50
```

## BPM Groovy脚本变量

一些变量可以在 BPM 中与 Groovy 脚本表达式一起使用。这些包括：

** `__studiouser__` - 当前用户或管理员（如果没有用户）
* `__date__` - 当前日期，类型为 `LocalDate`
* `__datetime__` - 当前日期时间，类型为 `LocalDateTime`
* `__time__` - 当前时间，类型为 `LocalTime`
* `__config__` - 应用程序配置，类型为 `axelor-config.properties`
* `__beans__` - Beans 类，类型为 `Beans.class`
* `__ctx__` - 工作流上下文助手，类型为 `WkfContextHelper`
* `__transform__` - Web 服务连接器的工作流转换助手，类型为 `WkfTransformationHelper`
* `__repo__` - 给定模型类的存储库
* `__log__` - 获取全局 Logger 实例

## 版本兼容性

建议使用以下描述的 AOP 和 AOS 版本与模块配合使用：

| Studio 模块版本 | 兼容的 AOP 版本 | 兼容的 AOS 版本 |
|-----------------|-----------------|-----------------|
| 1.0             | 6.1             | 7.0             |
| 1.1             | 6.1             | 7.0             |
| 1.2             | 6.1             | 7.1             |
| 1.3             | 6.1             | 7.2             |
| 2.x             | 7.0             | 8.0             |
| 3.1             | 7.1             | 8.1             |
| 3.2             | 7.1             | 8.1             |
| 3.3             | 7.2             | 8.2             |