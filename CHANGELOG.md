# Changelog

## 0.3.1 (2026-09-13)

- **runtime 存放位置按形态分流**（捆绑客户端 → 0.3.1）：
  - *插件形态*（exe 由 dsh 插件体系安装，位于 `<DSH_HOME>/profiles/<profile>/node_modules/<pkg>/bin/`）：runtime 用默认位置 `%LOCALAPPDATA%\dsh-desktop-shell-client\runtime\`。那类目录归包管理器（pnpm）所有，升级插件会替换整个包目录，放在旁边的 runtime 会被一起清掉，等于每次升级重下 200MB+。
  - *独立客户端形态*：runtime 放在 exe 同目录的 `runtime\` 下，「客户端 + runtime」成为一个可整体拷贝、可离线的自包含目录。
  - 新增设置项 `runtimeLocation`：`auto`（默认，按形态）/ `portable`（随客户端）/ `user`（默认位置）；环境变量 `DSH_SHELL_RUNTIME_DIR` 优先级最高。
- **设置页新增「运行时」区块**：显示存放位置与实际路径、已下载版本列表（可切换为当前版本、可删除），并从发布仓库匿名查询可下载版本、一键下载（带进度）。WebView2 用户数据与 harness 日志位置不变（固定在 `%LOCALAPPDATA%\dsh-desktop-shell-client\`）。
- **修复**：runtime 目录从 `%LOCALAPPDATA%\dsh-desktop-shell\` 挪到 `dsh-desktop-shell-client\`。前者是更早版本客户端遗留的 WebView2 用户数据目录（实测 3200+ 文件 / 500MB+ 浏览器 profile），把 runtime 混进去容易在清理浏览器数据时被一并删除。

## 0.3.0 (2026-09-13)

- **客户端可独立运行（新能力）**：捆绑客户端（bin/dsh-desktop-shell-client.exe → 0.3.0）不再要求机器上先有 dsh。本机没有可用 harness 时，客户端会从发布仓库（Gitee `coldcgh/dsh-runtime`）下载官方 `@deepseek-ai/dsh` 运行时，校验 sha256、解压到 `%LOCALAPPDATA%\dsh-desktop-shell\runtime\<version>`，再自行拉起 harness。下载走匿名直链，客户端不含任何凭证。于是同一个 exe 覆盖两种形态：
  - **插件形态**（本插件已装、dsh 在跑）：协议文件可达 → 直接附着，行为与 0.2.9 一致；
  - **独立形态**（裸机）：没有 harness → 下载运行时 → 启动 → 附着。
  - 加载页会显示下载进度（含百分比），失败显示具体原因；
  - 设置项新增 `pinnedDshVersion`（锁定运行时版本，留空自动选择）。
- **协议文件新增 `owner` 字段**：插件写 `owner=plugin`，独立客户端写 `owner=client`。插件卸载（dispose）时只删除自己写的那份，不再误删独立形态留下的状态。历史文件没有该字段时按插件所有处理，向后兼容。
- **修复**：客户端工作区不再硬编码 `D:\WorkSpaces\DeepSeekHerness`。改为「环境变量 > 设置项 > 历史目录（仅当存在，用于老用户无损迁移）> ~/DeepSeekHarness」。原硬编码会让分发给其它机器的用户把会话写到一个不存在的路径。
- **修复**：客户端与 harness 的数据根目录现在统一按 `DSH_HOME`（缺省 `~/.dsh`）解析。此前客户端固定用 `~/.dsh`，在设置了 `DSH_HOME` 的环境里会与 harness 各写各的目录。
- **改进**：harness 启动日志落到 `%LOCALAPPDATA%\dsh-desktop-shell\harness.log`（harness 是隐藏拉起的，此前启动失败没有任何线索）；退出时按 `tasklist` 核对进程名，避免 pid 复用误杀。

## 0.2.9 (2026-09-03)

- **捆绑桌面客户端升级**（bin/dsh-desktop-shell-client.exe → 0.2.0）：
  - 关闭主窗口行为按设置页三选项生效（退出到托盘 / 每次询问 / 直接退出）。**修复**：此前三个选项均不生效——拦截方式改为 Wails `RegisterHook` + `event.Cancel()`（与官方 hide-window 示例一致），否则框架内置的无条件关闭 listener 总会销毁窗口；
  - 托盘新增「开机自启」勾选（读写 HKCU Run，与插件设置页开关同一条值）；
  - 退出客户端不再杀 Harness（dsh web 后台保留，可随时重连）；
  - **标准多窗口接入（开放协议）**：客户端向每个托管页面注入 `window.dsh.desktop`（version 1），任何插件调用 `openWindow({url,title,width,height})` / `closeWindow(id)` 即可让客户端开原生独立窗口；底层走 WebView2 宿主消息（`window.chrome.webview.postMessage` → `{type:'dsh.desktop.openWindow',...}`），无跨端口 fetch/CORS，任何页面（含外部 harness）都成立；宿主侧由 `RawMessageHandler` 接收。保留旧 `__DSH_DESKTOP_API__` HTTP 桥接兼容；安装 dsh-deepseek-chat（0.3.3 接入该 SDK）后「网页对话」可多窗；
  - 正式版禁用 WebView2 原生右键菜单（DefaultContextMenuDisabled）。

## 0.2.8 (2026-09-02)

- **scope 迁移**：包名 `@coldcgh/dsh-desktop-shell` → `@zerorigin-studio/dsh-desktop-shell`（发布至 zerorigin-studio org）；内部 module id / bundle patch / author 同步更新。code/行为不变。
