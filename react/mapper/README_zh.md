# Assignment Builder (Mapper)

本项目用于通过UI动态生成脚本，并使用 [Create React App](https://github.com/facebook/create-react-app) 进行引导。

### 连接到Axelor

> #### 本地服务器运行在 http://localhost:8080/axelor-erp
>
> - 首先登录本地服务器，即 http://localhost:8080/axelor-erp (admin/admin)
> - 将 `package.json` 中的 'proxy' 更改为 http://localhost:8080。
> - 尝试使用相对子URL运行应用程序，例如 http://localhost:3000/axelor-erp

> #### 在线服务器运行在 https://test.axelor.com/open-suite-master
>
> - 首先登录在线服务器，即 https://test.axelor.com/open-suite-master (admin/@axadmin)
> - 将 `package.json` 中的 'proxy' 更改为 https://test.axelor.com。
> - 尝试使用相对子URL运行应用程序，例如 http://localhost:3000/open-suite-master
> - 手动将 CSRF-TOKEN 和 JSESSIONID 从 test.axelor.com 服务器复制到本地服务器（开发者工具 -> 应用程序选项卡 -> Cookies 部分），然后重新加载页面

> #### 检查Mapper记录
>
> - 在URL中传递id，如下所示，这将连接id=2的Mapper记录
> - http://localhost:3000/axelor-erp/?id=2
> - http://localhost:3000/open-suite-master/?id=2

## 可用脚本

在项目目录中，您可以运行以下命令：

### `yarn start`

以开发模式运行应用程序。\
打开 [http://localhost:3000](http://localhost:3000) 在浏览器中查看。

如果您进行编辑，页面将自动重新加载。\
您还将在控制台中看到任何lint错误。

### `yarn build`

构建应用程序以供生产环境使用，输出到 `build` 文件夹。\
它正确地打包React并优化构建以获得最佳性能。

构建是压缩的，文件名包含哈希值。\
您的应用程序已准备好部署！

有关更多信息，请参阅[部署](https://facebook.github.io/create-react-app/docs/deployment)部分。