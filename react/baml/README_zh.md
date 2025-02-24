# BAML (React + Vite)

此模板提供了一个最小化的设置，以在Vite中使用HMR和一些ESLint规则来运行 React。目前，有两个官方插件可用：

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) 使用 [Babel](https://babeljs.io/) 实现快速刷新（Fast Refresh）
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) 使用 [SWC](https://swc.rs/) 实现快速刷新（Fast Refresh）

### 连接到Axelor

> #### 本地服务器运行于 http://localhost:8080/axelor-erp
>
> - 首先登录本地服务器，即 http://localhost:8080/axelor-erp (admin/admin)
> - 修改 `.env` 文件中的代理服务器 URL 和子路径：
    >   - 将 `VITE_PROXY_TARGET` 设置为 http://localhost:8080
>   - 将 `VITE_PROXY_CONTEXT` 设置为 /axelor-erp/
>   - 注意：如果服务器没有子路径，则将 `VITE_PROXY_CONTEXT` 设置为 `/`
> - 尝试使用相对子路径运行应用程序，例如 http://localhost:5173/axelor-erp/

> #### 测试服务器运行于 https://test.axelor.com/open-suite-master
>
> - 首先登录测试服务器，即 https://test.axelor.com/open-suite-master (admin/@axadmin)
    >   - 将 `VITE_PROXY_TARGET` 设置为 http://localhost:8080
>   - 将 `VITE_PROXY_CONTEXT` 设置为 /axelor-erp/
>   - 注意：如果服务器没有子路径，则将 `VITE_PROXY_CONTEXT` 设置为 `/`
> - 尝试使用相对子路径运行应用程序，例如 http://localhost:5173/open-suite-master/
> - 手动从 test.axelor.com 服务器复制 CSRF-TOKEN 和 JSESSIONID 到本地服务器（开发者工具 -> 应用程序选项卡 -> Cookies 部分），然后重新加载页面

> #### 检查 Studio 记录
>
> - 在 URL 中传递 id 参数，如下所示，连接到 id=2 的 Studio 记录
> - http://localhost:5173/axelor-erp/?id=2
> - http://localhost:5173/open-suite-master/?id=2

## 可用脚本

在项目目录中，您可以运行以下命令：

### `pnpm start`

启动开发模式下的应用程序。\
打开 [http://localhost:5173](http://localhost:5173) 在浏览器中查看。\
如果您进行编辑，页面将自动重新加载。\
您还将在控制台中看到任何 ESLint 错误。

### `pnpm build`

构建生产环境的应用程序到 `build` 文件夹。\
它会正确打包 React 并优化构建以获得最佳性能。