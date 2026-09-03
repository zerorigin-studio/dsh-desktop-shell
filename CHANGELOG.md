# Changelog

## 0.2.9 (2026-09-03)

- **捆绑桌面客户端升级**（bin/dsh-desktop-shell-client.exe → 0.2.0）：
  - 关闭主窗口行为按设置页三选项生效（退出到托盘 / 每次询问 / 直接退出）。**修复**：此前三个选项均不生效——拦截方式改为 Wails `RegisterHook` + `event.Cancel()`（与官方 hide-window 示例一致），否则框架内置的无条件关闭 listener 总会销毁窗口；
  - 托盘新增「开机自启」勾选（读写 HKCU Run，与插件设置页开关同一条值）；
  - 退出客户端不再杀 Harness（dsh web 后台保留，可随时重连）；
  - **标准多窗口接入（开放协议）**：客户端向每个托管页面注入 `window.dsh.desktop`（version 1），任何插件调用 `openWindow({url,title,width,height})` / `closeWindow(id)` 即可让客户端开原生独立窗口；底层走 WebView2 宿主消息（`window.chrome.webview.postMessage` → `{type:'dsh.desktop.openWindow',...}`），无跨端口 fetch/CORS，任何页面（含外部 harness）都成立；宿主侧由 `RawMessageHandler` 接收。保留旧 `__DSH_DESKTOP_API__` HTTP 桥接兼容；安装 dsh-deepseek-chat（0.3.3 接入该 SDK）后「网页对话」可多窗；
  - 正式版禁用 WebView2 原生右键菜单（DefaultContextMenuDisabled）。

## 0.2.8 (2026-09-02)

- **scope 迁移**：包名 `@coldcgh/dsh-desktop-shell` → `@zerorigin-studio/dsh-desktop-shell`（发布至 zerorigin-studio org）；内部 module id / bundle patch / author 同步更新。code/行为不变。
