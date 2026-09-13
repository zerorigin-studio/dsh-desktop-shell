# @zerorigin-studio/dsh-desktop-shell

dsh 桌面壳插件：把 DeepSeek Harness 封装成原生 Windows 桌面客户端。

## 功能

- **内置桌面客户端**：`dsh-desktop-shell-client.exe`（Wails v3 + WebView2，~13MB）打包在 npm 包 `bin/` 内——装插件即得桌面窗口，无需单独安装客户端
- **两种形态，同一个 exe**：
  - *插件形态*（dsh 已在运行）：插件探测 web 端口、写协议文件、启动包内 exe，窗口包裹现有 Harness 进程；
  - *独立形态*（机器上没有 dsh）：exe 自行下载官方运行时并拉起 harness，runtime 就放在 exe 同目录，「客户端 + runtime」可整体拷贝、可离线，可直接当作完整客户端分发（见「独立使用」）。
- **设置页「运行时」区块**：查看/切换存放位置、列出已下载版本（切换、删除）、从发布仓库查询并一键下载新版本（带下载进度）
- **自动拉起桌面客户端**：dsh 启动后，插件探测 web 端口、写协议文件、启动包内 exe——独立桌面窗口包裹 Harness UI（无浏览器痕迹）
- **协议文件**：`~/.dsh/dsh-web-port.json` 写入 `{owner, port, url, pid, harnessVersion, pluginVersion, runtimeDir}`——客户端据此连接，设置页展示版本信息；`owner`（`plugin` / `client`）标识写入者，插件卸载只清理自己写的那份
- **快捷方式**：桌面 + 开始菜单注册；卸载插件时自动删除
- **客户端自动拉起 dsh**：若 harness 未运行，客户端自身会隐形启动（无控制台窗口）
- **开机自启开关**：设置页「桌面壳」开关，写入 HKCU Run 注册表项

## 安装

```bash
dsh plugin --profile web add @zerorigin-studio/dsh-desktop-shell
# 然后手动把 "@zerorigin-studio/dsh-desktop-shell" 追加到
# ~/.dsh/profiles/web/package.json 的 dsh.profile.bundles 数组
# 重启 harness
```

## 独立使用（无需先装 dsh）

直接运行 `bin/dsh-desktop-shell-client.exe`（或桌面快捷方式）。首次启动时它会：

1. 探测本机是否已有可用的 Harness（读协议文件）；
2. 没有则从发布仓库 `https://gitee.com/coldcgh/dsh-runtime` 拉取 `manifest.json`，下载对应的官方 `@deepseek-ai/dsh` 运行时；
3. 校验 sha256、解压到 **exe 同目录的 `runtime\<version>\`**，之后启动直接复用；
4. 以隐藏进程拉起 `dsh web`，窗口切到 Harness UI。

装好之后整个目录就是自包含的：

```
<客户端目录>\
  dsh-desktop-shell-client.exe
  runtime\
    0.1.5-rc.2\        ← 当前使用的运行时
    active.json        ← 记录当前版本；多版本可共存、可回滚
```

- 加载页会显示下载进度；失败时显示具体原因。
- 需要系统安装 Node.js（实测 v22 / v24 均可）。下载走匿名直链，客户端不含任何凭证。
- **设置页「运行时」**：切换存放位置、查看/切换/删除已下载版本、查询发布仓库并下载新版本。
- **存放位置规则**（设置项 `runtimeLocation`）：
  - `auto`（默认）：插件安装的 exe → `%LOCALAPPDATA%\dsh-desktop-shell-client\runtime\`；独立客户端 → exe 同目录 `runtime\`。
  - `portable` / `user`：强制指定其中之一。
  - 环境变量 `DSH_SHELL_RUNTIME_DIR` 优先级最高。
- WebView2 用户数据与 harness 启动日志固定在 `%LOCALAPPDATA%\dsh-desktop-shell-client\`——exe 所在目录可能只读，这两项必须落在始终可写的位置。
- 协议文件：`~/.dsh/dsh-web-port.json`（设置了 `DSH_HOME` 时为 `%DSH_HOME%\dsh-web-port.json`）。

## 🪟 多窗口接入标准（插件开发者）

客户端向每个托管页面注入**标准桌面 SDK** `window.dsh.desktop`（version 1）。
任何 dsh 插件需要开原生独立窗口时，直接调用统一入口即可：

```js
await window.dsh.desktop.openWindow({
  url: "https://chat.deepseek.com/",
  title: "DeepSeek 网页对话",
  width: 1024,
  height: 768,
});
```

**协议说明**：

- 底层走 **WebView2 宿主消息**（`window.chrome.webview.postMessage` → `{ type: "dsh.desktop.openWindow", url, title, width, height }`），由客户端 `RawMessageHandler` 接收并打开原生窗口——**无跨端口 fetch / CORS**，任何页面（含外部 harness）都成立；
- SDK 方法：`openWindow({url,title,width,height})`（返回 Promise）、`closeWindow(id)`、`getInfo()`；
- **检测宿主**：有 `window.chrome.webview.postMessage` 即视为桌面宿主存在；没有时插件应自行降级（如当前 webview 内导航）——插件在纯浏览器/第三方壳中不应失效；
- **兼容旧协议**：宿主仍注入 `window.__DSH_DESKTOP_API__`（`http://127.0.0.1:<port>/<token>`，HTTP 桥接），老插件 `fetch(api + "/window/chat")` 路径继续可用；
- 参照实现：`dsh-deepseek-chat`（@zerorigin-studio/dsh-deepseek-chat）通过该标准入口打开「网页对话」独立窗口。
